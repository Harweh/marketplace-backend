import { Resend } from "resend";
import { env } from "./env.js";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
    try {
        await resend.emails.send({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
        });
    } catch (err) {
        // Email failures should never break the request that triggered
        // them (an order still succeeded even if the confirmation email
        // failed to send) — log and move on.
        console.error(`Failed to send email to ${to}:`, err);
    }
}