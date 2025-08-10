import walletModel from "../models/wallet.model";
import { ObjectId } from "mongoose";

const createWallet = async (userId: ObjectId) => {
  const wallet = await walletModel.create({ user: userId });
  return wallet;
};

const getAllWallets = async () => {
  const wallets = await walletModel.find({}).populate("user");
  return wallets;
};

const getWalletByUserId = async (userId: ObjectId) => {
  const wallet = await walletModel.findOne({ user: userId });
  return wallet;
};

const deleteWalletByUserId = async (userId: ObjectId) => {
  const wallet = await walletModel.deleteOne({ user: userId });
  return wallet;
};

export { createWallet, getWalletByUserId, getAllWallets, deleteWalletByUserId };
