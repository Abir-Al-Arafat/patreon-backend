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
  setDefaultPayoutMethod,
  getPayoutMethodId,
  createTestBankAccountGBP,
  sendPayoutToRecipient,
  getFinancialAccounts,
  getFinancialAddress,
  addFundToFinancialAccount,
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

routes.put(
  "/set-default-payout-method",
  upload.none(),
  isAuthorizedUser,
  setDefaultPayoutMethod
);

routes.post(
  "/create-test-bank-account-gbp",
  upload.none(),
  isAuthorizedUser,
  createTestBankAccountGBP
);

routes.get(
  "/get-payout-method-id",
  upload.none(),
  isAuthorizedUser,
  getPayoutMethodId
);

routes.post(
  "/send-payout",
  upload.none(),
  isAuthorizedUser,
  sendPayoutToRecipient
);

routes.get(
  "/financial-accounts",

  // isAuthorizedUser,
  getFinancialAccounts
);

routes.get(
  "/financial-address",
  // upload.none(),
  // isAuthorizedUser,
  getFinancialAddress
);

routes.post(
  "/add-fund-to-financial-account",
  upload.none(),
  // isAuthorizedUser,
  addFundToFinancialAccount
);

export default routes;
