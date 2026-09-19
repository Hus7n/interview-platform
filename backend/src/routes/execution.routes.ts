import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { executionController } from "../controllers/execution.controller.js";

export const executionRouter = Router();

executionRouter.use(authenticate);

executionRouter.post("/run", executionController.execute);
executionRouter.post("/test", executionController.runTestCases);
