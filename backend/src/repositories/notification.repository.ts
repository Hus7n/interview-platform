import { query } from "../db.js";

type NotificationRecord = {
    id: string;
    user_id: string;
    type: string;
    message: string;
    is_read: boolean;
    created_at: Date | string;
};

export const notificationsRepository = {
    async create(userId: string, type: string, message: string) {
        const { rows } = await query(
            `INSERT INTO notifications (user_id, type, message)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [userId, type, message]
        );
        return rows[0] as NotificationRecord;
    },

    async findById(notificationId: string) {
        const { rows } = await query(
            `SELECT * FROM notifications WHERE id = $1 LIMIT 1`,
            [notificationId]
        );
        return (rows[0] as NotificationRecord | undefined) ?? null;
    },

    async findByUserId(userId: string, page: number, limit: number, filters: { is_read?: boolean; type?: string }) {
        const values: unknown[] = [userId];
        const conditions: string[] = ["user_id = $1"];

        if (filters.is_read !== undefined) {
            values.push(filters.is_read);
            conditions.push(`is_read = $${values.length}`);
        }
        if (filters.type) {
            values.push(filters.type);
            conditions.push(`type = $${values.length}`);
        }

        const whereSql = `WHERE ${conditions.join(" AND ")}`;
        const offset = (page - 1) * limit;
        values.push(limit, offset);

        const { rows } = await query(
            `SELECT * FROM notifications
            ${whereSql}
            ORDER BY created_at DESC
            LIMIT $${values.length - 1} OFFSET $${values.length}`,
            values
        );
        return rows as NotificationRecord[];
    },

    async countByUserId(userId: string, filters: { is_read?: boolean; type?: string }) {
        const values: unknown[] = [userId];
        const conditions: string[] = ["user_id = $1"];

        if (filters.is_read !== undefined) {
            values.push(filters.is_read);
            conditions.push(`is_read = $${values.length}`);
        }
        if (filters.type) {
            values.push(filters.type);
            conditions.push(`type = $${values.length}`);
        }

        const whereSql = `WHERE ${conditions.join(" AND ")}`;
        const { rows } = await query(
            `SELECT COUNT(*)::int AS total FROM notifications ${whereSql}`,
            values
        );
        return (rows[0] as { total: number } | undefined)?.total ?? 0;
    },

    async countUnread(userId: string) {
        const { rows } = await query(
            `SELECT COUNT(*)::int AS total FROM notifications
            WHERE user_id = $1 AND is_read = FALSE`,
            [userId]
        );
        return (rows[0] as { total: number } | undefined)?.total ?? 0;
    },

    async markAsRead(notificationId: string, userId: string) {
        const { rows } = await query(
            `UPDATE notifications SET is_read = TRUE
            WHERE id = $1 AND user_id = $2
            RETURNING *`,
            [notificationId, userId]
        );
        return (rows[0] as NotificationRecord | undefined) ?? null;
    },

    async markManyAsRead(notificationIds: string[], userId: string) {
        if (notificationIds.length === 0) return;

        await query(
            `UPDATE notifications SET is_read = TRUE
            WHERE id = ANY($1) AND user_id = $2`,
            [notificationIds, userId]
        );
    },

    async markAllAsRead(userId: string) {
        await query(
            `UPDATE notifications SET is_read = TRUE
            WHERE user_id = $1 AND is_read = FALSE`,
            [userId]
        );
    },

    async delete(notificationId: string, userId: string) {
        const { rows } = await query(
            `DELETE FROM notifications
            WHERE id = $1 AND user_id = $2
            RETURNING *`,
            [notificationId, userId]
        );
        return (rows[0] as NotificationRecord | undefined) ?? null;
    },

    async deleteAll(userId: string) {
        await query(
            `DELETE FROM notifications WHERE user_id = $1`,
            [userId]
        );
    },
};
