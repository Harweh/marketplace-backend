import { type Request, type Response, type NextFunction } from "express";
import { Notification } from "../models/Notification.js";
import { ok } from "../utils/response.js";

export async function listMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
        const notifications = await Notification.find({ user: req.user!.userId })
        .sort({ createdAt: -1 })
        .limit(50);
        const unreadCount = await Notification.countDocuments({ user: req.user!.userId, read: false });
        return ok(res, { notifications, unreadCount });
    } catch (err) {
        next(err);
    }
}

export async function markAsRead(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
        await Notification.updateOne(
        { _id: req.params.id, user: req.user!.userId },
        { read: true }
        );
        return ok(res, { success: true });
    } catch (err) {
        next(err);
    }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
        await Notification.updateMany({ user: req.user!.userId, read: false }, { read: true });
        return ok(res, { success: true });
    } catch (err) {
        next(err);
    }
}