import mongoose, { Document } from "mongoose";
export default interface IContactUs extends Document {
  title: string;
  description?: string;
  isActive?: boolean;
  user: mongoose.Schema.Types.ObjectId;
}
