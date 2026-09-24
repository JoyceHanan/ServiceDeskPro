import mongoose from "mongoose";

const savedFilterSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        filterCriteria: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        }
    },
    {
        timestamps: true
    }
);

const SavedFilter = mongoose.model("SavedFilter", savedFilterSchema);

export default SavedFilter;
