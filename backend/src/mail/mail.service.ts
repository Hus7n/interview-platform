import { sendMail } from "./transport.js";
import {
    verifyEmailTemplate,
    resetPasswordTemplate,
    interviewInvitationTemplate,
    interviewReminderTemplate,
    interviewCancellationTemplate,
} from "./templates.js";

export const mailService = {
    async sendVerificationEmail(email: string, name: string, token: string) {
        await sendMail({
            to: email,
            subject: "Verify your email address",
            html: verifyEmailTemplate(name, token),
        });
    },

    async sendResetPasswordEmail(email: string, name: string, token: string) {
        await sendMail({
            to: email,
            subject: "Reset your password",
            html: resetPasswordTemplate(name, token),
        });
    },

    async sendInterviewInvitation(email: string, name: string, interviewTitle: string, scheduledAt: Date, durationMinutes: number) {
        await sendMail({
            to: email,
            subject: `Interview invitation: ${interviewTitle}`,
            html: interviewInvitationTemplate(name, interviewTitle, scheduledAt, durationMinutes),
        });
    },

    async sendInterviewReminder(email: string, name: string, interviewTitle: string, scheduledAt: Date) {
        await sendMail({
            to: email,
            subject: `Reminder: ${interviewTitle} starts soon`,
            html: interviewReminderTemplate(name, interviewTitle, scheduledAt),
        });
    },

    async sendInterviewCancellation(email: string, name: string, interviewTitle: string) {
        await sendMail({
            to: email,
            subject: `Interview cancelled: ${interviewTitle}`,
            html: interviewCancellationTemplate(name, interviewTitle),
        });
    },
};
