import express from "express";
import SLA from "../models/SLA.js";
import Ticket from "../models/Ticket.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/sla
router.get("/", verifyToken, async (req, res, next) => {
    try {
        const slas = await SLA.find().sort({ priority: 1 });
        res.json({
            success: true,
            count: slas.length,
            slas
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/sla/:id
router.get("/:id", verifyToken, async (req, res, next) => {
    try {
        const sla = await SLA.findById(req.params.id);
        if (!sla) {
            return res.status(404).json({
                success: false,
                message: "SLA policy not found"
            });
        }
        res.json({
            success: true,
            sla
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/sla
router.post("/", verifyToken, authorizeRoles("System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const { name, priority, responseTimeHours, resolutionTimeHours, businessHoursOnly, escalationEmail, isActive } = req.body;

        if (!name || !priority || !responseTimeHours || !resolutionTimeHours) {
            return res.status(400).json({
                success: false,
                message: "Name, priority, responseTimeHours, and resolutionTimeHours are required"
            });
        }

        const existing = await SLA.findOne({ priority });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `An SLA policy for priority '${priority}' already exists`
            });
        }

        const sla = await SLA.create({
            name,
            priority,
            responseTimeHours,
            resolutionTimeHours,
            businessHoursOnly: businessHoursOnly || false,
            escalationEmail: escalationEmail || "",
            isActive: isActive !== undefined ? isActive : true
        });

        await AuditLog.create({
            user: req.user._id,
            action: "SLA_CREATE",
            entity: "SLA",
            entityId: sla._id.toString(),
            details: { name: sla.name, priority: sla.priority }
        }).catch(() => {});

        res.status(201).json({
            success: true,
            message: "SLA policy created successfully",
            sla
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/sla/:id
router.put("/:id", verifyToken, authorizeRoles("System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const { name, priority, responseTimeHours, resolutionTimeHours, businessHoursOnly, escalationEmail, isActive } = req.body;

        const sla = await SLA.findById(req.params.id);
        if (!sla) {
            return res.status(404).json({
                success: false,
                message: "SLA policy not found"
            });
        }

        if (name !== undefined) sla.name = name;
        if (priority !== undefined) sla.priority = priority;
        if (responseTimeHours !== undefined) sla.responseTimeHours = responseTimeHours;
        if (resolutionTimeHours !== undefined) sla.resolutionTimeHours = resolutionTimeHours;
        if (businessHoursOnly !== undefined) sla.businessHoursOnly = businessHoursOnly;
        if (escalationEmail !== undefined) sla.escalationEmail = escalationEmail;
        if (isActive !== undefined) sla.isActive = isActive;

        await sla.save();

        res.json({
            success: true,
            message: "SLA policy updated successfully",
            sla
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/sla/:id
router.delete("/:id", verifyToken, authorizeRoles("System Admin"), async (req, res, next) => {
    try {
        const sla = await SLA.findById(req.params.id);
        if (!sla) {
            return res.status(404).json({
                success: false,
                message: "SLA policy not found"
            });
        }

        await SLA.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "SLA policy deleted successfully"
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/sla/evaluate-breaches (Evaluate SLA breaches dynamically)
router.post("/evaluate-breaches", verifyToken, authorizeRoles("System Admin", "IT Manager", "Technician"), async (req, res, next) => {
    try {
        const now = new Date();
        // Find tickets that are not resolved/closed and resolutionDueAt < now and not already marked breached
        const breachedTickets = await Ticket.find({
            status: { $nin: ["Resolved", "Closed"] },
            resolutionDueAt: { $lt: now },
            slaBreached: false
        });

        let updatedCount = 0;
        for (const ticket of breachedTickets) {
            ticket.slaBreached = true;
            ticket.escalatedAt = now;
            await ticket.save();

            // Notify assigned tech or IT managers
            if (ticket.assignedTechnician) {
                await Notification.create({
                    user: ticket.assignedTechnician,
                    title: "SLA Breached Alert!",
                    message: `Resolution deadline has passed for ticket: "${ticket.title}"`,
                    type: "sla_breach",
                    link: `/tickets/${ticket._id}`
                }).catch(() => {});
            }

            await AuditLog.create({
                user: req.user._id,
                action: "SLA_BREACH_DETECTED",
                entity: "Ticket",
                entityId: ticket._id.toString(),
                details: { title: ticket.title, resolutionDueAt: ticket.resolutionDueAt }
            }).catch(() => {});

            updatedCount++;
        }

        res.json({
            success: true,
            message: `Evaluated SLA breaches. ${updatedCount} ticket(s) updated.`,
            updatedCount
        });
    } catch (error) {
        next(error);
    }
});

export default router;
