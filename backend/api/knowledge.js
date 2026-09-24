import express from "express";
import KnowledgeArticle from "../models/KnowledgeArticle.js";
import AuditLog from "../models/AuditLog.js";
import { verifyToken, authorizeRoles } from "../middleware/verifyToken.js";

const router = express.Router();

// POST /api/knowledge/ai-suggest (AI Knowledge Base Suggestions)
router.post("/ai-suggest", verifyToken, async (req, res, next) => {
    try {
        const { ticketText, title, category } = req.body;
        const queryText = `${title || ""} ${ticketText || ""}`.trim();

        if (!queryText) {
            return res.status(400).json({
                success: false,
                message: "Ticket text or title is required for suggestions"
            });
        }

        // Try AI or fallback text search
        const apiKey = process.env.AI_API_KEY;
        let aiKeywords = [];

        if (apiKey && apiKey.trim() !== "") {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `Extract top 3 search keywords for finding knowledge base help articles for this ticket: "${queryText}". Return JSON format: {"keywords": ["kw1", "kw2", "kw3"]}`
                            }]
                        }]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        aiKeywords = parsed.keywords || [];
                    }
                }
            } catch (err) {
                console.warn("AI suggestion call failed, falling back to database search:", err.message);
            }
        }

        // Search KnowledgeArticle database
        let searchFilter = { status: "Published" };

        if (aiKeywords.length > 0) {
            const regexArr = aiKeywords.map(kw => new RegExp(kw, "i"));
            searchFilter.$or = [
                { title: { $in: regexArr } },
                { content: { $in: regexArr } },
                { tags: { $in: regexArr } }
            ];
        } else {
            // Text search or regex search
            const words = queryText.split(/\s+/).filter(w => w.length > 3);
            const regexes = words.map(w => new RegExp(w, "i"));
            if (regexes.length > 0) {
                searchFilter.$or = [
                    { title: { $in: regexes } },
                    { content: { $in: regexes } },
                    { tags: { $in: regexes } }
                ];
            }
        }

        let suggestions = await KnowledgeArticle.find(searchFilter)
            .populate("author", "name email")
            .limit(5);

        // If no matches, return recent top articles
        if (suggestions.length === 0) {
            suggestions = await KnowledgeArticle.find({ status: "Published" })
                .sort({ views: -1 })
                .limit(5);
        }

        res.json({
            success: true,
            count: suggestions.length,
            suggestions
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/knowledge
router.get("/", verifyToken, async (req, res, next) => {
    try {
        const { search, category, tag, status } = req.query;
        let query = {};

        // Employees only see Published articles
        if (req.user.role === "Employee") {
            query.status = "Published";
        } else if (status) {
            query.status = status;
        }

        if (category) query.category = category;
        if (tag) query.tags = tag;

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } }
            ];
        }

        const articles = await KnowledgeArticle.find(query)
            .populate("author", "name email role")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: articles.length,
            articles
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/knowledge/:id
router.get("/:id", verifyToken, async (req, res, next) => {
    try {
        const article = await KnowledgeArticle.findById(req.params.id)
            .populate("author", "name email role");

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Knowledge article not found"
            });
        }

        // Increment view count
        article.views += 1;
        await article.save();

        res.json({
            success: true,
            article
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/knowledge (Technician, IT Manager, Admin)
router.post("/", verifyToken, authorizeRoles("Technician", "IT Manager", "System Admin"), async (req, res, next) => {
    try {
        const { title, content, category, tags, status } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required"
            });
        }

        const article = await KnowledgeArticle.create({
            title,
            content,
            category: category || "General",
            tags: Array.isArray(tags) ? tags : (tags ? tags.split(",").map(t => t.trim()) : []),
            author: req.user._id,
            status: status || "Published"
        });

        await AuditLog.create({
            user: req.user._id,
            action: "KNOWLEDGE_CREATE",
            entity: "KnowledgeArticle",
            entityId: article._id.toString(),
            details: { title: article.title }
        }).catch(() => {});

        res.status(201).json({
            success: true,
            message: "Knowledge article created successfully",
            article
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/knowledge/:id
router.put("/:id", verifyToken, authorizeRoles("Technician", "IT Manager", "System Admin"), async (req, res, next) => {
    try {
        const { title, content, category, tags, status } = req.body;

        const article = await KnowledgeArticle.findById(req.params.id);
        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Knowledge article not found"
            });
        }

        if (title !== undefined) article.title = title;
        if (content !== undefined) article.content = content;
        if (category !== undefined) article.category = category;
        if (tags !== undefined) article.tags = Array.isArray(tags) ? tags : tags.split(",").map(t => t.trim());
        if (status !== undefined) article.status = status;

        await article.save();

        res.json({
            success: true,
            message: "Knowledge article updated successfully",
            article
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/knowledge/:id
router.delete("/:id", verifyToken, authorizeRoles("IT Manager", "System Admin"), async (req, res, next) => {
    try {
        const article = await KnowledgeArticle.findById(req.params.id);
        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Knowledge article not found"
            });
        }

        await KnowledgeArticle.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Knowledge article deleted successfully"
        });
    } catch (error) {
        next(error);
    }
});

export default router;
