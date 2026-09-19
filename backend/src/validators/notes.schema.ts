import { z } from "zod";

export const CreateNoteSchema = z.object({
    content: z.string().max(5000).default(""),
    is_private: z.boolean().default(true),
});

export const UpdateNoteSchema = z.object({
    content: z.string().max(5000).optional(),
    is_private: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
});

export const NoteIdSchema = z.object({
    noteId: z.string().uuid(),
});

export const InterviewIdParamSchema = z.object({
    interviewId: z.string().uuid(),
});

export const ListNotesSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    is_private: z.coerce.boolean().optional(),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
export type ListNotesInput = z.infer<typeof ListNotesSchema>;
