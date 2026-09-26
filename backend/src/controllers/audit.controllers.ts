import type { NextFunction, Request, Response } from "express";
import { auditRepository } from "../repositories/audit.repository.js";
import { z } from "zod";
import { parseRequest } from "../utils/validate.js";

export const auditController = {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const input = parseRequest(
                z.object({
                    page: z.coerce.number().int().positive().default(1),
                    limit: z.coerce.number().int().min(1).max(100).default(20),
                    action: z.string().optional(),
                    entity: z.string().optional(),
                    userId: z.string().uuid().optional(),
                }),
                req.query
            );

            const [logs, total] = await Promise.all([
                auditRepository.findAll({
                    page: input.page,
                    limit: input.limit,
                    action: input.action,
                    entity: input.entity,
                    userId: input.userId,
                }),
                auditRepository.count({
                    action: input.action,
                    entity: input.entity,
                    userId: input.userId,
                }),
            ]);

            res.status(200).json({
                success: true,
                data: logs,
                pagination: {
                    page: input.page,
                    limit: input.limit,
                    total,
                    totalPages: Math.ceil(total / input.limit),
                },
            });
        } catch (error) {
            next(error);
        }
    },
};
