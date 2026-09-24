import express from "express";
import Vendor from "../models/Vendor.js";
import AuditLog from "../models/AuditLog.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/vendors
router.get("/", verifyToken, async (req, res, next) => {
    try {
        const vendors = await Vendor.find().sort({ name: 1 });
        res.json({
            success: true,
            count: vendors.length,
            vendors
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/vendors/:id
router.get("/:id", verifyToken, async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }
        res.json({
            success: true,
            vendor
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/vendors
router.post("/", verifyToken, authorizeRoles("Asset Manager", "System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const { name, contactPerson, email, phone, address, notes, isActive } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Vendor name is required"
            });
        }

        const vendor = await Vendor.create({
            name,
            contactPerson: contactPerson || "",
            email: email || "",
            phone: phone || "",
            address: address || "",
            notes: notes || "",
            isActive: isActive !== undefined ? isActive : true
        });

        await AuditLog.create({
            user: req.user._id,
            action: "VENDOR_CREATE",
            entity: "Vendor",
            entityId: vendor._id.toString(),
            details: { name: vendor.name }
        }).catch(() => {});

        res.status(201).json({
            success: true,
            message: "Vendor created successfully",
            vendor
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/vendors/:id
router.put("/:id", verifyToken, authorizeRoles("Asset Manager", "System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        const fields = ["name", "contactPerson", "email", "phone", "address", "notes", "isActive"];
        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                vendor[field] = req.body[field];
            }
        });

        await vendor.save();

        res.json({
            success: true,
            message: "Vendor updated successfully",
            vendor
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/vendors/:id
router.delete("/:id", verifyToken, authorizeRoles("Asset Manager", "System Admin"), async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        vendor.isActive = false;
        await vendor.save();

        res.json({
            success: true,
            message: "Vendor deactivated successfully"
        });
    } catch (error) {
        next(error);
    }
});

export default router;
