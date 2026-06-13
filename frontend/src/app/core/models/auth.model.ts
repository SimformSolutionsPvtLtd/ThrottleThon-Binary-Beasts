import { TenantBranding } from './tenant.model';

export interface LoginRequest {
  email: string;
  password: string;
  tenantSlug: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  tenantBranding: TenantBranding;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  tenantSlug: string;
  roleName: string;
  permissions: string[];
}
