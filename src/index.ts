import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/users.router";

const app = express();
dotenv.config();

const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRouter);

app.get("/", (req, res) => {
  res.send("Initial page");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
