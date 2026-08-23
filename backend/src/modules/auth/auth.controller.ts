import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service';

export const authRouter = Router();
const authService = new AuthService();

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Login failed' });
  }
});

authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to process forgot password request' });
  }
});

authRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const result = await authService.resetPassword(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Password reset failed' });
  }
});
