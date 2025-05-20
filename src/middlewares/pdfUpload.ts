import { Request } from "express";
import multer from "multer";
import path from "path";

const pdfUpload = () => {
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

  return multer({ storage, fileFilter }).fields([
    { name: "pdfFiles", maxCount: 5 },
  ]);
};

export default pdfUpload;
