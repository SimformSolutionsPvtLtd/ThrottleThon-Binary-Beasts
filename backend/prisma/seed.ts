/* eslint-disable no-console */
import { AiCacheType, CostBand, Plan, Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const PERMISSIONS = [
  { action: 'forecast:read', description: 'Read forecast results' },
  { action: 'forecast:write', description: 'Create/update forecasts' },
  { action: 'debate:run', description: 'Trigger debate orchestration' },
  { action: 'debate:read', description: 'Read debate transcripts and results' },
  { action: 'identity-map:read', description: 'Read pseudonym → identity map' },
  { action: 'allocations:read', description: 'Read developer allocations' },
  { action: 'allocations:write', description: 'Create/update allocations' },
  { action: 'brief:generate', description: 'Generate executive briefs' },
  { action: 'developers:read', description: 'Read developer roster' },
  { action: 'developers:write', description: 'Create/update developers' },
  { action: 'scenarios:read', description: 'Read scenarios' },
  { action: 'scenarios:write', description: 'Create/update scenarios' },
  { action: 'tenant:manage', description: 'Manage tenant settings + branding' },
  { action: 'users:manage', description: 'Manage tenant users and roles' },
  { action: 'audit:read', description: 'Read audit logs' },
  { action: 'ingestion:trigger', description: 'Trigger data ingestion jobs' },
  { action: 'ingestion:read', description: 'Read ingestion status and results' },
];

const ALL_PERMS = PERMISSIONS.map((p) => p.action);
const ADMIN_PERMS = ALL_PERMS.filter((p) => p !== 'tenant:manage');
const EM_PERMS = [
  'forecast:read',
  'debate:run',
  'debate:read',
  'identity-map:read',
  'allocations:read',
  'allocations:write',
  'brief:generate',
  'developers:read',
  'scenarios:read',
  'ingestion:trigger',
  'ingestion:read',
];
const VIEWER_PERMS = [
  'forecast:read',
  'debate:read',
  'developers:read',
  'scenarios:read',
  'allocations:read',
  'ingestion:read',
];

const ROLE_MATRIX: { name: string; description: string; perms: string[] }[] = [
  { name: 'super_admin', description: 'Full access including tenant management', perms: ALL_PERMS },
  { name: 'admin', description: 'Tenant admin — all except tenant:manage', perms: ADMIN_PERMS },
  {
    name: 'engineering_manager',
    description: 'Engineering manager — operational reads + selective writes',
    perms: EM_PERMS,
  },
  { name: 'viewer', description: 'Read-only access', perms: VIEWER_PERMS },
];

const FIXTURES_DIR = path.resolve(__dirname, '../../data/fixtures');

function readJsonIfExists<T>(file: string): T | null {
  const full = path.join(FIXTURES_DIR, file);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as T;
}

async function upsertPermissions() {
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action: p.action },
      update: { description: p.description },
      create: p,
    });
  }
  return prisma.permission.findMany();
}

async function upsertTenant(input: {
  name: string;
  slug: string;
  brandName: string;
  primaryColor: string;
  plan: Plan;
}) {
  return prisma.tenant.upsert({
    where: { slug: input.slug },
    update: {
      name: input.name,
      brandName: input.brandName,
      primaryColor: input.primaryColor,
      plan: input.plan,
    },
    create: { ...input, settings: {} },
  });
}

async function syncSystemRoles(tenantId: string, allPerms: { id: string; action: string }[]) {
  const byAction = new Map(allPerms.map((p) => [p.action, p.id]));
  const roles: Record<string, string> = {};
  for (const def of ROLE_MATRIX) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId, name: def.name } },
      update: { description: def.description, isSystem: true },
      create: { tenantId, name: def.name, description: def.description, isSystem: true },
    });
    roles[def.name] = role.id;

    const desired = new Set(def.perms.map((a) => byAction.get(a)!).filter(Boolean));
    const current = await prisma.rolePermission.findMany({ where: { roleId: role.id } });
    const currentSet = new Set(current.map((c) => c.permissionId));

    const toAdd = [...desired].filter((id) => !currentSet.has(id));
    const toRemove = [...currentSet].filter((id) => !desired.has(id));

    if (toAdd.length) {
      await prisma.rolePermission.createMany({
        data: toAdd.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
    if (toRemove.length) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id, permissionId: { in: toRemove } },
      });
    }
  }
  return roles;
}

async function upsertUserWithMembership(
  email: string,
  firstName: string,
  lastName: string,
  password: string,
  tenantId: string,
  roleId: string,
) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { firstName, lastName, isActive: true },
    create: { email, passwordHash, firstName, lastName, isActive: true },
  });
  await prisma.tenantMembership.upsert({
    where: { userId_tenantId: { userId: user.id, tenantId } },
    update: { roleId, isActive: true },
    create: { userId: user.id, tenantId, roleId, isActive: true },
  });
  return user;
}

async function seedVectorFinFixtures(tenantId: string) {
  // ─── Developers (12) ──────────────────────────────────────────
  type DevSeed = {
    pseudonym: string;
    role: string;
    department: string;
    tenureYears: number;
    costBand: CostBand;
    skills: string[];
    realName: string;
    email: string;
  };

  const fixtureDevs = readJsonIfExists<DevSeed[]>('developers.json');
  const devs: DevSeed[] =
    fixtureDevs ??
    Array.from({ length: 12 }, (_, i): DevSeed => {
      const id = String(i + 1).padStart(2, '0');
      const bands: CostBand[] = [CostBand.C1, CostBand.C2, CostBand.C3, CostBand.C4, CostBand.C5];
      const roles = ['Frontend', 'Backend', 'Full-stack', 'QA', 'DevOps', 'Tech Lead'];
      return {
        pseudonym: `DEV_${id}`,
        role: roles[i % roles.length],
        department: i < 8 ? 'Customer Portal' : 'Platform',
        tenureYears: Math.round((1 + (i % 8) * 0.7) * 10) / 10,
        costBand: bands[i % bands.length],
        skills: ['typescript', 'angular', 'nestjs'].slice(0, (i % 3) + 1),
        realName: `Vector Engineer ${id}`,
        email: `dev${id}@vectorfin.example`,
      };
    });

  for (const d of devs) {
    await prisma.developer.upsert({
      where: { tenantId_pseudonym: { tenantId, pseudonym: d.pseudonym } },
      update: {
        role: d.role,
        department: d.department,
        tenureYears: d.tenureYears,
        costBand: d.costBand,
        skills: d.skills,
      },
      create: {
        tenantId,
        pseudonym: d.pseudonym,
        role: d.role,
        department: d.department,
        tenureYears: d.tenureYears,
        costBand: d.costBand,
        skills: d.skills,
        currentAllocation: {},
      },
    });

    await prisma.pseudonymMap.upsert({
      where: { tenantId_pseudonym: { tenantId, pseudonym: d.pseudonym } },
      update: { realName: d.realName, email: d.email },
      create: { tenantId, pseudonym: d.pseudonym, realName: d.realName, email: d.email },
    });
  }

  // ─── Jira tickets (60) ────────────────────────────────────────
  type TicketSeed = {
    externalId: string;
    title: string;
    estimatedPoints: number;
    actualPoints: number;
    assigneePseudonym: string;
    labels: string[];
    sprint: string;
    status: string;
  };

  const fixtureTickets = readJsonIfExists<TicketSeed[]>('jira-tickets.json');
  const tickets: TicketSeed[] =
    fixtureTickets ??
    Array.from({ length: 60 }, (_, i): TicketSeed => {
      const id = 1001 + i;
      const devNum = (i % 12) + 1;
      const sprintNum = Math.floor(i / 10) + 1;
      const statuses = ['Done', 'In Progress', 'To Do', 'Done', 'Done'];
      return {
        externalId: `PORTAL-${id}`,
        title: `Customer portal task ${id}`,
        estimatedPoints: ((i % 5) + 1) * 2,
        actualPoints: ((i % 5) + 1) * 2 + (i % 3),
        assigneePseudonym: `DEV_${String(devNum).padStart(2, '0')}`,
        labels: i % 2 === 0 ? ['frontend', 'angular'] : ['backend'],
        sprint: `Sprint ${sprintNum}`,
        status: statuses[i % statuses.length],
      };
    });

  for (const t of tickets) {
    await prisma.jiraTicket.upsert({
      where: { tenantId_externalId: { tenantId, externalId: t.externalId } },
      update: {
        title: t.title,
        estimatedPoints: t.estimatedPoints,
        actualPoints: t.actualPoints,
        assigneePseudonym: t.assigneePseudonym,
        labels: t.labels,
        sprint: t.sprint,
        status: t.status,
      },
      create: { tenantId, ...t },
    });
  }

  // ─── Git repository ───────────────────────────────────────────
  await prisma.gitRepository.upsert({
    where: { tenantId_name: { tenantId, name: 'customer-portal-frontend' } },
    update: {},
    create: {
      tenantId,
      name: 'customer-portal-frontend',
      defaultBranch: 'main',
      language: 'TypeScript',
      framework: 'AngularJS 1.6',
      metadata: { loc: 142000, components: 318, contributors: 12 },
      staticAnalysis: { cyclomaticComplexity: 'high', testCoverage: 0.38, lintViolations: 1240 },
      dependencies: {
        angular: '1.6.10',
        jquery: '3.5.1',
        bootstrap: '3.4.1',
        nodeVersion: '14',
      },
    },
  });

  // ─── Scenarios (2) ────────────────────────────────────────────
  type ScenarioSeed = {
    externalId: string;
    name: string;
    description: string;
    category: string;
    baseEffortPoints: number;
    config: Prisma.InputJsonValue;
  };
  const scenarios: ScenarioSeed[] = readJsonIfExists<ScenarioSeed[]>('scenarios.json') ?? [
    {
      externalId: 'angular-migration-full',
      name: 'AngularJS → Angular 17 (Full Rewrite)',
      description: 'Replace the entire customer portal with a green-field Angular 17 SPA.',
      category: 'migration',
      baseEffortPoints: 540,
      config: { riskProfile: 'aggressive', parallelTeams: 2, dropInterimRelease: true },
    },
    {
      externalId: 'angular-migration-interim',
      name: 'AngularJS → Angular 17 (Interim Releases)',
      description: 'Strangler-pattern incremental migration with quarterly interim releases.',
      category: 'migration',
      baseEffortPoints: 720,
      config: { riskProfile: 'conservative', parallelTeams: 1, dropInterimRelease: false },
    },
  ];

  for (const s of scenarios) {
    await prisma.scenario.upsert({
      where: { tenantId_externalId: { tenantId, externalId: s.externalId } },
      update: {
        name: s.name,
        description: s.description,
        category: s.category,
        baseEffortPoints: s.baseEffortPoints,
        config: s.config,
      },
      create: { tenantId, ...s },
    });
  }

  // ─── Multiplier config v1.0.0 ─────────────────────────────────
  const multiplierConfig: Prisma.InputJsonValue = readJsonIfExists<Prisma.InputJsonValue>(
    'multiplier-config.json',
  ) ?? {
    costBandRates: { C1: 40, C2: 65, C3: 95, C4: 130, C5: 175 },
    riskMultipliers: {
      unknowns: 1.25,
      externalDependencies: 1.15,
      teamChurn: 1.1,
      regulatoryComplexity: 1.2,
    },
    contingencyPctByCategory: { migration: 0.25, feature: 0.15, infra: 0.2 },
  };
  await prisma.multiplierConfig.upsert({
    where: { tenantId_version: { tenantId, version: '1.0.0' } },
    update: { config: multiplierConfig, isActive: true },
    create: { tenantId, version: '1.0.0', config: multiplierConfig, isActive: true },
  });

  // ─── AiCache (5 entries) ──────────────────────────────────────
  const aiCacheEntries: { cacheKey: string; cacheType: AiCacheType; data: Prisma.InputJsonValue }[] = [
    {
      cacheKey: 'ingestion:jira:customer-portal',
      cacheType: AiCacheType.INGESTION_JIRA,
      data: { tickets: 60, sprints: 6, completionRate: 0.78 },
    },
    {
      cacheKey: 'ingestion:git:customer-portal-frontend',
      cacheType: AiCacheType.INGESTION_GIT,
      data: { commits: 4200, contributors: 12, hotspots: ['login.controller.js', 'cart.service.js'] },
    },
    {
      cacheKey: 'ingestion:hrms:vectorfin',
      cacheType: AiCacheType.INGESTION_HRMS,
      data: { headcount: 12, avgTenureYears: 3.8, departments: ['Customer Portal', 'Platform'] },
    },
    {
      cacheKey: 'debate:angular-migration-full',
      cacheType: AiCacheType.DEBATE,
      data: {
        frictionFactor: 0.62,
        confidenceScore: 0.71,
        keyRisks: ['scope-creep', 'integration-debt', 'regression'],
      },
    },
    {
      cacheKey: 'debate:angular-migration-interim',
      cacheType: AiCacheType.DEBATE,
      data: {
        frictionFactor: 0.41,
        confidenceScore: 0.84,
        keyRisks: ['parallel-feature-drift', 'dual-stack-overhead'],
      },
    },
  ];

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  for (const entry of aiCacheEntries) {
    await prisma.aiCache.upsert({
      where: { tenantId_cacheKey: { tenantId, cacheKey: entry.cacheKey } },
      update: { cacheType: entry.cacheType, data: entry.data, expiresAt },
      create: { tenantId, ...entry, expiresAt },
    });
  }

  // ─── Pre-computed DebateResult fixtures ───────────────────────
  for (const s of scenarios) {
    const cached = aiCacheEntries.find((e) => e.cacheKey === `debate:${s.externalId}`);
    if (!cached) continue;
    const data = cached.data as Record<string, unknown>;
    const existing = await prisma.debateResult.findFirst({
      where: { tenantId, scenarioExternalId: s.externalId, isFixture: true },
    });
    if (existing) continue;
    await prisma.debateResult.create({
      data: {
        tenantId,
        scenarioExternalId: s.externalId,
        frictionFactor: data.frictionFactor as number,
        confidenceScore: data.confidenceScore as number,
        keyRisks: data.keyRisks as Prisma.InputJsonValue,
        debateLog: { source: 'fixture', generatedAt: new Date().toISOString() },
        isFixture: true,
      },
    });
  }
}

async function main() {
  console.log('Seeding permissions…');
  const allPerms = await upsertPermissions();

  console.log('Seeding tenants…');
  const vectorfin = await upsertTenant({
    name: 'Vector Finance Tech',
    slug: 'vectorfin',
    brandName: 'Vector Finance Tech',
    primaryColor: '#2563EB',
    plan: Plan.ENTERPRISE,
  });
  const demo = await upsertTenant({
    name: 'Demo Corp',
    slug: 'demo',
    brandName: 'Demo Corp',
    primaryColor: '#2563EB',
    plan: Plan.FREE,
  });

  console.log('Seeding roles + permissions per tenant…');
  const vfRoles = await syncSystemRoles(vectorfin.id, allPerms);
  await syncSystemRoles(demo.id, allPerms);

  console.log('Seeding users + memberships…');
  await upsertUserWithMembership(
    'admin@vectorfin.example',
    'Vector',
    'Admin',
    'changeme',
    vectorfin.id,
    vfRoles['super_admin'],
  );
  await upsertUserWithMembership(
    'em@vectorfin.example',
    'Vector',
    'EM',
    'changeme',
    vectorfin.id,
    vfRoles['engineering_manager'],
  );
  await upsertUserWithMembership(
    'viewer@vectorfin.example',
    'Vector',
    'Viewer',
    'changeme',
    vectorfin.id,
    vfRoles['viewer'],
  );

  console.log('Seeding vectorfin fixture data…');
  await seedVectorFinFixtures(vectorfin.id);

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
