import type { NextFunction, Request, Response } from "express";
import { interviewService } from "../services/interview.service.js";
import {
    AddParticipantSchema,
    CreateInterviewSchema,
    InterviewIdSchema,
    ListInterviewSchema,
    RemoveParticipantSchema,
    StatusSchema,
    UpdateInterviewSchema,
} from "../validators/interview.schema.js";
import { parseRequest, getAuthUser } from "../utils/validate.js";

export const interviewController = {
    async createInterview(req: Request, res: Response, next: NextFunction) {
        try {
            const input = parseRequest(CreateInterviewSchema, req.body);
            const interview = await interviewService.createInterview(input, getAuthUser(req));

            res.status(201).json({
                success: true,
                message: "Interview created successfully",
                data: { interview },
            });
        } catch (error) {
            next(error);
        }
    },

    async updateInterview(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = parseRequest(InterviewIdSchema, req.params);
            const input = parseRequest(UpdateInterviewSchema, req.body);
            const interview = await interviewService.updateInterview(id, input, getAuthUser(req));

            res.status(200).json({
                success: true,
                message: "Interview updated successfully",
                data: { interview },
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteInterview(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = parseRequest(InterviewIdSchema, req.params);
            await interviewService.deleteInterview(id, getAuthUser(req));

            res.status(200).json({
                success: true,
                message: "Interview deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    },

    async getInterview(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = parseRequest(InterviewIdSchema, req.params);
            const interview = await interviewService.getInterview(id , getAuthUser(req));

            res.status(200).json({
                success: true,
                data: { interview },
            });
        } catch (error) {
            next(error);
        }
    },

    async listInterviews(req: Request, res: Response, next: NextFunction) {
        try {
            const input = parseRequest(ListInterviewSchema, req.query);
            const result = await interviewService.listInterviews(input , getAuthUser(req));

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async changeInterviewStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = parseRequest(InterviewIdSchema, req.params);
            const { status } = parseRequest(StatusSchema, req.body);
            const interview = await interviewService.changeInterviewStatus(
                id,
                status,
                getAuthUser(req)
            );

            res.status(200).json({
                success: true,
                message: "Interview status updated successfully",
                data: { interview },
            });
        } catch (error) {
            next(error);
        }
    },

    async addParticipant(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = parseRequest(InterviewIdSchema, req.params);
            const input = parseRequest(AddParticipantSchema, req.body);
            const participant = await interviewService.addParticipant(id, input, getAuthUser(req));

            res.status(201).json({
                success: true,
                message: "Participant added successfully",
                data: { participant },
            });
        } catch (error) {
            next(error);
        }
    },

    async removeParticipant(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = parseRequest(InterviewIdSchema, req.params);
            const input = parseRequest(RemoveParticipantSchema, req.body);
            await interviewService.removeParticipant(id, input, getAuthUser(req));

            res.status(200).json({
                success: true,
                message: "Participant removed successfully",
            });
        } catch (error) {
            next(error);
        }
    },

    async listParticipants(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = parseRequest(InterviewIdSchema, req.params);
            const participants = await interviewService.listParticipants(id , getAuthUser(req));

            res.status(200).json({
                success: true,
                data: { participants },
            });
        } catch (error) {
            next(error);
        }
    },
};
