import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { authRouter } from './modules/auth/auth.controller';
import { userRouter } from './modules/user/user.controller';
import { productRouter } from './modules/products/product.controller';
import { scansRouter } from './modules/scans/scans.controller';
import { ocrRouter } from './modules/ocr-vision/ocr.controller';
import { config } from './config';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '15mb' }));
  app.use(morgan('dev'));

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
  app.use('/api/auth', authRouter);
  app.use('/api/me', userRouter);
  app.use('/api/products', productRouter);
  app.use('/api/scans', scansRouter);
  app.use('/api/ocr', ocrRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  return app;
}
