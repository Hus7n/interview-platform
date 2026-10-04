import { env } from "../config/env.js";

const BASE_URL = env.frontendUrl;

/**
 * Interview titles, descriptions and display names are user-supplied and get
 * interpolated straight into an HTML email body, so every dynamic value has to
 * be escaped before it lands in the markup.
 */
function esc(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function wrap(content: string) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">${content}</body></html>`;
}

function button(href: string, label: string) {
    return `<a href="${esc(href)}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">${esc(label)}</a>`;
}

/**
 * Start times must be unambiguous. `toLocaleString()` alone renders in the
 * *server's* timezone, so an invite created in Berlin but mailed from a UTC
 * host would tell the candidate the wrong hour. The numeric offset is included
 * so the recipient can always resolve it against their own clock.
 */
export function formatWhen(date: Date) {
    return `${date.toLocaleString(undefined, {
        dateStyle: "full",
        timeStyle: "short",
    })} (${date.toLocaleString(undefined, { timeZoneName: "shortOffset" }).match(/GMT[+-]\d{1,2}(:?\d{2})?/)?.[0] ?? "local time"})`;
}

export function verifyEmailTemplate(name: string, token: string) {
    const url = `${BASE_URL}/verify-email?token=${token}`;
    return wrap(`
        <h2>Verify your email</h2>
        <p>Hi ${esc(name)},</p>
        <p>Click the link below to verify your email address:</p>
        <p>${button(url, "Verify Email")}</p>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't create an account, you can ignore this email.</p>
    `);
}

export function resetPasswordTemplate(name: string, token: string) {
    const url = `${BASE_URL}/reset-password?token=${token}`;
    return wrap(`
        <h2>Reset your password</h2>
        <p>Hi ${esc(name)},</p>
        <p>Click the link below to reset your password:</p>
        <p>${button(url, "Reset Password")}</p>
        <p>This link expires in 30 minutes.</p>
        <p>If you didn't request this, you can ignore this email.</p>
    `);
}

export function interviewInvitationTemplate(
    name: string,
    interviewTitle: string,
    scheduledAt: Date,
    durationMinutes: number,
    interviewId: string,
    organizerName?: string | null,
    description?: string | null,
) {
    const joinUrl = `${BASE_URL}/interview/${interviewId}`;
    return wrap(`
        <h2>You've been invited to an interview</h2>
        <p>Hi ${esc(name)},</p>
        <p>You have been added as a participant to <strong>${esc(interviewTitle)}</strong>.</p>
        ${organizerName ? `<p><strong>Organiser:</strong> ${esc(organizerName)}</p>` : ""}
        <p><strong>Starts:</strong> ${esc(formatWhen(scheduledAt))}</p>
        <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
        ${description ? `<p>${esc(description)}</p>` : ""}
        <p>${button(joinUrl, "Join Interview")}</p>
        <p style="color:#666;font-size:12px;">
            The room opens shortly before the start time. Use the button above or
            sign in and pick the session from your interview list.
        </p>
    `);
}

export function interviewReminderTemplate(
    name: string,
    interviewTitle: string,
    scheduledAt: Date,
    interviewId: string,
) {
    const joinUrl = `${BASE_URL}/interview/${interviewId}`;
    return wrap(`
        <h2>Interview reminder</h2>
        <p>Hi ${esc(name)},</p>
        <p>This is a reminder that your interview <strong>${esc(interviewTitle)}</strong> is starting soon.</p>
        <p><strong>Starts:</strong> ${esc(formatWhen(scheduledAt))}</p>
        <p>${button(joinUrl, "Join Interview")}</p>
    `);
}

export function interviewCancellationTemplate(name: string, interviewTitle: string) {
    return wrap(`
        <h2>Interview cancelled</h2>
        <p>Hi ${esc(name)},</p>
        <p>The interview <strong>${esc(interviewTitle)}</strong> has been cancelled.</p>
        <p>If you have questions, please contact the interview organizer.</p>
    `);
}
