import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transport = env.smtp.host
    ? nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port ?? 587,
        secure: (env.smtp.port ?? 587) === 465,
        auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
    : null;

/**
 * Outcome of a single delivery attempt. Callers must surface this to the user:
 * a "skipped" email is not a sent email, and pretending otherwise is how
 * interview invitations silently disappeared.
 */
export type MailResult = {
    delivered: boolean;
    reason?: "smtp_not_configured" | "send_failed";
    detail?: string;
};

export function isMailConfigured() {
    return transport !== null;
}

export async function sendMail(options: {
    to: string;
    subject: string;
    html: string;
    previewLink?: string;
}): Promise<MailResult> {
    if (!transport) {
        console.warn(
            `[mail] SMTP not configured — NOT delivered to ${options.to}: "${options.subject}"`,
        );
        if (options.previewLink) {
            console.warn(`[mail]   local link: ${options.previewLink}`);
        }
        return { delivered: false, reason: "smtp_not_configured" };
    }

    try {
        await transport.sendMail({
            from: env.smtp.from,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
        return { delivered: true };
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.error(`[mail] Failed to send "${options.subject}" to ${options.to}: ${detail}`);
        return { delivered: false, reason: "send_failed", detail };
    }
}
