import { sendMail, type MailResult } from "./transport.js";
import { env } from "../config/env.js";
import {
    verifyEmailTemplate,
    resetPasswordTemplate,
    interviewInvitationTemplate,
    interviewReminderTemplate,
    interviewCancellationTemplate,
} from "./templates.js";

export { isMailConfigured } from "./transport.js";
export type { MailResult } from "./transport.js";

export const mailService = {
    async sendVerificationEmail(email: string, name: string, token: string): Promise<MailResult> {
        return sendMail({
            to: email,
            subject: "Verify your email address",
            html: verifyEmailTemplate(name, token),
            previewLink: `${env.frontendUrl}/verify-email?token=${token}`,
        });
    },

    async sendResetPasswordEmail(email: string, name: string, token: string): Promise<MailResult> {
        return sendMail({
            to: email,
            subject: "Reset your password",
            html: resetPasswordTemplate(name, token),
            previewLink: `${env.frontendUrl}/reset-password?token=${token}`,
        });
    },

    async sendInterviewInvitation(
        email: string,
        name: string,
        interviewTitle: string,
        scheduledAt: Date,
        durationMinutes: number,
        interviewId: string,
        organizerName?: string | null,
        description?: string | null,
    ): Promise<MailResult> {
        return sendMail({
            to: email,
            subject: `Interview invitation: ${interviewTitle}`,
            html: interviewInvitationTemplate(
                name,
                interviewTitle,
                scheduledAt,
                durationMinutes,
                interviewId,
                organizerName,
                description,
            ),
            previewLink: `${env.frontendUrl}/interview/${interviewId}`,
        });
    },

    async sendInterviewReminder(
        email: string,
        name: string,
        interviewTitle: string,
        scheduledAt: Date,
        interviewId: string,
    ): Promise<MailResult> {
        return sendMail({
            to: email,
            subject: `Reminder: ${interviewTitle} starts soon`,
            html: interviewReminderTemplate(name, interviewTitle, scheduledAt, interviewId),
            previewLink: `${env.frontendUrl}/interview/${interviewId}`,
        });
    },

    async sendInterviewCancellation(email: string, name: string, interviewTitle: string): Promise<MailResult> {
        return sendMail({
            to: email,
            subject: `Interview cancelled: ${interviewTitle}`,
            html: interviewCancellationTemplate(name, interviewTitle),
        });
    },
};
