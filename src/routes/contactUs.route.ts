import express from "express";
import multer from "multer";

import {
  addContactUs,
  getContactUs,
  getAllContactUs,
} from "../controllers/contactUs.controller";

import {
  isAuthorizedUser,
  isAuthorizedAdmin,
  isAuthorizedSuperAdmin,
} from "../middlewares/authValidationJWT";

import contactUsValidator from "../validators/contactUsValidator";

const routes = express();
const upload = multer();

routes.post(
  "/",

  isAuthorizedUser,
  upload.none(),
  contactUsValidator.create,
  addContactUs
);
1;

routes.get("/", getAllContactUs);

routes.get("/self", isAuthorizedUser, getContactUs);

// routes.delete("/self", isAuthorizedUser, deleteWalletByUser);

export default routes;
