import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { feedbackController } from "../controllers/feedback.controller.js";

export const feedbackRouter = Router({ mergeParams: true });

feedbackRouter.use(authenticate);

feedbackRouter.post("/", feedbackController.createFeedback);
feedbackRouter.get("/", feedbackController.listFeedback);
feedbackRouter.get("/:feedbackId", feedbackController.getFeedback);
feedbackRouter.patch("/:feedbackId", feedbackController.updateFeedback);
feedbackRouter.delete("/:feedbackId", feedbackController.deleteFeedback);
