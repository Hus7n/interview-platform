import type { Request } from "express";
import type { z } from "zod";
import { validationError, badRequest } from "./error.js";

export function parseRequest<TSchema extends z.ZodTypeAny>(
    schema: TSchema,
    input: unknown
): z.infer<TSchema> {
    const result = schema.safeParse(input);
    if (!result.success) {
        throw validationError(result.error.issues[0]?.message ?? "Invalid request");
    }
    return result.data;
}

export function getAuthUser(req: Request) {
    if (!req.user) {
        throw badRequest("Authenticated user is required");
    }
    return req.user;
}
