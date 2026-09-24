import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        contactPerson: {
            type: String,
            trim: true,
            default: ""
        },
        email: {
            type: String,
            trim: true,
            default: ""
        },
        phone: {
            type: String,
            trim: true,
            default: ""
        },
        address: {
            type: String,
            trim: true,
            default: ""
        },
        notes: {
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

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
