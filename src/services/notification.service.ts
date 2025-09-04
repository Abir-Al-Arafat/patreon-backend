import Notification from "../models/notification.model";
import { ObjectId } from "mongoose";

const createNotification = async (data: any) => {
  const notification = new Notification(data);
  return await notification.save();
};

const getNotificationByContributorId = async (contributorId: string) => {
  return await Notification.find({ contributor: contributorId });
};

const getNotificationByBuyerId = async (buyerId: string) => {
  return await Notification.find({ buyer: buyerId });
};

const getNotificationByUserId = async (userId: ObjectId) => {
  return await Notification.find({ user: userId });
};

const getNotifications = async (userId: string) => {
  return await Notification.find({ userId });
};

const getAllNotificationsService = async () => {
  return await Notification.find();
};

const updateNotification = async (id: string, data: any) => {
  return await Notification.findByIdAndUpdate(id, data, { new: true });
};

const deleteNotification = async (id: string) => {
  return await Notification.findByIdAndDelete(id);
};

export {
  createNotification,
  getNotificationByContributorId,
  getNotificationByBuyerId,
  getNotificationByUserId,
  getNotifications,
  getAllNotificationsService,
  updateNotification,
  deleteNotification,
};
