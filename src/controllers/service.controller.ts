import fs from "fs";
import pdfParse from "pdf-parse";
import { Request, Response } from "express";
import { validationResult } from "express-validator";
import openai from "../config/openaids.config";
import { success, failure } from "../utilities/common";
import { TUploadFields } from "../types/upload-fields";
import HTTP_STATUS from "../constants/statusCodes";
import Service from "../models/service.model";
import User from "../models/user.model";
import Nootification from "../models/notification.model";
import Category from "../models/category.model";
import serviceResponseModel from "../models/serviceResponse.model";
import { servicePrompt } from "../constants/prompts";
import { UserRequest } from "./users.controller";
import { parseStringPromise } from "xml2js";

const addService = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to become a contributor"));
    }
    const user = await User.findById((req as UserRequest).user._id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }
    // console.log("user.subscriptions", user.subscriptions);
    // console.log("user.subscriptions.length", user.subscriptions.length);
    // if (user.subscriptions.length) {
    //   return res
    //     .status(HTTP_STATUS.OK)
    //     .send(failure("You are already a contributor"));
    // }
    const validation = validationResult(req).array();
    if (validation.length > 0) {
      return res
        .status(HTTP_STATUS.OK)
        .send(failure(validation[0].msg, "Failed to add service"));
    }

    let {
      title,
      subtitle,
      description,
      // prompt,
      price,
      about,
      category,
      explainMembership,
    } = req.body;

    // console.log("req.body", req.body);

    if (typeof explainMembership === "string") {
      explainMembership = JSON.parse(explainMembership);
    }

    const newService = new Service({
      title,
      subtitle,
      description,
      price,
      about,
      category,
      explainMembership,
      contributor: (req as UserRequest).user._id,
      status: "approved",
    });

    // console.log("newService", newService);

    if (!newService) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Service could not be added"));
    }

    const documentPaths: string[] = [];
    const files = req.files as TUploadFields;

    let extractedText = "";

    if (files?.pdfFiles) {
      // files.pdfFiles.forEach((file: Express.Multer.File) => {
      //   documentPaths.push(file.path);
      // });
      // newService.files = documentPaths;

      for (const file of files.pdfFiles) {
        if (file.mimetype !== "application/pdf") {
          return res.status(400).send(failure("only pdf files are allowed"));
        }
        documentPaths.push(file.path);

        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(dataBuffer);
        extractedText += pdfData.text + "\n"; // Append text from each file
        // console.log("dataBuffer", dataBuffer);
        // console.log("pdfData", pdfData);
        // console.log("extractedText", extractedText);
      }

      newService.files = documentPaths;
    }
    let combinedDescription: string = description ? description : "";
    if (extractedText) {
      combinedDescription += `${extractedText}`;
    }

    newService.description = combinedDescription;

    // Handle icon upload
    let iconPath: string | undefined = undefined;
    if (files?.icon && files.icon.length > 0) {
      const iconFile = files.icon[0];
      // console.log("iconFile", iconFile);

      if (!iconFile.mimetype.startsWith("image/")) {
        return res.status(400).send(failure("Icon must be an image file"));
      }

      // 1. SVG only
      if (iconFile.mimetype !== "image/svg+xml") {
        return res.status(400).send(failure("Icon must be an SVG file"));
      }
      // 2. Max 2KB
      if (iconFile.size > 2048) {
        return res.status(400).send(failure("Icon SVG must be less than 2KB"));
      }

      // 3. Check SVG width and height
      const svgContent = fs.readFileSync(iconFile.path, "utf8");

      try {
        const svgObj = await parseStringPromise(svgContent, {
          explicitArray: false,
        });
        const svgTag = svgObj.svg;
        const width = parseInt(svgTag.$.width, 10);
        const height = parseInt(svgTag.$.height, 10);

        if (width !== 20 || height !== 20) {
          return res
            .status(400)
            .send(failure("Icon SVG must be exactly 20x20 pixels"));
        }
      } catch (e) {
        return res.status(400).send(failure("Invalid SVG file"));
      }
      iconPath = iconFile.path;
    }

    newService.icon = iconPath;
    await newService.save();

    // if (category || iconPath) {
    //   // Check if category exists
    //   const existingCategory = await Category.findOne({ name: category });
    //   if (!existingCategory) {
    //     const newCategory = new Category({ name: category, image: iconPath });
    //     await newCategory.save();
    //   }
    // }
    // const user = await User.findById((req as UserRequest).user._id);

    user.services.push(newService._id);
    await user.save();
    const admin = await User.findOne({ roles: "admin" });
    const notification = new Nootification({
      message: `New service has been created: ${newService.title}.`,
      admin: admin && admin._id,
      type: "service",
      serviceId: newService._id, // service id
      contributor: user._id,
    });

    if (!notification) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Error creating notification"));
    }
    await notification.save();

    admin && admin.notifications.push(notification._id);
    admin && (await admin.save());
    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("Service added successfully", newService));
  } catch (err: any) {
    console.log("err", err);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error adding service", err.message));
  }
};

const addFileToService = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    const files = req.files as TUploadFields;
    if (!files?.pdfFiles) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide pdf files"));
    }
    const documentPaths: string[] = [];
    files.pdfFiles.forEach((file: Express.Multer.File) => {
      documentPaths.push(file.path);
    });
    service.files = [...service.files, ...documentPaths];

    let extractedText = "";
    for (const file of files.pdfFiles) {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      extractedText += pdfData.text + "\n"; // Append text from each file
      // console.log("dataBuffer", dataBuffer);
      // console.log("pdfData", pdfData);
      // console.log("extractedText", extractedText);
    }

    let combinedDescription: string = service.description
      ? service.description
      : "";

    if (extractedText) {
      combinedDescription += `${extractedText}`;
      service.description = combinedDescription;
    }

    await service.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Files added successfully", service));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error adding files", error.message));
  }
};

const removeFileFromService = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    const { filePath } = req.body;

    if (!filePath) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide file path"));
    }
    const fileIndex = service.files.indexOf(filePath);

    if (fileIndex === -1) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("File not found in service"));
    }
    fs.unlinkSync(filePath);
    service.files.splice(fileIndex, 1);
    await service.save();
    return res
      .status(HTTP_STATUS.OK)
      .send(success("File removed successfully", service));
  } catch (error: any) {
    console.log("error", error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error removing file", error.message));
  }
};

const updateServiceById = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }

    const validation = validationResult(req).array();
    // console.log(validation);
    if (validation.length > 0) {
      return res
        .status(HTTP_STATUS.OK)
        .send(failure("Failed to update the service", validation[0].msg));
    }

    let { explainMembership } = req.body;
    if (typeof explainMembership === "string") {
      explainMembership = JSON.parse(explainMembership);
    }
    req.body.explainMembership = explainMembership;

    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully updated service", service));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure(error.message));
  }
};

const getAllServices = async (req: Request, res: Response) => {
  try {
    let page =
      typeof req.query.page === "string" ? parseInt(req.query.page) || 1 : 1;
    let limit =
      typeof req.query.limit === "string"
        ? parseInt(req.query.limit ?? "10")
        : 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const skip = (page - 1) * limit;

    let query: any = {};

    if (typeof req.query.title === "string") {
      query.title = {
        $regex: new RegExp(req.query.title, "i"),
      };
    }

    if (typeof req.query.category === "string") {
      query.category = new RegExp(`^${req.query.category}$`, "i");
    }

    // console.log("query", query);

    if ((req as UserRequest).user?._id) {
      const user = await User.findById((req as UserRequest).user._id).select(
        "services"
      );
      if (user) {
        query._id = { $nin: user.services };
      }
      // console.log("user", user);
    }

    const services = await Service.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate({
        path: "contributor",
        select: "image",
      });
    // console.log("services", services);
    const count = await Service.countDocuments(query);
    if (!services.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Services not found"));
    }
    return res.status(HTTP_STATUS.OK).send(
      success("Successfully received all services", {
        result: services,
        count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      })
    );
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching services", error.message));
  }
};

const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find();
    if (!categories.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Categories not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received all categories", categories));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching categories", error.message));
  }
};

const getServiceById = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Service.findById(req.params.id).populate("prompt");
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received service", service));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching service", error.message));
  }
};

const getServiceByContributor = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to become a contributor"));
    }
    const service = await Service.find({
      contributor: (req as UserRequest).user._id,
    });

    if (!service.length) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received service", service));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching service", error.message));
  }
};

const deleteServiceById = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }

    const user = await User.findById(service.contributor);
    if (user) {
      user.services = user.services.filter(
        (id: any) => id.toString() !== service._id.toString()
      );
      await user.save();
    }

    const paths = service.files;
    for (const path of paths) {
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully deleted service", service));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error deleting service", error.message));
  }
};

const generateReplyForService = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login "));
    }
    if (!req.params.serviceId) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Service.findById(req.params.serviceId);
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
    }
    if (!service.description) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Service description not found or invalid"));
    }
    const { message } = req.body;
    const validation = validationResult(req).array();
    // console.log(validation);
    if (validation.length > 0) {
      return res
        .status(HTTP_STATUS.OK)
        .send(failure("Failed to send message", validation[0].msg));
    }
    if (!message) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide message"));
    }

    // const promptText = prompt
    //   .map((p) => `${p.question} - ${p.answer}`)
    //   .join("\n");
    const reply = await openai.chat.completions.create({
      // model: "deepseek/deepseek-r1:free",
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `${servicePrompt} ${service.description}`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.9, // optional but good
    });

    const answer = reply.choices[0].message.content;

    const createServiceResponse = await serviceResponseModel.create({
      user: (req as UserRequest).user._id,
      service: service._id,
      question: message,
      answer,
    });

    if (!createServiceResponse) {
      console.error("Error creating service response");
    }

    return res
      .status(HTTP_STATUS.OK)
      .send(
        success("Successfully sent reply", reply.choices[0].message.content)
      );
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error sending reply", error.message));
  }
};

const getRepliesForService = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to access your messages"));
    }
    if (!req.params.serviceId) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Please provide service id"));
    }
    const replies = await serviceResponseModel
      .find({
        service: req.params.serviceId,
        user: (req as UserRequest).user._id,
      })
      .sort({ createdAt: -1 });

    return res.status(HTTP_STATUS.OK).send(success("Replies fetched", replies));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching replies", error.message));
  }
};
// all services user has messaged
const getAllServiceMessagesByUser = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to access your messages"));
    }

    const serviceResponses = await serviceResponseModel
      .find({
        user: (req as UserRequest).user._id,
      })
      .populate("user", "name image")
      .populate("service", "title")
      .sort({ createdAt: -1 });

    // console.log("serviceResponses", serviceResponses);

    // Filter to only include one response per unique service._id
    const uniqueResponses: any[] = [];
    const seenServiceIds = new Set();

    for (const resp of serviceResponses) {
      const serviceId =
        resp.service && resp.service._id ? resp.service._id.toString() : null;
      if (serviceId && !seenServiceIds.has(serviceId)) {
        uniqueResponses.push(resp);
        seenServiceIds.add(serviceId);
      }
    }

    // console.log("serviceResponses (distinct)", uniqueResponses);

    // Search by service title if provided
    let filteredResponses = uniqueResponses;
    if (typeof req.query.title === "string" && req.query.title.trim() !== "") {
      const searchTitle = req.query.title.trim().toLowerCase();
      filteredResponses = uniqueResponses.filter(
        (resp) =>
          resp.service &&
          resp.service.title &&
          resp.service.title.toLowerCase().includes(searchTitle)
      );
    }

    return res.status(HTTP_STATUS.OK).send({
      success: true,
      message: "Messages fetched",
      serviceResponses: filteredResponses,
    });
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching messages", error.message));
  }
};

const getRepliesByUser = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to access your replies"));
    }
    const replies = await serviceResponseModel
      .find({
        user: (req as UserRequest).user._id,
      })
      .populate("user", "name image")
      .sort({ createdAt: -1 });

    return res.status(HTTP_STATUS.OK).send(success("Replies fetched", replies));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching replies", error.message));
  }
};

const subscribedServices = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user || !(req as UserRequest).user._id) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to access your subscribed services"));
    }
    const user = await User.findById((req as UserRequest).user._id).populate({
      path: "subscriptions",
      select: "title description price icon category",
      populate: {
        path: "contributor",
        select: "name username image",
      },
    });

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).send(failure("User not found"));
    }
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Subscribed services", user.subscriptions));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching subscribed services", error.message));
  }
};

export {
  addService,
  addFileToService,
  removeFileFromService,
  getAllServices,
  getAllCategories,
  getServiceById,
  getServiceByContributor,
  updateServiceById,
  deleteServiceById,
  generateReplyForService,
  getRepliesForService,
  getRepliesByUser,
  getAllServiceMessagesByUser,
  subscribedServices,
};
