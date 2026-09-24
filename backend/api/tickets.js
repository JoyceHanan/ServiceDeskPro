import express from "express";
import Ticket from "../models/Ticket.js";
import SLA from "../models/SLA.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import Category from "../models/Category.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";

const router = express.Router();

// Helper to calculate SLA deadlines
async function calculateSLADeadlines(priority) {
    const sla = await SLA.findOne({ priority, isActive: true });
    let responseHours = 24;
    let resolutionHours = 72;

    if (priority === "Critical") { responseHours = 2; resolutionHours = 8; }
    else if (priority === "High") { responseHours = 4; resolutionHours = 24; }
    else if (priority === "Medium") { responseHours = 12; resolutionHours = 48; }
    else if (priority === "Low") { responseHours = 24; resolutionHours = 96; }

    if (sla) {
        if (sla.responseTimeHours) responseHours = sla.responseTimeHours;
        if (sla.resolutionTimeHours) resolutionHours = sla.resolutionTimeHours;
    }

    const now = new Date();
    const responseDueAt = new Date(now.getTime() + responseHours * 60 * 60 * 1000);
    const resolutionDueAt = new Date(now.getTime() + resolutionHours * 60 * 60 * 1000);

    return {
        slaPolicy: sla ? sla._id : null,
        responseDueAt,
        resolutionDueAt
    };
}

// POST /api/tickets/ai-classify (AI Classification endpoint)
router.post("/ai-classify", verifyToken, async (req, res, next) => {
    try {
        const { title, description } = req.body;
        if (!title && !description) {
            return res.status(400).json({
                success: false,
                message: "Title or description is required for AI classification"
            });
        }

        const text = `${title || ""} ${description || ""}`.toLowerCase();

        // Check if AI API key is configured
        const apiKey = process.env.AI_API_KEY;
        if (apiKey && apiKey.trim() !== "") {
            try {
                // Call external AI service (e.g. Gemini API)
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `Analyze the following IT support request and classify it. Return ONLY valid JSON with format: {"category": "Hardware|Software|Network|Email|Security|Account Access|Printer|Other", "priority": "Low|Medium|High|Critical", "probableIssue": "brief explanation"}. Request: "${title} - ${description}"`
                            }]
                        }]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        return res.json({
                            success: true,
                            source: "ai",
                            category: parsed.category || "Other",
                            priority: parsed.priority || "Medium",
                            probableIssue: parsed.probableIssue || "Analyzed by AI Assistant"
                        });
                    }
                }
            } catch (aiErr) {
                console.warn("AI service call failed, falling back to rule-based engine:", aiErr.message);
            }
        }

        // Clean rule-based fallback engine
        let category = "Other";
        let priority = "Medium";
        let probableIssue = "Rule-based analysis based on keywords";

        if (text.includes("password") || text.includes("login") || text.includes("access") || text.includes("lockout") || text.includes("permission")) {
            category = "Account Access";
            priority = text.includes("lockout") || text.includes("urgent") ? "High" : "Medium";
            probableIssue = "Account authentication or authorization issue";
        } else if (text.includes("laptop") || text.includes("pc") || text.includes("monitor") || text.includes("screen") || text.includes("keyboard") || text.includes("mouse") || text.includes("ram") || text.includes("disk")) {
            category = "Hardware";
            priority = text.includes("broken") || text.includes("blue screen") || text.includes("crash") ? "High" : "Medium";
            probableIssue = "Hardware malfunction or component failure";
        } else if (text.includes("wifi") || text.includes("network") || text.includes("vpn") || text.includes("internet") || text.includes("connection")) {
            category = "Network";
            priority = text.includes("outage") || text.includes("down") ? "Critical" : "High";
            probableIssue = "Network connectivity or VPN configuration issue";
        } else if (text.includes("printer") || text.includes("print") || text.includes("paper") || text.includes("toner")) {
            category = "Printer";
            priority = "Low";
            probableIssue = "Printer hardware or spooler error";
        } else if (text.includes("virus") || text.includes("malware") || text.includes("phishing") || text.includes("breach") || text.includes("hack")) {
            category = "Security";
            priority = "Critical";
            probableIssue = "Potential security threat or system breach";
        } else if (text.includes("email") || text.includes("outlook") || text.includes("mailbox") || text.includes("spam")) {
            category = "Email";
            priority = "Medium";
            probableIssue = "Email client or mail routing configuration issue";
        } else if (text.includes("software") || text.includes("app") || text.includes("excel") || text.includes("install") || text.includes("crash")) {
            category = "Software";
            priority = "Medium";
            probableIssue = "Software application crash or installation failure";
        }

        res.json({
            success: true,
            source: "fallback",
            category,
            priority,
            probableIssue
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/tickets (Role-based filtering)
router.get("/", verifyToken, async (req, res, next) => {
    try {
        const { status, priority, category, department, requester, assignedTechnician, search } = req.query;
        let query = {};

        // Enforce RBAC filtering
        const user = req.user;
        if (user.role === "Employee") {
            query.requester = user._id;
        } else if (user.role === "Technician") {
            if (req.query.view === "my-assigned") {
                query.assignedTechnician = user._id;
            } else if (req.query.view === "unassigned") {
                query.assignedTechnician = null;
            } else {
                query.$or = [{ assignedTechnician: user._id }, { department: user.department }, { requester: user._id }];
            }
        } else if (user.role === "IT Manager") {
            if (user.department) {
                query.$or = [{ department: user.department }, { requester: user._id }];
            }
        }

        // Apply URL filters
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;
        if (department) query.department = department;
        if (requester && (user.role === "System Admin" || user.role === "IT Manager")) query.requester = requester;
        if (assignedTechnician && (user.role === "System Admin" || user.role === "IT Manager" || user.role === "Technician")) query.assignedTechnician = assignedTechnician;

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const tickets = await Ticket.find(query)
            .populate("requester", "name email role phone")
            .populate("assignedTechnician", "name email role")
            .populate("department", "name")
            .populate("category", "name")
            .populate("slaPolicy")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: tickets.length,
            tickets
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/tickets/:id
router.get("/:id", verifyToken, async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate("requester", "name email role phone department")
            .populate("assignedTechnician", "name email role phone")
            .populate("department", "name manager")
            .populate("category", "name description")
            .populate("slaPolicy")
            .populate("comments.user", "name email role")
            .populate("internalNotes.user", "name email role");

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        // Check authorization: Employee can only see their own tickets
        const user = req.user;
        if (user.role === "Employee" && ticket.requester._id.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied to this ticket"
            });
        }

        res.json({
            success: true,
            ticket
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/tickets (Create ticket)
router.post("/", verifyToken, async (req, res, next) => {
    try {
        const { title, description, category, priority, department } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required"
            });
        }

        const ticketPriority = priority || "Medium";
        const slaDetails = await calculateSLADeadlines(ticketPriority);

        let categoryId = category || null;
        if (typeof category === "string" && category.length !== 24) {
            // Find category by name if provided as string
            const foundCat = await Category.findOne({ name: category });
            if (foundCat) categoryId = foundCat._id;
            else categoryId = null;
        }

        const ticket = await Ticket.create({
            title,
            description,
            category: categoryId,
            priority: ticketPriority,
            status: "Open",
            requester: req.user._id,
            department: department || req.user.department || null,
            slaPolicy: slaDetails.slaPolicy,
            responseDueAt: slaDetails.responseDueAt,
            resolutionDueAt: slaDetails.resolutionDueAt
        });

        await AuditLog.create({
            user: req.user._id,
            action: "TICKET_CREATE",
            entity: "Ticket",
            entityId: ticket._id.toString(),
            details: { title: ticket.title, priority: ticket.priority }
        }).catch(() => {});

        res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            ticket
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/tickets/:id (Update ticket details)
router.put("/:id", verifyToken, async (req, res, next) => {
    try {
        const { title, description, category, priority } = req.body;

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        // Only requester (if open) or technician/admin can update details
        const isOwner = ticket.requester.toString() === req.user._id.toString();
        const isStaff = ["Technician", "IT Manager", "System Admin"].includes(req.user.role);

        if (!isOwner && !isStaff) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this ticket"
            });
        }

        if (title) ticket.title = title;
        if (description) ticket.description = description;
        if (category !== undefined) ticket.category = category || null;

        if (priority && priority !== ticket.priority) {
            ticket.priority = priority;
            const slaDetails = await calculateSLADeadlines(priority);
            ticket.slaPolicy = slaDetails.slaPolicy;
            ticket.responseDueAt = slaDetails.responseDueAt;
            ticket.resolutionDueAt = slaDetails.resolutionDueAt;
        }

        await ticket.save();

        await AuditLog.create({
            user: req.user._id,
            action: "TICKET_UPDATE",
            entity: "Ticket",
            entityId: ticket._id.toString(),
            details: { title: ticket.title }
        }).catch(() => {});

        res.json({
            success: true,
            message: "Ticket updated successfully",
            ticket
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/tickets/:id (Admin / Manager)
router.delete("/:id", verifyToken, authorizeRoles("System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        await Ticket.findByIdAndDelete(req.params.id);

        await AuditLog.create({
            user: req.user._id,
            action: "TICKET_DELETE",
            entity: "Ticket",
            entityId: req.params.id,
            details: { title: ticket.title }
        }).catch(() => {});

        res.json({
            success: true,
            message: "Ticket deleted successfully"
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/tickets/:id/assign
router.patch("/:id/assign", verifyToken, authorizeRoles("Technician", "IT Manager", "System Admin"), async (req, res, next) => {
    try {
        const { assignedTechnician } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const techId = assignedTechnician || req.user._id;
        ticket.assignedTechnician = techId;
        if (ticket.status === "Open") {
            ticket.status = "Assigned";
        }

        await ticket.save();

        // Send Notification to assigned technician & requester
        await Notification.create({
            user: techId,
            title: "Ticket Assigned",
            message: `You have been assigned to ticket: "${ticket.title}"`,
            type: "ticket_assigned",
            link: `/tickets/${ticket._id}`
        }).catch(() => {});

        await AuditLog.create({
            user: req.user._id,
            action: "TICKET_ASSIGN",
            entity: "Ticket",
            entityId: ticket._id.toString(),
            details: { assignedTo: techId }
        }).catch(() => {});

        res.json({
            success: true,
            message: "Technician assigned successfully",
            ticket
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/tickets/:id/status
router.patch("/:id/status", verifyToken, async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ["Open", "Assigned", "In Progress", "Pending", "Resolved", "Closed", "Reopened"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        ticket.status = status;
        if (status === "Resolved") ticket.resolvedAt = new Date();
        if (status === "Closed") ticket.closedAt = new Date();

        await ticket.save();

        // Send notification to requester
        await Notification.create({
            user: ticket.requester,
            title: "Ticket Status Changed",
            message: `Ticket "${ticket.title}" status changed to ${status}`,
            type: "status_change",
            link: `/tickets/${ticket._id}`
        }).catch(() => {});

        await AuditLog.create({
            user: req.user._id,
            action: "TICKET_STATUS_CHANGE",
            entity: "Ticket",
            entityId: ticket._id.toString(),
            details: { status }
        }).catch(() => {});

        res.json({
            success: true,
            message: `Ticket status updated to ${status}`,
            ticket
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/tickets/:id/priority
router.patch("/:id/priority", verifyToken, authorizeRoles("Technician", "IT Manager", "System Admin"), async (req, res, next) => {
    try {
        const { priority } = req.body;
        if (!["Low", "Medium", "High", "Critical"].includes(priority)) {
            return res.status(400).json({
                success: false,
                message: "Invalid priority value"
            });
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        ticket.priority = priority;
        const slaDetails = await calculateSLADeadlines(priority);
        ticket.slaPolicy = slaDetails.slaPolicy;
        ticket.responseDueAt = slaDetails.responseDueAt;
        ticket.resolutionDueAt = slaDetails.resolutionDueAt;

        await ticket.save();

        await AuditLog.create({
            user: req.user._id,
            action: "TICKET_PRIORITY_CHANGE",
            entity: "Ticket",
            entityId: ticket._id.toString(),
            details: { priority }
        }).catch(() => {});

        res.json({
            success: true,
            message: `Priority updated to ${priority}`,
            ticket
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/tickets/:id/comments
router.post("/:id/comments", verifyToken, async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment text is required"
            });
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        const newComment = {
            user: req.user._id,
            text: text.trim(),
            createdAt: new Date()
        };

        ticket.comments.push(newComment);
        await ticket.save();

        // Send Notification to recipient (if commenter is requester -> send to assigned tech; if tech -> send to requester)
        const recipient = ticket.requester.toString() === req.user._id.toString()
            ? ticket.assignedTechnician
            : ticket.requester;

        if (recipient) {
            await Notification.create({
                user: recipient,
                title: "New Comment on Ticket",
                message: `${req.user.name} commented on "${ticket.title}"`,
                type: "comment",
                link: `/tickets/${ticket._id}`
            }).catch(() => {});
        }

        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            comments: ticket.comments
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/tickets/:id/internal-notes
router.post("/:id/internal-notes", verifyToken, authorizeRoles("Technician", "IT Manager", "System Admin", "Asset Manager"), async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Internal note text is required"
            });
        }

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        ticket.internalNotes.push({
            user: req.user._id,
            text: text.trim(),
            createdAt: new Date()
        });

        await ticket.save();

        res.status(201).json({
            success: true,
            message: "Internal note added successfully",
            internalNotes: ticket.internalNotes
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/tickets/:id/resolve
router.patch("/:id/resolve", verifyToken, authorizeRoles("Technician", "IT Manager", "System Admin"), async (req, res, next) => {
    try {
        const { resolutionNote } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        ticket.status = "Resolved";
        ticket.resolutionNote = resolutionNote || "Resolved by technician";
        ticket.resolvedAt = new Date();

        await ticket.save();

        await Notification.create({
            user: ticket.requester,
            title: "Ticket Resolved",
            message: `Your ticket "${ticket.title}" has been resolved.`,
            type: "resolution",
            link: `/tickets/${ticket._id}`
        }).catch(() => {});

        await AuditLog.create({
            user: req.user._id,
            action: "TICKET_RESOLVE",
            entity: "Ticket",
            entityId: ticket._id.toString(),
            details: { resolutionNote: ticket.resolutionNote }
        }).catch(() => {});

        res.json({
            success: true,
            message: "Ticket marked as resolved",
            ticket
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/tickets/:id/reopen
router.patch("/:id/reopen", verifyToken, async (req, res, next) => {
    try {
        const { reason } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }

        ticket.status = "Reopened";
        if (reason) {
            ticket.comments.push({
                user: req.user._id,
                text: `[Reopened Reason]: ${reason}`,
                createdAt: new Date()
            });
        }

        await ticket.save();

        if (ticket.assignedTechnician) {
            await Notification.create({
                user: ticket.assignedTechnician,
                title: "Ticket Reopened",
                message: `Ticket "${ticket.title}" was reopened.`,
                type: "reopen",
                link: `/tickets/${ticket._id}`
            }).catch(() => {});
        }

        await AuditLog.create({
            user: req.user._id,
            action: "TICKET_REOPEN",
            entity: "Ticket",
            entityId: ticket._id.toString(),
            details: { reason }
        }).catch(() => {});

        res.json({
            success: true,
            message: "Ticket reopened",
            ticket
        });
    } catch (error) {
        next(error);
    }
});

export default router;
