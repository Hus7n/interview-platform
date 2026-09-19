import { z } from "zod";
import { InterviewIdSchema } from "./interview.schema.js";

export { InterviewIdSchema };

export const SaveCodeSchema = z.object({
    code: z.string().max(20000).default(""),
    language: z.string().trim().min(1).max(50).default("javascript"),
});

export const RestoreCodeSchema = InterviewIdSchema;

export type SaveCodeInput = z.infer<typeof SaveCodeSchema>;
export type RestoreCodeInput = z.infer<typeof RestoreCodeSchema>;
