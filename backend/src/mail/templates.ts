import { env } from "../config/env.js";

const BASE_URL = env.frontendUrl;

function wrap(content: string) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">${content}</body></html>`;
}

export function verifyEmailTemplate(name: string, token: string) {
    const url = `${BASE_URL}/verify-email?token=${token}`;
    return wrap(`
        <h2>Verify your email</h2>
        <p>Hi ${name},</p>
        <p>Click the link below to verify your email address:</p>
        <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a></p>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't create an account, you can ignore this email.</p>
    `);
}

export function resetPasswordTemplate(name: string, token: string) {
    const url = `${BASE_URL}/reset-password?token=${token}`;
    return wrap(`
        <h2>Reset your password</h2>
        <p>Hi ${name},</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">Reset Password</a></p>
        <p>This link expires in 30 minutes.</p>
        <p>If you didn't request this, you can ignore this email.</p>
    `);
}

export function interviewInvitationTemplate(
    name: string,
    interviewTitle: string,
    scheduledAt: Date,
    durationMinutes: number
) {
    const dateStr = scheduledAt.toLocaleString();
    return wrap(`
        <h2>You've been invited to an interview</h2>
        <p>Hi ${name},</p>
        <p>You've been added as a participant to <strong>${interviewTitle}</strong>.</p>
        <p><strong>Scheduled:</strong> ${dateStr}</p>
        <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
        <p><a href="${BASE_URL}/interviews" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">View Interview</a></p>
    `);
}

export function interviewReminderTemplate(name: string, interviewTitle: string, scheduledAt: Date) {
    const dateStr = scheduledAt.toLocaleString();
    return wrap(`
        <h2>Interview reminder</h2>
        <p>Hi ${name},</p>
        <p>This is a reminder that your interview <strong>${interviewTitle}</strong> is starting soon.</p>
        <p><strong>Scheduled:</strong> ${dateStr}</p>
        <p><a href="${BASE_URL}/interviews" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">Join Interview</a></p>
    `);
}

export function interviewCancellationTemplate(name: string, interviewTitle: string) {
    return wrap(`
        <h2>Interview cancelled</h2>
        <p>Hi ${name},</p>
        <p>The interview <strong>${interviewTitle}</strong> has been cancelled.</p>
        <p>If you have questions, please contact the interview organizer.</p>
    `);
}
