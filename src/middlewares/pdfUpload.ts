import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype === "application/pdf") {
      cb(null, path.join(__dirname, "../public/uploads/pdfs"));
    } else {
      cb(new Error("Only PDF files are allowed"), "");
    }
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, name);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: 5, // Limit to 5 files max
  },
});

export const pdfUpload = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.fields([{ name: "pdfFiles", maxCount: 5 }])(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.log("err.message", err.message);
        console.log("err.code", err.code);
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).send({
            success: false,
            message: "You are not allowed to upload more than 5 PDF files",
          });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).send({
            success: false,
            message: "You are not allowed to upload more than 5 PDF files",
          });
        }
        return res.status(400).send({
          success: false,
          message: err.message,
        });
      } else if (err instanceof Error) {
        return res.status(400).send({
          success: false,
          message: err.message, // Handles "Only PDF files are allowed"
        });
      }
      next();
    });
  };
};

export default pdfUpload;
