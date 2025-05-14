"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthorizedUser = exports.isAuthorizedSuperAdmin = exports.isAuthorizedAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const statusCodes_1 = __importDefault(require("../constants/statusCodes"));
const common_1 = require("../utilities/common");
const isAuthorizedAdmin = (req, res, next) => {
    var _a;
    try {
        // const { authorization } = req.headers;
        const { token } = req.cookies;
        console.log("tokenCookie", token);
        if (!token) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Unauthorized access, admin not logged in"));
        }
        // console.log(authorization);
        // if (!authorization) {
        //   return res
        //     .status(HTTP_STATUS.UNAUTHORIZED)
        //     .send(failure("Unauthorized access, admin not logged in"));
        // }
        // const tokenHeader = authorization.split(" ")[1];
        // console.log("token", tokenHeader);
        // const validate = jsonWebToken.verify(
        //   tokenHeader,
        //   process.env.JWT_SECRET ?? "default_secret"
        // ) as JwtPayload;
        const validate = jsonwebtoken_1.default.verify(token, (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "default_secret");
        if (!validate) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Unauthorized access, token not validated"));
        }
        req.user = validate;
        console.log("validate", validate.role);
        if (validate.role == "admin" || validate.role == "superadmin") {
            next();
        }
        else {
            return res
                .status(statusCodes_1.default.UNPROCESSABLE_ENTITY)
                .send((0, common_1.failure)("Admin access required"));
        }
    }
    catch (error) {
        console.log(error);
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Access expired"));
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Unauthorized access"));
        }
        else {
            return res
                .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
                .send((0, common_1.failure)("Internal server error"));
        }
    }
};
exports.isAuthorizedAdmin = isAuthorizedAdmin;
const isAuthorizedSuperAdmin = (req, res, next) => {
    var _a;
    try {
        const { authorization } = req.headers;
        console.log(authorization);
        if (!authorization) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Unauthorized access, super admin not logged in"));
        }
        const token = authorization.split(" ")[1];
        console.log("token", token);
        const validate = jsonwebtoken_1.default.verify(token, (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "default_secret");
        if (!validate) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Unauthorized access, token not validated"));
        }
        req.user = validate;
        console.log("validate", validate.role);
        if (validate.role == "superadmin") {
            next();
        }
        else {
            return res
                .status(statusCodes_1.default.UNPROCESSABLE_ENTITY)
                .send((0, common_1.failure)("super admin access required"));
        }
    }
    catch (error) {
        console.log(error);
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Access expired"));
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Unauthorized access"));
        }
        else {
            return res
                .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
                .send((0, common_1.failure)("Internal server error"));
        }
    }
};
exports.isAuthorizedSuperAdmin = isAuthorizedSuperAdmin;
const isAuthorizedUser = (req, res, next) => {
    var _a;
    try {
        const userId = req.params.id;
        console.log("headers", req.headers);
        const { authorization } = req.headers;
        const { token: tokenCookie } = req.cookies;
        if (!tokenCookie) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Unauthorized access, user not logged in"));
        }
        console.log("tokenCookie", tokenCookie);
        // if (!authorization) {
        //   return res
        //     .status(HTTP_STATUS.UNAUTHORIZED)
        //     .send(failure("Unauthorized access"));
        // }
        // console.log(authorization);
        // const tokenHeader = authorization.split(" ")[1];
        // console.log("tokenHeader", tokenHeader);
        // const validate = jsonWebToken.verify(
        //   tokenHeader,
        //   process.env.JWT_SECRET ?? "default_secret"
        // ) as JwtPayload;
        const validate = jsonwebtoken_1.default.verify(tokenCookie, (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "default_secret");
        if (!validate) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Unauthorized access, token not validated"));
        }
        req.user = validate;
        // console.log("validate", validate.role);
        // console.log("validate _id", validate._id);
        // if (validate._id == userId && validate.role == "user") {
        next();
        // } else {
        //   return res
        //     .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        //     .send(failure("Something went wrong"));
        // }
    }
    catch (error) {
        console.log(error);
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Access expired"));
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Unauthorized access"));
        }
        else {
            return res
                .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
                .send((0, common_1.failure)("Internal server error"));
        }
    }
};
exports.isAuthorizedUser = isAuthorizedUser;
