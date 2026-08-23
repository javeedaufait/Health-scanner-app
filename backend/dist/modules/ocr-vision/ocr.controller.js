"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocrRouter = void 0;
const express_1 = require("express");
const ocr_service_1 = require("./ocr.service");
const auth_middleware_1 = require("../auth/auth.middleware");
exports.ocrRouter = (0, express_1.Router)();
const ocrService = new ocr_service_1.OcrVisionService();
exports.ocrRouter.use(auth_middleware_1.authMiddleware);
exports.ocrRouter.post('/extract', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) {
            return res.status(400).json({ error: 'Please provide a base64 encoded image string.' });
        }
        const extracted = await ocrService.extractNutritionFromImage(imageBase64);
        return res.json({ success: true, data: extracted });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to extract nutrition from label' });
    }
});
