import { z } from "zod";

export const ListNotificationsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    is_read: z.coerce.boolean().optional(),
    type: z.string().trim().min(1).max(30).optional(),
});

export type ListNotificationsInput = z.infer<typeof ListNotificationsSchema>;
