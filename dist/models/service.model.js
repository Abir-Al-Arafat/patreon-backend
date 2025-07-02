"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const serviceSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
    },
    subtitle: {
        type: String,
    },
    description: {
        type: String,
    },
    contributor: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    subscribers: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    transactions: [
        { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Transaction" },
    ],
    prompt: { type: String },
    files: [{ type: String }],
    price: {
        type: Number,
    },
    about: {
        type: String,
    },
    category: {
        type: String,
    },
    explainMembership: [
        {
            type: String,
        },
    ],
    icon: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        default: "pending",
        enum: ["pending", "approved", "rejected"],
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    reviews: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "Review" }],
}, { timestamps: true });
exports.default = mongoose_1.default.model("Service", serviceSchema);
