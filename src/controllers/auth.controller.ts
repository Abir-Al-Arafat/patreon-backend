import { Request, Response } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import {
  success,
  failure,
  generateRandomCode,
  sanitizeUser,
} from "../utilities/common";
import { UserRequest } from "./users.controller";
import User from "../models/user.model";
import Phone from "../models/phone.model";
import Notification from "../models/notification.model";

import HTTP_STATUS from "../constants/statusCodes";
import { emailWithNodemailerGmail } from "../config/email.config";
import { CreateUserQueryParams } from "../types/query-params";

import { IUser } from "../interfaces/user.interface";

import {
  signupService,
  loginService,
  findUserByEmail,
  findUserByUsername,
} from "../services/auth.service";

import { getSignupEmailData } from "../utilities/emailData";

// const sendVerificationCodeToPhone = async (req: Request, res: Response) => {
//   try {
//     const client = twilio(
//       process.env.TWILIO_ACCOUNT_SID as string,
//       process.env.TWILIO_AUTH_TOKEN as string
//     );
//     const verifySid = process.env.TWILIO_VERIFY_SID as string;

//     const { phone } = req.body;

//     if (!phone) {
//       return res.status(400).send(success("Phone number is required"));
//     }

//     const verification = await client.verify.v2
//       .services(verifySid)
//       .verifications.create({ to: phone, channel: "sms" });

//     console.log("verification", verification);

//     return res.status(HTTP_STATUS.OK).send(
//       success("Verification code sent successfully", {
//         verification: { sid: verification.sid },
//       })
//     );
//   } catch (err) {
//     console.log(err);
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(failure("INTERNAL SERVER ERROR"));
//   }
// };
const sendVerificationCodeToPhone = async (req: Request, res: Response) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID as string,
      process.env.TWILIO_AUTH_TOKEN as string
    );

    console.log("client", client);

    const { phone } = req.body;

    if (!phone) {
      return res.status(400).send(success("Phone number is required"));
    }

    const phoneNumberVerifyCode = generateRandomCode(6);

    const phoneExists = await Phone.findOne({
      phoneNumber: phone,
    });
    let newPhone;
    if (!phoneExists) {
      newPhone = await Phone.create({
        phoneNumber: phone,
        phoneNumberVerifyCode,
      });
    }
    if (phoneExists) phoneExists.phoneNumberVerifyCode = phoneNumberVerifyCode;

    console.log("phoneExists", phoneExists);
    console.log("newPhone", newPhone);
    console.log("newPhone?.user", newPhone?.user);

    const message = await client.messages.create({
      body: `Your verification code is ${phoneNumberVerifyCode}`,
      from: "+14176203785",
      to: phone,
    });

    await newPhone?.save();
    await phoneExists?.save();

    return res.status(HTTP_STATUS.OK).send(
      success("Verification code sent successfully", {
        message,
      })
    );
  } catch (err: any) {
    console.log(err);

    if (err.status && err.code) {
      return res.status(err.status).send({
        success: false,
        message: "Twilio Error",
        error: {
          code: err.code,
          message: err.message,
          moreInfo: err.moreInfo || null,
        },
      });
    }
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("INTERNAL SERVER ERROR"));
  }
};

const sendVerificationCodeToEmail = async (req: Request, res: Response) => {
  try {
    const validation = validationResult(req).array();
    if (validation.length) {
      return res
        .status(HTTP_STATUS.OK)
        .send(failure("Failed to add the user", validation[0].msg));
    }
    const { email } = req.body;

    const emailVerifyCode = generateRandomCode(6);

    const user: any = await findUserByEmail(email);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }

    user.emailVerifyCode = emailVerifyCode;
    user.emailVerified = false;
    await user.save();

    const emailData = getSignupEmailData(
      user.email,
      user.name,
      emailVerifyCode
    );
    emailWithNodemailerGmail(emailData);

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Verification code sent successfully"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

// verify by phone
const verifyCode = async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide phone number and code"));
    }

    const phoneCheck = await Phone.findOne({
      phoneNumber: phone,
    });

    if (!phoneCheck) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("phone number does not exist"));
    }

    console.log("verificationCheck", phoneCheck);
    console.log("verificationCheck?.user", phoneCheck?.user);
    console.log("verificationCheck", phoneCheck);
    console.log(
      "verificationCheck.phoneNumberVerified",
      phoneCheck.phoneNumberVerified
    );
    console.log(
      "verificationCheck.phoneNumberVerified",
      phoneCheck.phoneNumberVerifyCode
    );

    if (phoneCheck.phoneNumberVerifyCode !== Number(code)) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Invalid verification code"));
    }

    phoneCheck.phoneNumberVerified = true;

    await phoneCheck.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Phone number verified successfully"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(`INTERNAL SERVER ERROR`);
  }
};

const verifyEmail = async (req: Request, res: Response) => {
  try {
    const validation = validationResult(req).array();
    if (validation.length) {
      return res
        .status(HTTP_STATUS.OK)
        .send(failure("Failed to add the user", validation[0].msg));
    }
    const { email, code } = req.body;

    if (!email || !code) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide email and code"));
    }

    const user = await findUserByEmail(email);

    if (user && user.emailVerifyCode === Number(code)) {
      user.emailVerified = true;
      await user.save();
      return res
        .status(HTTP_STATUS.OK)
        .send(success("Email verified successfully"));
    }
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .send(failure("Invalid verification code"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};
// const verifyCode = async (req: Request, res: Response) => {
//   try {
//     const client = twilio(
//       process.env.TWILIO_ACCOUNT_SID as string,
//       process.env.TWILIO_AUTH_TOKEN as string
//     );
//     const verifySid = process.env.TWILIO_VERIFY_SID as string;
//     const { phone, code } = req.body;

//     if (!phone || !code) {
//       return res
//         .status(HTTP_STATUS.BAD_REQUEST)
//         .send(failure("Please provide phone number and code"));
//     }

//     const verificationCheck = await client.verify.v2
//       .services(verifySid)
//       .verificationChecks.create({ to: phone, code });

//     console.log("verificationCheck", verificationCheck);

//     if (verificationCheck.status === "approved") {
//       return res
//         .status(HTTP_STATUS.OK)
//         .send(success("Phone number verified successfully"));
//     } else {
//       return res
//         .status(HTTP_STATUS.BAD_REQUEST)
//         .send(failure("Invalid verification code"));
//     }
//   } catch (err) {
//     console.log(err);
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(`INTERNAL SERVER ERROR`);
//   }
// };

const signup = async (req: Request, res: Response) => {
  try {
    const validation = validationResult(req).array();
    if (validation.length) {
      return res
        .status(HTTP_STATUS.OK)
        .send(failure("Failed to add the user", validation[0].msg));
    }

    // if (req.body.role === "admin") {
    //   return res
    //     .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
    //     .send(failure(`Admin cannot be signed up`));
    // }

    const emailCheck: any = await findUserByEmail(req.body.email);
    const userNameCheck: any = await findUserByUsername(req.body.username);
    // const phoneCheck = await Phone.findOne({
    //   phoneNumber: req.body.phone,
    // });
    // if (!phoneCheck) {
    //   return res
    //     .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
    //     .send(failure(`Phone number does not exist`));
    // }

    // if (!phoneCheck?.phoneNumberVerified) {
    //   console.log("phoneCheck", phoneCheck);
    //   console.log(
    //     "phoneCheck?.phoneNumberVerified",
    //     phoneCheck?.phoneNumberVerified
    //   );
    //   return res
    //     .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
    //     .send(failure(`Phone number is not verified, please verify`));
    // }

    // if (phoneCheck.user) {
    //   return res
    //     .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
    //     .send(failure(`Phone number is already registered`));
    // }

    if (emailCheck && !emailCheck.emailVerified) {
      const emailVerifyCode = generateRandomCode(6);
      emailCheck.emailVerifyCode = emailVerifyCode;
      await emailCheck.save();

      const emailData = getSignupEmailData(
        emailCheck.email,
        emailCheck.name,
        emailVerifyCode
      );
      emailWithNodemailerGmail(emailData);

      return res
        .status(HTTP_STATUS.OK)
        .send(failure("Please verify your email"));
    }

    if (emailCheck) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure(`${req.body.email} already exists`));
    }

    if (userNameCheck) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(
          failure(`User with username: ${req.body.username} already exists`)
        );
    }

    const emailVerifyCode = generateRandomCode(6);
    req.body.emailVerifyCode = emailVerifyCode;

    const newUser: any = await signupService(req.body);

    // phoneCheck.user = newUser._id;
    // await phoneCheck.save();

    const emailData = getSignupEmailData(
      newUser.email,
      newUser.name,
      emailVerifyCode
    );

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
        roles: newUser.roles,
      },
      process.env.JWT_SECRET ?? "default_secret",
      {
        expiresIn,
      }
    );
    res.setHeader("Authorization", token);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production" ? true : false,
      maxAge: expiresIn * 1000,
    });
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

const login = async (req: Request, res: Response) => {
  try {
    const validation = validationResult(req).array();
    if (validation.length) {
      return res
        .status(HTTP_STATUS.OK)
        .send(failure("Failed to add the user", validation[0].msg));
    }
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Invalid email or password"));
    }

    if (!user.emailVerified) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Email not verified"));
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Invalid email or password"));
    }

    const expiresIn = process.env.JWT_EXPIRES_IN
      ? parseInt(process.env.JWT_EXPIRES_IN, 10)
      : 3600; // default to 1 hour if not set

    // const token = jwt.sign(
    //   user.toObject(),
    //   process.env.JWT_SECRET ?? "default_secret",
    //   {
    //     expiresIn,
    //   }
    // );

    // payload, secret, JWT expiration
    const token = jwt.sign(
      {
        _id: user._id,
        roles: user.roles,
      },
      process.env.JWT_SECRET ?? "default_secret",
      {
        expiresIn,
      }
    );

    res.setHeader("Authorization", token);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production" ? true : false,
      maxAge: expiresIn * 1000,
    });

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Login successful", { user, token }));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token");
    return res.status(HTTP_STATUS.OK).send(success("Logout successful"));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

// const resetPassword = async (req: Request, res: Response) => {
//   try {
//     const { phoneNumber, password, confirmPassword } = req.body;

//     if (!phoneNumber || !password || !confirmPassword) {
//       return res
//         .status(HTTP_STATUS.BAD_REQUEST)
//         .send(
//           failure("Please provide phone number, password and confirm password")
//         );
//     }

//     if (password !== confirmPassword) {
//       return res
//         .status(HTTP_STATUS.BAD_REQUEST)
//         .send(failure("Password and confirm password do not match"));
//     }

//     const phone = await Phone.findOne({ phoneNumber });

//     if (!phone) {
//       return res
//         .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
//         .send(failure("Invalid phone number"));
//     }

//     const user = await User.findOne({ phone: phone._id });

//     if (!user) {
//       return res
//         .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
//         .send(failure("No user found with this phone number"));
//     }

//     // console.log(user);

//     console.log("password", password);
//     console.log("confirmPassword", confirmPassword);

//     const hashedPassword = await bcrypt.hash(password, 10);

//     user.password = hashedPassword;

//     await user.save();

//     const userData = sanitizeUser(user);

//     return res
//       .status(HTTP_STATUS.OK)
//       .send(success("Password reset successful", { ...userData }));
//   } catch (err) {
//     console.log(err);
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(failure("Internal server error"));
//   }
// };

const resetPassword = async (req: Request, res: Response) => {
  try {
    const validation = validationResult(req).array();
    if (validation.length) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Validation failed", validation[0].msg));
    }
    const { email, password, confirmPassword } = req.body;

    const user: any = await User.findOne({ email });

    if (!user) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Invalid email"));
    }

    if (!user.emailVerified) {
      return res
        .status(HTTP_STATUS.UNPROCESSABLE_ENTITY)
        .send(failure("Email not verified"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    await user.save();

    const userData = sanitizeUser(user);

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Password reset successful", { ...userData }));
  } catch (err) {
    console.log(err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Internal server error"));
  }
};

const verifyToken = (req: Request, res: Response) => {
  try {
    const user = (req as UserRequest).user;

    if (!user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Unauthorized access"));
    }

    return res.status(HTTP_STATUS.OK).send(success("Token is valid", { user }));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Token verification failed", error.message));
  }
};

export {
  signup,
  login,
  sendVerificationCodeToPhone,
  sendVerificationCodeToEmail,
  verifyCode,
  verifyEmail,
  resetPassword,
  verifyToken,
  logout,
};
