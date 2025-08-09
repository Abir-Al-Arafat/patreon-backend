import { Request, Response } from "express";
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
import { ObjectId } from "mongoose";
import {
  createWallet,
  getAllWallets,
  getWalletByUserId,
  deleteWalletByUserId,
} from "../services/wallet.service";

const openWallet = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).send(failure("Please login"));
    }
    const userId: any = (req as UserRequest)?.user?._id;
    const validation = validationResult(req).array();
    if (validation.length) {
      return res
        .status(HTTP_STATUS.OK)
        .send(failure(validation[0].msg, "Failed to create wallet"));
    }
    const wallet = await getWalletByUserId(userId);
    if (wallet) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`user already has a wallet`));
    }
    const newWallet = await createWallet(userId);
    if (!newWallet) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`Failed to create wallet`));
    }

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
    const userId = (req as UserRequest).user._id;
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
    const userId = (req as UserRequest).user._id;
    const wallet = await deleteWalletByUserId(userId);
    if (!wallet) {
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
