import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    contributor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },

    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "cancelled"],
      default: "pending",
    },
    message: {
      type: String,
      required: true,
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
      enum: ["service", "wallet", "transaction", "others"],
      default: "others",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
