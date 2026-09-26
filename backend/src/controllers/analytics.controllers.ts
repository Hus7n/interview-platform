import type { NextFunction, Request, Response } from "express";
import { analyticsRepository } from "../repositories/analytics.repository.js";

export const analyticsController = {
    async dashboard(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await analyticsRepository.getDashboardStats();
            const ratings = await analyticsRepository.getAverageRatings();
            const hireRate = await analyticsRepository.getHireRate();

            res.status(200).json({
                success: true,
                data: { ...stats, ...ratings, ...hireRate },
            });
        } catch (error) {
            next(error);
        }
    },

    async interviewsByLanguage(_req: Request, res: Response, next: NextFunction) {
        try {
            const data = await analyticsRepository.getInterviewsByLanguage();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    async interviewsByMonth(_req: Request, res: Response, next: NextFunction) {
        try {
            const data = await analyticsRepository.getInterviewsByMonth();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    async topInterviewers(_req: Request, res: Response, next: NextFunction) {
        try {
            const data = await analyticsRepository.getTopInterviewers();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    async hireRate(_req: Request, res: Response, next: NextFunction) {
        try {
            const data = await analyticsRepository.getHireRate();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },
};
