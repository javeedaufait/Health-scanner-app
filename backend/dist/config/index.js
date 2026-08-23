"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '4000', 10),
    jwtSecret: process.env.JWT_SECRET || 'health_scanner_dev_secret_key_2026_xyz',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
    dbPath: process.env.DB_PATH || path_1.default.resolve(__dirname, '../../health_scanner.db'),
    openAiApiKey: process.env.OPENAI_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    corsOrigin: process.env.CORS_ORIGIN || '*',
};
