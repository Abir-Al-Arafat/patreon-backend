"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const routes = (0, express_1.default)();
const upload = (0, multer_1.default)();
const service_controller_1 = require("../controllers/service.controller");
const authValidationJWT_1 = require("../middlewares/authValidationJWT");
const fileUpload_1 = __importDefault(require("../middlewares/fileUpload"));
// const { authValidator } = require("../middleware/authValidation");
routes.post("/become-contributor", authValidationJWT_1.isAuthorizedUser, (0, fileUpload_1.default)(), service_controller_1.addService);
routes.post("/add-file-to-service/:id", (0, fileUpload_1.default)(), service_controller_1.addFileToService);
routes.delete("/remove-file-from-service/:id", upload.none(), service_controller_1.removeFileFromService);
routes.get("/get-all-services", service_controller_1.getAllServices);
routes.get("/all-categories", service_controller_1.getAllCategories);
routes.get("/get-service-by-id/:id", service_controller_1.getServiceById);
routes.get("/get-service-by-contributor", authValidationJWT_1.isAuthorizedUser, service_controller_1.getServiceByContributor);
routes.put("/update-service-by-id/:id", (0, fileUpload_1.default)(), service_controller_1.updateServiceById);
routes.delete("/delete-service-by-id/:id", service_controller_1.deleteServiceById);
routes.post("/generate-reply-for-service/:serviceId", upload.none(), service_controller_1.generateReplyForService);
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
exports.default = routes;
