import express from "express";
import { Request, Response, NextFunction, RequestHandler } from "express";

import {
  signup,
  login,
  sendVerificationCodeToPhone,
  sendVerificationCodeToEmail,
  verifyCode,
  verifyEmail,
  verifyToken,
  resetPassword,
} from "../controllers/auth.controller";
import multer from "multer";

import { userValidator } from "../middlewares/validation";
import {
  isAuthorizedUser,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
} from "../middlewares/authValidationJWT";
import authValidator from "../validators/auth.validator";
// const { authValidator } = require("../middleware/authValidation");
const routes = express();
const upload = multer();
// for signing up
routes.post("/signup", upload.none(), authValidator.signup, signup);

routes.post(
  "/send-verification-code-to-phone",
  // userValidator.create,
  // authValidator.create,
  upload.none(),
  sendVerificationCodeToPhone
);

routes.post(
  "/send-verification-code-to-email",
  upload.none(),
  authValidator.sendCodeToEmail,
  sendVerificationCodeToEmail
);

routes.post(
  "/verify-code",
  // userValidator.create,
  // authValidator.create,
  upload.none(),
  verifyCode
);

routes.post(
  "/verify-email",
  upload.none(),
  authValidator.verifyEmail,
  verifyEmail
);
// for logging in
routes.post("/login", upload.none(), authValidator.login, login);

routes.post(
  "/reset-password",
  // userValidator.create,
  // authValidator.create,
  upload.none(),
  resetPassword
);

routes.post("/verify-token", isAuthorizedUser, upload.none(), verifyToken);

// routes.post(
//   "/auth/change-password",
//   // userValidator.create,
//   // authValidator.create,
//   changePassword
// );

// routes.post("/auth/send-otp-again", sendOTPAgain);

// // for logging in
// routes.post("/auth/logout", logout);

export default routes;
