import express from "express";
import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  getAllUsers,
  getOneUserById,
  getNotificationsByUserId,
  getAllNotifications,
  updateUserById,
  profile,
  updateProfileByUser,
} from "../controllers/users.controller";

import {
  isAuthorizedUser,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
} from "../middlewares/authValidationJWT";

import fileUpload from "../middlewares/fileUpload";

const routes = express();

// /api/users

routes.get("/", getAllUsers);

// /api/users/123
routes.get("/:id", getOneUserById);

// /api/users

routes.patch(
  "/update-profile-by-user",
  isAuthorizedUser,
  fileUpload(),
  updateProfileByUser
);

export default routes;
