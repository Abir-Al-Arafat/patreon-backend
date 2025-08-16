import mongoose, { Document } from "mongoose";
export default interface IWallet extends Document {
  user: mongoose.Types.ObjectId;
  balance: number;
  currency: string;
  lastUpdated: Date;
  transactions: mongoose.Types.ObjectId[];
}
