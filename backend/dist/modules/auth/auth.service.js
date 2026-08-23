"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
const db_1 = require("../../db");
const config_1 = require("../../config");
const shared_1 = require("@health-scanner/shared");
class AuthService {
    db = (0, db_1.getDb)();
    async register(data) {
        const validated = shared_1.RegisterUserSchema.parse(data);
        const emailLower = validated.email.toLowerCase();
        const existing = this.db.tables.users.find((u) => u.email === emailLower);
        if (existing) {
            throw new Error('An account with this email already exists.');
        }
        const userId = (0, crypto_1.randomUUID)();
        const profileId = (0, crypto_1.randomUUID)();
        const passwordHash = await bcryptjs_1.default.hash(validated.password, 10);
        const now = new Date().toISOString();
        this.db.tables.users.push({
            id: userId,
            email: emailLower,
            password_hash: passwordHash,
            created_at: now,
            updated_at: now,
        });
        this.db.tables.user_profiles.push({
            id: profileId,
            user_id: userId,
            name: validated.name,
            country: 'India',
            state: 'Kerala',
            language_preference: 'en',
            disclaimer_acknowledged: 0,
            created_at: now,
            updated_at: now,
        });
        this.db.save();
        const token = this.generateToken(userId, emailLower);
        return {
            userId,
            email: emailLower,
            name: validated.name,
            token,
        };
    }
    async login(data) {
        const validated = shared_1.LoginUserSchema.parse(data);
        const emailLower = validated.email.toLowerCase();
        const user = this.db.tables.users.find((u) => u.email === emailLower);
        if (!user) {
            throw new Error('Invalid email or password.');
        }
        const isValidPassword = await bcryptjs_1.default.compare(validated.password, user.password_hash);
        if (!isValidPassword) {
            throw new Error('Invalid email or password.');
        }
        const profile = this.db.tables.user_profiles.find((p) => p.user_id === user.id);
        const token = this.generateToken(user.id, user.email);
        return {
            userId: user.id,
            email: user.email,
            name: profile?.name || 'User',
            languagePreference: profile?.language_preference || 'en',
            disclaimerAcknowledged: Boolean(profile?.disclaimer_acknowledged),
            token,
        };
    }
    generateToken(userId, email) {
        return jsonwebtoken_1.default.sign({ userId, email }, config_1.config.jwtSecret, {
            expiresIn: config_1.config.jwtExpiresIn,
        });
    }
}
exports.AuthService = AuthService;
