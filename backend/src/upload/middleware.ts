import multer from "multer";
import type { Request } from "express";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB

const memStorage = multer.memoryStorage();

export const uploadAvatar = multer({
    storage: memStorage,
    limits: { fileSize: MAX_IMAGE_SIZE },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
        }
    },
}).single("file");

export const uploadResume = multer({
    storage: memStorage,
    limits: { fileSize: MAX_DOC_SIZE },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        if (ALLOWED_DOC_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }
    },
}).single("file");
