import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: (process.env.JWT_SECRET || 'health_scanner_dev_secret_key_2026_xyz').trim(),
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '30d').trim(),
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../../health_scanner.db'),
  openAiApiKey: (process.env.OPENAI_API_KEY || '').trim(),
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
