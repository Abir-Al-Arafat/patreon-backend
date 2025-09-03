import express from "express";
import multer from "multer";

import {
  getAllNotifications,
  getNotificationByContributor,
  getNotificationByBuyer,
  getNotificationByUser,
} from "../controllers/notification.controller";

import {
  isAuthorizedUser,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
} from "../middlewares/authValidationJWT";

const routes = express();
const upload = multer();

// routes.post("/", isAuthorizedUser, openWallet);

routes.get("/", getAllNotifications);

routes.get("/contributor/:id", getNotificationByContributor);

routes.get("/buyer/:id", getNotificationByBuyer);

routes.get("/user", getNotificationByUser);

// routes.get("/self", isAuthorizedUser, getWalletByUser);

// routes.delete("/self", isAuthorizedUser, deleteWalletByUser);

export default routes;
