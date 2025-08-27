import mongoose, { Schema, Document } from "mongoose";

import IContactUs from "../interfaces/contactUs.interface";

const ContactUsSchema: Schema<IContactUs> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IContactUs>("ContactUs", ContactUsSchema);
