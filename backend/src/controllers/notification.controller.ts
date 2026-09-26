import type { NextFunction, Request, Response } from "express";
import { notificationsService } from "../services/notification.service.js";
import { ListNotificationsSchema } from "../validators/notification.schema.js";
import { parseRequest, getAuthUser } from "../utils/validate.js";
import { validationError } from "../utils/errors.js";

export const notificationsController = {
    async listNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const filters = parseRequest(ListNotificationsSchema, req.query);
            const result = await notificationsService.listNotifications(getAuthUser(req), filters);

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async getUnreadCount(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await notificationsService.getUnreadCount(getAuthUser(req));

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async markAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params["notificationId"];
            if (!id || Array.isArray(id)) throw validationError("Notification ID is required");
            const notification = await notificationsService.markAsRead(id, getAuthUser(req));

            res.status(200).json({
                success: true,
                message: "Notification marked as read",
                data: { notification },
            });
        } catch (error) {
            next(error);
        }
    },

    async markAllAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            await notificationsService.markAllAsRead(getAuthUser(req));

            res.status(200).json({
                success: true,
                message: "All notifications marked as read",
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteNotification(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params["notificationId"];
            if (!id || Array.isArray(id)) throw validationError("Notification ID is required");
            await notificationsService.deleteNotification(id, getAuthUser(req));

            res.status(200).json({
                success: true,
                message: "Notification deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteAll(req: Request, res: Response, next: NextFunction) {
        try {
            await notificationsService.deleteAll(getAuthUser(req));

            res.status(200).json({
                success: true,
                message: "All notifications deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    },
};
