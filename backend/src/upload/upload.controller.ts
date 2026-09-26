import type { NextFunction, Request, Response } from "express";
import sharp from "sharp";
import { storage } from "./storage.js";
import { authRepository } from "../repositories/auth.repository.js";
import { badRequest, notFound } from "../utils/errors.js";
import { getAuthUser } from "../utils/validate.js";

const AVATAR_MAX_WIDTH = 400;
const AVATAR_MAX_HEIGHT = 400;
const AVATAR_QUALITY = 80;

export const uploadController = {
    async uploadAvatar(req: Request, res: Response, next: NextFunction) {
        try {
            const authUser = getAuthUser(req);
            const file = req.file;
            if (!file) throw badRequest("No file uploaded");

            const processed = await sharp(file.buffer)
                .resize(AVATAR_MAX_WIDTH, AVATAR_MAX_HEIGHT, { fit: "cover" })
                .jpeg({ quality: AVATAR_QUALITY })
                .toBuffer();

            const url = await storage.save(processed, "avatar.jpg", "avatars");
            await authRepository.updateProfilePicture(authUser.userId, url);

            res.status(200).json({
                success: true,
                message: "Avatar uploaded successfully",
                data: { url },
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteAvatar(req: Request, res: Response, next: NextFunction) {
        try {
            const authUser = getAuthUser(req);
            const user = await authRepository.findById(authUser.userId) as { avatar_url?: string | null } | null;
            if (!user?.avatar_url) throw notFound("No avatar to delete");

            await storage.delete(user.avatar_url);
            await authRepository.updateProfilePicture(authUser.userId, null);

            res.status(200).json({
                success: true,
                message: "Avatar deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    },

    async uploadResume(req: Request, res: Response, next: NextFunction) {
        try {
            const file = req.file;
            if (!file) throw badRequest("No file uploaded");

            const url = await storage.save(file.buffer, file.originalname, "resumes");

            res.status(200).json({
                success: true,
                message: "Resume uploaded successfully",
                data: { url, originalName: file.originalname },
            });
        } catch (error) {
            next(error);
        }
    },
};
