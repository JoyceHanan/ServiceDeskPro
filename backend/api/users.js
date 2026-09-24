import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/users
router.get("/", verifyToken, async (req, res, next) => {
    try {
        const { role, department, isActive, search } = req.query;
        let query = {};

        if (role) {
            if (role === "staff") {
                query.role = { $in: ["Technician", "IT Manager", "System Admin"] };
            } else {
                query.role = role;
            }
        }
        if (department) query.department = department;
        if (isActive !== undefined) query.isActive = isActive === "true";

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const users = await User.find(query)
            .populate("department", "name description")
            .select("-password")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/users/:id
router.get("/:id", verifyToken, async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .populate("department", "name description")
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/users (System Admin)
router.post("/", verifyToken, authorizeRoles("System Admin"), async (req, res, next) => {
    try {
        const { name, email, password, role, department, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and password are required"
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || "Employee",
            department: department || null,
            phone: phone || ""
        });

        await AuditLog.create({
            user: req.user._id,
            action: "USER_CREATE",
            entity: "User",
            entityId: newUser._id.toString(),
            details: { email: newUser.email, role: newUser.role }
        }).catch(() => {});

        const safeUser = newUser.toObject();
        delete safeUser.password;

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: safeUser
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/users/:id (System Admin & IT Manager)
router.put("/:id", verifyToken, authorizeRoles("System Admin", "IT Manager"), async (req, res, next) => {
    try {
        const { name, email, password, role, department, phone, isActive } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email.toLowerCase();
        if (role !== undefined) user.role = role;
        if (department !== undefined) user.department = department || null;
        if (phone !== undefined) user.phone = phone;
        if (isActive !== undefined) user.isActive = isActive;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        await AuditLog.create({
            user: req.user._id,
            action: "USER_UPDATE",
            entity: "User",
            entityId: user._id.toString(),
            details: { updatedUser: user.email }
        }).catch(() => {});

        const safeUser = user.toObject();
        delete safeUser.password;

        res.json({
            success: true,
            message: "User updated successfully",
            user: safeUser
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/users/:id (System Admin - Soft Delete / Deactivate)
router.delete("/:id", verifyToken, authorizeRoles("System Admin"), async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.isActive = false;
        await user.save();

        await AuditLog.create({
            user: req.user._id,
            action: "USER_DEACTIVATE",
            entity: "User",
            entityId: user._id.toString(),
            details: { email: user.email }
        }).catch(() => {});

        res.json({
            success: true,
            message: "User deactivated successfully"
        });
    } catch (error) {
        next(error);
    }
});

export default router;
