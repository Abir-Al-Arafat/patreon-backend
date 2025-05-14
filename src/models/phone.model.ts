import mongoose from "mongoose";

const phoneSchema = new mongoose.Schema(
  {
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Phone", phoneSchema);
