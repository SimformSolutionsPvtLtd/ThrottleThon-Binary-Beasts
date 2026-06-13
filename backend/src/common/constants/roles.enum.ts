export enum Role {
  ADMIN = 'ADMIN',
  CTO = 'CTO',
  CFO = 'CFO',
  CEO = 'CEO',
  ENGINEERING_MANAGER = 'ENGINEERING_MANAGER',
  USER = 'USER',
}

export enum Permission {
  PROJECT_READ = 'project:read',
  PROJECT_WRITE = 'project:write',
  SCENARIO_READ = 'scenario:read',
  SCENARIO_WRITE = 'scenario:write',
  FORECAST_RUN = 'forecast:run',
  DEBATE_RUN = 'debate:run',
  ALLOCATION_WRITE = 'allocation:write',
  REPORT_GENERATE = 'report:generate',
  USER_MANAGE = 'user:manage',
  AUDIT_READ = 'audit:read',
}

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),
  [Role.CTO]: [
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.SCENARIO_READ,
    Permission.SCENARIO_WRITE,
    Permission.FORECAST_RUN,
    Permission.DEBATE_RUN,
    Permission.ALLOCATION_WRITE,
    Permission.REPORT_GENERATE,
    Permission.AUDIT_READ,
  ],
  [Role.CFO]: [
    Permission.PROJECT_READ,
    Permission.SCENARIO_READ,
    Permission.FORECAST_RUN,
    Permission.REPORT_GENERATE,
    Permission.AUDIT_READ,
  ],
  [Role.CEO]: [
    Permission.PROJECT_READ,
    Permission.SCENARIO_READ,
    Permission.REPORT_GENERATE,
    Permission.AUDIT_READ,
  ],
  [Role.ENGINEERING_MANAGER]: [
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.SCENARIO_READ,
    Permission.SCENARIO_WRITE,
    Permission.FORECAST_RUN,
    Permission.ALLOCATION_WRITE,
  ],
  [Role.USER]: [Permission.PROJECT_READ, Permission.SCENARIO_READ],
};
