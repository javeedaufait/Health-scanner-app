"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_service_1 = require("./auth.service");
exports.authRouter = (0, express_1.Router)();
const authService = new auth_service_1.AuthService();
exports.authRouter.post('/register', async (req, res) => {
    try {
        const result = await authService.register(req.body);
        return res.status(201).json(result);
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Registration failed' });
    }
});
exports.authRouter.post('/login', async (req, res) => {
    try {
        const result = await authService.login(req.body);
        return res.json(result);
    }
    catch (err) {
        return res.status(400).json({ error: err.message || 'Login failed' });
    }
});
