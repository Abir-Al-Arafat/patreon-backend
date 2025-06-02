import express from "express";
import multer from "multer";
const routes = express();
const upload = multer();
import {
  createPaddleCheckout,
  //   disableServiceById,
  //   enableServiceById,
  //   approveServiceById,
  //   cancelServiceById,
} from "../controllers/transaction.controller";
import { userValidator, authValidator } from "../middlewares/validation";
import {
  isAuthorizedUser,
  isAuthorizedAdmin,
} from "../middlewares/authValidationJWT";

import fileUpload from "../middlewares/fileUpload";

// const { authValidator } = require("../middleware/authValidation");

routes.post("/checkout", upload.none(), createPaddleCheckout);

export default routes;
