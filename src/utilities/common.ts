import { Document } from "mongoose";
const success = <T>(message: string, data: T | null = null) => {
  return {
    success: true,
    message: message,
    data: data,
  };
};

const failure = <T>(message: string, error: T | null = null) => {
  return {
    success: false,
    message: message,
    error: error,
  };
};

const generateRandomCode = (length: number) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1));
};

const sanitizeUser = (user: Document | any): any => {
  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  return userObj;
};

export { success, failure, generateRandomCode, sanitizeUser };
