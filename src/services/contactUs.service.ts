import contactUsModel from "../models/contactUs.model";
import { ObjectId } from "mongoose";
import IContactUs from "../interfaces/contactUs.interface";

const createContactUs = async (data: IContactUs) => {
  const contactUs = await contactUsModel.create(data);
  return contactUs;
};

const getAllContactUsService = async () => {
  const contactUs = await contactUsModel.find({});
  return contactUs;
};

const getContactUsById = async (id: ObjectId) => {
  const contactUs = await contactUsModel.findById(id);
  return contactUs;
};

const deleteContactUsById = async (id: ObjectId) => {
  const contactUs = await contactUsModel.deleteOne({ _id: id });
  return contactUs;
};

export {
  createContactUs,
  getContactUsById,
  getAllContactUsService,
  deleteContactUsById,
};
