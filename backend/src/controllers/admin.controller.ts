import type { NextFunction, Request, Response } from "express";
import { parseRequest } from "../utils/validate.js";
import { adminUpdateUserSchema, adminListUsersSchema } from "../validators/admin.schema.js";
import { adminService } from "../services/admin.service.js";
import { auditService } from "../services/audit.service.js";
import { z } from "zod";

export const adminController = {
    async listUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const input = parseRequest(adminListUsersSchema, req.query);
            const result = await adminService.listUsers(input);

            res.status(200).json({
                success: true,
                data: result.users,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    },

    async getUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = parseRequest(z.object({ id: z.string().uuid() }), req.params);
            const user = await adminService.getUser(id);

            res.status(200).json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    },

    async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = parseRequest(z.object({ id: z.string().uuid() }), req.params);
            const input = parseRequest(adminUpdateUserSchema, req.body);

            // Read the prior state so the audit row records the transition.
            const before = await adminService.getUser(id) as {
                role?: string;
                is_active?: boolean;
            };
            const user = await adminService.updateUser(id, input);

            if (input.role !== undefined) {
                await auditService.record({
                    action: "user.role_update",
                    entity: "user",
                    entityId: id,
                    userId: req.user?.userId,
                    ipAddress: req.ip,
                    details: { from: before?.role ?? null, to: input.role },
                });
            }
            if (input.is_active !== undefined) {
                await auditService.record({
                    action: "user.status_update",
                    entity: "user",
                    entityId: id,
                    userId: req.user?.userId,
                    ipAddress: req.ip,
                    details: { from: before?.is_active ?? null, to: input.is_active },
                });
            }

            res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = parseRequest(z.object({ id: z.string().uuid() }), req.params);
            const removed = await adminService.deleteUser(id) as { email?: string } | undefined;
            await auditService.record({
                action: "user.delete",
                entity: "user",
                entityId: id,
                userId: req.user?.userId,
                ipAddress: req.ip,
                details: { email: removed?.email ?? null },
            });

            res.status(200).json({
                success: true,
                message: "User deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    },

    async listInterviews(req: Request, res: Response, next: NextFunction) {
        try {
            const input = parseRequest(
                z.object({
                    page: z.coerce.number().int().positive().default(1),
                    limit: z.coerce.number().int().min(1).max(100).default(20),
                    status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
                }),
                req.query
            );
            const result = await adminService.listAllInterviews({
                page: input.page,
                limit: input.limit,
                status: input.status,
            });

            res.status(200).json({
                success: true,
                data: result.interviews,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    },
};
