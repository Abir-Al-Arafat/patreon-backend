"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        // required: true,
    },
    username: {
        type: String,
        required: [true, "please provide a username"],
        unique: true,
    },
    email: {
        type: String,
        required: [true, "please provide email"],
        unique: true,
    },
    image: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minlength: 5,
        // select: false,
    },
    address: {
        type: String,
    },
    paymentIntent: {
        type: String,
    },
    subscriptions: [
        { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Subscription" },
    ],
    services: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Service" }],
    subscriberCount: {
        type: Number,
        default: 0,
    },
    roles: {
        type: [String],
        enum: ["user", "contributor", "admin", "superadmin"],
        default: ["user"],
    },
    bio: {
        type: String,
    },
    phone: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Phone",
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
    },
    balance: {
        type: Number,
        min: 0,
        default: 0,
    },
    dateOfBirth: {
        type: Date,
    },
    notifications: [
        { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Notification" },
    ],
    emailVerified: {
        type: Boolean,
        default: false,
    },
    emailVerifyCode: {
        type: Number,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
    reviewId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Review" },
}, { timestamps: true });
exports.default = mongoose_1.default.model("User", userSchema);
