import { Router, Response } from 'express';
import { UserService } from './user.service';
import { authMiddleware, AuthenticatedRequest } from '../auth/auth.middleware';

export const userRouter = Router();
const userService = new UserService();

// Public master data catalog
userRouter.get('/master-data', (_req, res: Response) => {
  try {
    const data = userService.getMasterData();
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch master data' });
  }
});

// Protected profile routes
userRouter.use(authMiddleware);

userRouter.get('/profile', (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = userService.getProfile(req.userId!);
    return res.json(profile);
  } catch (err: any) {
    return res.status(404).json({ error: err.message || 'Profile not found' });
  }
});

userRouter.put('/profile', (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = userService.updateBasicProfile(req.userId!, req.body);
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update profile' });
  }
});

userRouter.put('/health-profile', (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = userService.updateHealthProfile(req.userId!, req.body);
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update health profile' });
  }
});

userRouter.post('/acknowledge-disclaimer', (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = userService.acknowledgeDisclaimer(req.userId!);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to acknowledge disclaimer' });
  }
});

userRouter.delete('/account', (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = userService.deleteAccount(req.userId!);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete account' });
  }
});
