import express from "express";
import multer from "multer";
const routes = express();
const upload = multer();
import {
  createPaddleCheckout,
  createStripeAccountLink,
  subscribeToService,
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

routes.post("/subscribe/:serviceId", subscribeToService);
routes.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);
routes.get("/stripe/onboarding", createStripeAccountLink);

export default routes;
