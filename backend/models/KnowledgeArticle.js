import mongoose from "mongoose";

const knowledgeArticleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            trim: true,
            default: "General"
        },
        tags: {
            type: [String],
            default: []
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["Draft", "Published", "Archived"],
            default: "Published"
        },
        views: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

knowledgeArticleSchema.index({
    title: "text",
    content: "text",
    tags: "text"
});

const KnowledgeArticle = mongoose.model("KnowledgeArticle", knowledgeArticleSchema);

export default KnowledgeArticle;
