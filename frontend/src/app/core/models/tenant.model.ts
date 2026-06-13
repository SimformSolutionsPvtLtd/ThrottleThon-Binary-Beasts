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
