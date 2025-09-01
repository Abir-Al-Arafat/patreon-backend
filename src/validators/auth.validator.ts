import { body, param } from "express-validator";
import { resetPassword } from "../controllers/auth.controller";

const authValidator = {
  signup: [
    body("email")
      .exists()
      .withMessage("email was not provided")
      .bail()
      .notEmpty()
      .withMessage("email cannot be empty")
      .bail()
      .isString()
      .withMessage("email must be a string")
      .bail()
      .isEmail()
      .withMessage("email must be a valid email address"),
    body("password")
      .exists()
      .withMessage("password was not provided")
      .bail()
      .notEmpty()
      .withMessage("password cannot be empty")
      .bail()
      .isString()
      .withMessage("password must be a string"),
    body("username")
      .exists()
      .withMessage("username was not provided")
      .bail()
      .notEmpty()
      .withMessage("username cannot be empty")
      .bail()
      .isString()
      .withMessage("username must be a string"),
    body("name")
      .exists()
      .withMessage("name was not provided")
      .bail()
      .notEmpty()
      .withMessage("name cannot be empty")
      .bail()
      .isString()
      .withMessage("name must be a string"),
  ],

  login: [
    body("email")
      .exists()
      .withMessage("email was not provided")
      .bail()
      .notEmpty()
      .withMessage("email cannot be empty")
      .bail()
      .isString()
      .withMessage("email must be a string")
      .bail()
      .isEmail()
      .withMessage("email must be a valid email address"),
    body("password")
      .exists()
      .withMessage("password was not provided")
      .bail()
      .notEmpty()
      .withMessage("password cannot be empty")
      .bail()
      .isString()
      .withMessage("password must be a string"),
  ],

  sendCodeToEmail: [
    body("email")
      .exists()
      .withMessage("email was not provided")
      .bail()
      .notEmpty()
      .withMessage("email cannot be empty")
      .bail()
      .isString()
      .withMessage("email must be a string")
      .bail()
      .isEmail()
      .withMessage("email must be a valid email address"),
  ],

  verifyEmail: [
    body("email")
      .exists()
      .withMessage("email was not provided")
      .bail()
      .notEmpty()
      .withMessage("email cannot be empty")
      .bail()
      .isString()
      .withMessage("email must be a string")
      .bail()
      .isEmail()
      .withMessage("email must be a valid email address"),
    body("code")
      .exists()
      .withMessage("code was not provided")
      .bail()
      .notEmpty()
      .withMessage("code cannot be empty")
      .bail()
      .isString()
      .withMessage("code must be a string"),
  ],

  resetPassword: [
    body("email")
      .exists()
      .withMessage("email was not provided")
      .bail()
      .notEmpty()
      .withMessage("email cannot be empty")
      .bail()
      .isString()
      .withMessage("email must be a string")
      .bail()
      .isEmail()
      .withMessage("email must be a valid email address"),
    body("password")
      .exists()
      .withMessage("password was not provided")
      .bail()
      .notEmpty()
      .withMessage("password cannot be empty")
      .bail()
      .isString()
      .withMessage("password must be a string"),
    body("confirmPassword")
      .exists()
      .withMessage("confirmPassword was not provided")
      .bail()
      .notEmpty()
      .withMessage("confirmPassword cannot be empty")
      .bail()
      .isString()
      .withMessage("confirmPassword must be a string")
      .bail()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("password and confirmPassword do not match");
        }
        return true;
      }),
  ],
};

export default authValidator;
