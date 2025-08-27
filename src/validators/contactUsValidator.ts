import { body, param } from "express-validator";
const contactUsValidator = {
  create: [
    body("title")
      .exists()
      .withMessage("title was not provided")
      .bail()
      .isString()
      .withMessage("title must be a string"),
    body("description")
      .exists()
      .withMessage("description was not provided")
      .bail()
      .isString()
      .withMessage("description must be a string"),
  ],
};

export default contactUsValidator;
