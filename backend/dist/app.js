"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const auth_controller_1 = require("./modules/auth/auth.controller");
const user_controller_1 = require("./modules/user/user.controller");
const product_controller_1 = require("./modules/products/product.controller");
const scans_controller_1 = require("./modules/scans/scans.controller");
const ocr_controller_1 = require("./modules/ocr-vision/ocr.controller");
const config_1 = require("./config");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({ origin: config_1.config.corsOrigin }));
    app.use(express_1.default.json({ limit: '15mb' }));
    app.use((0, morgan_1.default)('dev'));
    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.json({
            status: 'ok',
            service: 'AI Food Scanner Backend API',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        });
    });
    // Mount API modules
    app.use('/api/auth', auth_controller_1.authRouter);
    app.use('/api/me', user_controller_1.userRouter);
    app.use('/api/products', product_controller_1.productRouter);
    app.use('/api/scans', scans_controller_1.scansRouter);
    app.use('/api/ocr', ocr_controller_1.ocrRouter);
    // 404 handler
    app.use((_req, res) => {
        res.status(404).json({ error: 'Endpoint not found' });
    });
    return app;
}
