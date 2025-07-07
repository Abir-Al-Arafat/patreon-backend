import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // required: true,
    },
    username: {
      type: String,
      // required: [true, "please provide a username"],
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

    country: {
      type: String,
    },

    paymentIntent: {
      type: String,
    },

    stripeAccountId: {
      type: String,
    },

    stripeCustomConnectAccountId: {
      type: String,
    },

    recipientId: {
      type: String,
    },

    subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],

    services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],

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
      type: mongoose.Schema.Types.ObjectId,
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
      { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
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

    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
