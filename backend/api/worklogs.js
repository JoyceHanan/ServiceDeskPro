import express from "express";
import WorkLog from "../models/WorkLog.js";
import Ticket from "../models/Ticket.js";
import AuditLog from "../models/AuditLog.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/worklogs/ticket/:ticketId
router.get("/ticket/:ticketId", verifyToken, async (req, res, next) => {
    try {
        const worklogs = await WorkLog.find({ ticket: req.params.ticketId })
            .populate("technician", "name email role")
            .sort({ createdAt: -1 });

        const totalMinutes = worklogs.reduce((acc, log) => acc + log.timeSpentMinutes, 0);

        res.json({
            success: true,
            count: worklogs.length,
            totalMinutes,
            worklogs
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/worklogs
router.post("/", verifyToken, authorizeRoles("Technician", "IT Manager", "System Admin"), async (req, res, next) => {
    try {
        const { ticket, description, timeSpentMinutes } = req.body;

        if (!ticket || !description || !timeSpentMinutes) {
            return res.status(400).json({
                success: false,
                message: "Ticket ID, description, and timeSpentMinutes are required"
            });
        }

        const ticketExists = await Ticket.findById(ticket);
        if (!ticketExists) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const worklog = await WorkLog.create({
            ticket,
            technician: req.user._id,
            description,
            timeSpentMinutes: Number(timeSpentMinutes)
        });

        await AuditLog.create({
            user: req.user._id,
            action: "WORKLOG_ADD",
            entity: "Ticket",
            entityId: ticket.toString(),
            details: { timeSpentMinutes: Number(timeSpentMinutes), description }
        }).catch(() => {});

        res.status(201).json({
            success: true,
            message: "Work log recorded successfully",
            worklog
        });
    } catch (error) {
        next(error);
    }
});

export default router;
