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
import IContactUs from "../interfaces/contactUs.interface";

import {
  createContactUs,
  getContactUsById,
  getAllContactUsService,
  deleteContactUsById,
} from "../services/contactUs.service";

import { getUserById } from "../services/user.service";

const addContactUs = async (req: Request, res: Response) => {
  if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .send(failure("Unauthorized", "User not found"));
  }

  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Validation error", errors.array()[0].msg));
  }

  req.body.user = (req as UserRequest)?.user?._id;

  try {
    // Create new contact us entry
    const contactUs = await createContactUs(req.body);
    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("Contact Us entry created", contactUs));
  } catch (error) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to create Contact Us entry", error));
  }
};

const getContactUs = async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Validation error", errors.array()));
  }

  try {
    // Get contact us entry by ID
    const contactUs = await getContactUsById(id as unknown as ObjectId);
    if (!contactUs) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Contact Us entry not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Contact Us entry retrieved", contactUs));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to retrieve Contact Us entry", error));
  }
};

const getAllContactUs = async (req: Request, res: Response) => {
  try {
    const contactUs = await getAllContactUsService();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("All Contact Us entries retrieved", contactUs));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to retrieve Contact Us entries", error));
  }
};

export { addContactUs, getContactUs, getAllContactUs };
