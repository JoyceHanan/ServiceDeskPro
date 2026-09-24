import express from "express";
import Organization from "../models/Organization.js";
import AuditLog from "../models/AuditLog.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/organizations
router.get("/", verifyToken, async (req, res, next) => {
    try {
        const organizations = await Organization.find().sort({ name: 1 });
        res.json({
            success: true,
            count: organizations.length,
            organizations
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/organizations/:id
router.get("/:id", verifyToken, async (req, res, next) => {
    try {
        const organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }
        res.json({
            success: true,
            organization
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/organizations
router.post("/", verifyToken, authorizeRoles("System Admin"), async (req, res, next) => {
    try {
        const { name, domain, contactEmail, isActive } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Organization name is required"
            });
        }

        const organization = await Organization.create({
            name,
            domain: domain || "",
            contactEmail: contactEmail || "",
            isActive: isActive !== undefined ? isActive : true
        });

        await AuditLog.create({
            user: req.user._id,
            action: "ORGANIZATION_CREATE",
            entity: "Organization",
            entityId: organization._id.toString(),
            details: { name: organization.name }
        }).catch(() => {});

        res.status(201).json({
            success: true,
            message: "Organization created successfully",
            organization
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/organizations/:id
router.put("/:id", verifyToken, authorizeRoles("System Admin"), async (req, res, next) => {
    try {
        const organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }

        const fields = ["name", "domain", "contactEmail", "isActive"];
        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                organization[field] = req.body[field];
            }
        });

        await organization.save();

        res.json({
            success: true,
            message: "Organization updated successfully",
            organization
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/organizations/:id
router.delete("/:id", verifyToken, authorizeRoles("System Admin"), async (req, res, next) => {
    try {
        const organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            });
        }

        organization.isActive = false;
        await organization.save();

        res.json({
            success: true,
            message: "Organization deactivated successfully"
        });
    } catch (error) {
        next(error);
    }
});

export default router;
