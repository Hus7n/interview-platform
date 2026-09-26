import type { NextFunction, Request, Response } from "express";
import { feedbackService } from "../services/feedback.service.js";
import {
    CreateFeedbackSchema,
    FeedbackIdParamSchema,
    InterviewIdParamSchema,
    ListFeedbackSchema,
    UpdateFeedbackSchema,
} from "../validators/feedback.schema.js";
import { parseRequest, getAuthUser } from "../utils/validate.js";

const FeedbackParamsSchema = InterviewIdParamSchema.extend(FeedbackIdParamSchema.shape);

export const feedbackController = {
    async createFeedback(req: Request, res: Response, next: NextFunction) {
        try {
            const { interviewId } = parseRequest(InterviewIdParamSchema, req.params);
            const input = parseRequest(CreateFeedbackSchema, req.body);
            const feedback = await feedbackService.createFeedback(interviewId, input, getAuthUser(req));

            res.status(201).json({
                success: true,
                message: "Feedback submitted successfully",
                data: { feedback },
            });
        } catch (error) {
            next(error);
        }
    },

    async listFeedback(req: Request, res: Response, next: NextFunction) {
        try {
            const { interviewId } = parseRequest(InterviewIdParamSchema, req.params);
            const filters = parseRequest(ListFeedbackSchema, req.query);
            const result = await feedbackService.listFeedback(interviewId, filters , getAuthUser(req));

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async getFeedback(req: Request, res: Response, next: NextFunction) {
        try {
            const { interviewId, feedbackId } = parseRequest(FeedbackParamsSchema, req.params);
            const feedback = await feedbackService.getFeedback(feedbackId, interviewId , getAuthUser(req));

            res.status(200).json({
                success: true,
                data: { feedback },
            });
        } catch (error) {
            next(error);
        }
    },

    async updateFeedback(req: Request, res: Response, next: NextFunction) {
        try {
            const { interviewId, feedbackId } = parseRequest(FeedbackParamsSchema, req.params);
            const input = parseRequest(UpdateFeedbackSchema, req.body);
            const feedback = await feedbackService.updateFeedback(feedbackId, interviewId, input, getAuthUser(req));

            res.status(200).json({
                success: true,
                message: "Feedback updated successfully",
                data: { feedback },
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteFeedback(req: Request, res: Response, next: NextFunction) {
        try {
            const { interviewId, feedbackId } = parseRequest(FeedbackParamsSchema, req.params);
            await feedbackService.deleteFeedback(feedbackId, interviewId, getAuthUser(req));

            res.status(200).json({
                success: true,
                message: "Feedback deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    },
};
