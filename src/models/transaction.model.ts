import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    paymentIntentId: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    amount: Number,
    status: {
      type: String,
      enum: ["created", "succeeded", "failed"],
      default: "created",
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
