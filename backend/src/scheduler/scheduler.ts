import cron from "node-cron";
import { pool } from "../db.js";
import { authRepository } from "../repositories/auth.repository.js";
import { mailService } from "../mail/mail.service.js";
import type { UserRecord } from "../types/user.js";

function log(job: string, msg: string) {
    console.log(`[scheduler] ${job}: ${msg}`);
}

async function deleteExpiredSessions() {
    const result = await pool.query(`DELETE FROM sessions WHERE expires_at <= NOW()`);
    log("sessions", `deleted ${result.rowCount} expired sessions`);
}

async function expireResetTokens() {
    const result = await pool.query(
        `UPDATE users SET reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
        WHERE reset_token IS NOT NULL AND reset_token_expires <= NOW()`
    );
    log("reset-tokens", `expired ${result.rowCount} reset tokens`);
}

async function interviewReminders() {
    const { rows } = await pool.query(
        `SELECT i.id, i.title, i.scheduled_at, p.user_id
        FROM interviews i
        JOIN interview_participants p ON p.interview_id = i.id
        WHERE i.status = 'scheduled'
        AND i.scheduled_at BETWEEN NOW() AND NOW() + interval '1 hour'
        AND NOT EXISTS (
            SELECT 1 FROM notifications n
            WHERE n.user_id = p.user_id
            AND n.type = 'interview_reminder'
            AND n.message LIKE '%' || i.id || '%'
            AND n.created_at > NOW() - interval '2 hours'
        )`
    );

    for (const row of rows as { id: string; title: string; scheduled_at: Date; user_id: string }[]) {
        const user = await authRepository.findById(row.user_id) as UserRecord | null;
        if (!user) continue;

        await mailService
            .sendInterviewReminder(
                user.email,
                user.display_name ?? user.email,
                row.title,
                new Date(row.scheduled_at),
                row.id,
            )
            .then((result) => {
                if (!result.delivered) {
                    log("reminders", `email not delivered to ${user.email}: ${result.reason ?? "unknown"}`);
                }
            })
            .catch((error: unknown) => {
                log("reminders", `email error for ${user.email}: ${error instanceof Error ? error.message : String(error)}`);
            });

        await pool.query(
            `INSERT INTO notifications (user_id, type, message)
            VALUES ($1, 'interview_reminder', $2)`,
            [row.user_id, `Your interview "${row.title}" starts in less than an hour`]
        );
    }

    log("reminders", `sent ${rows.length} interview reminders`);
}

async function autoCompleteInterviews() {
    const result = await pool.query(
        `UPDATE interviews
        SET status = 'completed', updated_at = NOW()
        WHERE status = 'in_progress'
        AND scheduled_at + (duration_minutes || ' minutes')::interval < NOW()`
    );
    log("auto-complete", `completed ${result.rowCount} interviews`);
}

async function cleanupNotifications() {
    const result = await pool.query(
        `DELETE FROM notifications WHERE created_at < NOW() - interval '30 days'`
    );
    log("cleanup", `deleted ${result.rowCount} old notifications`);
}

export function startScheduler() {
    cron.schedule("* * * * *", deleteExpiredSessions);
    cron.schedule("*/5 * * * *", expireResetTokens);
    cron.schedule("*/15 * * * *", interviewReminders);
    cron.schedule("*/5 * * * *", autoCompleteInterviews);
    cron.schedule("0 0 * * *", cleanupNotifications);

    log("init", "scheduler started");
}
