import type { NextFunction, Request, Response } from "express";
import { editorService } from "../services/editor.service.js";
import { InterviewIdSchema, SaveCodeSchema } from "../validators/editor.schema.js";
import { parseRequest, getAuthUser } from "../utils/validate.js";

export const editorController = {
    async getCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = parseRequest(InterviewIdSchema, req.params);
            const code = await editorService.getCode(id, getAuthUser(req));

            res.status(200).json({
                success: true,
                data: { code },
            });
        } catch (error) {
            next(error);
        }
    },

    async saveCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = parseRequest(InterviewIdSchema, req.params);
            const input = parseRequest(SaveCodeSchema, req.body);
            const code = await editorService.saveCode(id, input, getAuthUser(req));

            res.status(200).json({
                success: true,
                message: "Code saved successfully",
                data: { code },
            });
        } catch (error) {
            next(error);
        }
    },

    async restoreCode(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = parseRequest(InterviewIdSchema, req.params);
            const code = await editorService.restoreCode(id, getAuthUser(req));

            res.status(200).json({
                success: true,
                message: "Code restored to starter code successfully",
                data: { code },
            });
        } catch (error) {
            next(error);
        }
    },
};
