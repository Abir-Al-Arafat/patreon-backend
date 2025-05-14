"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const phoneSchema = new mongoose_1.default.Schema({
    phoneNumber: {
        type: String,
    },
    phoneNumberVerified: {
        type: Boolean,
        default: false,
    },
    phoneNumberVerifyCode: {
        type: Number,
    },
    reviewId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Review" },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Phone", phoneSchema);
