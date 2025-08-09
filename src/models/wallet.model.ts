import mongoose, { Schema, Document } from "mongoose";
import IWallet from "../interfaces/wallet.interface";
const WalletSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "GBP" },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IWallet>("Wallet", WalletSchema);
