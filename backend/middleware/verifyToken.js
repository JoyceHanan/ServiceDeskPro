import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function verifyToken(req, res, next) {
    try {
        // Get token from cookie
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Please login"
            });
        }

        // Verify JWT
        const decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Find user from database
        const user = await User.findById(decodedToken.id)
            .select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found. Please login again"
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated"
            });
        }

        // Store authenticated user
        req.user = user;

        next();

    } catch (error) {
        console.error("Authentication error:", error.message);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please login again"
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid session. Please login again"
        });
    }
}