import { PermissionAction, Permissions } from './permissions';

export const SystemRoles = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  ENGINEERING_MANAGER: 'engineering_manager',
  VIEWER: 'viewer',
} as const;

export type SystemRoleName = (typeof SystemRoles)[keyof typeof SystemRoles];

export interface SystemRoleDef {
  name: SystemRoleName;
  description: string;
  permissions: PermissionAction[];
}

const ALL: PermissionAction[] = Object.values(Permissions);

export const SYSTEM_ROLE_DEFINITIONS: SystemRoleDef[] = [
  {
    name: SystemRoles.SUPER_ADMIN,
    description: 'Full access including tenant management',
    permissions: ALL,
  },
  {
    name: SystemRoles.ADMIN,
    description: 'Tenant admin — all except tenant:manage',
    permissions: ALL.filter((p) => p !== Permissions.TENANT_MANAGE),
  },
  {
    name: SystemRoles.ENGINEERING_MANAGER,
    description: 'Engineering manager — operational reads + selective writes',
    permissions: [
      Permissions.FORECAST_READ,
      Permissions.DEBATE_RUN,
      Permissions.DEBATE_READ,
      Permissions.IDENTITY_MAP_READ,
      Permissions.ALLOCATIONS_READ,
      Permissions.ALLOCATIONS_WRITE,
      Permissions.BRIEF_GENERATE,
      Permissions.DEVELOPERS_READ,
      Permissions.SCENARIOS_READ,
      Permissions.INGESTION_TRIGGER,
      Permissions.INGESTION_READ,
    ],
  },
  {
    name: SystemRoles.VIEWER,
    description: 'Read-only access',
    permissions: [
      Permissions.FORECAST_READ,
      Permissions.DEBATE_READ,
      Permissions.DEVELOPERS_READ,
      Permissions.SCENARIOS_READ,
      Permissions.ALLOCATIONS_READ,
      Permissions.INGESTION_READ,
    ],
  },
];
