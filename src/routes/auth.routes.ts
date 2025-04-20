import express from "express";
import { Request, Response, NextFunction } from "express";
import { UserRequest } from "../middlewares/authValidationJWT";
import {
  signup,
  login,
  sendVerificationCodeToPhone,
  verifyCode,
} from "../controllers/auth.controller";
import multer from "multer";

import { userValidator, authValidator } from "../middlewares/validation";
import {
  isAuthorizedUser,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
} from "../middlewares/authValidationJWT";
// const { authValidator } = require("../middleware/authValidation");
const routes = express();
const upload = multer();
// for signing up
routes.post(
  "/signup",
  // userValidator.create,
  // authValidator.create,
  upload.none(),
  signup
);

routes.post(
  "/auth/send-verification-code-to-phone",
  // userValidator.create,
  // authValidator.create,
  sendVerificationCodeToPhone
);

routes.post(
  "/auth/verify-code",
  // userValidator.create,
  // authValidator.create,
  verifyCode
);

// for logging in
routes.post("/login", upload.none(), login);

routes.get("/users", (req: Request, res: Response, next: NextFunction) => {
  try {
    const userReq = req as UserRequest;
    isAuthorizedAdmin(userReq, res, next);
    return res.status(200).json("HIT");
  } catch (error) {
    return res.status(500).json(error);
  }
});
// routes.post(
//   "/auth/create-admin",
//   // userValidator.create,
//   // authValidator.create,
//   isAuthorizedSuperAdmin,
//   createAdmin
// );

// for signing up as doctor
// routes.post(
//   "/auth/signup-as-affiliate",
//   // userValidator.create,
//   // authValidator.create,
//   signupAsAffiliate
// );

// routes.post(
//   "/auth/connect-stripe-account",
//   isAuthorizedUser,
//   connectStripeAccount
// );

// routes.post(
//   "/auth/verify-email",
//   // userValidator.create,
//   // authValidator.create,
//   verifyEmail
// );

// routes.post(
//   "/auth/forgot-password",
//   // userValidator.create,
//   // authValidator.create,
//   forgotPassword
// );

// routes.post(
//   "/auth/reset-password",
//   // userValidator.create,
//   // authValidator.create,
//   resetPassword
// );

// routes.post(
//   "/auth/change-password",
//   // userValidator.create,
//   // authValidator.create,
//   changePassword
// );

// // for approving doctor
// routes.post(
//   "/auth/approve-affiliate",
//   // userValidator.create,
//   // authValidator.create,
//   isAuthorizedAdmin,
//   approveAffiliate
// );

// // for canceling doctor
// routes.post(
//   "/auth/cancel-affiliate",
//   // userValidator.create,
//   // authValidator.create,
//   isAuthorizedAdmin,
//   cancelAffiliate
// );

// for logging in
// routes.post("/auth/login-as-doctor", authValidator.login, loginAsDoctor);

// routes.post("/auth/send-otp-again", sendOTPAgain);

// // for logging in
// routes.post("/auth/logout", logout);

export default routes;
