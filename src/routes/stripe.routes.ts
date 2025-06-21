import express from "express";
import multer from "multer";
const routes = express();
const upload = multer();

import {
  onboardingComplete,
  onboardingRefresh,
} from "../controllers/transaction.controller";

import {
  isAuthorizedUser,
  isAuthorizedAdmin,
} from "../middlewares/authValidationJWT";

routes.get(
  "/complete",
  // upload.none(), isAuthorizedUser,
  onboardingComplete
);

routes.get(
  "/refresh",
  // upload.none(), isAuthorizedUser,
  onboardingRefresh
);
export default routes;
