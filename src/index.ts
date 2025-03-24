import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import { Request, Response, NextFunction } from "express";
import userRouter from "./routes/users.router";

const app = express();
dotenv.config();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json()); // Parses data as JSON
app.use(express.text()); // Parses data as text
app.use(express.urlencoded({ extended: true })); // Parses data as URL-encoded
// ✅ Handle Invalid JSON Errors
app.use(
  (
    err: SyntaxError & { status?: number; body?: any },
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).send({ message: "Invalid JSON format" });
    }
    next();
  }
);

app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/api/users", userRouter);

app.get("/", (req, res) => {
  return res.status(200).send({
    name: "Patreon",
    developer: "Abir",
    version: "1.0.0",
    description: "Backend server for Patreon",
    status: "success",
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
