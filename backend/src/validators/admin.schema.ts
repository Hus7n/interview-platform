import { z } from "zod";

export const adminUpdateUserSchema = z.object({
    role: z.enum(["admin", "interviewer", "candidate"]).optional(),
    is_active: z.boolean().optional(),
}).refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required",
});

export const adminListUsersSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    role: z.enum(["admin", "interviewer", "candidate"]).optional(),
    search: z.string().trim().min(1).max(150).optional(),
    is_active: z.coerce.boolean().optional(),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type AdminListUsersInput = z.infer<typeof adminListUsersSchema>;
