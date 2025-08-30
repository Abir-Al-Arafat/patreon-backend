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
  attachBankAccountToRecipientUS,
  attachBankAccountToRecipientGB,
  getStripeExternalAccountList,
  getBankAccountDetails,
  getRecipientPayoutMethods,
  setDefaultPayoutMethod,
  getPayoutMethodId,
  createTestBankAccountGBP,
  getAllStorageBalances,
  getSpecificStorageBalance,
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
  "/attach-bank-account-us",
  upload.none(),
  isAuthorizedUser,
  attachBankAccountToRecipientUS
);

routes.put(
  "/attach-bank-account-gb",
  upload.none(),
  isAuthorizedUser,
  attachBankAccountToRecipientGB
);

routes.get(
  "/external-accounts",
  upload.none(),
  isAuthorizedUser,
  getStripeExternalAccountList
);

routes.get(
  "/bank-account-details",
  upload.none(),
  isAuthorizedUser,
  getBankAccountDetails
);

routes.get(
  "/recipient-payout-methods",
  upload.none(),
  isAuthorizedUser,
  getRecipientPayoutMethods
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

routes.get(
  "/storage-balance",
  upload.none(),
  // isAuthorizedUser,
  getAllStorageBalances
);

routes.get(
  "/storage-balance/specific-account/:pfaId",
  upload.none(),
  // isAuthorizedUser,
  getSpecificStorageBalance
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
