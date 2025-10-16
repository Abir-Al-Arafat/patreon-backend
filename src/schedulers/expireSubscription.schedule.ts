import cron from "node-cron";
import { checkExpiredSubscriptions } from "../jobs/expireSubscriptions.job";

export const initScheduledJobs = () => {
  // Run the check every day at midnight
  cron.schedule("0 0 * * *", async () => {
    await checkExpiredSubscriptions();
  });

  console.log(
    "Subscription expiration checker scheduled to run daily at midnight"
  );

  // Uncomment if you want to run it when the scheduler initializes
  checkExpiredSubscriptions();
};
