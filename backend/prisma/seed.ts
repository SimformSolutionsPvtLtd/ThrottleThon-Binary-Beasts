/* eslint-disable no-console */
import { AiCacheType, CostBand, Plan, Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const DATA_DIR = path.resolve(__dirname, '../data');
const FIXTURES_DIR = path.join(DATA_DIR, 'fixtures');
const CONFIG_DIR = path.join(DATA_DIR, 'config');
const CACHE_DIR = path.join(DATA_DIR, 'cache');
const SECURE_DIR = path.join(DATA_DIR, 'secure');

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function readJsonSafe<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

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
  { name: 'engineering_manager', description: 'Engineering manager — operational reads + selective writes', perms: EM_PERMS },
  { name: 'viewer', description: 'Read-only access', perms: VIEWER_PERMS },
];

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

async function upsertTenant(input: { name: string; slug: string; brandName: string; primaryColor: string; plan: Plan }) {
  return prisma.tenant.upsert({
    where: { slug: input.slug },
    update: { name: input.name, brandName: input.brandName, primaryColor: input.primaryColor, plan: input.plan },
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
      await prisma.rolePermission.createMany({ data: toAdd.map((permissionId) => ({ roleId: role.id, permissionId })), skipDuplicates: true });
    }
    if (toRemove.length) {
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id, permissionId: { in: toRemove } } });
    }
  }
  return roles;
}

async function upsertUserWithMembership(email: string, firstName: string, lastName: string, password: string, tenantId: string, roleId: string) {
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
  // ─── Developers from hrms-records.json ───────────────────────────────────
  type HrmsEmployee = {
    pseudonym: string;
    role: string;
    department: string;
    tenureYears: number;
    costBand: string;
    skills: Prisma.InputJsonValue;
    currentAllocation: Prisma.InputJsonValue;
  };
  type HrmsFile = { employees: HrmsEmployee[] };

  const hrmsFile = readJsonSafe<HrmsFile>(path.join(FIXTURES_DIR, 'hrms-records.json'));
  const employees: HrmsEmployee[] =
    hrmsFile?.employees ??
    Array.from({ length: 12 }, (_, i): HrmsEmployee => {
      const id = String(i + 1).padStart(2, '0');
      const bands = ['C1', 'C2', 'C3', 'C4', 'C5'];
      const roleNames = ['Frontend', 'Backend', 'Full-stack', 'QA', 'DevOps', 'Tech Lead'];
      return {
        pseudonym: `DEV_${id}`,
        role: roleNames[i % roleNames.length],
        department: i < 8 ? 'Customer Portal' : 'Platform',
        tenureYears: Math.round((1 + (i % 8) * 0.7) * 10) / 10,
        costBand: bands[i % bands.length],
        skills: ['typescript', 'angular', 'nestjs'].slice(0, (i % 3) + 1),
        currentAllocation: {},
      };
    });

  for (const emp of employees) {
    await prisma.developer.upsert({
      where: { tenantId_pseudonym: { tenantId, pseudonym: emp.pseudonym } },
      update: {
        role: emp.role,
        department: emp.department,
        tenureYears: emp.tenureYears,
        costBand: emp.costBand as CostBand,
        skills: emp.skills,
        currentAllocation: emp.currentAllocation,
      },
      create: {
        tenantId,
        pseudonym: emp.pseudonym,
        role: emp.role,
        department: emp.department,
        tenureYears: emp.tenureYears,
        costBand: emp.costBand as CostBand,
        skills: emp.skills,
        currentAllocation: emp.currentAllocation,
      },
    });
  }

  // ─── PseudonymMap from secure/pseudonym-map.json ──────────────────────────
  type PseudonymMapFile = Record<string, { realName: string; email: string }>;
  const pseudonymMapFile = readJsonSafe<PseudonymMapFile>(path.join(SECURE_DIR, 'pseudonym-map.json'));

  if (pseudonymMapFile) {
    for (const [pseudonym, info] of Object.entries(pseudonymMapFile)) {
      await prisma.pseudonymMap.upsert({
        where: { tenantId_pseudonym: { tenantId, pseudonym } },
        update: { realName: info.realName, email: info.email },
        create: { tenantId, pseudonym, realName: info.realName, email: info.email },
      });
    }
  } else {
    // Fallback: create from employees list if pseudonym-map.json is missing
    for (const emp of employees) {
      await prisma.pseudonymMap.upsert({
        where: { tenantId_pseudonym: { tenantId, pseudonym: emp.pseudonym } },
        update: {},
        create: { tenantId, pseudonym: emp.pseudonym, realName: emp.pseudonym, email: `${emp.pseudonym.toLowerCase()}@vectorfin.example` },
      });
    }
  }

  // ─── Jira Tickets (60) from fixtures/jira-tickets.json ───────────────────
  type TicketSeed = {
    id: string;
    title: string;
    estimatedPoints: number;
    actualPoints: number;
    assigneePseudonym: string;
    labels: string[];
    sprint: string;
    status: string;
  };
  type JiraFile = { tickets: TicketSeed[] };

  const jiraFile = readJsonSafe<JiraFile>(path.join(FIXTURES_DIR, 'jira-tickets.json'));
  const jiraTickets: TicketSeed[] = jiraFile?.tickets ?? [];

  for (const t of jiraTickets) {
    await prisma.jiraTicket.upsert({
      where: { tenantId_externalId: { tenantId, externalId: t.id } },
      update: {
        title: t.title,
        estimatedPoints: t.estimatedPoints,
        actualPoints: t.actualPoints,
        assigneePseudonym: t.assigneePseudonym,
        labels: t.labels,
        sprint: t.sprint,
        status: t.status,
      },
      create: {
        tenantId,
        externalId: t.id,
        title: t.title,
        estimatedPoints: t.estimatedPoints,
        actualPoints: t.actualPoints,
        assigneePseudonym: t.assigneePseudonym,
        labels: t.labels,
        sprint: t.sprint,
        status: t.status,
      },
    });
  }

  // ─── GitRepository from fixtures/git-metadata.json ───────────────────────
  type GitRepo = {
    name: string;
    defaultBranch: string;
    language: string;
    framework: string;
    totalCommits: number;
    activeBranches: number;
    openPRs: number;
    codeOwners: string[];
  };
  type GitMetaFile = {
    repositories: GitRepo[];
    dependencies: Prisma.InputJsonValue;
    staticAnalysis: Prisma.InputJsonValue;
  };

  const gitMetaFile = readJsonSafe<GitMetaFile>(path.join(FIXTURES_DIR, 'git-metadata.json'));
  const gitRepo = gitMetaFile?.repositories?.[0];

  await prisma.gitRepository.upsert({
    where: { tenantId_name: { tenantId, name: gitRepo?.name ?? 'customer-portal-frontend' } },
    update: {},
    create: {
      tenantId,
      name: gitRepo?.name ?? 'customer-portal-frontend',
      defaultBranch: gitRepo?.defaultBranch ?? 'main',
      language: gitRepo?.language ?? 'TypeScript',
      framework: gitRepo?.framework ?? 'Angular 16',
      metadata: gitRepo
        ? ({ totalCommits: gitRepo.totalCommits, activeBranches: gitRepo.activeBranches, openPRs: gitRepo.openPRs, codeOwners: gitRepo.codeOwners } as Prisma.InputJsonValue)
        : ({} as Prisma.InputJsonValue),
      staticAnalysis: gitMetaFile?.staticAnalysis ?? {},
      dependencies: gitMetaFile?.dependencies ?? {},
    },
  });

  // ─── Scenarios from config/scenarios.json ────────────────────────────────
  type ScenarioSeed = {
    id: string;
    name: string;
    description: string;
    category: string;
    baseEffortPoints: number;
    applicableLabels?: string[];
    riskFactors?: string[];
    assumptions?: string[];
    expectedOutcome?: string;
  };
  type ScenariosFile = { scenarios: ScenarioSeed[] };

  const scenariosFile = readJsonSafe<ScenariosFile>(path.join(CONFIG_DIR, 'scenarios.json'));
  const scenarios: ScenarioSeed[] =
    scenariosFile?.scenarios ??
    [
      {
        id: 'angular-migration-full',
        name: 'AngularJS → Angular 17 (Full Rewrite)',
        description: 'Replace the entire customer portal with a green-field Angular 17 SPA.',
        category: 'migration',
        baseEffortPoints: 540,
        applicableLabels: ['migration', 'standalone', 'signals', 'tech-debt', 'refactor'],
      },
      {
        id: 'angular-migration-interim',
        name: 'AngularJS → Angular 17 (Interim Releases)',
        description: 'Strangler-pattern incremental migration with quarterly interim releases.',
        category: 'migration',
        baseEffortPoints: 720,
        applicableLabels: ['migration', 'standalone', 'auth', 'payments', 'tech-debt'],
      },
    ];

  for (const s of scenarios) {
    const config: Prisma.InputJsonValue = {
      applicableLabels: s.applicableLabels ?? [],
      riskFactors: s.riskFactors ?? [],
      assumptions: s.assumptions ?? [],
      expectedOutcome: s.expectedOutcome ?? '',
    };
    await prisma.scenario.upsert({
      where: { tenantId_externalId: { tenantId, externalId: s.id } },
      update: { name: s.name, description: s.description, category: s.category, baseEffortPoints: s.baseEffortPoints, config },
      create: { tenantId, externalId: s.id, name: s.name, description: s.description, category: s.category, baseEffortPoints: s.baseEffortPoints, config },
    });
  }

  // ─── MultiplierConfig from config/multipliers.json ───────────────────────
  const multipliersConfig =
    readJsonSafe<Prisma.InputJsonValue>(path.join(CONFIG_DIR, 'multipliers.json')) ??
    ({
      labelOverrunMultipliers: { migration: 1.3, refactor: 1.15, 'tech-debt': 1.2, standalone: 1.25, signals: 1.3, auth: 1.15, bug: 1.05, feature: 1.1 },
      complexityMultipliers: { multiMajorVersionJump: 1.4, singleMajorVersionJump: 1.2, lowTestCoverage: 1.15, circularDependencyHigh: 1.1 },
      teamCapacityFactors: { seniorRatio: { above60pct: 0.85, '40to60pct': 1.0, below40pct: 1.15 }, signalsExperiencePresent: 0.9, signalsExperienceAbsent: 1.1, domainExpertOnTeam: 0.9, noDomainExpert: 1.1 },
      costBandMonthlyRates: { C1: 225000, C2: 270000, C3: 310000, C4: 355000, C5: 400000 },
      sprintCapacityPointsPerDev: 10,
      weeksPerSprint: 2,
    } as Prisma.InputJsonValue);

  await prisma.multiplierConfig.upsert({
    where: { tenantId_version: { tenantId, version: '1.0.0' } },
    update: { config: multipliersConfig, isActive: true },
    create: { tenantId, version: '1.0.0', config: multipliersConfig, isActive: true },
  });

  // ─── AiCache — 5 entries from data/cache/ JSON files ─────────────────────
  // cacheKey matches exactly what AiService uses so the cache is warm on first request:
  //   parseIngestion uses key `ingestion:${source}` for exact lookup
  //   chat() uses no cacheKey for debate (relies on DebateResult table instead)
  function loadCacheFile(filename: string): Prisma.InputJsonValue {
    const raw = readJsonSafe<Record<string, unknown>>(path.join(CACHE_DIR, filename));
    if (!raw) return {};
    const { _meta: _, ...data } = raw;
    return data as Prisma.InputJsonValue;
  }

  const aiCacheEntries: { cacheKey: string; cacheType: AiCacheType; data: Prisma.InputJsonValue }[] = [
    { cacheKey: 'ingestion:jira', cacheType: AiCacheType.INGESTION_JIRA, data: loadCacheFile('ai-ingestion-jira.json') },
    { cacheKey: 'ingestion:git', cacheType: AiCacheType.INGESTION_GIT, data: loadCacheFile('ai-ingestion-git.json') },
    { cacheKey: 'ingestion:hrms', cacheType: AiCacheType.INGESTION_HRMS, data: loadCacheFile('ai-ingestion-hrms.json') },
    { cacheKey: 'debate:angular-migration-full', cacheType: AiCacheType.DEBATE, data: loadCacheFile('ai-debate-angular-migration-full.json') },
    { cacheKey: 'debate:angular-migration-interim', cacheType: AiCacheType.DEBATE, data: loadCacheFile('ai-debate-angular-migration-interim.json') },
  ];

  // Remove any legacy keys from earlier seed versions
  const legacyKeys = ['ingestion:jira:customer-portal', 'ingestion:git:customer-portal-frontend', 'ingestion:hrms:vectorfin'];
  await prisma.aiCache.deleteMany({ where: { tenantId, cacheKey: { in: legacyKeys } } });

  // 1-year expiry so fixture data never expires during demos/testing
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  for (const entry of aiCacheEntries) {
    await prisma.aiCache.upsert({
      where: { tenantId_cacheKey: { tenantId, cacheKey: entry.cacheKey } },
      update: { cacheType: entry.cacheType, data: entry.data, expiresAt },
      create: { tenantId, cacheKey: entry.cacheKey, cacheType: entry.cacheType, data: entry.data, expiresAt },
    });
  }

  // ─── DebateResult fixtures — authoritative pre-computed results ───────────
  // These are read by ForecastService.runForecast() via debateResult.frictionFactor
  type DebateCacheFile = {
    frictionFactor: number;
    confidenceScore: number;
    keyRisks: Prisma.InputJsonValue;
    debateLog: Prisma.InputJsonValue;
  };

  const debateFixtures = [
    { externalId: 'angular-migration-full', file: 'ai-debate-angular-migration-full.json' },
    { externalId: 'angular-migration-interim', file: 'ai-debate-angular-migration-interim.json' },
  ];

  for (const { externalId, file } of debateFixtures) {
    const raw = readJsonSafe<DebateCacheFile>(path.join(CACHE_DIR, file));

    const frictionFactor = raw?.frictionFactor ?? 1.0;
    const confidenceScore = raw?.confidenceScore ?? 0.5;
    const keyRisks = (raw?.keyRisks ?? []) as Prisma.InputJsonValue;
    const debateLog = (raw?.debateLog ?? []) as Prisma.InputJsonValue;

    // Delete stale fixture rows and recreate with correct values (idempotent)
    await prisma.debateResult.deleteMany({ where: { tenantId, scenarioExternalId: externalId, isFixture: true } });
    await prisma.debateResult.create({
      data: { tenantId, scenarioExternalId: externalId, frictionFactor, confidenceScore, keyRisks, debateLog, isFixture: true },
    });
  }

  // ─── Allocations — representative team assignments for both scenarios ──────
  // Needed so /brief can show a populated team and compute a forecast.
  const allocationData: { devPseudonym: string; scenarioExternalId: string; allocationPercent: number }[] = [
    // angular-migration-full: 8 devs
    { devPseudonym: 'DEV_01', scenarioExternalId: 'angular-migration-full', allocationPercent: 100 },
    { devPseudonym: 'DEV_02', scenarioExternalId: 'angular-migration-full', allocationPercent: 80 },
    { devPseudonym: 'DEV_03', scenarioExternalId: 'angular-migration-full', allocationPercent: 100 },
    { devPseudonym: 'DEV_04', scenarioExternalId: 'angular-migration-full', allocationPercent: 60 },
    { devPseudonym: 'DEV_05', scenarioExternalId: 'angular-migration-full', allocationPercent: 80 },
    { devPseudonym: 'DEV_07', scenarioExternalId: 'angular-migration-full', allocationPercent: 100 },
    { devPseudonym: 'DEV_09', scenarioExternalId: 'angular-migration-full', allocationPercent: 60 },
    { devPseudonym: 'DEV_11', scenarioExternalId: 'angular-migration-full', allocationPercent: 50 },
    // angular-migration-interim: 6 devs (different mix)
    { devPseudonym: 'DEV_01', scenarioExternalId: 'angular-migration-interim', allocationPercent: 50 },
    { devPseudonym: 'DEV_03', scenarioExternalId: 'angular-migration-interim', allocationPercent: 50 },
    { devPseudonym: 'DEV_06', scenarioExternalId: 'angular-migration-interim', allocationPercent: 80 },
    { devPseudonym: 'DEV_08', scenarioExternalId: 'angular-migration-interim', allocationPercent: 80 },
    { devPseudonym: 'DEV_10', scenarioExternalId: 'angular-migration-interim', allocationPercent: 60 },
    { devPseudonym: 'DEV_12', scenarioExternalId: 'angular-migration-interim', allocationPercent: 100 },
  ];

  for (const a of allocationData) {
    await prisma.allocation.upsert({
      where: { tenantId_devPseudonym_scenarioExternalId: { tenantId, devPseudonym: a.devPseudonym, scenarioExternalId: a.scenarioExternalId } },
      update: { allocationPercent: a.allocationPercent },
      create: { tenantId, devPseudonym: a.devPseudonym, scenarioExternalId: a.scenarioExternalId, allocationPercent: a.allocationPercent },
    });
  }
}

async function main() {
  console.log('Seeding permissions…');
  const allPerms = await upsertPermissions();

  console.log('Seeding tenants…');
  const vectorfin = await upsertTenant({ name: 'Vector Finance Tech', slug: 'vectorfin', brandName: 'Vector Finance Tech', primaryColor: '#2563EB', plan: Plan.ENTERPRISE });
  await upsertTenant({ name: 'Demo Corp', slug: 'demo', brandName: 'Demo Corp', primaryColor: '#2563EB', plan: Plan.FREE });

  console.log('Seeding roles + permissions per tenant…');
  const vfRoles = await syncSystemRoles(vectorfin.id, allPerms);
  const demo = await prisma.tenant.findUnique({ where: { slug: 'demo' } });
  if (demo) await syncSystemRoles(demo.id, allPerms);

  console.log('Seeding users + memberships…');
  await upsertUserWithMembership('admin@vectorfin.example', 'Vector', 'Admin', 'changeme', vectorfin.id, vfRoles['super_admin']);
  await upsertUserWithMembership('em@vectorfin.example', 'Vector', 'EM', 'changeme', vectorfin.id, vfRoles['engineering_manager']);
  await upsertUserWithMembership('viewer@vectorfin.example', 'Vector', 'Viewer', 'changeme', vectorfin.id, vfRoles['viewer']);

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
