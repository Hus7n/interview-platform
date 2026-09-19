import { query } from "../db.js";

type AuditLogData = {
    userId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    details?: Record<string, unknown> | null;
    ipAddress?: string | null;
};

export const auditRepository = {
    async log(data: AuditLogData) {
        await query(
            `INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                data.userId ?? null,
                data.action,
                data.entity,
                data.entityId ?? null,
                data.details ? JSON.stringify(data.details) : null,
                data.ipAddress ?? null,
            ]
        );
    },

    async findAll(filters: { page: number; limit: number; action?: string | undefined; entity?: string | undefined; userId?: string | undefined }) {
        const values: unknown[] = [];
        const conditions: string[] = [];

        if (filters.action) {
            values.push(filters.action);
            conditions.push(`a.action = $${values.length}`);
        }

        if (filters.entity) {
            values.push(filters.entity);
            conditions.push(`a.entity = $${values.length}`);
        }

        if (filters.userId) {
            values.push(filters.userId);
            conditions.push(`a.user_id = $${values.length}`);
        }

        const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
        const offset = (filters.page - 1) * filters.limit;

        values.push(filters.limit);
        values.push(offset);

        const { rows } = await query(
            `SELECT a.*, p.display_name
             FROM audit_logs a
             LEFT JOIN profiles p ON p.user_id = a.user_id
             ${whereSql}
             ORDER BY a.created_at DESC
             LIMIT $${values.length - 1}
             OFFSET $${values.length}`,
            values
        );

        return rows;
    },

    async count(filters: { action?: string | undefined; entity?: string | undefined; userId?: string | undefined }) {
        const values: unknown[] = [];
        const conditions: string[] = [];

        if (filters.action) {
            values.push(filters.action);
            conditions.push(`action = $${values.length}`);
        }

        if (filters.entity) {
            values.push(filters.entity);
            conditions.push(`entity = $${values.length}`);
        }

        if (filters.userId) {
            values.push(filters.userId);
            conditions.push(`user_id = $${values.length}`);
        }

        const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const { rows } = await query(
            `SELECT COUNT(*)::int AS total FROM audit_logs ${whereSql}`,
            values
        );

        return rows[0]?.total ?? 0;
    },
};
