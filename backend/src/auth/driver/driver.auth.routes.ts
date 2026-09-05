import { Router } from 'express';
import {
  registerDriverController,
  loginDriverController,
  forgotPasswordDriverController,
  resetPasswordDriverController,
  meDriverController,
  updateMeDriverController,
  logoutDriverController,
} from './driver.auth.controller.js';

export const driverAuthRouter = Router();

driverAuthRouter.post('/register', registerDriverController);
driverAuthRouter.post('/login', loginDriverController);
driverAuthRouter.post('/forgot-password', forgotPasswordDriverController);
driverAuthRouter.post('/reset-password', resetPasswordDriverController);
driverAuthRouter.get('/me', meDriverController);
driverAuthRouter.patch('/me', updateMeDriverController);
driverAuthRouter.post('/logout', logoutDriverController);
