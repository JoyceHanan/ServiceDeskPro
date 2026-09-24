import express from "express";
import AuditLog from "../models/AuditLog.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/audit (System Admin, IT Manager)
router.get("/", verifyToken, authorizeRoles("System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const { action, entity, user, page = 1, limit = 50 } = req.query;
        let query = {};

        if (action) query.action = action;
        if (entity) query.entity = entity;
        if (user) query.user = user;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const logs = await AuditLog.find(query)
            .populate("user", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await AuditLog.countDocuments(query);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            logs
        });
    } catch (error) {
        next(error);
    }
});

export default router;
