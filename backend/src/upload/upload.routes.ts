import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { uploadAvatar, uploadResume } from "./middleware.js";
import { uploadController } from "./upload.controller.js";

export const uploadRouter = Router();

uploadRouter.use(authenticate);

uploadRouter.post("/avatar", (req, res, next) => {
    uploadAvatar(req, res, next);
}, uploadController.uploadAvatar);

uploadRouter.delete("/avatar", uploadController.deleteAvatar);

uploadRouter.post("/resume", (req, res, next) => {
    uploadResume(req, res, next);
}, uploadController.uploadResume);
