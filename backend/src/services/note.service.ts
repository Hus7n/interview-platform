import { notesRepository } from "../repositories/notes.repository.js";
import { interviewRepository } from "../repositories/interview.repository.js";
import type { CreateNoteInput, ListNotesInput, UpdateNoteInput } from "../validators/notes.schema.js";
import type { AuthUser } from "../types/user.js";
import { forbidden, notFound } from "../utils/error.js";

async function assertIsParticipant(interviewId: string, userId: string) {
    const participants = await interviewRepository.findParticipants(interviewId);
    if (!participants.some((p) => p.user_id === userId)) {
        throw forbidden("You are not a participant of this interview");
    }
}

async function getOwnedNote(noteId: string, interviewId: string, userId: string) {
    const note = await notesRepository.findById(noteId);
    if (!note) throw notFound("Note not found");
    if (note.interview_id !== interviewId) throw notFound("Note not found in this interview");
    if (note.author_id !== userId) throw forbidden("You can only access your own notes");
    return note;
}

function sanitizeNote(note: { id: string; interview_id: string; author_id: string; content: string; is_private: boolean; created_at: Date | string; updated_at: Date | string }) {
    return {
        id: note.id,
        interviewId: note.interview_id,
        authorId: note.author_id,
        content: note.content,
        isPrivate: note.is_private,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
    };
}

export const notesService = {
    async createNote(interviewId: string, input: CreateNoteInput, authUser: AuthUser) {
        if (!(await interviewRepository.exists(interviewId))) throw notFound("Interview not found");
        await assertIsParticipant(interviewId, authUser.userId);

        const note = await notesRepository.create(interviewId, authUser.userId, input.content, input.is_private);
        return sanitizeNote(note);
    },

    async listNotes(interviewId: string, filters: ListNotesInput, authUser: AuthUser) {
        if (!(await interviewRepository.exists(interviewId))) throw notFound("Interview not found");
        await assertIsParticipant(interviewId, authUser.userId);

        const [notes, total] = await Promise.all([
            notesRepository.findManyByInterviewId(interviewId, authUser.userId, filters.page, filters.limit),
            notesRepository.countByInterviewId(interviewId, authUser.userId),
        ]);

        return {
            notes: notes.map(sanitizeNote),
            pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
        };
    },

    async getNote(noteId: string, interviewId: string, authUser: AuthUser) {
        await assertIsParticipant(interviewId, authUser.userId);
        return sanitizeNote(await getOwnedNote(noteId, interviewId, authUser.userId));
    },

    async updateNote(noteId: string, interviewId: string, input: UpdateNoteInput, authUser: AuthUser) {
        await assertIsParticipant(interviewId, authUser.userId);
        await getOwnedNote(noteId, interviewId, authUser.userId);
        const updated = await notesRepository.update(noteId, { content: input.content, is_private: input.is_private });
        return sanitizeNote(updated!);
    },

    async deleteNote(noteId: string, interviewId: string, authUser: AuthUser) {
        await assertIsParticipant(interviewId, authUser.userId);
        await getOwnedNote(noteId, interviewId, authUser.userId);
        await notesRepository.delete(noteId);
    },
};
