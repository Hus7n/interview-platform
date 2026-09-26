import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { notificationsController } from "../controllers/notification.controller.js";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get("/", notificationsController.listNotifications);
notificationsRouter.get("/unread-count", notificationsController.getUnreadCount);
notificationsRouter.patch("/read-all", notificationsController.markAllAsRead);
notificationsRouter.patch("/:notificationId/read", notificationsController.markAsRead);
notificationsRouter.delete("/delete-all", notificationsController.deleteAll);
notificationsRouter.delete("/:notificationId", notificationsController.deleteNotification);
