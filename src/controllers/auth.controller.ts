import { Request, Response } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { success, failure, generateRandomCode } from "../utilities/common";
import User from "../models/user.model";
import Notification from "../models/notification.model";

import HTTP_STATUS from "../constants/statusCodes";
import { emailWithNodemailerGmail } from "../config/email.config";
import { CreateUserQueryParams } from "../types/query-params";

import { IUser } from "../interfaces/user.interface";

const signup = async (req: Request, res: Response) => {
  try {
    // const validation = validationResult(req).array();
    // console.log(validation);
    // if (validation.length > 0) {
    //   return res
    //     .status(HTTP_STATUS.OK)
    //     .send(failure("Failed to add the user", validation[0].msg));
    // }

    // if (req.body.role === "admin") {
    //   return res
    //     .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
    //     .send(failure(`Admin cannot be signed up`));
    // }

    if (!req.body.email || !req.body.password) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("please provide mail and password"));
    }

    const emailCheck = await User.findOne({ email: req.body.email });

    if (emailCheck && !emailCheck.emailVerified) {
      const emailVerifyCode = generateRandomCode(4); //4 digits
      emailCheck.emailVerifyCode = emailVerifyCode;
      await emailCheck.save();

      const emailData = {
        email: emailCheck.email,
        subject: "Account Activation Email",
        html: `
                        <div style="max-width: 500px; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center; font-family: Arial, sans-serif;">
        <h6 style="font-size: 16px; color: #333;">Hello, ${
          emailCheck?.name || "User"
        }</h6>
        <p style="font-size: 14px; color: #555;">Your email verification code is:</p>
        <div style="font-size: 24px; font-weight: bold; color: #d32f2f; background: #f8d7da; display: inline-block; padding: 10px 20px; border-radius: 5px; margin-top: 10px;">
          ${emailVerifyCode}
        </div>
        <p style="font-size: 14px; color: #555;">Please use this code to verify your email.</p>
      </div>
                        
                      `,
      };
      emailWithNodemailerGmail(emailData);

      return res
        .status(HTTP_STATUS.OK)
        .send(success("Please verify your email"));
    }

    if (emailCheck) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`User with email: ${req.body.email} already exists`));
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const emailVerifyCode = generateRandomCode(4); //4 digits

    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      role: req.body.role || "user",
      password: hashedPassword,
      emailVerifyCode,
    });

    const emailData = {
      email: req.body.email,
      subject: "Account Activation Email",
      html: `
                    <h6>Hello, ${newUser?.name || newUser?.email || "User"}</h6>
                    <p>Your email verification code is <h6>${emailVerifyCode}</h6> to verify your email</p>
                    
                  `,
    };

    emailWithNodemailerGmail(emailData);

    const expiresIn = process.env.JWT_EXPIRES_IN
      ? parseInt(process.env.JWT_EXPIRES_IN, 10)
      : 3600; // default to 1 hour if not set

    // const token = jwt.sign(
    //   newUser.toObject(),
    //   process.env.JWT_SECRET ?? "default_secret",
    //   {
    //     expiresIn,
    //   }
    // );

    // payload, secret, JWT expiration
    const token = jwt.sign(
      {
        _id: newUser._id,
        role: newUser.roles,
      },
      process.env.JWT_SECRET ?? "default_secret",
      {
        expiresIn,
      }
    );
    res.setHeader("Authorization", token);
    if (newUser) {
      return res
        .status(HTTP_STATUS.OK)
        .send(success("Account created successfully ", { newUser, token }));
    }
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Account couldnt be created"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(`INTERNAL SERVER ERROR`);
  }
};

export { signup };
