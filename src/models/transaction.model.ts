import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    contributorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    session_id: String,
    payment_intent: String,
    amount_subtotal: Number,
    amount_total: Number,
    amount_in_gbp: Number,
    amount: Number,
    status: {
      type: String,
      enum: ["created", "succeeded", "failed"],
      default: "created",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
