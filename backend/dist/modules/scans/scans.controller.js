"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scansRouter = void 0;
const express_1 = require("express");
const scans_service_1 = require("./scans.service");
const auth_middleware_1 = require("../auth/auth.middleware");
exports.scansRouter = (0, express_1.Router)();
const scansService = new scans_service_1.ScansService();
exports.scansRouter.use(auth_middleware_1.authMiddleware);
// Evaluate food product and record scan
exports.scansRouter.post('/evaluate', async (req, res) => {
    try {
        const result = await scansService.evaluateAndRecordScan(req.userId, req.body);
        return res.status(201).json(result);
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Failed to evaluate food product' });
    }
});
// Scan History
exports.scansRouter.get('/history', (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 20;
        const history = scansService.getScanHistory(req.userId, limit);
        return res.json(history);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to load scan history' });
    }
});
exports.scansRouter.get('/history/:id', (req, res) => {
    try {
        const scan = scansService.getScanById(req.userId, req.params.id);
        return res.json(scan);
    }
    catch (err) {
        return res.status(404).json({ error: err.message || 'Scan not found' });
    }
});
// Saved Products / Favorites
exports.scansRouter.post('/saved/:productId', (req, res) => {
    try {
        const result = scansService.toggleSavedProduct(req.userId, req.params.productId);
        return res.json(result);
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Failed to update saved product' });
    }
});
exports.scansRouter.get('/saved', (req, res) => {
    try {
        const saved = scansService.getSavedProducts(req.userId);
        return res.json(saved);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to fetch saved products' });
    }
});
