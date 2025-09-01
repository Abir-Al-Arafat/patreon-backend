import { body, param } from "express-validator";
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
};

export default authValidator;
