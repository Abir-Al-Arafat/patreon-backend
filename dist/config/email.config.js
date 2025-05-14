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
exports.emailWithNodemailerGmail = exports.emailWithNodemailer = void 0;
// require("dotenv").config();
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const nodemailer_1 = __importDefault(require("nodemailer"));
let transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER, // generated ethereal user
        pass: process.env.EMAIL_PASS, // generated ethereal password
    },
});
let transporterGmail = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_HOST_USER, // generated ethereal user
        pass: process.env.EMAIL_HOST_PASS, // generated ethereal password
    },
});
const emailWithNodemailer = (emailData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM, // sender address
            to: emailData.email, // list of receivers
            subject: emailData.subject, // Subject line
            html: emailData.html, // html body
        };
        const info = yield transporter.sendMail(mailOptions);
        console.log("Email sent %s", info.response);
    }
    catch (error) {
        console.error("Error sending mail", error);
        throw error;
    }
});
exports.emailWithNodemailer = emailWithNodemailer;
const emailWithNodemailerGmail = (emailData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mailOptions = {
            from: process.env.EMAIL_HOST_USER, // sender address
            to: emailData.email, // list of receivers
            subject: emailData.subject, // Subject line
            html: emailData.html, // html body
        };
        const info = yield transporterGmail.sendMail(mailOptions);
        console.log("Email sent %s", info.response);
    }
    catch (error) {
        console.error("Error sending mail", error);
        throw error;
    }
});
exports.emailWithNodemailerGmail = emailWithNodemailerGmail;
