import { Request, Response } from "express";
import { success, failure } from "../utilities/common";
import { TUploadFields } from "../types/upload-fields";
import HTTP_STATUS from "../constants/statusCodes";
import Service from "../models/service.model";
import User from "../models/user.model";
import Nootification from "../models/notification.model";
import { UserRequest } from "./users.controller";

const addService = async (req: Request, res: Response) => {
  try {
    if (!(req as UserRequest).user) {
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .send(failure("Please login to become a contributor"));
    }
    const { title, prompt, price, about, category, explainMembership } =
      req.body;

    const newService = new Service({
      title,
      prompt,
      price,
      about,
      category,
      explainMembership,
      contributor: (req as UserRequest).user._id,
      status: "approved",
    });

    if (!newService) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .send(failure("Service could not be added"));
    }

    const documentPaths: string[] = [];
    const files = req.files as TUploadFields;
    if (files?.pdfFiles) {
      files.pdfFiles.forEach((file: Express.Multer.File) => {
        documentPaths.push(file.path);
      });
      newService.files = documentPaths;
    }

    console.log("documentPaths", documentPaths);

    await newService.save();
    const admin = await User.findOne({ roles: "admin" });
    const notification = new Nootification({
      message: `New service has been created: ${newService.title}.`,
      admin: admin && admin._id,
      type: "service",
      serviceId: newService._id, // service id
    });

    if (!notification) {
      return res.status(HTTP_STATUS.BAD_REQUEST).send(failure("Error"));
    }
    await notification.save();

    admin && admin.notifications.push(notification._id);
    admin && (await admin.save());
    return res
      .status(HTTP_STATUS.CREATED)
      .send(success("Service added successfully", newService));
  } catch (err: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error adding service", err.message));
  }
};

const updateServiceById = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
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

    let query = { isDeleted: false };

    const services = await Service.find(query)

      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const count = await Service.countDocuments(query);

    if (!services) {
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

const getServiceById = async (req: Request, res: Response) => {
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
    return res
      .status(HTTP_STATUS.OK)
      .send(success("Successfully received service", service));
  } catch (error: any) {
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .send(failure("Error fetching service", error.message));
  }
};

const getServiceByDoctorId = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide doctor id"));
    }
    const service = await Service.find({ doctor: req.params.id });
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

const deleteServiceById = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Please provide service id"));
    }
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!service) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .send(failure("Service not found"));
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

// const disableServiceById = async (req, res) => {
//   try {
//     if (!req.params.id) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Please provide service id"));
//     }
//     const service = await Service.findByIdAndUpdate(
//       req.params.id,
//       { isDisabled: true },
//       { new: true }
//     );
//     if (!service) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Service not found"));
//     }
//     return res
//       .status(HTTP_STATUS.OK)
//       .send(success("Successfully disabled service", service));
//   } catch (error) {
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(failure("Error disabling service", error.message));
//   }
// };

// const enableServiceById = async (req, res) => {
//   try {
//     if (!req.params.id) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Please provide service id"));
//     }
//     const service = await Service.findByIdAndUpdate(
//       req.params.id,
//       { isDisabled: false },
//       { new: true }
//     );
//     if (!service) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Service not found"));
//     }
//     return res
//       .status(HTTP_STATUS.OK)
//       .send(success("Successfully enabled service", service));
//   } catch (error) {
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(failure("Error enabling service", error.message));
//   }
// };

// const approveServiceById = async (req, res) => {
//   try {
//     if (!req.params.id) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Please provide service id"));
//     }
//     const service = await Service.findByIdAndUpdate(
//       req.params.id,
//       { status: "approved" },
//       { new: true }
//     );
//     if (!service) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Service not found"));
//     }
//     return res
//       .status(HTTP_STATUS.OK)
//       .send(success("Successfully approved service", service));
//   } catch (error) {
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(failure("Error approving service", error.message));
//   }
// };

// const cancelServiceById = async (req, res) => {
//   try {
//     if (!req.params.id) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Please provide service id"));
//     }
//     const service = await Service.findByIdAndUpdate(
//       req.params.id,
//       { status: "cancelled" },
//       { new: true }
//     );
//     if (!service) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Service not found"));
//     }
//     return res
//       .status(HTTP_STATUS.OK)
//       .send(success("Successfully approved service", service));
//   } catch (error) {
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(failure("Error approving service", error.message));
//   }
// };

export {
  addService,
  getAllServices,
  getServiceById,
  getServiceByDoctorId,
  updateServiceById,
  deleteServiceById,
  // disableServiceById,
  // enableServiceById,
  // approveServiceById,
  // cancelServiceById,
};
