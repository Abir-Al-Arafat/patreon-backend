"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const multer_1 = __importDefault(require("multer"));
// const { authValidator } = require("../middleware/authValidation");
const routes = (0, express_1.default)();
const upload = (0, multer_1.default)();
// for signing up
routes.post("/signup", 
// userValidator.create,
// authValidator.create,
upload.none(), auth_controller_1.signup);
routes.post("/send-verification-code-to-phone", 
// userValidator.create,
// authValidator.create,
upload.none(), auth_controller_1.sendVerificationCodeToPhone);
routes.post("/verify-code", 
// userValidator.create,
// authValidator.create,
upload.none(), auth_controller_1.verifyCode);
routes.post("/verify-email", 
// userValidator.create,
// authValidator.create,
upload.none(), auth_controller_1.verifyEmail);
// for logging in
routes.post("/login", upload.none(), auth_controller_1.login);
routes.post("/reset-password", 
// userValidator.create,
// authValidator.create,
upload.none(), auth_controller_1.resetPassword);
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
exports.default = routes;
