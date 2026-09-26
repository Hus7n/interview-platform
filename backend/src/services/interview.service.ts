import { randomUUID } from "node:crypto";
import { interviewRepository } from "../repositories/interview.repository.js";
import type {
    AddParticipantInput,
    CreateInterviewInput,
    InterviewStatus,
    ListInterviewInput,
    RemoveParticipantInput,
    UpdateInterviewInput,
} from "../validators/interview.schema.js";
import type { AuthUser } from "../types/user.js";
import { badRequest, conflict, forbidden, notFound } from "../utils/errors.js";
import { mailService } from "../mail/mail.service.js";
import { authRepository } from "../repositories/auth.repository.js";
import type { UserRecord } from "../types/user.js";

type InterviewRecord = {
    id: string;
    title: string;
    description: string | null;
    scheduled_at: Date | string;
    duration_minutes: number;
    status: InterviewStatus;
    room_id: string;
    language: string;
    starter_code: string | null;
    created_by: string;
    created_at: Date | string;
    updated_at: Date | string;
    participant_count?: number;
};

const VALID_STATUS_TRANSITIONS: Record<InterviewStatus, InterviewStatus[]> = {
    scheduled: ["in_progress", "cancelled"],
    in_progress: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
};

function canManageInterview(user: AuthUser, interview: InterviewRecord) {
    return user.role === "admin" || interview.created_by === user.userId;
}
async function assertCanView(interview: InterviewRecord, authUser: AuthUser) {
    if (authUser.role === "admin" || interview.created_by === authUser.userId) return;
    const participants = await interviewRepository.findParticipants(interview.id);
    if (!participants.some((p) => p.user_id === authUser.userId)) {
        throw forbidden("You are not a participant of this interview");
    }
}

function sanitizeInterview(interview: InterviewRecord) {
    return {
        id: interview.id,
        title: interview.title,
        description: interview.description,
        scheduledAt: interview.scheduled_at,
        durationMinutes: interview.duration_minutes,
        status: interview.status,
        roomId: interview.room_id,
        language: interview.language,
        starterCode: interview.starter_code,
        createdBy: interview.created_by,
        participantCount: interview.participant_count ?? 0,
        createdAt: interview.created_at,
        updatedAt: interview.updated_at,
    };
}

async function getExistingInterview(id: string) {
    const interview = await interviewRepository.findById(id) as InterviewRecord | null;
    if (!interview) throw notFound("Interview not found");
    return interview;
}

async function generateRoomId() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const roomId = randomUUID();
        if (!(await interviewRepository.existsByRoom(roomId))) return roomId;
    }
    throw conflict("Could not generate a unique interview room");
}

export const interviewService = {
    async createInterview(input: CreateInterviewInput, authUser: AuthUser) {
        if (input.scheduled_at.getTime() <= Date.now()) {
            throw badRequest("Interview must be scheduled in the future", "VALIDATION_ERROR");
        }

        const roomId = await generateRoomId();
        const interview = await interviewRepository.create({
            ...input,
            room_id: roomId,
            created_by: authUser.userId,
            status: "scheduled",
        }) as InterviewRecord;

        await interviewRepository.addParticipant(interview.id, authUser.userId, "interviewer");

        return sanitizeInterview(interview);
    },

    async updateInterview(id: string, input: UpdateInterviewInput, authUser: AuthUser) {
        const interview = await getExistingInterview(id);

        if (!canManageInterview(authUser, interview)) {
            throw forbidden("You do not have permission to manage this interview");
        }
        if (interview.status === "completed") {
            throw badRequest("Completed interviews cannot be modified");
        }
        if (input.scheduled_at && input.scheduled_at.getTime() <= Date.now()) {
            throw badRequest("Interview must be scheduled in the future", "VALIDATION_ERROR");
        }

        return sanitizeInterview(await interviewRepository.update(id, input) as InterviewRecord);
    },

    async deleteInterview(id: string, authUser: AuthUser) {
        const interview = await getExistingInterview(id);
        if (!canManageInterview(authUser, interview)) {
            throw forbidden("You do not have permission to manage this interview");
        }
        if (interview.status === "completed") {
            throw badRequest("Completed interviews cannot be modified");
        }
        await interviewRepository.delete(id);
    },

    async getInterview(id: string , authUser : AuthUser) {
        const interview = await getExistingInterview(id);
        await assertCanView(interview , authUser);
        const participantCount = await interviewRepository.countParticipants(id);
        return sanitizeInterview({ ...interview, participant_count: participantCount } as unknown as InterviewRecord);
    },

    async listInterviews(filters: ListInterviewInput , authUser : AuthUser) {
        if (filters.from_date && filters.to_date && filters.from_date.getTime() > filters.to_date.getTime()) {
            throw badRequest("from_date cannot be after to_date", "VALIDATION_ERROR");
        }

        const scopedFilters = authUser.role === "admin"
        ? filters : {...filters , participant_id : authUser.userId};

        const offset = (filters.page - 1) * filters.limit;
        const [interviews, total] = await Promise.all([
            interviewRepository.findMany({ ...filters, offset }),
            interviewRepository.count(filters),
        ]);

        return {
            interviews: interviews.map((i) => sanitizeInterview(i as InterviewRecord)),
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total,
                totalPages: Math.ceil(total / filters.limit),
            },
        };
    },

    async changeInterviewStatus(id: string, status: InterviewStatus, authUser: AuthUser) {
        const interview = await getExistingInterview(id);
        if (!canManageInterview(authUser, interview)) {
            throw forbidden("You do not have permission to manage this interview");
        }

        const allowedStatuses = VALID_STATUS_TRANSITIONS[interview.status];
        if (!allowedStatuses.includes(status)) {
            throw badRequest(`Cannot change interview status from ${interview.status} to ${status}`, "VALIDATION_ERROR");
        }

        const updatedInterview = await interviewRepository.updateStatus(id, status) as InterviewRecord;

        if (status === "cancelled") {
            const participants = await interviewRepository.findParticipants(id);
            for (const p of participants) {
                const user = await authRepository.findById(p.user_id) as UserRecord | null;
                if (user) {
                    mailService.sendInterviewCancellation(
                        user.email,
                        user.display_name ?? user.email,
                        interview.title,
                    ).catch(() => {});
                }
            }
        }

        return sanitizeInterview(updatedInterview);
    },

    async addParticipant(id: string, input: AddParticipantInput, authUser: AuthUser) {
        const interview = await getExistingInterview(id);
        if (!canManageInterview(authUser, interview)) {
            throw forbidden("You do not have permission to manage this interview");
        }

        const participants = await interviewRepository.findParticipants(id);
        if (participants.some((p) => p.user_id === input.user_id)) {
            throw conflict("User is already a participant in this interview");
        }

        const result = await interviewRepository.addParticipant(id, input.user_id, input.role);

        const user = await authRepository.findById(input.user_id) as UserRecord | null;
        if (user) {
            const scheduledAt = new Date(interview.scheduled_at);
            mailService.sendInterviewInvitation(
                user.email,
                user.display_name ?? user.email,
                interview.title,
                scheduledAt,
                interview.duration_minutes,
            ).catch(() => {});
        }

        return result;
    },

    async removeParticipant(id: string, input: RemoveParticipantInput, authUser: AuthUser) {
        const interview = await getExistingInterview(id);
        if (!canManageInterview(authUser, interview)) {
            throw forbidden("You do not have permission to manage this interview");
        }

        const removed = await interviewRepository.removeParticipant(id, input.user_id);
        if (!removed) throw notFound("Participant not found");
    },

    async listParticipants(id: string , authUser : AuthUser) {
        const interview = await getExistingInterview(id);
        await assertCanView(interview , authUser);
        return interviewRepository.findParticipants(id);
    },
};
