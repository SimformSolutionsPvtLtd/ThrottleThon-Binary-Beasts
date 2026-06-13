export interface TenantBranding {
  brandName: string;
  primaryColor: string;
  logoUrl: string | null;
  slug: string;
}

export interface TenantMembership {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  roleName: string;
}

/** Full tenant record returned by GET /tenants/current. */
export interface TenantDetail {
  id: string;
  slug: string;
  name: string;
  brandName: string;
  primaryColor: string;
  logoUrl: string | null;
  isActive?: boolean;
  settings?: Record<string, unknown> | null;
}

/** Partial branding/settings update sent to PATCH /tenants/current. */
export interface UpdateTenantRequest {
  name?: string;
  brandName?: string;
  logoUrl?: string;
  primaryColor?: string;
  settings?: Record<string, unknown>;
}

export interface TenantMemberRole {
  id: string;
  name: string;
  description?: string;
}

/** A member row as returned by GET /tenants/current/members. */
export interface TenantMember {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  joinedAt: string;
  role: TenantMemberRole;
}

export interface AddMemberRequest {
  email: string;
  roleName: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

/** A single audit log entry from GET /audit-logs. */
export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  details: unknown;
  piiSanitised: boolean;
  ipAddress: string | null;
  createdAt: string;
  userId: string | null;
}

export interface AuditLogPage {
  data: AuditLog[];
  meta: { total: number; page: number; limit: number; pages: number };
}
