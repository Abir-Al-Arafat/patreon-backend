import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

const signupService = async (userData: any) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  // const randomNumber = Math.floor(1000 + Math.random() * 9000);
  // const username = `${userData.username}${randomNumber}`;

  return await User.create({
    name: userData.name,
    email: userData.email,
    username: userData.username,
    roles: userData.roles || "user",
    password: hashedPassword,
    emailVerifyCode: userData.emailVerifyCode,
  });
};

const loginService = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const expiresIn = process.env.JWT_EXPIRES_IN
    ? parseInt(process.env.JWT_EXPIRES_IN, 10)
    : 3600;

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

  return { user, token };
};

const findUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};

const findUserByUsername = async (username: string) => {
  return await User.findOne({ username });
};

export { signupService, loginService, findUserByEmail, findUserByUsername };
