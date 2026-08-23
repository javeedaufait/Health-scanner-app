import { Router, Response } from 'express';
import { OcrVisionService } from './ocr.service';
import { authMiddleware, AuthenticatedRequest } from '../auth/auth.middleware';

export const ocrRouter = Router();
const ocrService = new OcrVisionService();

ocrRouter.use(authMiddleware);

ocrRouter.post('/extract', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Please provide a base64 encoded image string.' });
    }

    const extracted = await ocrService.extractNutritionFromImage(imageBase64);
    return res.json({ success: true, data: extracted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to extract nutrition from label' });
  }
});
