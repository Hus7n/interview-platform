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

export async function sendMail(options: { to: string; subject: string; html: string }) {
    if (!transport) {
        console.log(`[mail] SMTP not configured, skipping email to ${options.to}: ${options.subject}`);
        return;
    }

    await transport.sendMail({
        from: env.smtp.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
    });
}
