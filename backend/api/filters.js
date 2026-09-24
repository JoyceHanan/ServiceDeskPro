import express from "express";
import SavedFilter from "../models/SavedFilter.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/filters
router.get("/", verifyToken, async (req, res, next) => {
    try {
        const filters = await SavedFilter.find({ user: req.user._id }).sort({ name: 1 });
        res.json({
            success: true,
            count: filters.length,
            filters
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/filters
router.post("/", verifyToken, async (req, res, next) => {
    try {
        const { name, filterCriteria } = req.body;
        if (!name || !filterCriteria) {
            return res.status(400).json({
                success: false,
                message: "Filter name and filterCriteria are required"
            });
        }

        const filter = await SavedFilter.create({
            user: req.user._id,
            name: name.trim(),
            filterCriteria
        });

        res.status(201).json({
            success: true,
            message: "Filter saved successfully",
            filter
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/filters/:id
router.delete("/:id", verifyToken, async (req, res, next) => {
    try {
        const filter = await SavedFilter.findOne({ _id: req.params.id, user: req.user._id });
        if (!filter) {
            return res.status(404).json({
                success: false,
                message: "Filter not found"
            });
        }

        await SavedFilter.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Filter deleted successfully"
        });
    } catch (error) {
        next(error);
    }
});

export default router;
