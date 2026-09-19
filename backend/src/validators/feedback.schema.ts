import { z } from "zod";

export const CreateFeedbackSchema = z.object({
    technical_rating: z.number().int().min(1).max(5),
    communication_rating: z.number().int().min(1).max(5),
    problem_solving_rating: z.number().int().min(1).max(5),
    recommendation: z.enum(["hire", "no_hire"]),
    written_feedback: z.string().max(10000).optional().nullable(),
});

export const UpdateFeedbackSchema = z.object({
    technical_rating: z.number().int().min(1).max(5).optional(),
    communication_rating: z.number().int().min(1).max(5).optional(),
    problem_solving_rating: z.number().int().min(1).max(5).optional(),
    recommendation: z.enum(["hire", "no_hire"]).optional(),
    written_feedback: z.string().max(10000).optional().nullable(),
}).refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
});

export const InterviewIdParamSchema = z.object({
    interviewId: z.string().uuid(),
});

export const FeedbackIdParamSchema = z.object({
    feedbackId: z.string().uuid(),
});

export const ListFeedbackSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateFeedbackInput = z.infer<typeof CreateFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof UpdateFeedbackSchema>;
export type ListFeedbackInput = z.infer<typeof ListFeedbackSchema>;
