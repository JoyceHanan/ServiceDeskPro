import express from "express";
import Department from "../models/Department.js";
import AuditLog from "../models/AuditLog.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/departments
router.get("/", verifyToken, async (req, res, next) => {
    try {
        const departments = await Department.find()
            .populate("manager", "name email role")
            .sort({ name: 1 });

        res.json({
            success: true,
            count: departments.length,
            departments
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/departments/:id
router.get("/:id", verifyToken, async (req, res, next) => {
    try {
        const department = await Department.findById(req.params.id)
            .populate("manager", "name email role");

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.json({
            success: true,
            department
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/departments (Admin/IT Manager)
router.post("/", verifyToken, authorizeRoles("System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const { name, description, manager, isActive } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Department name is required"
            });
        }

        const existing = await Department.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Department with this name already exists"
            });
        }

        const department = await Department.create({
            name,
            description: description || "",
            manager: manager || null,
            isActive: isActive !== undefined ? isActive : true
        });

        await AuditLog.create({
            user: req.user._id,
            action: "DEPARTMENT_CREATE",
            entity: "Department",
            entityId: department._id.toString(),
            details: { name: department.name }
        }).catch(() => {});

        res.status(201).json({
            success: true,
            message: "Department created successfully",
            department
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/departments/:id
router.put("/:id", verifyToken, authorizeRoles("System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const { name, description, manager, isActive } = req.body;

        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        if (name !== undefined) department.name = name;
        if (description !== undefined) department.description = description;
        if (manager !== undefined) department.manager = manager || null;
        if (isActive !== undefined) department.isActive = isActive;

        await department.save();

        await AuditLog.create({
            user: req.user._id,
            action: "DEPARTMENT_UPDATE",
            entity: "Department",
            entityId: department._id.toString(),
            details: { name: department.name }
        }).catch(() => {});

        res.json({
            success: true,
            message: "Department updated successfully",
            department
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/departments/:id
router.delete("/:id", verifyToken, authorizeRoles("System Admin"), async (req, res, next) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        department.isActive = false;
        await department.save();

        await AuditLog.create({
            user: req.user._id,
            action: "DEPARTMENT_DEACTIVATE",
            entity: "Department",
            entityId: department._id.toString(),
            details: { name: department.name }
        }).catch(() => {});

        res.json({
            success: true,
            message: "Department deactivated successfully"
        });
    } catch (error) {
        next(error);
    }
});

export default router;
