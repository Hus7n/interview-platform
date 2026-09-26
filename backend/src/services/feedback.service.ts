import { feedbackRepository } from "../repositories/feedback.repository.js";
import { interviewRepository } from "../repositories/interview.repository.js";
import type { CreateFeedbackInput, ListFeedbackInput, UpdateFeedbackInput } from "../validators/feedback.schema.js";
import type { AuthUser } from "../types/user.js";
import { badRequest, conflict, forbidden, notFound } from "../utils/errors.js";

async function assertIsInterviewer(interviewId: string, userId: string) {
    const participants = await interviewRepository.findParticipants(interviewId);
    const participant = participants.find((p) => p.user_id === userId);
    if (!participant || participant.role !== "interviewer") {
        throw forbidden("Only interviewers can submit feedback");
    }
}

async function getExistingFeedback(feedbackId: string, interviewId: string) {
    const feedback = await feedbackRepository.findById(feedbackId);
    if (!feedback) throw notFound("Feedback not found");
    if (feedback.interview_id !== interviewId) throw notFound("Feedback not found for this interview");
    return feedback;
}

function sanitizeFeedback(record: {
    id: string; interview_id: string; reviewer_id: string;
    technical_rating: number; communication_rating: number; problem_solving_rating: number;
    recommendation: string; written_feedback: string | null;
    created_at: Date | string; updated_at: Date | string;
    reviewer_email?: string; reviewer_name?: string | null;
}) {
    return {
        id: record.id,
        interviewId: record.interview_id,
        reviewerId: record.reviewer_id,
        technicalRating: record.technical_rating,
        communicationRating: record.communication_rating,
        problemSolvingRating: record.problem_solving_rating,
        recommendation: record.recommendation,
        writtenFeedback: record.written_feedback,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        ...(record.reviewer_email !== undefined && {
            reviewerEmail: record.reviewer_email,
            reviewerName: record.reviewer_name ?? null,
        }),
    };
}

export const feedbackService = {
    async createFeedback(interviewId: string, input: CreateFeedbackInput, authUser: AuthUser) {
        const interview = await interviewRepository.findById(interviewId);
        if (!interview) throw notFound("Interview not found");
        if (interview.status === "completed") throw badRequest("Cannot submit feedback for a completed interview");

        await assertIsInterviewer(interviewId, authUser.userId);

        const existing = await feedbackRepository.findByInterviewAndReviewer(interviewId, authUser.userId);
        if (existing) throw conflict("You have already submitted feedback for this interview");

        const feedback = await feedbackRepository.create({
            interviewId,
            reviewerId: authUser.userId,
            technicalRating: input.technical_rating,
            communicationRating: input.communication_rating,
            problemSolvingRating: input.problem_solving_rating,
            recommendation: input.recommendation,
            writtenFeedback: input.written_feedback ?? null,
        });

        return sanitizeFeedback(feedback);
    },

    async listFeedback(interviewId: string, filters: ListFeedbackInput) {
        if (!(await interviewRepository.exists(interviewId))) throw notFound("Interview not found");

        const [feedbacks, total] = await Promise.all([
            feedbackRepository.findByInterviewId(interviewId, filters.page, filters.limit),
            feedbackRepository.countByInterviewId(interviewId),
        ]);

        return {
            feedbacks: feedbacks.map(sanitizeFeedback),
            pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
        };
    },

    async getFeedback(feedbackId: string, interviewId: string) {
        if (!(await interviewRepository.exists(interviewId))) throw notFound("Interview not found");
        return sanitizeFeedback(await getExistingFeedback(feedbackId, interviewId));
    },

    async updateFeedback(feedbackId: string, interviewId: string, input: UpdateFeedbackInput, authUser: AuthUser) {
        const interview = await interviewRepository.findById(interviewId);
        if (!interview) throw notFound("Interview not found");
        if (interview.status === "completed") throw badRequest("Cannot update feedback after interview is completed");

        const feedback = await getExistingFeedback(feedbackId, interviewId);
        if (feedback.reviewer_id !== authUser.userId && authUser.role !== "admin") {
            throw forbidden("You can only update your own feedback");
        }

        const updated = await feedbackRepository.update(feedbackId, {
            technical_rating: input.technical_rating,
            communication_rating: input.communication_rating,
            problem_solving_rating: input.problem_solving_rating,
            recommendation: input.recommendation,
            written_feedback: input.written_feedback,
        });
        if (!updated) throw badRequest("No fields to update");

        return sanitizeFeedback(updated);
    },

    async deleteFeedback(feedbackId: string, interviewId: string, authUser: AuthUser) {
        const interview = await interviewRepository.findById(interviewId);
        if (!interview) throw notFound("Interview not found");
        if (interview.status === "completed") throw badRequest("Cannot delete feedback after interview is completed");

        const feedback = await getExistingFeedback(feedbackId, interviewId);
        if (feedback.reviewer_id !== authUser.userId && authUser.role !== "admin") {
            throw forbidden("You can only delete your own feedback");
        }

        await feedbackRepository.delete(feedbackId);
    },
};
