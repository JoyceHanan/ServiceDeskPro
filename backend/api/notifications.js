import express from "express";
import Notification from "../models/Notification.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/notifications
router.get("/", verifyToken, async (req, res, next) => {
    try {
        const { unreadOnly } = req.query;
        let query = { user: req.user._id };

        if (unreadOnly === "true") {
            query.read = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

        res.json({
            success: true,
            count: notifications.length,
            unreadCount,
            notifications
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", verifyToken, async (req, res, next) => {
    try {
        await Notification.updateMany({ user: req.user._id, read: false }, { read: true });

        res.json({
            success: true,
            message: "All notifications marked as read"
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", verifyToken, async (req, res, next) => {
    try {
        const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        notification.read = true;
        await notification.save();

        res.json({
            success: true,
            message: "Notification marked as read",
            notification
        });
    } catch (error) {
        next(error);
    }
});

export default router;
