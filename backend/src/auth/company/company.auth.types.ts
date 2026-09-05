export interface CompanyRegisterInput {
  companyName: string;
  rccm: string;
  taxId: string;
  city: string;
  contactName: string;
  phone: string;
  email: string;
  password: string;
}

export interface CompanyLoginInput {
  email: string;
  password: string;
}

export interface CompanyForgotPasswordInput {
  email?: string;
  phone?: string;
}

export interface CompanyResetPasswordInput {
  email?: string;
  phone?: string;
  code: string;
  newPassword: string;
}
