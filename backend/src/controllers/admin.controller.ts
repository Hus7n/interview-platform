import type { NextFunction, Request, Response } from "express";
import { parseRequest } from "../utils/validate.js";
import { adminUpdateUserSchema, adminListUsersSchema } from "../validators/admin.schema.js";
import { adminService } from "../services/admin.service.js";
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
            const user = await adminService.updateUser(id, input);

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
            await adminService.deleteUser(id);

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
