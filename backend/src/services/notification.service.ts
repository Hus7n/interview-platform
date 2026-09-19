import { notificationsRepository } from "../repositories/notifications.repository.js";
import type { ListNotificationsInput } from "../validators/notification.schema.js";
import type { AuthUser } from "../types/user.js";
import { notFound } from "../utils/error.js";

function sanitizeNotification(record: { id: string; user_id: string; type: string; message: string; is_read: boolean; created_at: Date | string }) {
    return {
        id: record.id,
        userId: record.user_id,
        type: record.type,
        message: record.message,
        isRead: record.is_read,
        createdAt: record.created_at,
    };
}

export const notificationsService = {
    async createNotification(userId: string, type: string, message: string) {
        return sanitizeNotification(await notificationsRepository.create(userId, type, message));
    },

    async listNotifications(authUser: AuthUser, filters: ListNotificationsInput) {
        const repoFilters: { is_read?: boolean; type?: string } = {};
        if (filters.is_read !== undefined) repoFilters.is_read = filters.is_read;
        if (filters.type !== undefined) repoFilters.type = filters.type;

        const [notifications, total] = await Promise.all([
            notificationsRepository.findByUserId(authUser.userId, filters.page, filters.limit, repoFilters),
            notificationsRepository.countByUserId(authUser.userId, repoFilters),
        ]);

        return {
            notifications: notifications.map(sanitizeNotification),
            pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
        };
    },

    async getUnreadCount(authUser: AuthUser) {
        return { unreadCount: await notificationsRepository.countUnread(authUser.userId) };
    },

    async markAsRead(notificationId: string, authUser: AuthUser) {
        const notification = await notificationsRepository.markAsRead(notificationId, authUser.userId);
        if (!notification) throw notFound("Notification not found");
        return sanitizeNotification(notification);
    },

    async markAllAsRead(authUser: AuthUser) {
        await notificationsRepository.markAllAsRead(authUser.userId);
    },

    async deleteNotification(notificationId: string, authUser: AuthUser) {
        const notification = await notificationsRepository.delete(notificationId, authUser.userId);
        if (!notification) throw notFound("Notification not found");
    },

    async deleteAll(authUser: AuthUser) {
        await notificationsRepository.deleteAll(authUser.userId);
    },
};
