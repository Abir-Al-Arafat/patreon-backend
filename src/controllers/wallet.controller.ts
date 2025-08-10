import { Request, Response } from "express";
import mongoose, { ObjectId } from "mongoose";
import { validationResult } from "express-validator";
import {
  success,
  failure,
  generateRandomCode,
  sanitizeUser,
} from "../utilities/common";
import { UserRequest } from "./users.controller";
import User from "../models/user.model";
import Phone from "../models/phone.model";
import Notification from "../models/notification.model";

import HTTP_STATUS from "../constants/statusCodes";
import { emailWithNodemailerGmail } from "../config/email.config";
import { CreateUserQueryParams } from "../types/query-params";

import { IUser } from "../interfaces/user.interface";
import IWallet from "../interfaces/wallet.interface";

import {
  createWallet,
  getAllWallets,
  getWalletByUserId,
  deleteWalletByUserId,
} from "../services/wallet.service";

import { getUserById } from "../services/user.service";

const openWallet = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const userId: ObjectId = (req as UserRequest)?.user?._id!;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    if (user.wallet) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`user already has a wallet`));
    }

    const wallet = await getWalletByUserId(userId);
    if (wallet) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`user already has a wallet`));
    }
    const newWallet: IWallet = await createWallet(userId);
    if (!newWallet) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`Failed to create wallet`));
    }
    user.wallet = newWallet._id as mongoose.Types.ObjectId;
    await user.save();
    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("user wallet created", newWallet));
  } catch (error: any) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(failure(error));
  }
};

const getAllWalletsController = async (req: Request, res: Response) => {
  try {
    const wallets = await getAllWallets();
    if (!wallets) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`wallets not found`));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("wallets retrieved", wallets));
  } catch (error: any) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(failure(error));
  }
};

const getWalletByUser = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const userId: ObjectId = (req as UserRequest).user._id!;
    const wallet = await getWalletByUserId(userId);
    if (!wallet) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`user does not have a wallet`));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("user wallet retrieved", wallet));
  } catch (error: any) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(failure(error));
  }
};

const deleteWalletByUser = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const userId: ObjectId = (req as UserRequest).user._id!;
    const user = await getUserById(userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    user.wallet = null;
    await user.save();
    const wallet = await deleteWalletByUserId(userId);

    if (!wallet.deletedCount) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`user does not have a wallet`));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("user wallet deleted", wallet));
  } catch (error: any) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send(failure(error));
  }
};

export {
  openWallet,
  getWalletByUser,
  deleteWalletByUser,
  getAllWalletsController,
};
