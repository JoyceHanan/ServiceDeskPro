import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Helper to set cookie
const sendTokenCookie = (res, userId) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return token;
};

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
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
                message: "Email is already registered"
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

        sendTokenCookie(res, newUser._id);

        // Record audit
        await AuditLog.create({
            user: newUser._id,
            action: "REGISTER",
            entity: "User",
            entityId: newUser._id.toString(),
            details: { email: newUser.email, role: newUser.role }
        }).catch(() => {});

        const safeUser = newUser.toObject();
        delete safeUser.password;

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: safeUser
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account has been deactivated"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        sendTokenCookie(res, user._id);

        // Record audit
        await AuditLog.create({
            user: user._id,
            action: "LOGIN",
            entity: "User",
            entityId: user._id.toString(),
            details: { email: user.email }
        }).catch(() => {});

        const safeUser = user.toObject();
        delete safeUser.password;

        res.json({
            success: true,
            message: "Logged in successfully",
            user: safeUser
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax"
    });

    res.json({
        success: true,
        message: "Logged out successfully"
    });
});

// GET /api/auth/me
router.get("/me", verifyToken, async (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

export default router;
