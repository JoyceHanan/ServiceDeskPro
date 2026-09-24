import mongoose from "mongoose";

const slaSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            required: true
        },
        responseTimeHours: {
            type: Number,
            required: true,
            default: 24
        },
        resolutionTimeHours: {
            type: Number,
            required: true,
            default: 72
        },
        businessHoursOnly: {
            type: Boolean,
            default: false
        },
        escalationEmail: {
            type: String,
            trim: true,
            default: ""
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const SLA = mongoose.model("SLA", slaSchema);

export default SLA;
