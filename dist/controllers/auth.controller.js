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
exports.resetPassword = exports.verifyEmail = exports.verifyCode = exports.sendVerificationCodeToPhone = exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const twilio_1 = __importDefault(require("twilio"));
const common_1 = require("../utilities/common");
const user_model_1 = __importDefault(require("../models/user.model"));
const phone_model_1 = __importDefault(require("../models/phone.model"));
const statusCodes_1 = __importDefault(require("../constants/statusCodes"));
const email_config_1 = require("../config/email.config");
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
const sendVerificationCodeToPhone = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).send((0, common_1.success)("Phone number is required"));
        }
        const phoneNumberVerifyCode = (0, common_1.generateRandomCode)(6);
        const newPhone = yield phone_model_1.default.create({
            phoneNumber: phone,
            phoneNumberVerifyCode,
        });
        const message = yield client.messages.create({
            body: `Your verification code is ${phoneNumberVerifyCode}`,
            from: "+14176203785",
            to: phone,
        });
        yield newPhone.save();
        console.log("verification", message);
        return res.status(statusCodes_1.default.OK).send((0, common_1.success)("Verification code sent successfully", {
            message,
        }));
    }
    catch (err) {
        console.log(err);
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("INTERNAL SERVER ERROR"));
    }
});
exports.sendVerificationCodeToPhone = sendVerificationCodeToPhone;
const verifyCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phone, code } = req.body;
        if (!phone || !code) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Please provide phone number and code"));
        }
        const verificationCheck = yield phone_model_1.default.findOneAndUpdate({
            phoneNumber: phone,
            phoneNumberVerifyCode: Number(code),
        });
        if (verificationCheck) {
            return res
                .status(statusCodes_1.default.OK)
                .send((0, common_1.success)("Phone number verified successfully"));
        }
        else {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Invalid verification code"));
        }
    }
    catch (err) {
        console.log(err);
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send(`INTERNAL SERVER ERROR`);
    }
});
exports.verifyCode = verifyCode;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Please provide email and code"));
        }
        const user = yield user_model_1.default.findOne({ email });
        if (user && user.emailVerifyCode === code) {
            user.emailVerified = true;
            yield user.save();
            return res
                .status(statusCodes_1.default.OK)
                .send((0, common_1.success)("Email verified successfully"));
        }
        else {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Invalid verification code"));
        }
    }
    catch (err) {
        console.log(err);
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Internal server error"));
    }
});
exports.verifyEmail = verifyEmail;
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
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        console.log("req.body", req.body);
        if (!req.body.email || !req.body.password || !req.body.phone) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("please provide mail, password & phone number"));
        }
        const emailCheck = yield user_model_1.default.findOne({ email: req.body.email });
        const phoneCheck = yield phone_model_1.default.findOne({
            phoneNumber: req.body.phone,
        });
        if (!phoneCheck) {
            return res
                .status(statusCodes_1.default.UNPROCESSABLE_ENTITY)
                .send((0, common_1.failure)(`Phone number does not exist`));
        }
        if (!(phoneCheck === null || phoneCheck === void 0 ? void 0 : phoneCheck.phoneNumberVerified)) {
            return res
                .status(statusCodes_1.default.UNPROCESSABLE_ENTITY)
                .send((0, common_1.failure)(`Phone number is not verified, please verify`));
        }
        if (emailCheck && !emailCheck.emailVerified) {
            const emailVerifyCode = (0, common_1.generateRandomCode)(6);
            emailCheck.emailVerifyCode = emailVerifyCode;
            yield emailCheck.save();
            const emailData = {
                email: emailCheck.email,
                subject: "Account Activation Email",
                html: `
                        <div style="max-width: 500px; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center; font-family: Arial, sans-serif;">
        <h6 style="font-size: 16px; color: #333;">Hello, ${(emailCheck === null || emailCheck === void 0 ? void 0 : emailCheck.name) || "User"}</h6>
        <p style="font-size: 14px; color: #555;">Your email verification code is:</p>
        <div style="font-size: 24px; font-weight: bold; color: #d32f2f; background: #f8d7da; display: inline-block; padding: 10px 20px; border-radius: 5px; margin-top: 10px;">
          ${emailVerifyCode}
        </div>
        <p style="font-size: 14px; color: #555;">Please use this code to verify your email.</p>
      </div>
                        
                      `,
            };
            (0, email_config_1.emailWithNodemailerGmail)(emailData);
            return res
                .status(statusCodes_1.default.OK)
                .send((0, common_1.success)("Please verify your email"));
        }
        if (emailCheck) {
            return res
                .status(statusCodes_1.default.UNPROCESSABLE_ENTITY)
                .send((0, common_1.failure)(`User with email: ${req.body.email} already exists`));
        }
        const hashedPassword = yield bcryptjs_1.default.hash(req.body.password, 10);
        const emailVerifyCode = (0, common_1.generateRandomCode)(6);
        const newUser = yield user_model_1.default.create({
            name: req.body.name,
            email: req.body.email,
            username: req.body.username,
            roles: req.body.roles || "user",
            password: hashedPassword,
            emailVerifyCode,
            phone: phoneCheck._id,
        });
        const emailData = {
            email: req.body.email,
            subject: "Account Activation Email",
            html: `
                    <h6>Hello, ${(newUser === null || newUser === void 0 ? void 0 : newUser.name) || (newUser === null || newUser === void 0 ? void 0 : newUser.email) || "User"}</h6>
                    <p>Your email verification code is <h6>${emailVerifyCode}</h6> to verify your email</p>
                    
                  `,
        };
        (0, email_config_1.emailWithNodemailerGmail)(emailData);
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
        const token = jsonwebtoken_1.default.sign({
            _id: newUser._id,
            roles: newUser.roles,
        }, (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "default_secret", {
            expiresIn,
        });
        res.setHeader("Authorization", token);
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production" ? true : false,
            maxAge: expiresIn * 1000,
        });
        if (newUser) {
            return res
                .status(statusCodes_1.default.OK)
                .send((0, common_1.success)("Account created successfully ", { newUser, token }));
        }
        return res
            .status(statusCodes_1.default.BAD_REQUEST)
            .send((0, common_1.failure)("Account couldnt be created"));
    }
    catch (err) {
        console.log(err);
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send(`INTERNAL SERVER ERROR`);
    }
});
exports.signup = signup;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Please provide email and password"));
        }
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            return res
                .status(statusCodes_1.default.UNPROCESSABLE_ENTITY)
                .send((0, common_1.failure)("Invalid email or password"));
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res
                .status(statusCodes_1.default.UNPROCESSABLE_ENTITY)
                .send((0, common_1.failure)("Invalid email or password"));
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
        const token = jsonwebtoken_1.default.sign({
            _id: user._id,
            roles: user.roles,
        }, (_a = process.env.JWT_SECRET) !== null && _a !== void 0 ? _a : "default_secret", {
            expiresIn,
        });
        res.setHeader("Authorization", token);
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production" ? true : false,
            maxAge: expiresIn * 1000,
        });
        return res
            .status(statusCodes_1.default.OK)
            .send((0, common_1.success)("Login successful", { user, token }));
    }
    catch (err) {
        console.log(err);
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Internal server error"));
    }
});
exports.login = login;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phoneNumber, password, confirmPassword } = req.body;
        if (!phoneNumber || !password || !confirmPassword) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Please provide phone number, password and confirm password"));
        }
        if (password !== confirmPassword) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Password and confirm password do not match"));
        }
        const phone = yield phone_model_1.default.findOne({ phoneNumber });
        if (!phone) {
            return res
                .status(statusCodes_1.default.UNPROCESSABLE_ENTITY)
                .send((0, common_1.failure)("Invalid phone number"));
        }
        const user = yield user_model_1.default.findOne({ phone: phone._id });
        if (!user) {
            return res
                .status(statusCodes_1.default.UNPROCESSABLE_ENTITY)
                .send((0, common_1.failure)("No user found with this phone number"));
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        user.password = hashedPassword;
        yield user.save();
        const userData = (0, common_1.sanitizeUser)(user);
        return res
            .status(statusCodes_1.default.OK)
            .send((0, common_1.success)("Password reset successful", Object.assign({}, userData)));
    }
    catch (err) {
        console.log(err);
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Internal server error"));
    }
});
exports.resetPassword = resetPassword;
