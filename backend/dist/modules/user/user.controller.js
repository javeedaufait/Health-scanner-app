"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const user_service_1 = require("./user.service");
const auth_middleware_1 = require("../auth/auth.middleware");
exports.userRouter = (0, express_1.Router)();
const userService = new user_service_1.UserService();
// Public master data catalog
exports.userRouter.get('/master-data', (_req, res) => {
    try {
        const data = userService.getMasterData();
        return res.json(data);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to fetch master data' });
    }
});
// Protected profile routes
exports.userRouter.use(auth_middleware_1.authMiddleware);
exports.userRouter.get('/profile', (req, res) => {
    try {
        const profile = userService.getProfile(req.userId);
        return res.json(profile);
    }
    catch (err) {
        return res.status(404).json({ error: err.message || 'Profile not found' });
    }
});
exports.userRouter.put('/profile', (req, res) => {
    try {
        const updated = userService.updateBasicProfile(req.userId, req.body);
        return res.json(updated);
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Failed to update profile' });
    }
});
exports.userRouter.put('/health-profile', (req, res) => {
    try {
        const updated = userService.updateHealthProfile(req.userId, req.body);
        return res.json(updated);
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Failed to update health profile' });
    }
});
exports.userRouter.post('/acknowledge-disclaimer', (req, res) => {
    try {
        const result = userService.acknowledgeDisclaimer(req.userId);
        return res.json(result);
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Failed to acknowledge disclaimer' });
    }
});
exports.userRouter.delete('/account', (req, res) => {
    try {
        const result = userService.deleteAccount(req.userId);
        return res.json(result);
    }
    catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to delete account' });
    }
});
