import { Router } from 'express';
import {
  registerCompanyController,
  loginCompanyController,
  googleLoginCompanyController,
  forgotPasswordCompanyController,
  resetPasswordCompanyController,
  meCompanyController,
  updateMeCompanyController,
} from './company.auth.controller.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';

export const companyAuthRouter = Router();
companyAuthRouter.post('/register', registerCompanyController);
companyAuthRouter.post('/login', loginCompanyController);
companyAuthRouter.post('/google', googleLoginCompanyController);
companyAuthRouter.post('/forgot-password', forgotPasswordCompanyController);
companyAuthRouter.post('/reset-password', resetPasswordCompanyController);
companyAuthRouter.get('/me', requireAuth, meCompanyController);
companyAuthRouter.patch('/me', requireAuth, updateMeCompanyController);
