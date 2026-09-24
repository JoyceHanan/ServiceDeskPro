import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        domain: {
            type: String,
            trim: true,
            default: ""
        },
        contactEmail: {
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

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
