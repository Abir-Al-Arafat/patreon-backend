import express from "express";
import dotenv from "dotenv";
import path from "path";
import userRouter from "./routes/users.router";

const app = express();
dotenv.config();

const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
