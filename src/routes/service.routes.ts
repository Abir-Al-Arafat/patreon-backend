import { Request, Response } from "express";
import express from "express";
import multer from "multer";
const routes = express();
const upload = multer();
import {
  addService,
  addFileToService,
  removeFileFromService,
  getAllServices,
  getAllCategories,
  getServiceById,
  getServiceByContributor,
  updateServiceById,
  deleteServiceById,
  generateReplyForService,
  getRepliesForService,
  getRepliesByUser,
  //   disableServiceById,
  //   enableServiceById,
  //   approveServiceById,
  //   cancelServiceById,
} from "../controllers/service.controller";

import { success, failure } from "../utilities/common";
import HTTP_STATUS from "../constants/statusCodes";

import {
  userValidator,
  authValidator,
  serviceValidator,
} from "../middlewares/validation";
import {
  isAuthorizedUser,
  isAuthorizedAdmin,
} from "../middlewares/authValidationJWT";

import fileUpload from "../middlewares/fileUpload";
import pdfUpload from "../middlewares/pdfUpload";
import { NextFunction } from "express-serve-static-core";

// const { authValidator } = require("../middleware/authValidation");

routes.post(
  "/become-contributor",
  isAuthorizedUser,
  fileUpload(),

  // pdfUpload(),
  // (req: Request, res: Response, next: NextFunction) => {
  //   pdfUpload()(req, res, (err) => {
  //     if (err instanceof Error) {
  //       return res.status(HTTP_STATUS.BAD_REQUEST).send({
  //         success: false,
  //         message: "Error uploading file",
  //         error: err.message,
  //       }); // ✅ Send the actual error
  //     }
  //     next();
  //   });
  // },
  serviceValidator.addService,
  addService
);

routes.post(
  "/add-file-to-service/:id",
  // fileUpload(),
  // (req, res, next) => {
  //   pdfUpload()(req, res, (err) => {
  //     if (err instanceof Error) {
  //       return res.status(HTTP_STATUS.BAD_REQUEST).send({
  //         success: false,
  //         message: "Error uploading file",
  //         error: err.message,
  //       }); // ✅ Send the actual error
  //     }
  //     next();
  //   });
  // },
  pdfUpload(),
  addFileToService
);

routes.delete(
  "/remove-file-from-service/:id",
  upload.none(),
  removeFileFromService
);

routes.get("/get-all-services", isAuthorizedUser, getAllServices);

routes.get("/all-categories", getAllCategories);

routes.get(
  "/get-service-by-id/:id",

  getServiceById
);

routes.get(
  "/get-service-by-contributor",
  isAuthorizedUser,
  getServiceByContributor
);

routes.put(
  "/update-service-by-id/:id",
  // fileUpload(),
  pdfUpload(),
  serviceValidator.updateService,
  updateServiceById
);

routes.delete(
  "/delete-service-by-id/:id",

  deleteServiceById
);

routes.post(
  "/generate-reply-for-service/:serviceId",
  isAuthorizedUser,
  upload.none(),
  serviceValidator.message,
  generateReplyForService
);

routes.get("/get-replies-for-service/:serviceId", getRepliesForService);

routes.get("/get-replies-by-user", isAuthorizedUser, getRepliesByUser);

// routes.get(
//   "/get-replies-for-service/:serviceId",
//   isAuthorizedUser,
//   "/disable-service-by-id/:id",
//   isAuthorizedAdmin,
//   disableServiceById
// );

// routes.patch(
//   "/enable-service-by-id/:id",

//   isAuthorizedAdmin,
//   enableServiceById
// );

// routes.patch(
//   "/approve-service-by-id/:id",

//   isAuthorizedAdmin,
//   approveServiceById
// );

// routes.patch(
//   "/cancel-service-by-id/:id",

//   isAuthorizedAdmin,
//   cancelServiceById
// );

export default routes;
