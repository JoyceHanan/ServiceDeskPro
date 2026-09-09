import mongoose from "mongoose";
const commentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        text: {
            type: String,
            required: true,
            trim: true
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: true
    }
);

const internalNoteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        text: {
            type: String,
            required: true,
            trim: true
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: true
    }
);

const attachmentSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            required: true
        },

        fileUrl: {
            type: String,
            required: true
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: true
    }
);

const ticketSchema = new mongoose.Schema(
    {

        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null
        },

        priority: {
            type: String,
            enum: [
                "Low",
                "Medium",
                "High",
                "Critical"
            ],
            default: "Medium"
        },

        status: {
            type: String,
            enum: [
                "Open",
                "Assigned",
                "In Progress",
                "Pending",
                "Resolved",
                "Closed",
                "Reopened"
            ],
            default: "Open"
        },

        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        assignedTechnician: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null
        },

        comments: {
            type: [commentSchema],
            default: []
        },

      internalNotes: {
            type: [internalNoteSchema],
            default: []
        },

        attachments: {
            type: [attachmentSchema],
            default: []
        },

        slaPolicy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SLA",
            default: null
        },

        responseDueAt: {
            type: Date,
            default: null
        },

        resolutionDueAt: {
            type: Date,
            default: null
        },

        slaBreached: {
            type: Boolean,
            default: false
        },

        escalatedAt: {
            type: Date,
            default: null
        },

        resolutionNote: {
            type: String,
            trim: true,
            default: ""
        },

        resolvedAt: {
            type: Date,
            default: null
        },

        closedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


ticketSchema.index({
    title: "text",
    description: "text"
});

ticketSchema.index({
    status: 1
});

ticketSchema.index({
    priority: 1
});

ticketSchema.index({
    requester: 1
});

ticketSchema.index({
    assignedTechnician: 1
});

ticketSchema.index({
    department: 1
});

const Ticket = mongoose.model(
    "Ticket",
    ticketSchema
);

export default Ticket;