import { interviewRepository } from "../repositories/interview.repository.js";
import { editorRepository } from "../repositories/editor.repository.js";
import type { SaveCodeInput } from "../validators/editor.schema.js";
import type { AuthUser } from "../types/user.js";
import { forbidden, notFound } from "../utils/error.js";

type EditorCodeRecord = {
    id: string;
    interview_id: string;
    code: string;
    language: string;
    created_at: Date | string;
    updated_at: Date | string;
};

async function assertIsParticipant(interviewId: string, userId: string) {
    const participants = await interviewRepository.findParticipants(interviewId);
    const isParticipant = participants.some(
        (participant) => participant.user_id === userId
    );
    if (!isParticipant) {
        throw forbidden("You are not a participant of this interview");
    }
}

function sanitizeEditorCode(record: EditorCodeRecord) {
    return {
        id: record.id,
        interviewId: record.interview_id,
        code: record.code,
        language: record.language,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
    };
}

export const editorService = {
    async getCode(interviewId: string, authUser: AuthUser) {
        const exists = await interviewRepository.exists(interviewId);
        if (!exists) throw notFound("Interview not found");
        await assertIsParticipant(interviewId, authUser.userId);

        const code = await editorRepository.findByInterviewId(interviewId);
        if (!code) return null;
        return sanitizeEditorCode(code);
    },

    async saveCode(interviewId: string, input: SaveCodeInput, authUser: AuthUser) {
        const exists = await interviewRepository.exists(interviewId);
        if (!exists) throw notFound("Interview not found");
        await assertIsParticipant(interviewId, authUser.userId);

        const code = await editorRepository.upsert(interviewId, input.code, input.language);
        return sanitizeEditorCode(code);
    },

    async restoreCode(interviewId: string, authUser: AuthUser) {
        const exists = await interviewRepository.exists(interviewId);
        if (!exists) throw notFound("Interview not found");
        await assertIsParticipant(interviewId, authUser.userId);

        const interview = await interviewRepository.findById(interviewId);
        if (!interview) throw notFound("Interview not found");

        const code = await editorRepository.upsert(
            interviewId,
            interview.starter_code ?? "//Write your solution here",
            interview.language
        );
        return sanitizeEditorCode(code);
    },
};
