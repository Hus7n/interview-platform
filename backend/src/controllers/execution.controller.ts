import type { NextFunction, Request, Response } from "express";
import { parseRequest } from "../utils/validate.js";
import { executeCodeSchema, runTestCasesSchema } from "../validators/execution.schema.js";
import { executionService } from "../services/execution.service.js";

export const executionController = {
    async execute(req: Request, res: Response, next: NextFunction) {
        try {
            const input = parseRequest(executeCodeSchema, req.body);
            const result = await executionService.execute(input);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async runTestCases(req: Request, res: Response, next: NextFunction) {
        try {
            const input = parseRequest(runTestCasesSchema, req.body);
            const result = await executionService.runTestCases(input);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },
};
