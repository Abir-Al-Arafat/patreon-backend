"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const configureFileUpload = () => {
    const storage = multer_1.default.diskStorage({
        destination: function (req, file, cb) {
            if (file.mimetype.startsWith("image/")) {
                cb(null, path_1.default.join(__dirname, "../public/uploads/images"));
            }
            else if (file.mimetype.startsWith("video/")) {
                cb(null, path_1.default.join(__dirname, "../public/uploads/videos"));
            }
            else if (file.mimetype.startsWith("audio/")) {
                cb(null, path_1.default.join(__dirname, "../public/uploads/audios"));
            }
            else if (file.mimetype === "application/pdf") {
                cb(null, path_1.default.join(__dirname, "../public/uploads/pdfs"));
            }
            else {
                cb(new Error("Invalid file type"), "");
            }
        },
        filename: function (req, file, cb) {
            const name = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
            cb(null, name);
        },
    });
    const fileFilter = (req, file, cb) => {
        const allowedFieldnames = [
            "productImage",
            "image",
            "categoryImage",
            "videoFile",
            "audioFile",
            "pdfFiles",
            "previewPdfFiles",
            "icon",
        ];
        if (file.fieldname === undefined) {
            // Allow requests without any files
            cb(null, true);
        }
        else if (allowedFieldnames.includes(file.fieldname)) {
            if ((file.mimetype.startsWith("image/") && file.fieldname !== "icon") ||
                file.mimetype.startsWith("video/") ||
                file.mimetype.startsWith("audio/") ||
                file.mimetype === "application/pdf") {
                cb(null, true);
            }
            else if (file.fieldname === "icon" &&
                file.mimetype.startsWith("image/")) {
                cb(null, true);
            }
            else {
                cb(new Error("Invalid file type"));
            }
        }
        else {
            cb(new Error("Invalid fieldname"));
        }
    };
    const upload = (0, multer_1.default)({
        storage: storage,
        fileFilter: fileFilter,
    }).fields([
        { name: "productImage", maxCount: 10 },
        { name: "image", maxCount: 1 },
        { name: "categoryImage", maxCount: 1 },
        { name: "videoFile", maxCount: 1 },
        { name: "audioFile", maxCount: 1 },
        { name: "pdfFiles", maxCount: 5 },
        { name: "previewPdfFiles", maxCount: 3 },
        { name: "icon", maxCount: 1 }, // ✅ Added icon field
    ]);
    return upload;
};
exports.default = configureFileUpload;
