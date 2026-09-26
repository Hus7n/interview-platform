import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { analyticsController } from "../controllers/analytics.controllers.js";

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);
analyticsRouter.use(authorize("admin"));

analyticsRouter.get("/dashboard", analyticsController.dashboard);
analyticsRouter.get("/by-language", analyticsController.interviewsByLanguage);
analyticsRouter.get("/by-month", analyticsController.interviewsByMonth);
analyticsRouter.get("/top-interviewers", analyticsController.topInterviewers);
analyticsRouter.get("/hire-rate", analyticsController.hireRate);
