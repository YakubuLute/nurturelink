import { Router } from 'express';
import { LoginSchema, RefreshTokenSchema } from '@nurturelink/shared';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();
export const authRouter = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body);
    const result = await authService.login(body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const body = RefreshTokenSchema.parse(req.body);
    const result = await authService.refresh(body.refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
