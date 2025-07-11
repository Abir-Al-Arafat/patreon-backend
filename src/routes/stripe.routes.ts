import express from "express";
import multer from "multer";
const routes = express();
const upload = multer();

import {
  onboardingComplete,
  onboardingRefresh,
} from "../controllers/transaction.controller";

import {
  createRecipientForDirectBankTransfer,
  updateRecipientForDirectBankTransfer,
  attachBankAccountToRecipient,
  sendPayoutToRecipient,
  getFinancialAccounts,
} from "../controllers/stripe.controller";

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
routes.post(
  "/create-recipient",
  upload.none(),
  isAuthorizedUser,
  createRecipientForDirectBankTransfer
);
routes.put(
  "/update-recipient",
  upload.none(),
  isAuthorizedUser,
  updateRecipientForDirectBankTransfer
);

routes.put(
  "/attach-bank-account",
  upload.none(),
  isAuthorizedUser,
  attachBankAccountToRecipient
);

routes.post(
  "/send-payout",
  upload.none(),
  isAuthorizedUser,
  sendPayoutToRecipient
);

routes.get(
  "/financial-accounts",
  upload.none(),
  // isAuthorizedUser,
  getFinancialAccounts
);

export default routes;
