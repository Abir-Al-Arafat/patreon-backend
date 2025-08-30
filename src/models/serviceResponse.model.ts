import mongoose, { Document, Schema } from "mongoose";

export interface IServiceResponse extends Document {
  user?: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  createdAt: Date;
}

const serviceResponseSchema = new Schema<IServiceResponse>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IServiceResponse>(
  "ServiceResponse",
  serviceResponseSchema
);
