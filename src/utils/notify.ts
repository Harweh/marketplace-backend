import { Notification } from "../models/Notification.js";
import { sendEmail } from "../config/email.js";

interface NotifyOptions {
    userId: string;
    email: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    emailSubject: string;
    emailHtml: string;
}

// Creates the in-app notification and sends the matching email together —
// every trigger point (order confirmed, shipped, etc.) calls this once
// instead of duplicating both steps everywhere.
export async function notify(opts: NotifyOptions) {
    await Notification.create({
        user: opts.userId,
        type: opts.type,
        title: opts.title,
        message: opts.message,
        link: opts.link,
    });

    sendEmail(opts.email, opts.emailSubject, opts.emailHtml).catch(() => {});
}