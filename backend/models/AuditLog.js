import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        action: {
            type: String,
            required: true,
            trim: true
        },
        entity: {
            type: String,
            trim: true,
            default: ""
        },
        entityId: {
            type: String,
            default: null
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        ipAddress: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
