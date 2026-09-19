import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { auditController } from "../controllers/audit.controller.js";

export const auditRouter = Router();

auditRouter.use(authenticate);
auditRouter.use(authorize("admin"));

auditRouter.get("/", auditController.list);
