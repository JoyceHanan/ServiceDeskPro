import express from "express";
import Asset from "../models/Asset.js";
import AuditLog from "../models/AuditLog.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/assets
router.get("/", verifyToken, async (req, res, next) => {
    try {
        const { status, category, department, assignedTo, search } = req.query;
        let query = {};

        // If Employee, show assets assigned to them
        if (req.user.role === "Employee") {
            query.assignedTo = req.user._id;
        } else {
            if (status) query.status = status;
            if (category) query.category = category;
            if (department) query.department = department;
            if (assignedTo) query.assignedTo = assignedTo;
        }

        if (search) {
            query.$or = [
                { assetTag: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
                { serialNumber: { $regex: search, $options: "i" } }
            ];
        }

        const assets = await Asset.find(query)
            .populate("department", "name")
            .populate("assignedTo", "name email role")
            .populate("vendor", "name contactPerson")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: assets.length,
            assets
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/assets/:id
router.get("/:id", verifyToken, async (req, res, next) => {
    try {
        const asset = await Asset.findById(req.params.id)
            .populate("department", "name manager")
            .populate("assignedTo", "name email role phone")
            .populate("vendor", "name contactPerson email phone");

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found"
            });
        }

        res.json({
            success: true,
            asset
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/assets (Asset Manager, Admin, IT Manager)
router.post("/", verifyToken, authorizeRoles("Asset Manager", "System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const { assetTag, name, category, serialNumber, status, department, assignedTo, vendor, purchaseDate, warrantyExpiry, cost, notes } = req.body;

        if (!assetTag || !name) {
            return res.status(400).json({
                success: false,
                message: "Asset tag and name are required"
            });
        }

        const existing = await Asset.findOne({ assetTag: assetTag.trim() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Asset tag already exists"
            });
        }

        const asset = await Asset.create({
            assetTag: assetTag.trim(),
            name,
            category: category || "General",
            serialNumber: serialNumber || "",
            status: status || "Available",
            department: department || null,
            assignedTo: assignedTo || null,
            vendor: vendor || null,
            purchaseDate: purchaseDate || null,
            warrantyExpiry: warrantyExpiry || null,
            cost: cost || 0,
            notes: notes || ""
        });

        await AuditLog.create({
            user: req.user._id,
            action: "ASSET_CREATE",
            entity: "Asset",
            entityId: asset._id.toString(),
            details: { assetTag: asset.assetTag, name: asset.name }
        }).catch(() => {});

        res.status(201).json({
            success: true,
            message: "Asset created successfully",
            asset
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/assets/:id
router.put("/:id", verifyToken, authorizeRoles("Asset Manager", "System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found"
            });
        }

        const fields = ["name", "category", "serialNumber", "status", "department", "assignedTo", "vendor", "purchaseDate", "warrantyExpiry", "cost", "notes"];
        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                asset[field] = req.body[field] === "" ? null : req.body[field];
            }
        });

        await asset.save();

        await AuditLog.create({
            user: req.user._id,
            action: "ASSET_UPDATE",
            entity: "Asset",
            entityId: asset._id.toString(),
            details: { assetTag: asset.assetTag, status: asset.status }
        }).catch(() => {});

        res.json({
            success: true,
            message: "Asset updated successfully",
            asset
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/assets/:id/assign
router.patch("/:id/assign", verifyToken, authorizeRoles("Asset Manager", "System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const { assignedTo, department, status } = req.body;
        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found"
            });
        }

        asset.assignedTo = assignedTo || null;
        if (department !== undefined) asset.department = department || null;
        asset.status = status || (assignedTo ? "Assigned" : "Available");

        await asset.save();

        await AuditLog.create({
            user: req.user._id,
            action: "ASSET_ASSIGN",
            entity: "Asset",
            entityId: asset._id.toString(),
            details: { assignedTo, status: asset.status }
        }).catch(() => {});

        res.json({
            success: true,
            message: "Asset assignment updated",
            asset
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/assets/:id
router.delete("/:id", verifyToken, authorizeRoles("Asset Manager", "System Admin"), async (req, res, next) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({
                success: false,
                message: "Asset not found"
            });
        }

        await Asset.findByIdAndDelete(req.params.id);

        await AuditLog.create({
            user: req.user._id,
            action: "ASSET_DELETE",
            entity: "Asset",
            entityId: req.params.id,
            details: { assetTag: asset.assetTag }
        }).catch(() => {});

        res.json({
            success: true,
            message: "Asset deleted successfully"
        });
    } catch (error) {
        next(error);
    }
});

export default router;
