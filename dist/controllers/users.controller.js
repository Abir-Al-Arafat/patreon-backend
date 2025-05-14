"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileImageByUser = exports.updateProfileByUser = exports.profile = exports.updateUserById = exports.getAllNotifications = exports.getNotificationsByUserId = exports.getOneUserById = exports.getAllUsers = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const common_1 = require("../utilities/common");
const statusCodes_1 = __importDefault(require("../constants/statusCodes"));
const user_model_1 = __importDefault(require("../models/user.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { role, isAffiliate, isActive } = req.query;
        const query = {};
        if (role) {
            query.role = role;
        }
        if (typeof isAffiliate !== "undefined") {
            query.isAffiliate = isAffiliate === "true";
        }
        if (typeof isActive !== "undefined") {
            query.isActive = isActive === "true";
        }
        const users = yield user_model_1.default.find(query).select("-__v").populate("phone");
        const count = yield user_model_1.default.countDocuments(query);
        if (users.length) {
            return res.status(statusCodes_1.default.OK).send((0, common_1.success)("Successfully received all users", {
                result: users,
                count,
            }));
        }
        else {
            return res.status(statusCodes_1.default.NOT_FOUND).send((0, common_1.failure)("Users not found"));
        }
    }
    catch (error) {
        console.error(error);
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Internal server error"));
    }
});
exports.getAllUsers = getAllUsers;
const getOneUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_model_1.default.findById(id);
        if (!user) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("User was not found"));
        }
        return res
            .status(statusCodes_1.default.OK)
            .send((0, common_1.success)("Successfully got the user", user));
    }
    catch (error) {
        return res.status(statusCodes_1.default.BAD_REQUEST).send(`internal server error`);
    }
});
exports.getOneUserById = getOneUserById;
const profile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!(req === null || req === void 0 ? void 0 : req.user)) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("User not logged in"));
        }
        const user = yield user_model_1.default.findById((_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a._id).select("-password -__v");
        if (!user) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("User was not found"));
        }
        return res
            .status(statusCodes_1.default.OK)
            .send((0, common_1.success)("Successfully got profile", user));
    }
    catch (error) {
        return res.status(statusCodes_1.default.BAD_REQUEST).send(`internal server error`);
    }
});
exports.profile = profile;
const updateUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // const validation = validationResult(req).array();
        // if (validation.length > 0) {
        //   return res
        //     .status(HTTP_STATUS.OK)
        //     .send(failure("Failed to update data", validation[0].msg));
        // }
        if (!req.params.id) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send({ message: "please provide id parameter" });
        }
        // const updatedUserData = req.body;
        const { name, phone } = req.body;
        // const user = await UserModel.findById(req.user._id);
        const user = yield user_model_1.default.findById(req.params.id);
        if (!user) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send({ message: "User not found" });
        }
        const files = req.files;
        console.log("files", files);
        console.log("files", files === null || files === void 0 ? void 0 : files["image"]);
        if (req.files && (files === null || files === void 0 ? void 0 : files["image"])) {
            let imageFileName = "";
            if (files === null || files === void 0 ? void 0 : files.image[0]) {
                // Add public/uploads link to the image file
                imageFileName = `public/uploads/images/${(_a = files === null || files === void 0 ? void 0 : files.image[0]) === null || _a === void 0 ? void 0 : _a.filename}`;
                user.image = imageFileName;
            }
        }
        user.name = name || user.name;
        user.phone = phone || user.phone;
        yield user.save();
        // const updatedUser = await UserModel.findByIdAndUpdate(
        //   req.params.id,
        //   updatedUserData,
        //   // Returns the updated document
        //   { new: true }
        // );
        // if (!updatedUser) {
        //   return res
        //     .status(HTTP_STATUS.NOT_FOUND)
        //     .send({ message: "User not found" });
        // }
        // console.log(updatedUser);
        // updatedUser.__v = undefined;
        return res
            .status(statusCodes_1.default.ACCEPTED)
            .send((0, common_1.success)("User data updated successfully", user));
    }
    catch (error) {
        console.log(error);
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send({ message: "INTERNAL SERVER ERROR" });
    }
});
exports.updateUserById = updateUserById;
const updateProfileByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { name, phone, image } = req.body;
        console.log("body", req.body);
        console.log("image body", req.body.image);
        console.log("image body", typeof req.body.image);
        const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        if (typeof req.body.image === "string") {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send({ message: "Please provide image, you have given string" });
        }
        if (!user) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send({ message: "User not found" });
        }
        const files = req.files;
        console.log("files", files);
        console.log("files", files === null || files === void 0 ? void 0 : files["image"]);
        if (req.files && (files === null || files === void 0 ? void 0 : files["image"])) {
            let imageFileName = "";
            if (files === null || files === void 0 ? void 0 : files.image[0]) {
                // Delete old image file if it exists
                if (user.image) {
                    const oldImagePath = path_1.default.join(__dirname, "../", user.image);
                    fs_1.default.unlink(oldImagePath, (err) => {
                        if (err) {
                            console.error("Failed to delete old image:", err);
                        }
                    });
                }
                // Add public/uploads link to the new image file
                imageFileName = `public/uploads/images/${(_b = files === null || files === void 0 ? void 0 : files.image[0]) === null || _b === void 0 ? void 0 : _b.filename}`;
                user.image = imageFileName;
            }
        }
        const updatedUser = yield user_model_1.default.findByIdAndUpdate((_c = req.user) === null || _c === void 0 ? void 0 : _c._id, req.body, { new: true });
        if (!updatedUser) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send({ message: "User not found" });
        }
        console.log(updatedUser);
        yield user.save();
        return res
            .status(statusCodes_1.default.ACCEPTED)
            .send((0, common_1.success)("Profile updated successfully", updatedUser));
    }
    catch (error) {
        console.log(error);
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send({ message: "INTERNAL SERVER ERROR" });
    }
});
exports.updateProfileByUser = updateProfileByUser;
const updateProfileImageByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const user = yield user_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
        if (!user) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send({ message: "User not found" });
        }
        const files = req.files;
        console.log("files", files);
        console.log("files", files === null || files === void 0 ? void 0 : files["image"]);
        if (!req.files || !(files === null || files === void 0 ? void 0 : files["image"])) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send({ message: "Please provide image" });
        }
        if (req.files && (files === null || files === void 0 ? void 0 : files["image"])) {
            let imageFileName = "";
            if (files === null || files === void 0 ? void 0 : files.image[0]) {
                // Delete old image file if it exists
                if (user.image) {
                    const oldImagePath = path_1.default.join(__dirname, "../", user.image);
                    fs_1.default.unlink(oldImagePath, (err) => {
                        if (err) {
                            console.error("Failed to delete old image:", err);
                        }
                    });
                }
                // Add public/uploads link to the new image file
                imageFileName = `public/uploads/images/${(_b = files === null || files === void 0 ? void 0 : files.image[0]) === null || _b === void 0 ? void 0 : _b.filename}`;
                user.image = imageFileName;
            }
        }
        const updatedUser = yield user_model_1.default.findByIdAndUpdate((_c = req.user) === null || _c === void 0 ? void 0 : _c._id, { image: user.image }, { new: true });
        if (!updatedUser) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send({ message: "User not found" });
        }
        console.log(updatedUser);
        yield user.save();
        return res
            .status(statusCodes_1.default.ACCEPTED)
            .send((0, common_1.success)("Profile image updated successfully", updatedUser));
    }
    catch (error) {
        console.log(error);
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send({ message: "INTERNAL SERVER ERROR" });
    }
});
exports.updateProfileImageByUser = updateProfileImageByUser;
// Controller to get notifications by userId
const getNotificationsByUserId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Please provide userId"));
        }
        // Fetch the user to check if they exist
        const user = yield user_model_1.default.findById(userId).populate("notifications");
        if (!user) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("User does not exist"));
        }
        // Return the user's notifications
        res.status(statusCodes_1.default.OK).send({
            message: "Notifications fetched successfully",
            notifications: user.notifications,
        });
        // .json({
        //   message: "Notifications fetched successfully",
        //   notifications: user.notifications,
        // });
    }
    catch (error) {
        console.error(error);
        res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .json({ message: "Internal server error" });
    }
});
exports.getNotificationsByUserId = getNotificationsByUserId;
// Controller to get notifications
const getAllNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch the user to check if they exist
        const notifications = yield notification_model_1.default.find();
        if (!notifications) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("notification does not exist"));
        }
        res.status(statusCodes_1.default.OK).send({
            message: "All Notifications fetched successfully",
            notifications: notifications,
        });
    }
    catch (error) {
        console.error(error);
        res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .json({ message: "Internal server error" });
    }
});
exports.getAllNotifications = getAllNotifications;
