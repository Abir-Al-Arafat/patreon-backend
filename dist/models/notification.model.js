"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const notificationSchema = new mongoose_1.default.Schema({
    uploader: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
    },
    admin: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
    },
    confession: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Confession",
    },
    story: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Story",
    },
    forum: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Forum",
    },
    status: {
        type: String,
        enum: ["pending", "approved", "cancelled"],
        default: "pending",
    },
    message: {
        type: String,
        required: true, // Message about the notification
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        enum: ["service", "forum", "story", "others"],
        default: "others",
    },
}, { timestamps: true });
// const Notification = mongoose.model("Notification", notificationSchema);
// module.exports = Notification;
exports.default = mongoose_1.default.model("Notification", notificationSchema);
