import { auditRepository } from "../repositories/audit.repository.js";

/**
 * Entity vocabulary is constrained so the admin audit page filters
 * (user / interview / feedback / auth) always match what gets written.
 */
export type AuditEntity = "user" | "interview" | "feedback" | "auth";

type AuditEntry = {
    action: string;
    entity: AuditEntity;
    userId?: string | null | undefined;
    entityId?: string | null | undefined;
    details?: Record<string, unknown> | null | undefined;
    ipAddress?: string | null | undefined;
};

export const auditService = {
    /**
     * Writes one audit row. Failures are logged but never propagated: losing an
     * audit entry must not turn a successful privileged action into a 500 for
     * the caller. Actions are dotted (`user.role_update`) so the page's action
     * filter stays useful without an enum migration per new event.
     */
    async record(entry: AuditEntry): Promise<void> {
        try {
            await auditRepository.log({
                userId: entry.userId ?? null,
                action: entry.action,
                entity: entry.entity,
                entityId: entry.entityId ?? null,
                details: entry.details ?? null,
                ipAddress: entry.ipAddress ?? null,
            });
        } catch (error) {
            console.error("[audit] failed to record entry", error);
        }
    },
};