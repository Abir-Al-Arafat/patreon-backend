import { body, param } from "express-validator";
const contactUsValidator = {
  create: [
    body("title")
      .exists()
      .withMessage("title was not provided")
      .bail()
      .notEmpty()
      .withMessage("title cannot be empty")
      .bail()
      .isString()
      .withMessage("title must be a string"),
    body("description")
      .exists()
      .withMessage("description was not provided")
      .bail()
      .notEmpty()
      .withMessage("description cannot be empty")
      .bail()
      .isString()
      .withMessage("description must be a string"),
  ],
};

export default contactUsValidator;
