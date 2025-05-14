"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_controller_1 = require("../controllers/users.controller");
const authValidationJWT_1 = require("../middlewares/authValidationJWT");
const fileUpload_1 = __importDefault(require("../middlewares/fileUpload"));
const routes = (0, express_1.default)();
// /api/users
routes.get("/", users_controller_1.getAllUsers);
// /api/users/123
routes.get("/:id", users_controller_1.getOneUserById);
routes.get("/auth/profile", authValidationJWT_1.isAuthorizedUser, users_controller_1.profile);
// /api/users
routes.patch("/auth/update-profile-by-user", authValidationJWT_1.isAuthorizedUser, (0, fileUpload_1.default)(), users_controller_1.updateProfileByUser);
routes.patch("/auth/profile-image/update", authValidationJWT_1.isAuthorizedUser, (0, fileUpload_1.default)(), users_controller_1.updateProfileImageByUser);
exports.default = routes;
