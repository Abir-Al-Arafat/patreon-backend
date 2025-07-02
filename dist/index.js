"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const database_1 = __importDefault(require("./config/database"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const service_routes_1 = __importDefault(require("./routes/service.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const app = (0, express_1.default)();
dotenv_1.default.config();
app.use((0, cors_1.default)({ origin: "*", credentials: true }));
app.use((0, cookie_parser_1.default)()); // Needed to read cookies
app.use(express_1.default.json()); // Parses data as JSON
app.use(express_1.default.text()); // Parses data as text
app.use(express_1.default.urlencoded({ extended: false })); // Parses data as URL-encoded
// ✅ Handle Invalid JSON Errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).send({ message: "Invalid JSON format" });
    }
    next();
});
app.use("/public", express_1.default.static(path_1.default.join(__dirname, "public")));
const baseApiUrl = "/api";
app.use(`${baseApiUrl}/users`, user_routes_1.default);
app.use(`${baseApiUrl}/auth`, auth_routes_1.default);
app.use(`${baseApiUrl}/services`, service_routes_1.default);
app.use(`${baseApiUrl}/transactions`, transaction_routes_1.default);
app.get("/", (req, res) => {
    return res.status(200).send({
        name: "Patreon",
        developer: "Abir",
        version: "1.0.0",
        description: "Backend server for Patreon",
        status: "success",
    });
});
// ✅ Handle 404 Routes
app.use((req, res) => {
    return res.status(400).send({ message: "Route does not exist" });
});
// ✅ Handle Global Errors
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send({ message: "Internal Server Error" });
});
const PORT = process.env.PORT || 3001;
(0, database_1.default)(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
