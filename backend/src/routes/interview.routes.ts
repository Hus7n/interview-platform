import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { interviewController } from "../controllers/interview.controller.js";

export const interviewRouter = Router();

interviewRouter.use(authenticate);

interviewRouter.post("/", interviewController.createInterview);
interviewRouter.get("/", interviewController.listInterviews);

interviewRouter.patch("/:id/status", interviewController.changeInterviewStatus);
interviewRouter.post("/:id/participants", interviewController.addParticipant);
interviewRouter.get("/:id/participants", interviewController.listParticipants);
interviewRouter.delete("/:id/participants", interviewController.removeParticipant);

interviewRouter.get("/:id", interviewController.getInterview);
interviewRouter.patch("/:id", interviewController.updateInterview);
interviewRouter.delete("/:id", interviewController.deleteInterview);
