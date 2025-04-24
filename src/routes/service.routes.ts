import express from "express";
const routes = express();
import {
  addService,
  getAllServices,
  getServiceById,
  getServiceByDoctorId,
  updateServiceById,
  deleteServiceById,
  //   disableServiceById,
  //   enableServiceById,
  //   approveServiceById,
  //   cancelServiceById,
} from "../controllers/service.controller";
import { userValidator, authValidator } from "../middlewares/validation";
import {
  isAuthorizedUser,
  isAuthorizedAdmin,
} from "../middlewares/authValidationJWT";

// const { authValidator } = require("../middleware/authValidation");

routes.post("/become-contributor", isAuthorizedUser, addService);

routes.get("/get-all-services", getAllServices);

routes.get(
  "/get-service-by-id/:id",

  getServiceById
);

routes.get(
  "/get-service-by-doctorId/:id",

  getServiceByDoctorId
);

routes.put("/update-service-by-id/:id", isAuthorizedAdmin, updateServiceById);

routes.delete(
  "/delete-service-by-id/:id",
  isAuthorizedAdmin,
  deleteServiceById
);

// routes.patch(
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
