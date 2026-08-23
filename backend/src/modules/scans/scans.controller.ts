import { Router, Response } from 'express';
import { ScansService } from './scans.service';
import { authMiddleware, AuthenticatedRequest } from '../auth/auth.middleware';

export const scansRouter = Router();
const scansService = new ScansService();

scansRouter.use(authMiddleware);

// Evaluate food product and record scan
scansRouter.post('/evaluate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await scansService.evaluateAndRecordScan(req.userId!, req.body);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to evaluate food product' });
  }
});

// Scan History
scansRouter.get('/history', (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const history = scansService.getScanHistory(req.userId!, limit);
    return res.json(history);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to load scan history' });
  }
});

scansRouter.delete('/history', (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = scansService.clearScanHistory(req.userId!);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to clear scan history' });
  }
});

scansRouter.get('/history/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const scan = scansService.getScanById(req.userId!, req.params.id);
    return res.json(scan);
  } catch (err: any) {
    return res.status(404).json({ error: err.message || 'Scan not found' });
  }
});

// Saved Products / Favorites
scansRouter.post('/saved/:productId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = scansService.toggleSavedProduct(req.userId!, req.params.productId);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update saved product' });
  }
});

scansRouter.get('/saved', (req: AuthenticatedRequest, res: Response) => {
  try {
    const saved = scansService.getSavedProducts(req.userId!);
    return res.json(saved);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch saved products' });
  }
});
