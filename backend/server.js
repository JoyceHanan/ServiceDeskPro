import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./api/auth.js";
import userRoutes from "./api/users.js";
import departmentRoutes from "./api/departments.js";
import ticketRoutes from "./api/tickets.js";
import categoryRoutes from "./api/categories.js";
import slaRoutes from "./api/sla.js";
import assetRoutes from "./api/assets.js";
import vendorRoutes from "./api/vendors.js";
import knowledgeRoutes from "./api/knowledge.js";
import worklogRoutes from "./api/worklogs.js";
import notificationRoutes from "./api/notifications.js";
import auditRoutes from "./api/audit.js";
import filterRoutes from "./api/filters.js";
import organizationRoutes from "./api/organizations.js";

dotenv.config();

const app = express();

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
    cors({
        origin: clientUrl,
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API route registrations
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/sla", slaRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/worklogs", worklogRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/filters", filterRoutes);
app.use("/api/organizations", organizationRoutes);

// Health check endpoint
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "ServiceDesk Pro API is running",
        dbConnected: mongoose.connection.readyState === 1,
        timestamp: new Date().toISOString()
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Error:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/servicedb";

// Start Express listener immediately
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected successfully to URI instance");
    } catch (error) {
        console.warn("MongoDB connection error:", error.message);
    }
};

connectDB();

export default app;