import type { NextFunction, Request, Response } from "express";
import { searchRepository } from "../repositories/search.repository.js";
import { getAuthUser } from "../utils/validate.js";

export const searchController = {
    async global(req: Request, res: Response, next: NextFunction) {
        try {
            const authUser = getAuthUser(req);
            const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
            const limit = Math.min(Number(req.query.limit) || 10, 50);

            if (!q || q.length < 2) {
                res.status(200).json({
                    success: true,
                    data: { users: [], interviews: [] },
                });
                return;
            }

            const results = await searchRepository.searchAll(q, authUser.userId, limit);

            res.status(200).json({
                success: true,
                data: results,
            });
        } catch (error) {
            next(error);
        }
    },
};
