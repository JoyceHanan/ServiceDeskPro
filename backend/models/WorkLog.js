import mongoose from "mongoose";

const workLogSchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true
        },
        technician: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        timeSpentMinutes: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        timestamps: true
    }
);

const WorkLog = mongoose.model("WorkLog", workLogSchema);

export default WorkLog;
