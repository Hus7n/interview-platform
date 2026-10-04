import {z} from "zod";

const interviewStatusSchema = z.enum([
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
]);

const participantRoleSchema = z.enum(["interviewer" , "candidate"]);
const scheduledAtSchema = z.coerce.date();

export const CreateInterviewSchema = z.object({
    title : z.string().trim().min(3).max(150),
    description : z.string().trim().max(2000).optional().nullable(),
    scheduled_at : scheduledAtSchema,
    duration_minutes : z.coerce.number().int().min(15).max(480),
    language : z.string().trim().min(1).max(50),
    starter_code : z.string().max(20000).optional().nullable(),
    participants : z
        .array(z.object({
            user_id : z.string().uuid(),
            role : participantRoleSchema.default("candidate"),
        }))
        .max(20)
        .optional()
        .default([]),
});

export const UpdateInterviewSchema = z.object({
    title : z.string().trim().min(3).max(150).optional(),
    description : z.string().trim().max(2000).optional().nullable(),
    scheduled_at : scheduledAtSchema.optional(),
    duration_minutes : z.coerce.number().int().min(15).max(480).optional(),
    language : z.string().trim().min(1).max(50).optional(),
    starter_code : z.string().max(20000).optional().nullable(),
})

.refine((value) => Object.keys(value).length > 0 , {
    message : "At least one field is required",
});

export const InterviewIdSchema = z.object({
    id : z.string().uuid(),
});

export const StatusSchema = z.object({
    status : interviewStatusSchema,
});

export const ListInterviewSchema = z.object({
    page : z.coerce.number().int().positive().default(1),
    limit : z.coerce.number().int().min(1).max(100).default(20),
    status : interviewStatusSchema.optional(),
    language : z.string().trim().min(1).max(50).optional(),
    created_by : z.string().uuid().optional(),
    room_id : z.string().trim().min(1).max(100).optional(),
    from_date : scheduledAtSchema.optional(),
    to_date : scheduledAtSchema.optional(),
    search : z.string().trim().min(1).max(150).optional(),
});

export const AddParticipantSchema = z.object({
    user_id : z.string().uuid(),
    role : participantRoleSchema,
});

export const RemoveParticipantSchema = z.object({
    user_id : z.string().uuid(),
});

export type CreateInterviewInput = z.infer<typeof CreateInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof UpdateInterviewSchema>;
export type ListInterviewInput  = z.infer<typeof ListInterviewSchema >;
export type AddParticipantInput = z.infer<typeof AddParticipantSchema >;
export type RemoveParticipantInput  = z.infer<typeof RemoveParticipantSchema >;
export type InterviewStatus = z.infer<typeof interviewStatusSchema >;
export type ParticipantRole = z.infer<typeof participantRoleSchema>;
