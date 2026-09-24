import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            default: "general"
        },
        link: {
            type: String,
            default: ""
        },
        read: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
