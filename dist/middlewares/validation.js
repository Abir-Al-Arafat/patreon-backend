"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceValidator = exports.discountValidator = exports.reviewValidator = exports.authValidator = exports.userValidator = exports.productValidator = void 0;
const express_validator_1 = require("express-validator");
const productValidator = {
    create: [
        (0, express_validator_1.body)("name")
            .exists()
            .withMessage("name was not provided")
            .bail()
            .notEmpty()
            .withMessage("name cannot be empty")
            .bail()
            .isString()
            .withMessage("name must be a string"),
        (0, express_validator_1.body)("author")
            .exists()
            .withMessage("author was not provided")
            .bail()
            .notEmpty()
            .withMessage("author cannot be empty")
            .bail()
            .isString()
            .withMessage("author must be a string"),
        (0, express_validator_1.body)("category")
            .optional()
            .exists()
            .withMessage("category was not provided")
            .bail()
            .notEmpty()
            .withMessage("category cannot be empty")
            .bail()
            .isString()
            .withMessage("category must be a string"),
        (0, express_validator_1.body)("description")
            .exists()
            .withMessage("description was not provided")
            .bail()
            .notEmpty()
            .withMessage("description cannot be empty")
            .bail()
            .isString()
            .withMessage("description must be a string"),
        (0, express_validator_1.body)("releaseDate")
            .exists()
            .withMessage("releaseDate was not provided")
            .bail()
            .notEmpty()
            .withMessage("releaseDate cannot be empty")
            .bail()
            .isDate({ format: "YYYY-MM-DD" })
            .withMessage("Invalid release date format (YYYY-MM-DD)"),
        (0, express_validator_1.body)("pages")
            .notEmpty()
            .withMessage("pages cannot be empty")
            .bail()
            .isInt({ min: 1 })
            .withMessage("Pages must be a positive integer and bigger than 0"),
        (0, express_validator_1.body)("price")
            .exists()
            .withMessage("price was not provided")
            .bail()
            .notEmpty()
            .withMessage("price cannot be empty")
            .bail()
            .isFloat({ min: 1, max: 1000 })
            .withMessage("Price must be a positive number"),
        (0, express_validator_1.body)("stock")
            .exists()
            .withMessage("stock was not provided")
            .bail()
            .notEmpty()
            .withMessage("stock cannot be empty")
            .bail()
            .isInt({ min: 1 })
            .withMessage("Stock must be a non-negative integer"),
    ],
    update: [
        (0, express_validator_1.body)("name")
            .optional()
            .notEmpty()
            .withMessage("Name is required")
            .bail()
            .isString()
            .withMessage("name must be a string"),
        (0, express_validator_1.body)("author")
            .optional()
            .notEmpty()
            .withMessage("author is required")
            .bail()
            .isString()
            .withMessage("author must be a string"),
        (0, express_validator_1.body)("category")
            .optional()
            .notEmpty()
            .withMessage("category cannot be empty")
            .bail()
            .isString()
            .withMessage("category must be a string"),
        (0, express_validator_1.body)("description")
            .optional()
            .notEmpty()
            .withMessage("description cannot be empty")
            .bail()
            .isString()
            .withMessage("description must be a string"),
        (0, express_validator_1.body)("releaseDate")
            .optional()
            .notEmpty()
            .withMessage("releaseDate cannot be empty")
            .bail()
            .isDate({ format: "YYYY-MM-DD" })
            .withMessage("Invalid release date format (YYYY-MM-DD)"),
        (0, express_validator_1.body)("pages")
            .optional()
            .notEmpty()
            .withMessage("pages cannot be empty")
            .bail()
            .isInt({ min: 1 })
            .withMessage("Pages must be a positive integer and bigger than 0"),
        (0, express_validator_1.body)("price")
            .optional()
            .notEmpty()
            .withMessage("price cannot be empty")
            .bail()
            .isFloat({ min: 1, max: 1000 })
            .withMessage("Price must be a positive number"),
        (0, express_validator_1.body)("stock")
            .optional()
            .notEmpty()
            .withMessage("stock cannot be empty")
            .bail()
            .isInt({ min: 1 })
            .withMessage("Stock must be a non-negative integer"),
    ],
    delete: [
        (0, express_validator_1.param)("id")
            .exists()
            .withMessage("Product ID must be provided")
            .bail()
            .matches(/^[a-f\d]{24}$/i)
            .withMessage("ID is not in valid mongoDB format"),
    ],
};
exports.productValidator = productValidator;
const userValidator = {
    create: [
        (0, express_validator_1.body)("name")
            .exists()
            .withMessage("name was not provided")
            .bail()
            .notEmpty()
            .withMessage("name cannot be empty")
            .bail()
            .isString()
            .withMessage("name must be a string"),
        (0, express_validator_1.body)("email")
            .exists()
            .withMessage("Email was not provided")
            .bail()
            .notEmpty()
            .withMessage("Email cannot be empty")
            .bail()
            .isString()
            .withMessage("Email must be a string")
            .bail()
            .isEmail()
            .withMessage("Email format is incorrect"),
        (0, express_validator_1.body)("phone")
            .exists()
            .withMessage("Phone number was not provided")
            .bail()
            .notEmpty()
            .withMessage("Phone number cannot be empty")
            .bail()
            .isString()
            .withMessage("Phone number must be a string")
            .bail()
            .isMobilePhone("any")
            .withMessage("Phone number format is incorrect"),
        (0, express_validator_1.body)("gender")
            .isIn(["male", "female", "other"])
            .withMessage("Gender must be male, female or other"),
        (0, express_validator_1.body)("address.area")
            .optional()
            .exists()
            .withMessage("area was not provided")
            .bail()
            .notEmpty()
            .withMessage("area cannot be empty")
            .bail()
            .isString()
            .withMessage("area must be a string"),
        (0, express_validator_1.body)("address.city")
            .optional()
            .exists()
            .withMessage("city was not provided")
            .bail()
            .notEmpty()
            .withMessage("city cannot be empty")
            .bail()
            .isString()
            .withMessage("city must be a string"),
        (0, express_validator_1.body)("address.country")
            .optional()
            .exists()
            .withMessage("country was not provided")
            .bail()
            .notEmpty()
            .withMessage("country cannot be empty")
            .bail()
            .isString()
            .withMessage("country must be a string"),
        (0, express_validator_1.body)("balance")
            .isFloat({ min: 0, max: 1500 })
            .withMessage("balance must be grater than 0 and less than 1500"),
    ],
    update: [
        (0, express_validator_1.body)("name")
            .optional()
            .notEmpty()
            .withMessage("Name is required")
            .bail()
            .isString()
            .withMessage("name must be a string"),
        (0, express_validator_1.body)("email")
            .optional()
            .notEmpty()
            .withMessage("email is required")
            .bail()
            .isString()
            .withMessage("email must be a string")
            .bail()
            .isEmail()
            .withMessage("Email format is incorrect"),
        (0, express_validator_1.body)("phone")
            .optional()
            .notEmpty()
            .withMessage("phone number cannot be empty")
            .bail()
            .isString()
            .withMessage("phone number must be a string")
            .bail()
            .isMobilePhone("any")
            .withMessage("Phone number format is incorrect"),
        (0, express_validator_1.body)("gender")
            .optional()
            .notEmpty()
            .withMessage("gender cannot be empty")
            .bail()
            .isIn(["male", "female", "other"])
            .withMessage("Gender must be male, female or other"),
        (0, express_validator_1.body)("address.area")
            .optional()
            .notEmpty()
            .withMessage("area cannot be empty")
            .bail()
            .isString()
            .withMessage("area must be a string"),
        (0, express_validator_1.body)("address.city")
            .optional()
            .notEmpty()
            .withMessage("city cannot be empty")
            .bail()
            .isString()
            .withMessage("area must be a string"),
        (0, express_validator_1.body)("address.country")
            .optional()
            .notEmpty()
            .withMessage("country cannot be empty")
            .bail()
            .isString()
            .withMessage("area must be a string"),
        (0, express_validator_1.body)("balance")
            .optional()
            .isFloat({ min: 0, max: 1500 })
            .withMessage("balance must be greater than 0 and less than 1500"),
    ],
    delete: [
        (0, express_validator_1.param)("id")
            .exists()
            .withMessage("User ID must be provided")
            .bail()
            .matches(/^[a-f\d]{24}$/i)
            .withMessage("ID is not in valid mongoDB format"),
    ],
};
exports.userValidator = userValidator;
const authValidator = {
    create: [
        (0, express_validator_1.body)("email")
            .exists()
            .withMessage("Email was not provided")
            .bail()
            .notEmpty()
            .withMessage("Email cannot be empty")
            .bail()
            .isString()
            .withMessage("Email must be a string")
            .bail()
            .isEmail()
            .withMessage("Email format is incorrect"),
        (0, express_validator_1.body)("password")
            .exists()
            .withMessage("Password was not provided")
            .bail()
            .isString()
            .withMessage("Password must be a string")
            .bail()
            .isStrongPassword({
            minLength: 8,
            minNumbers: 1,
            minLowercase: 1,
            minUppercase: 1,
            minSymbols: 1,
        })
            .withMessage("Password must contain 8 characters, a small letter, a capital letter, a symbol and a number"),
        (0, express_validator_1.body)("passwordConfirm")
            .exists()
            .withMessage("Confirm Password was not provided")
            .bail()
            .isString()
            .withMessage("Password must be a string")
            .bail()
            .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Passwords do not match");
            }
            return true;
        }),
        (0, express_validator_1.body)("role")
            .optional()
            .isIn(["user", "admin"])
            .withMessage("Role must be user or admin"),
    ],
    login: [
        (0, express_validator_1.body)("email")
            .exists()
            .withMessage("Email was not provided")
            .bail()
            .notEmpty()
            .withMessage("Email cannot be empty"),
        (0, express_validator_1.body)("password")
            .exists()
            .withMessage("Password was not provided")
            .bail()
            .isString()
            .withMessage("Password must be a string"),
    ],
};
exports.authValidator = authValidator;
const reviewValidator = {
    addReview: [
        (0, express_validator_1.param)("id")
            .exists()
            .withMessage("User ID must be provided")
            .bail()
            .matches(/^[a-f\d]{24}$/i)
            .withMessage("ID is not in valid mongoDB format"),
        (0, express_validator_1.body)("productId")
            .exists()
            .withMessage("Product ID must be provided")
            .bail()
            .matches(/^[a-f\d]{24}$/i)
            .withMessage("ID is not in valid mongoDB format"),
        (0, express_validator_1.body)("review")
            .exists()
            .withMessage("Review must be provided")
            .bail()
            .isString()
            .withMessage("Review has to be a string"),
        (0, express_validator_1.body)("rating")
            .isFloat({ min: 1, max: 5 })
            .withMessage("Rating must be a number between 1 and 5"),
    ],
    updateReview: [
        (0, express_validator_1.param)("id")
            .exists()
            .withMessage("User ID must be provided")
            .bail()
            .matches(/^[a-f\d]{24}$/i)
            .withMessage("ID is not in valid mongoDB format"),
        (0, express_validator_1.body)("productId")
            .exists()
            .withMessage("Product ID must be provided")
            .bail()
            .matches(/^[a-f\d]{24}$/i)
            .withMessage("ID is not in valid mongoDB format"),
        (0, express_validator_1.body)("review")
            .optional()
            .exists()
            .withMessage("Review must be provided")
            .bail()
            .isString()
            .withMessage("Review has to be a string"),
        (0, express_validator_1.body)("rating")
            .optional()
            .isFloat({ min: 1, max: 5 })
            .withMessage("Rating must be a number between 1 and 5"),
    ],
};
exports.reviewValidator = reviewValidator;
const discountValidator = {
    addDiscount: [
        (0, express_validator_1.body)("productId")
            .exists()
            .withMessage("product ID must be provided")
            .bail()
            .matches(/^[a-f\d]{24}$/i)
            .withMessage("ID is not in valid mongoDB format"),
        (0, express_validator_1.body)("startTime")
            .exists()
            .withMessage("startTime was not provided")
            .bail()
            .notEmpty()
            .withMessage("startTime cannot be empty")
            .isISO8601()
            .withMessage('Invalid date-time format for start time. Use "YYYY-MM-DDT14:10:26.113Z" format.'),
        (0, express_validator_1.body)("endTime")
            .exists()
            .withMessage("endTime was not provided")
            .bail()
            .notEmpty()
            .withMessage("endTime cannot be empty")
            .isISO8601()
            .withMessage('Invalid date-time format for end time. Use "YYYY-MM-DDT14:10:26.113Z" format.'),
        (0, express_validator_1.body)("percentage")
            .isFloat({ min: 1, max: 70 })
            .withMessage("discount percentage must be a number between 1 and 70"),
        (0, express_validator_1.body)("title")
            .exists()
            .withMessage("title was not provided")
            .bail()
            .notEmpty()
            .withMessage("title cannot be empty")
            .bail()
            .isString()
            .withMessage("title must be a string"),
    ],
    updateDiscount: [
        (0, express_validator_1.body)("productId")
            .optional()
            .exists()
            .withMessage("product ID must be provided")
            .bail()
            .matches(/^[a-f\d]{24}$/i)
            .withMessage("ID is not in valid mongoDB format"),
        (0, express_validator_1.body)("startTime")
            .optional()
            .exists()
            .withMessage("startTime was not provided")
            .bail()
            .notEmpty()
            .withMessage("startTime cannot be empty"),
        (0, express_validator_1.body)("endTime")
            .optional()
            .exists()
            .withMessage("endTime was not provided")
            .bail()
            .notEmpty()
            .withMessage("endTime cannot be empty"),
        (0, express_validator_1.body)("percentage")
            .optional()
            .isFloat({ min: 1, max: 70 })
            .withMessage("discount percentage must be a number between 1 and 70"),
        (0, express_validator_1.body)("title")
            .optional()
            .exists()
            .withMessage("title was not provided")
            .bail()
            .notEmpty()
            .withMessage("title cannot be empty")
            .bail()
            .isString()
            .withMessage("title must be a string"),
    ],
    id: [
        (0, express_validator_1.param)("id")
            .exists()
            .withMessage("Discount ID must be provided")
            .bail()
            .matches(/^[a-f\d]{24}$/i)
            .withMessage("ID is not in valid mongoDB format"),
    ],
};
exports.discountValidator = discountValidator;
const serviceValidator = {
    addService: [
        (0, express_validator_1.body)("title")
            .exists()
            .withMessage("title was not provided")
            .bail()
            .notEmpty()
            .withMessage("title cannot be empty")
            .bail()
            .isString()
            .withMessage("title must be a string"),
        (0, express_validator_1.body)("subtitle")
            .exists()
            .withMessage("subtitle was not provided")
            .bail()
            .notEmpty()
            .withMessage("subtitle cannot be empty")
            .bail()
            .isString()
            .withMessage("subtitle must be a string"),
        (0, express_validator_1.body)("description")
            .exists()
            .withMessage("description was not provided")
            .bail()
            .notEmpty()
            .withMessage("description cannot be empty")
            .bail()
            .isString()
            .withMessage("description must be a string"),
        (0, express_validator_1.body)("price")
            .exists()
            .withMessage("price was not provided")
            .bail()
            .notEmpty()
            .withMessage("price cannot be empty")
            .bail()
            .isFloat({ min: 1, max: 100000 })
            .withMessage("Price must be a positive number"),
        (0, express_validator_1.body)("about")
            .exists()
            .withMessage("about was not provided")
            .bail()
            .notEmpty()
            .withMessage("about cannot be empty")
            .bail()
            .isString()
            .withMessage("about must be a string"),
        (0, express_validator_1.body)("category")
            .exists()
            .withMessage("category was not provided")
            .bail()
            .notEmpty()
            .withMessage("category cannot be empty")
            .bail()
            .isString()
            .withMessage("category must be a string"),
        (0, express_validator_1.body)("explainMembership")
            .exists()
            .withMessage("explainMembership was not provided"),
    ],
    updateService: [
        (0, express_validator_1.body)("title")
            .optional()
            .notEmpty()
            .withMessage("title is required")
            .bail()
            .isString()
            .withMessage("title must be a string"),
        (0, express_validator_1.body)("subtitle")
            .optional()
            .notEmpty()
            .withMessage("subtitle cannot be empty")
            .bail()
            .isString()
            .withMessage("subtitle must be a string"),
        (0, express_validator_1.body)("description")
            .optional()
            .notEmpty()
            .withMessage("description cannot be empty")
            .bail()
            .isString()
            .withMessage("description must be a string"),
        (0, express_validator_1.body)("price")
            .optional()
            .notEmpty()
            .withMessage("price cannot be empty")
            .bail()
            .isFloat({ min: 1, max: 10000 })
            .withMessage("Price must be a positive number"),
        (0, express_validator_1.body)("about")
            .optional()
            .notEmpty()
            .withMessage("about cannot be empty")
            .bail()
            .isString()
            .withMessage("about must be a string"),
        (0, express_validator_1.body)("category")
            .optional()
            .notEmpty()
            .withMessage("category cannot be empty")
            .bail()
            .isString()
            .withMessage("category must be a string"),
        (0, express_validator_1.body)("explainMembership")
            .optional()
            .notEmpty()
            .withMessage("explainMembership cannot be empty"),
    ],
    message: [
        (0, express_validator_1.body)("message")
            .exists()
            .withMessage("message was not provided")
            .bail()
            .notEmpty()
            .withMessage("message cannot be empty")
            .bail()
            .isString()
            .withMessage("message must be a string"),
    ],
    id: [
        (0, express_validator_1.param)("id")
            .exists()
            .withMessage("Service ID must be provided")
            .bail()
            .matches(/^[a-f\d]{24}$/i)
            .withMessage("ID is not in valid mongoDB format"),
    ],
};
exports.serviceValidator = serviceValidator;
