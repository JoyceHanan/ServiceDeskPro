import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
    {
        assetTag: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            trim: true,
            default: "General"
        },
        serialNumber: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: [
                "Procured",
                "Available",
                "Assigned",
                "Under Repair",
                "Replaced",
                "Retired"
            ],
            default: "Available"
        },
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            default: null
        },
        purchaseDate: {
            type: Date,
            default: null
        },
        warrantyExpiry: {
            type: Date,
            default: null
        },
        cost: {
            type: Number,
            default: 0
        },
        notes: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;
