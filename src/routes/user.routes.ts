import express from "express";
import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  getAllUsers,
  getOneUserById,
  getOneUserByUsername,
  getNotificationsByUserId,
  getAllNotifications,
  updateUserById,
  deleteUserByUser,
  profile,
  updateProfileByUser,
  updateProfileImageByUser,
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

routes.get("/auth/profile", isAuthorizedUser, profile);

routes.get("/by-username/:username", getOneUserByUsername);

// /api/users

routes.patch(
  "/auth/update-profile-by-user",
  isAuthorizedUser,
  fileUpload(),
  updateProfileByUser
);

routes.patch(
  "/auth/profile-image/update",
  isAuthorizedUser,
  fileUpload(),
  updateProfileImageByUser
);

routes.delete("/auth/delete-user", isAuthorizedUser, deleteUserByUser);

export default routes;
