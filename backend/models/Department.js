import mongoose from "mongoose";
const departmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
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

const Department = mongoose.model(
    "Department",
    departmentSchema
);

export default Department;