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
const validation_1 = require("../middlewares/validation");
const authValidationJWT_1 = require("../middlewares/authValidationJWT");
const fileUpload_1 = __importDefault(require("../middlewares/fileUpload"));
const pdfUpload_1 = __importDefault(require("../middlewares/pdfUpload"));
// const { authValidator } = require("../middleware/authValidation");
routes.post("/become-contributor", authValidationJWT_1.isAuthorizedUser, (0, fileUpload_1.default)(), 
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
validation_1.serviceValidator.addService, service_controller_1.addService);
routes.post("/add-file-to-service/:id", 
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
(0, pdfUpload_1.default)(), service_controller_1.addFileToService);
routes.delete("/remove-file-from-service/:id", upload.none(), service_controller_1.removeFileFromService);
routes.get("/get-all-services", authValidationJWT_1.isAuthorizedUser, service_controller_1.getAllServices);
routes.get("/all-categories", service_controller_1.getAllCategories);
routes.get("/get-service-by-id/:id", service_controller_1.getServiceById);
routes.get("/get-service-by-contributor", authValidationJWT_1.isAuthorizedUser, service_controller_1.getServiceByContributor);
routes.put("/update-service-by-id/:id", 
// fileUpload(),
(0, pdfUpload_1.default)(), validation_1.serviceValidator.updateService, service_controller_1.updateServiceById);
routes.delete("/delete-service-by-id/:id", service_controller_1.deleteServiceById);
routes.post("/generate-reply-for-service/:serviceId", authValidationJWT_1.isAuthorizedUser, upload.none(), validation_1.serviceValidator.message, service_controller_1.generateReplyForService);
routes.get("/get-replies-for-service/:serviceId", service_controller_1.getRepliesForService);
routes.get("/get-replies-by-user", authValidationJWT_1.isAuthorizedUser, service_controller_1.getRepliesByUser);
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
exports.default = routes;
