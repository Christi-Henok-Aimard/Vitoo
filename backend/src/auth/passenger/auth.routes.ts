import { Router } from 'express';
import {
  forgotPasswordController,
  googleLoginController,
  loginController,
  meController,
  meMessagesController,
  registerController,
  resetPasswordController,
  updateMeController,
  updatePasswordController,
} from './auth.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';

export const authRouter = Router();
authRouter.post('/register', registerController);
authRouter.post('/login', loginController);
authRouter.post('/google', googleLoginController);
authRouter.post('/forgot-password', forgotPasswordController);
authRouter.post('/reset-password', resetPasswordController);
authRouter.get('/me', requireAuth, meController);
authRouter.get('/me/messages', requireAuth, meMessagesController);
authRouter.patch('/me', requireAuth, updateMeController);
authRouter.patch('/me/password', requireAuth, updatePasswordController);
