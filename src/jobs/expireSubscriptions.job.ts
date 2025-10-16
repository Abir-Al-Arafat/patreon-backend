import mongoose from "mongoose";
import Transaction from "../models/transaction.model";
import User from "../models/user.model";
import Service from "../models/service.model";
import Notification from "../models/notification.model";

export const checkExpiredSubscriptions = async () => {
  try {
    console.log("Checking for expired subscriptions...");

    // Find all transactions that have expired but haven't been marked as expired yet
    const expiredTransactions = await Transaction.find({
      expiresAt: { $lt: new Date() },
      isExpired: false,
      status: "succeeded",
    }).populate("userId serviceId");

    console.log(`Found ${expiredTransactions.length} expired subscriptions`);

    for (const transaction of expiredTransactions) {
      const { userId, serviceId } = transaction;

      if (!userId || !serviceId) continue;

      // Remove the service from user's subscriptions
      await User.findByIdAndUpdate(userId, {
        $pull: { subscriptions: serviceId },
      });

      // Remove the user from service's subscribers
      await Service.findByIdAndUpdate(serviceId, {
        $pull: { subscribers: userId },
      });

      // Mark transaction as expired
      transaction.isExpired = true;
      await transaction.save();

      // Create notification for the user
      const notification = await Notification.create({
        user: userId,
        type: "subscription",
        message: `Your subscription to service "${
          transaction.serviceId &&
          typeof transaction.serviceId === "object" &&
          "title" in transaction.serviceId
            ? (transaction.serviceId as any).title
            : ""
        }" has expired.`,
        transaction: transaction._id,
      });

      console.log(
        `Expired subscription: User ${userId} for Service ${serviceId}`
      );

      console.log("Notification created:", notification);
    }

    console.log("Finished checking expired subscriptions");
  } catch (error) {
    console.error("Error checking expired subscriptions:", error);
  }
};
