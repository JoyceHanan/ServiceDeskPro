import express from "express";
import Category from "../models/Category.js";
import AuditLog from "../models/AuditLog.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/categories
router.get("/", verifyToken, async (req, res, next) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json({
            success: true,
            count: categories.length,
            categories
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/categories/:id
router.get("/:id", verifyToken, async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }
        res.json({
            success: true,
            category
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/categories
router.post("/", verifyToken, authorizeRoles("System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const { name, description, isActive } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const existing = await Category.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Category already exists"
            });
        }

        const category = await Category.create({
            name: name.trim(),
            description: description || "",
            isActive: isActive !== undefined ? isActive : true
        });

        await AuditLog.create({
            user: req.user._id,
            action: "CATEGORY_CREATE",
            entity: "Category",
            entityId: category._id.toString(),
            details: { name: category.name }
        }).catch(() => {});

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            category
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/categories/:id
router.put("/:id", verifyToken, authorizeRoles("System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const { name, description, isActive } = req.body;
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        if (name !== undefined) category.name = name.trim();
        if (description !== undefined) category.description = description;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();

        res.json({
            success: true,
            message: "Category updated successfully",
            category
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/categories/:id
router.delete("/:id", verifyToken, authorizeRoles("System Admin"), async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        category.isActive = false;
        await category.save();

        res.json({
            success: true,
            message: "Category deactivated successfully"
        });
    } catch (error) {
        next(error);
    }
});

export default router;
