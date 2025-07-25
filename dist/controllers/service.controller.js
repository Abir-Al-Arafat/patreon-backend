"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepliesByUser = exports.getRepliesForService = exports.generateReplyForService = exports.deleteServiceById = exports.updateServiceById = exports.getServiceByContributor = exports.getServiceById = exports.getAllCategories = exports.getAllServices = exports.removeFileFromService = exports.addFileToService = exports.addService = void 0;
const fs_1 = __importDefault(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const express_validator_1 = require("express-validator");
const openaids_config_1 = __importDefault(require("../config/openaids.config"));
const common_1 = require("../utilities/common");
const statusCodes_1 = __importDefault(require("../constants/statusCodes"));
const service_model_1 = __importDefault(require("../models/service.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const category_model_1 = __importDefault(require("../models/category.model"));
const serviceResponse_model_1 = __importDefault(require("../models/serviceResponse.model"));
const xml2js_1 = require("xml2js");
const prompt = [
    {
        question: "What areas of law do you work in?",
        answer: "I help with family law and small business legal matters.",
    },
    {
        question: "How would you describe your style?",
        answer: "I’m friendly, easy to talk to, and always clear.",
    },
    {
        question: "What should I expect if I work with you?",
        answer: "Open communication, real support, and honest advice.",
    },
    {
        question: "How do you communicate with clients?",
        answer: "Phone, email, or text — whatever works best for you!",
    },
    {
        question: "Do you offer free consultations?",
        answer: "Yes, the first consultation is free!",
    },
    {
        question: "What makes you different from other lawyers?",
        answer: "I truly listen, stay available, and treat every case personally.",
    },
    {
        question: "How long does a typical case take?",
        answer: "It depends, but I always move things forward quickly and carefully.",
    },
    {
        question: "What are your fees like?",
        answer: "I’m upfront about all costs — no surprises.",
    },
    {
        question: "Why did you become a lawyer?",
        answer: "I love helping people through important moments in life.",
    },
];
const addService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Please login to become a contributor"));
        }
        const validation = (0, express_validator_1.validationResult)(req).array();
        console.log(validation);
        if (validation.length > 0) {
            return res
                .status(statusCodes_1.default.OK)
                .send((0, common_1.failure)(validation[0].msg, "Failed to add service"));
        }
        let { title, subtitle, description, 
        // prompt,
        price, about, category, explainMembership, } = req.body;
        console.log("req.body", req.body);
        if (typeof explainMembership === "string") {
            explainMembership = JSON.parse(explainMembership);
        }
        const newService = new service_model_1.default({
            title,
            subtitle,
            description,
            price,
            about,
            category,
            explainMembership,
            contributor: req.user._id,
            status: "approved",
        });
        console.log("newService", newService);
        if (!newService) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Service could not be added"));
        }
        const documentPaths = [];
        const files = req.files;
        let extractedText = "";
        if (files === null || files === void 0 ? void 0 : files.pdfFiles) {
            // files.pdfFiles.forEach((file: Express.Multer.File) => {
            //   documentPaths.push(file.path);
            // });
            // newService.files = documentPaths;
            for (const file of files.pdfFiles) {
                if (file.mimetype !== "application/pdf") {
                    return res.status(400).send((0, common_1.failure)("only pdf files are allowed"));
                }
                documentPaths.push(file.path);
                const dataBuffer = fs_1.default.readFileSync(file.path);
                const pdfData = yield (0, pdf_parse_1.default)(dataBuffer);
                extractedText += pdfData.text + "\n"; // Append text from each file
                console.log("dataBuffer", dataBuffer);
                console.log("pdfData", pdfData);
                console.log("extractedText", extractedText);
            }
            newService.files = documentPaths;
        }
        let combinedDescription = description ? description : "";
        if (extractedText) {
            combinedDescription += `${extractedText}`;
        }
        newService.description = combinedDescription;
        // Handle icon upload
        let iconPath = undefined;
        if ((files === null || files === void 0 ? void 0 : files.icon) && files.icon.length > 0) {
            const iconFile = files.icon[0];
            console.log("iconFile", iconFile);
            if (!iconFile.mimetype.startsWith("image/")) {
                return res.status(400).send((0, common_1.failure)("Icon must be an image file"));
            }
            // 1. SVG only
            if (iconFile.mimetype !== "image/svg+xml") {
                return res.status(400).send((0, common_1.failure)("Icon must be an SVG file"));
            }
            // 2. Max 2KB
            if (iconFile.size > 2048) {
                return res.status(400).send((0, common_1.failure)("Icon SVG must be less than 2KB"));
            }
            // 3. Check SVG width and height
            const svgContent = fs_1.default.readFileSync(iconFile.path, "utf8");
            try {
                const svgObj = yield (0, xml2js_1.parseStringPromise)(svgContent, {
                    explicitArray: false,
                });
                const svgTag = svgObj.svg;
                const width = parseInt(svgTag.$.width, 10);
                const height = parseInt(svgTag.$.height, 10);
                if (width !== 20 || height !== 20) {
                    return res
                        .status(400)
                        .send((0, common_1.failure)("Icon SVG must be exactly 20x20 pixels"));
                }
            }
            catch (e) {
                return res.status(400).send((0, common_1.failure)("Invalid SVG file"));
            }
            iconPath = iconFile.path;
        }
        newService.icon = iconPath;
        yield newService.save();
        if (category || iconPath) {
            // Check if category exists
            const existingCategory = yield category_model_1.default.findOne({ name: category });
            if (!existingCategory) {
                const newCategory = new category_model_1.default({ name: category, image: iconPath });
                yield newCategory.save();
            }
        }
        const user = yield user_model_1.default.findById(req.user._id);
        if (!user) {
            return res.status(statusCodes_1.default.NOT_FOUND).send((0, common_1.failure)("User not found"));
        }
        user.services.push(newService._id);
        yield user.save();
        const admin = yield user_model_1.default.findOne({ roles: "admin" });
        const notification = new notification_model_1.default({
            message: `New service has been created: ${newService.title}.`,
            admin: admin && admin._id,
            type: "service",
            serviceId: newService._id, // service id
        });
        if (!notification) {
            return res.status(statusCodes_1.default.BAD_REQUEST).send((0, common_1.failure)("Error"));
        }
        yield notification.save();
        admin && admin.notifications.push(notification._id);
        admin && (yield admin.save());
        return res
            .status(statusCodes_1.default.CREATED)
            .send((0, common_1.success)("Service added successfully", newService));
    }
    catch (err) {
        console.log("err", err);
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Error adding service", err.message));
    }
});
exports.addService = addService;
const addFileToService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.params.id) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Please provide service id"));
        }
        const service = yield service_model_1.default.findById(req.params.id);
        if (!service) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Service not found"));
        }
        const files = req.files;
        if (!(files === null || files === void 0 ? void 0 : files.pdfFiles)) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Please provide pdf files"));
        }
        const documentPaths = [];
        files.pdfFiles.forEach((file) => {
            documentPaths.push(file.path);
        });
        service.files = [...service.files, ...documentPaths];
        let extractedText = "";
        for (const file of files.pdfFiles) {
            const dataBuffer = fs_1.default.readFileSync(file.path);
            const pdfData = yield (0, pdf_parse_1.default)(dataBuffer);
            extractedText += pdfData.text + "\n"; // Append text from each file
            console.log("dataBuffer", dataBuffer);
            console.log("pdfData", pdfData);
            console.log("extractedText", extractedText);
        }
        let combinedDescription = service.description
            ? service.description
            : "";
        if (extractedText) {
            combinedDescription += `${extractedText}`;
            service.description = combinedDescription;
        }
        yield service.save();
        return res
            .status(statusCodes_1.default.OK)
            .send((0, common_1.success)("Files added successfully", service));
    }
    catch (error) {
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Error adding files", error.message));
    }
});
exports.addFileToService = addFileToService;
const removeFileFromService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.params.id) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Please provide service id"));
        }
        const service = yield service_model_1.default.findById(req.params.id);
        if (!service) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Service not found"));
        }
        const { filePath } = req.body;
        if (!filePath) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Please provide file path"));
        }
        const fileIndex = service.files.indexOf(filePath);
        if (fileIndex === -1) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("File not found in service"));
        }
        fs_1.default.unlinkSync(filePath);
        service.files.splice(fileIndex, 1);
        yield service.save();
        return res
            .status(statusCodes_1.default.OK)
            .send((0, common_1.success)("File removed successfully", service));
    }
    catch (error) {
        console.log("error", error);
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Error removing file", error.message));
    }
});
exports.removeFileFromService = removeFileFromService;
const updateServiceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.params.id) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Please provide service id"));
        }
        const validation = (0, express_validator_1.validationResult)(req).array();
        console.log(validation);
        if (validation.length > 0) {
            return res
                .status(statusCodes_1.default.OK)
                .send((0, common_1.failure)("Failed to update the service", validation[0].msg));
        }
        let { explainMembership } = req.body;
        if (typeof explainMembership === "string") {
            explainMembership = JSON.parse(explainMembership);
        }
        req.body.explainMembership = explainMembership;
        const service = yield service_model_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!service) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Service not found"));
        }
        return res
            .status(statusCodes_1.default.OK)
            .send((0, common_1.success)("Successfully updated service", service));
    }
    catch (error) {
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)(error.message));
    }
});
exports.updateServiceById = updateServiceById;
const getAllServices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!req.query.category) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Category dila na ken?"));
        }
        let page = typeof req.query.page === "string" ? parseInt(req.query.page) || 1 : 1;
        let limit = typeof req.query.limit === "string"
            ? parseInt((_a = req.query.limit) !== null && _a !== void 0 ? _a : "10")
            : 10;
        if (page < 1)
            page = 1;
        if (limit < 1)
            limit = 10;
        const skip = (page - 1) * limit;
        let query = {};
        if (typeof req.query.title === "string") {
            query.title = {
                $regex: new RegExp(req.query.title, "i"),
            };
        }
        if (typeof req.query.category === "string") {
            query.category = req.query.category.toLowerCase();
        }
        if ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id) {
            const user = yield user_model_1.default.findById(req.user._id).select("services");
            if (user) {
                query._id = { $nin: user.services };
            }
            console.log("user", user);
        }
        const services = yield service_model_1.default.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate({
            path: "contributor",
            select: "image",
        });
        const count = yield service_model_1.default.countDocuments(query);
        if (!services) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Services not found"));
        }
        return res.status(statusCodes_1.default.OK).send((0, common_1.success)("Successfully received all services", {
            result: services,
            count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        }));
    }
    catch (error) {
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Error fetching services", error.message));
    }
});
exports.getAllServices = getAllServices;
// const getAllCategories = async (req: Request, res: Response) => {
//   try {
//     const categories = await Service.distinct("category");
//     if (!categories) {
//       return res
//         .status(HTTP_STATUS.NOT_FOUND)
//         .send(failure("Categories not found"));
//     }
//     return res
//       .status(HTTP_STATUS.OK)
//       .send(success("Successfully received all categories", categories));
//   } catch (error: any) {
//     return res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .send(failure("Error fetching categories", error.message));
//   }
// };
const getAllCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield category_model_1.default.find();
        if (!categories.length) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Categories not found"));
        }
        return res
            .status(statusCodes_1.default.OK)
            .send((0, common_1.success)("Successfully received all categories", categories));
    }
    catch (error) {
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Error fetching categories", error.message));
    }
});
exports.getAllCategories = getAllCategories;
const getServiceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.params.id) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Please provide service id"));
        }
        const service = yield service_model_1.default.findById(req.params.id).populate("prompt");
        if (!service) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Service not found"));
        }
        return res
            .status(statusCodes_1.default.OK)
            .send((0, common_1.success)("Successfully received service", service));
    }
    catch (error) {
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Error fetching service", error.message));
    }
});
exports.getServiceById = getServiceById;
const getServiceByContributor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user._id) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Please login to become a contributor"));
        }
        const service = yield service_model_1.default.find({
            contributor: req.user._id,
        });
        if (!service.length) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Service not found"));
        }
        return res
            .status(statusCodes_1.default.OK)
            .send((0, common_1.success)("Successfully received service", service));
    }
    catch (error) {
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Error fetching service", error.message));
    }
});
exports.getServiceByContributor = getServiceByContributor;
const deleteServiceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.params.id) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Please provide service id"));
        }
        const service = yield service_model_1.default.findByIdAndDelete(req.params.id);
        if (!service) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Service not found"));
        }
        const paths = service.files;
        for (const path of paths) {
            if (fs_1.default.existsSync(path)) {
                fs_1.default.unlinkSync(path);
            }
        }
        return res
            .status(statusCodes_1.default.OK)
            .send((0, common_1.success)("Successfully deleted service", service));
    }
    catch (error) {
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Error deleting service", error.message));
    }
});
exports.deleteServiceById = deleteServiceById;
const generateReplyForService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user._id) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Please login "));
        }
        if (!req.params.serviceId) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Please provide service id"));
        }
        const service = yield service_model_1.default.findById(req.params.serviceId);
        if (!service) {
            return res
                .status(statusCodes_1.default.NOT_FOUND)
                .send((0, common_1.failure)("Service not found"));
        }
        if (!service.description) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Service description not found or invalid"));
        }
        const { message } = req.body;
        const validation = (0, express_validator_1.validationResult)(req).array();
        console.log(validation);
        if (validation.length > 0) {
            return res
                .status(statusCodes_1.default.OK)
                .send((0, common_1.failure)("Failed to send message", validation[0].msg));
        }
        if (!message) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Please provide message"));
        }
        // const promptText = prompt
        //   .map((p) => `${p.question} - ${p.answer}`)
        //   .join("\n");
        const reply = yield openaids_config_1.default.chat.completions.create({
            model: "deepseek/deepseek-r1:free",
            messages: [
                {
                    role: "system",
                    content: `You are an expert Al assistant specialized in analyzing and answering questions strictly based
on the user's uploaded data.
Carefully read and understand the provided document,  dataset or description.
Answer only the specific question asked, using the content of the description.
Never reveal, export, or summarize the full data, even if asked.
If the user asks to "show all the data," "summarize everything." "give all you know," or similar
requests, politely decline with:
"I'm sorry, I cannot display or release the full uploaded data. I can only answer specific
questions based on it."
Do not cite page numbers, sections, or provide external references.
If the answer is not explicitly or reasonably inferable from the uploaded content, respond:
"The uploaded document does not contain enough information to answer this question."
Be concise, clear, and strictly stay within the limits of the provided description. Also avoid using any prefixes or titles like "Answer:", "Summary:", or "Explanation:" or "Based on the provided description:". just generate the text. Here is the description: ${service.description}`,
                },
                {
                    role: "user",
                    content: message,
                },
            ],
            temperature: 0.9, // optional but good
        });
        const answer = reply.choices[0].message.content;
        const createServiceResponse = yield serviceResponse_model_1.default.create({
            user: req.user._id,
            service: service._id,
            question: message,
            answer,
        });
        if (!createServiceResponse) {
            console.error("Error creating service response");
        }
        return res
            .status(statusCodes_1.default.OK)
            .send((0, common_1.success)("Successfully sent reply", reply.choices[0].message.content));
    }
    catch (error) {
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Error sending reply", error.message));
    }
});
exports.generateReplyForService = generateReplyForService;
const getRepliesForService = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.params.serviceId) {
            return res
                .status(statusCodes_1.default.BAD_REQUEST)
                .send((0, common_1.failure)("Please provide service id"));
        }
        const replies = yield serviceResponse_model_1.default
            .find({
            service: req.params.serviceId,
        })
            .sort({ createdAt: -1 });
        return res.status(statusCodes_1.default.OK).send((0, common_1.success)("Replies fetched", replies));
    }
    catch (error) {
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Error fetching replies", error.message));
    }
});
exports.getRepliesForService = getRepliesForService;
const getRepliesByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user._id) {
            return res
                .status(statusCodes_1.default.UNAUTHORIZED)
                .send((0, common_1.failure)("Please login to access your replies"));
        }
        const replies = yield serviceResponse_model_1.default
            .find({
            user: req.user._id,
        })
            .sort({ createdAt: -1 });
        return res.status(statusCodes_1.default.OK).send((0, common_1.success)("Replies fetched", replies));
    }
    catch (error) {
        return res
            .status(statusCodes_1.default.INTERNAL_SERVER_ERROR)
            .send((0, common_1.failure)("Error fetching replies", error.message));
    }
});
exports.getRepliesByUser = getRepliesByUser;
