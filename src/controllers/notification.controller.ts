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

import HTTP_STATUS from "../constants/statusCodes";
import { CreateUserQueryParams } from "../types/query-params";

import { IUser } from "../interfaces/user.interface";

import {
  createNotification,
  getNotificationByContributorId,
  getNotificationByBuyerId,
  getNotifications,
  updateNotification,
  deleteNotification,
  getAllNotificationsService,
} from "../services/notification.service";

const getAllNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await getAllNotificationsService();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Notifications fetched successfully", notifications));
  } catch (error) {
    console.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to fetch notifications"));
  }
};

const getNotificationByContributor = async (req: Request, res: Response) => {
  try {
    const contributorId = req.params.id;
    const notifications = await getNotificationByContributorId(contributorId);
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Notifications fetched successfully", notifications));
  } catch (error) {
    console.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to fetch notifications"));
  }
};

const getNotificationByBuyer = async (req: Request, res: Response) => {
  try {
    const buyerId = req.params.id;
    const notifications = await getNotificationByBuyerId(buyerId);
    if (!notifications.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("No notifications found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Notifications fetched successfully", notifications));
  } catch (error) {
    console.error(error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Failed to fetch notifications"));
  }
};

export {
  getAllNotifications,
  getNotificationByContributor,
  getNotificationByBuyer,
};
