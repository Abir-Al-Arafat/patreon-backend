import express from "express";
import multer from "multer";
const routes = express();
const upload = multer();
import {
  createPaddleCheckout,
  createStripeAccountLink,
  createCheckoutSession,
  subscribeToService,
  getAllTransactions,
  getTransactionById,
  getTransactionByUser,
  handleStripeWebhook,
} from "../controllers/transaction.controller";
import { userValidator, authValidator } from "../middlewares/validation";
import {
  isAuthorizedUser,
  isAuthorizedAdmin,
} from "../middlewares/authValidationJWT";

import fileUpload from "../middlewares/fileUpload";

// const { authValidator } = require("../middleware/authValidation");

routes.post("/checkout", upload.none(), createPaddleCheckout);

routes.post(
  "/subscribe/:serviceId",
  // upload.none(),
  isAuthorizedUser,
  subscribeToService
);
// routes.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   handleStripeWebhook
// );
routes.post(
  "/stripe/onboarding",
  upload.none(),
  isAuthorizedUser,
  createStripeAccountLink
);

routes.post(
  "/stripe/checkout/:serviceId",
  upload.none(),
  isAuthorizedUser,
  createCheckoutSession
);

routes.get("/all", getAllTransactions);
routes.get("/:id", getTransactionById);
routes.get("/user/self", isAuthorizedUser, getTransactionByUser);

export default routes;
