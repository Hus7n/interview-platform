import { query } from "../db.js";
import type { AdminListUsersInput } from "../validators/admin.schema.js";

export const adminRepository = {
    async findUsers(filters: AdminListUsersInput) {
        const values: unknown[] = [];
        const conditions: string[] = [];

        if (filters.role) {
            values.push(filters.role);
            conditions.push(`u.role = $${values.length}`);
        }

        if (filters.is_active !== undefined) {
            values.push(filters.is_active);
            conditions.push(`u.is_active = $${values.length}`);
        }

        if (filters.search) {
            values.push(`%${filters.search}%`);
            conditions.push(`(u.email ILIKE $${values.length} OR p.display_name ILIKE $${values.length})`);
        }

        const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const offset = (filters.page - 1) * filters.limit;

        values.push(filters.limit);
        values.push(offset);

        const { rows } = await query(
            `SELECT u.id, u.email, u.role, u.is_active, u.email_verified, u.created_at, u.last_login_at,
                    p.display_name, p.avatar_url
             FROM users u
             LEFT JOIN profiles p ON p.user_id = u.id
             ${whereSql}
             ORDER BY u.created_at DESC
             LIMIT $${values.length - 1}
             OFFSET $${values.length}`,
            values
        );

        return rows;
    },

    async countUsers(filters: AdminListUsersInput) {
        const values: unknown[] = [];
        const conditions: string[] = [];

        if (filters.role) {
            values.push(filters.role);
            conditions.push(`u.role = $${values.length}`);
        }

        if (filters.is_active !== undefined) {
            values.push(filters.is_active);
            conditions.push(`u.is_active = $${values.length}`);
        }

        if (filters.search) {
            values.push(`%${filters.search}%`);
            conditions.push(`(u.email ILIKE $${values.length} OR p.display_name ILIKE $${values.length})`);
        }

        const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const { rows } = await query(
            `SELECT COUNT(*)::int AS total
             FROM users u
             LEFT JOIN profiles p ON p.user_id = u.id
             ${whereSql}`,
            values
        );

        return rows[0]?.total ?? 0;
    },

    async updateUser(userId: string, data: { role?: string | undefined; is_active?: boolean | undefined }) {
        const values: unknown[] = [];
        const updates: string[] = [];

        if (data.role) {
            values.push(data.role);
            updates.push(`role = $${values.length}`);
        }

        if (data.is_active !== undefined) {
            values.push(data.is_active);
            updates.push(`is_active = $${values.length}`);
        }

        if (updates.length === 0) return null;

        values.push(userId);

        const { rows } = await query(
            `UPDATE users
             SET ${updates.join(", ")}, updated_at = NOW()
             WHERE id = $${values.length}
             RETURNING id, email, role, is_active, created_at, updated_at`,
            values
        );

        return rows[0] ?? null;
    },

    async deleteUser(userId: string) {
        const { rows } = await query(
            `DELETE FROM users WHERE id = $1 RETURNING id, email`,
            [userId]
        );
        return rows[0] ?? null;
    },

    async findUserById(userId: string) {
        const { rows } = await query(
            `SELECT u.id, u.email, u.role, u.is_active, u.email_verified, u.created_at, u.last_login_at,
                    p.display_name, p.avatar_url
             FROM users u
             LEFT JOIN profiles p ON p.user_id = u.id
             WHERE u.id = $1
             LIMIT 1`,
            [userId]
        );
        return rows[0] ?? null;
    },

    async getAllInterviews(filters: { page: number; limit: number; status?: string | undefined }) {
        const values: unknown[] = [];
        const conditions: string[] = [];

        if (filters.status) {
            values.push(filters.status);
            conditions.push(`i.status = $${values.length}`);
        }

        const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const offset = (filters.page - 1) * filters.limit;

        values.push(filters.limit);
        values.push(offset);

        const { rows } = await query(
            `SELECT i.*, p.display_name AS creator_name, COUNT(ip.id)::int AS participant_count
             FROM interviews i
             LEFT JOIN profiles p ON p.user_id = i.created_by
             LEFT JOIN interview_participants ip ON ip.interview_id = i.id
             ${whereSql}
             GROUP BY i.id, p.display_name
             ORDER BY i.created_at DESC
             LIMIT $${values.length - 1}
             OFFSET $${values.length}`,
            values
        );

        return rows;
    },

    async countAllInterviews(status?: string | undefined) {
        const values: unknown[] = [];
        let whereSql = "";

        if (status) {
            values.push(status);
            whereSql = `WHERE status = $1`;
        }

        const { rows } = await query(
            `SELECT COUNT(*)::int AS total FROM interviews ${whereSql}`,
            values
        );

        return rows[0]?.total ?? 0;
    },
};
