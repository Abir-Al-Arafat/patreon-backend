"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUser = exports.generateRandomCode = exports.failure = exports.success = void 0;
const success = (message, data = null) => {
    return {
        success: true,
        message: message,
        data: data,
    };
};
exports.success = success;
const failure = (message, error = null) => {
    return {
        success: false,
        message: message,
        error: error,
    };
};
exports.failure = failure;
const generateRandomCode = (length) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1));
};
exports.generateRandomCode = generateRandomCode;
const sanitizeUser = (user) => {
    const userObj = user.toObject ? user.toObject() : Object.assign({}, user);
    delete userObj.password;
    return userObj;
};
exports.sanitizeUser = sanitizeUser;
