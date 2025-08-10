import userModel from "../models/user.model";
import { ObjectId } from "mongoose";

const getUserById = async (userId: ObjectId) => {
  const user = await userModel.findById(userId);
  return user;
};

export { getUserById };
