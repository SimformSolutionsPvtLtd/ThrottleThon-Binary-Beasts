# Backend — Claude Code Prompts (Copy-Paste Ready)

> **How to use:** Open Claude Code in your `backend/` folder. Copy-paste ONE prompt at a time. Wait for it to finish. Test. Commit. Move to next prompt.
> Prompts reference `ai-prompt/BE-tasks.md` for context — make sure that file exists in your backend folder.

---

## PROMPT 1 — Phase 0: Multi-Tenant RBAC Foundation

```
Read the file ai-prompt/BE-tasks.md for full project context. We are building SmarterSprint — a multi-tenant white-label SaaS for engineering decision support.

This is Phase 0. Nothing exists yet except package.json and a bare NestJS scaffold. Implement the COMPLETE multi-tenant RBAC foundation.

IMPORTANT CONSTRAINTS:
- Tech stack: NestJS 10, Prisma 5, PostgreSQL, Redis (ioredis), BullMQ, Passport JWT, Winston, Swagger, Zod, class-validator/class-transformer
- Every single database table MUST have a tenantId foreign key (except User and Permission which are global)
- All queries MUST be scoped to the current tenant — no exceptions
- Passwords: bcrypt 12 rounds
- JWT access tokens: 15 min expiry, refresh tokens: 7 days
- No localStorage/sessionStorage on frontend — tokens are in-memory only (this affects our cookie strategy)

IMPLEMENT THE FOLLOWING:

### 1. Prisma Schema (prisma/schema.prisma)
Create ALL these models with PostgreSQL datasource:

**Global models (no tenantId):**
- User: id (cuid), email (unique), passwordHash, firstName, lastName, isActive, timestamps
- Permission: id (cuid), action (unique, e.g. "forecast:read"), description

**Tenant-scoped models:**
- Tenant: id, name, slug (unique), logoUrl?, primaryColor, brandName, plan (enum FREE/STARTER/ENTERPRISE), settings (Json), isActive, timestamps
- TenantMembership: id, userId→User, tenantId→Tenant, roleId→Role, isActive, joinedAt. Unique [userId, tenantId]
- Role: id, tenantId→Tenant, name, description, isSystem (default false). Unique [tenantId, name]
- RolePermission: roleId→Role, permissionId→Permission. Unique [roleId, permissionId]
- RefreshToken: id, userId→User, tenantId→Tenant, tokenHash, expiresAt, isRevoked, createdAt

**Data models (all tenant-scoped):**
- Developer: id, tenantId→Tenant, pseudonym, role, department, tenureYears (Float), costBand (enum C1/C2/C3/C4/C5), skills (Json), currentAllocation (Json), isActive. Unique [tenantId, pseudonym]
- PseudonymMap: id, tenantId→Tenant, pseudonym, realName, email. Unique [tenantId, pseudonym]
- JiraTicket: id, tenantId→Tenant, externalId, title, estimatedPoints (Int), actualPoints (Int), assigneePseudonym, labels (String[]), sprint, status. Unique [tenantId, externalId]
- GitRepository: id, tenantId→Tenant, name, defaultBranch, language, framework, metadata (Json), staticAnalysis (Json), dependencies (Json), createdAt
- Scenario: id, tenantId→Tenant, externalId, name, description, category, baseEffortPoints (Int), config (Json), isActive. Unique [tenantId, externalId]
- MultiplierConfig: id, tenantId→Tenant, version, config (Json), isActive. Unique [tenantId, version]
- Allocation: id, tenantId→Tenant, devPseudonym, scenarioExternalId, allocationPercent (Int), createdAt, updatedAt. Unique [tenantId, devPseudonym, scenarioExternalId]
- AiCache: id, tenantId→Tenant, cacheKey, cacheType (enum INGESTION_JIRA/INGESTION_GIT/INGESTION_HRMS/DEBATE), data (Json), expiresAt. Unique [tenantId, cacheKey]
- DebateResult: id, tenantId→Tenant, scenarioExternalId, frictionFactor (Float), confidenceScore (Float), keyRisks (Json), debateLog (Json), isFixture (Boolean), createdAt
- ForecastResult: id, tenantId→Tenant, scenarioExternalId, parameters (Json), result (Json), createdAt
- AuditLog: id, tenantId→Tenant, userId?, action, resource, details (Json), piiSanitised (Boolean default true), ipAddress?, createdAt

Use @@map for snake_case table names, @map for snake_case columns.
Add indexes on every tenantId FK, plus [tenantId, cacheKey, expiresAt] on AiCache, [tenantId, createdAt] on AuditLog, [tenantId, sprint] on JiraTicket.

### 2. Seed Script (prisma/seed.ts)
Create an idempotent seed that:
- Creates permissions: forecast:read, forecast:write, debate:run, debate:read, identity-map:read, allocations:read, allocations:write, brief:generate, developers:read, developers:write, scenarios:read, scenarios:write, tenant:manage, users:manage, audit:read, ingestion:trigger, ingestion:read
- Creates tenant "Vector Finance Tech" (slug: vectorfin, plan: ENTERPRISE, primaryColor: #2563EB)
- Creates tenant "Demo Corp" (slug: demo, plan: FREE)
- For each tenant creates system roles:
  - super_admin: ALL permissions
  - admin: all except tenant:manage
  - engineering_manager: forecast:read, debate:run, debate:read, identity-map:read, allocations:read, allocations:write, brief:generate, developers:read, scenarios:read, ingestion:trigger, ingestion:read
  - viewer: forecast:read, debate:read, developers:read, scenarios:read, allocations:read, ingestion:read
- Creates admin user: admin@vectorfin.example / changeme (bcrypt hashed) with super_admin role in vectorfin tenant
- Creates viewer user: viewer@vectorfin.example / changeme with viewer role
- Creates em user: em@vectorfin.example / changeme with engineering_manager role

Seed fixture data for vectorfin tenant (read the data from data/fixtures/ directory — I will place the JSON files there):
- 12 Developers with pseudonyms DEV_01 through DEV_12
- 60 JiraTickets (PORTAL-1001 through PORTAL-1060)
- 1 GitRepository (customer-portal-frontend)
- 2 Scenarios (angular-migration-full, angular-migration-interim)
- 1 MultiplierConfig (version 1.0.0)
- 12 PseudonymMap entries
- Pre-computed AiCache entries for all 5 cache types (jira, git, hrms ingestion + 2 debate results)

Use upsert on unique constraints so the seed is idempotent.

### 3. Auth Module (src/modules/auth/)
Create:
- auth.module.ts: imports PassportModule, JwtModule (async from ConfigService)
- auth.service.ts:
  - login(email, password, tenantSlug) → validates creds, checks membership in tenant, returns { accessToken, refreshToken, user: { id, email, firstName, lastName, tenantId, tenantSlug, roleName, permissions: string[] }, tenantBranding: { brandName, primaryColor, logoUrl } }
  - refresh(refreshTokenString) → verifies stored hash, issues new tokens
  - getProfile(userId, tenantId) → returns user + role + permissions + tenant info
  - getUserTenants(userId) → returns array of { tenantId, tenantSlug, tenantName, roleName } for tenant switcher
- jwt.strategy.ts: extracts bearer token, validates, attaches { sub, email, tenantId, tenantSlug, roleName, permissions[] } to request
- auth.controller.ts:
  - POST /api/v1/auth/login body: { email: string, password: string, tenantSlug: string }
  - POST /api/v1/auth/refresh body: { refreshToken: string }
  - GET /api/v1/auth/me → current user profile
  - GET /api/v1/auth/tenants → list of tenants current user belongs to (for tenant switcher)

### 4. Decorators & Guards (src/common/)
- @CurrentUser() parameter decorator → extracts user from request
- @CurrentTenant() parameter decorator → extracts tenantId from JWT user
- @RequirePermissions('forecast:read') method decorator
- @Public() decorator → bypasses JwtAuthGuard
- JwtAuthGuard (global, with @Public() bypass)
- PermissionsGuard → checks @RequirePermissions against user.permissions[]
- TenantGuard → ensures JWT tenantId matches request context

### 5. Tenant Module (src/modules/tenant/)
- GET /api/v1/tenants/branding?slug=vectorfin → @Public(), returns { brandName, primaryColor, logoUrl, slug } (FE calls this BEFORE login for white-label theming)
- GET /api/v1/tenants/current → current tenant details (authenticated)
- PATCH /api/v1/tenants/current → update branding/settings (requires tenant:manage)
- GET /api/v1/tenants/current/members → list members with roles (requires users:manage)
- POST /api/v1/tenants/current/members → invite/add member (requires users:manage)
- PATCH /api/v1/tenants/current/members/:userId → change role (requires users:manage)
- DELETE /api/v1/tenants/current/members/:userId → deactivate (requires users:manage)

### 6. Global Setup (src/main.ts, src/app.module.ts)
- Helmet security headers
- CORS (configurable via CORS_ORIGINS env, default http://localhost:4200)
- Global validation pipe (class-validator, whitelist: true, transform: true)
- Winston logger (structured JSON, log levels from env)
- Swagger at /api/docs with bearer auth
- Global exception filter: maps Prisma/Zod/HTTP errors to { statusCode, message, error, timestamp, path } — NEVER expose stack traces
- Register JwtAuthGuard as global guard

### 7. Environment
Create .env.example:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smartersprint
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
GEMINI_API_KEY=
CORS_ORIGINS=http://localhost:4200
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

Create src/common/constants/permissions.ts with typed enum of all permission strings.
Create src/common/constants/roles.ts with the system role definitions.

Add Swagger decorators (@ApiTags, @ApiBearerAuth, @ApiOperation, @ApiResponse) to ALL controllers.
Add class-validator decorators to ALL DTOs.

After implementation, the following must work:
1. npx prisma validate → no errors
2. npx prisma migrate dev --name init → creates all tables
3. npx ts-node prisma/seed.ts → seeds without errors, runs twice without duplicates
4. POST /api/v1/auth/login with admin creds → returns JWT
5. GET /api/v1/auth/me with that JWT → returns user profile
6. GET /api/v1/tenants/branding?slug=vectorfin without auth → returns branding
7. GET /api/v1/tenants/current/members with admin JWT → returns member list
8. GET /api/v1/tenants/current/members with viewer JWT → returns 403
```

---

## PROMPT 2 — Phase 1: Core Data API (Sandbox Mode)

```
Read ai-prompt/BE-tasks.md Phase 1 for context.

Phase 0 is complete. We have: Prisma schema with all models, seeded data (12 devs, 60 tickets, 1 repo, 2 scenarios, multiplier config, pseudonym map, AI cache), auth module with JWT, tenant module with branding, guards, decorators.

Now implement Phase 1: Core Data API endpoints that serve fixture/seeded data. All endpoints are tenant-scoped using @CurrentTenant().

### 1. Status Module (src/modules/status/)
GET /api/v1/status — any authenticated user
Response:
{
  tenant: { name, slug, plan },
  sources: {
    git: { mode: "sandbox", repoCount: number, lastSyncAt: null },
    jira: { mode: "sandbox", ticketCount: number, sprintCount: number (count distinct sprint values), lastSyncAt: null },
    hrms: { mode: "sandbox", employeeCount: number, lastSyncAt: null }
  }
}
Counts come from Prisma count queries filtered by tenantId.

### 2. Scenarios Module (src/modules/scenarios/)
- GET /api/v1/scenarios — list all active scenarios for current tenant. Returns array of { id, externalId, name, description, category, baseEffortPoints, config, isActive }. Requires: scenarios:read
- GET /api/v1/scenarios/:externalId — single scenario with full config. Requires: scenarios:read
- POST /api/v1/scenarios — create new scenario. Body: { externalId, name, description, category, baseEffortPoints, config: { riskFactors: string[], assumptions: string[], applicableLabels: string[], expectedOutcome: string } }. Requires: scenarios:write
- PATCH /api/v1/scenarios/:externalId — update scenario. Requires: scenarios:write
- DELETE /api/v1/scenarios/:externalId — soft delete (isActive=false). Requires: scenarios:write

### 3. Developers Module (src/modules/developers/)
- GET /api/v1/developers — all active developers for current tenant. Response: array of { pseudonym, role, department, tenureYears, costBand, skills: [{tech, proficiency, source}], currentAllocation: {project, percent}, isActive }. NEVER include realName or email. Requires: developers:read
- GET /api/v1/developers/:pseudonym — single developer. Requires: developers:read
- GET /api/v1/developers/bench — developers with totalAllocation < 100%. For each developer, compute available allocation = 100 - sum of all Allocation records for this dev. Response includes availablePercent field. Requires: developers:read
- POST /api/v1/developers — add developer (for admin data management). Requires: developers:write
- PATCH /api/v1/developers/:pseudonym — update developer. Requires: developers:write

### 4. Jira Tickets Module (src/modules/tickets/)
- GET /api/v1/tickets — paginated list of tickets for current tenant. Query params: sprint?, labels[]?, assigneePseudonym?, page=1, limit=20. Requires: ingestion:read
- GET /api/v1/tickets/stats — aggregated stats: { totalTickets, totalSprints, avgOverrunRatio, labelBreakdown: [{label, count, avgOverrun}] }. Requires: ingestion:read

### 5. Git Repository Module (src/modules/git-repos/)
- GET /api/v1/git-repos — list repos for current tenant. Requires: ingestion:read
- GET /api/v1/git-repos/:id — single repo with full metadata, staticAnalysis, dependencies. Requires: ingestion:read

### 6. PII Sanitiser (src/common/services/pii-sanitiser.service.ts)
@Global() @Injectable()
- sanitise(payload: any, tenantId: string): scans for PII (matches against PseudonymMap entries, email regex, salary patterns). Returns { sanitisedPayload, report: { fieldsChecked: number, piiFound: number, piiReplaced: number, clean: boolean } }
- This will be used before every AI call in Phase 3

### 7. Audit Log Service (src/common/services/audit-log.service.ts)
@Global() @Injectable()
- log(entry: { tenantId, userId?, action, resource, details?: Json, piiSanitised?: boolean, ipAddress?: string }): writes to AuditLog via Prisma
- GET /api/v1/audit-logs — paginated, filterable. Query: page, limit, action?, startDate?, endDate?. Requires: audit:read

Add Swagger decorators and class-validator DTOs to ALL new endpoints.
Write unit tests for PII sanitiser: test that real names from PseudonymMap are replaced with pseudonyms, emails are stripped, clean objects pass.

After implementation:
1. GET /api/v1/status → returns counts (12 employees, 60 tickets, 1 repo)
2. GET /api/v1/scenarios → returns 2 scenarios
3. GET /api/v1/developers → returns 12 devs with NO real names
4. GET /api/v1/developers/bench → returns only devs with available allocation
5. GET /api/v1/tickets/stats → returns aggregated overrun stats
6. GET /api/v1/audit-logs → returns audit entries
7. PII sanitiser tests pass
```

---

## PROMPT 3 — Phase 2: Deterministic Forecast Engine

```
Read ai-prompt/BE-tasks.md Phase 2 for context.

Phase 0 and 1 are complete. We have auth, tenant, status, scenarios, developers, tickets, git-repos, PII sanitiser, and audit logging.

Now implement Phase 2: The deterministic forecast engine. This is the HOT PATH — <100ms response time, zero AI, zero I/O, pure math.

### 1. Forecast Engine — Pure Functions (src/modules/forecast/forecast-engine.ts)
This file must have ZERO NestJS imports, ZERO injected services. Pure exported functions only.

Types:
interface ForecastInput {
  scenario: { externalId: string; baseEffortPoints: number; applicableLabels: string[] };
  allocations: Array<{ devPseudonym: string; costBand: 'C1'|'C2'|'C3'|'C4'|'C5'; allocationPercent: number; skills: Array<{tech: string; proficiency: number}> }>;
  multipliers: {
    labelOverrunMultipliers: Record<string, number>;
    complexityMultipliers: Record<string, number>;
    teamCapacityFactors: { seniorRatio: Record<string, number>; signalsExperiencePresent: number; signalsExperienceAbsent: number; domainExpertOnTeam: number; noDomainExpert: number };
    costBandMonthlyRates: Record<string, number>;
    sprintCapacityPointsPerDev: number;
    weeksPerSprint: number;
  };
  sliders: { priorityPressure: number; scopePercent: number; contingencyBuffer: number };
  debateOutput: { frictionFactor: number; confidenceScore: number };
}

interface ForecastResult {
  scenarioId: string;
  adjustedEffortPoints: number;
  projectTimelineWeeks: number;
  projectCost: number;
  riskAdjustedCost: number;
  confidenceScore: number;
  breakdown: { baseEffort: number; labelMultiplier: number; complexityMultiplier: number; teamCapacityFactor: number; frictionFactor: number; priorityPressure: number; scopeMultiplier: number; contingencyMultiplier: number; sprintCapacity: number; monthlyTeamCost: number };
}

Formulas:
- labelMultiplier = weighted avg of labelOverrunMultipliers for scenario's applicableLabels (fallback 1.0 for unknown labels)
- complexityMultiplier = product of applicable complexity factors. Apply: multiMajorVersionJump if scenario is "angular-migration-full", singleMajorVersionJump if "interim". Always apply lowTestCoverage and circularDependencyHigh.
- teamCapacityFactor = seniorRatio factor × signalsExperience factor × domainExpert factor. Senior ratio = count of C4+C5 devs / total allocated devs. If >60% → above60pct multiplier, 40-60% → 40to60pct, <40% → below40pct. If any allocated dev has "Angular Signals" skill → signalsExperiencePresent, else signalsExperienceAbsent. If any has domain-relevant skill → domainExpertOnTeam, else noDomainExpert.
- adjustedEffort = baseEffortPoints × labelMultiplier × complexityMultiplier × teamCapacityFactor × frictionFactor × priorityPressure × (scopePercent/100) × (1 + contingencyBuffer)
- sprintCapacity = sum(each dev's allocationPercent/100 × sprintCapacityPointsPerDev). If 0 → return error.
- timelineWeeks = (adjustedEffort / sprintCapacity) × weeksPerSprint
- monthlyTeamCost = sum(each dev's costBandMonthlyRates[costBand] × allocationPercent/100)
- projectCost = monthlyTeamCost × (timelineWeeks / 4.33)
- riskAdjustedCost = projectCost × (1 + (1 - confidenceScore) × 0.5)

CRITICAL: All intermediate rounding uses: Math.round(x * 100) / 100. This ensures determinism.
Export: computeForecast(input: ForecastInput): ForecastResult
Export: compareForecasts(results: ForecastResult[]): { winner: { scenarioId: string; reason: string } }

### 2. Forecast Service (src/modules/forecast/forecast.service.ts)
NestJS injectable service that:
- On module init: loads MultiplierConfig and Developer data from Prisma into memory Maps
- computeForecast(tenantId, dto): assembles ForecastInput from DB data + dto params, calls the pure function
- compareScenarios(tenantId, dto): runs forecast for each scenario, determines winner
- invalidateCache(tenantId): reloads from DB (call when config changes)

### 3. Forecast Controller (src/modules/forecast/forecast.controller.ts)
POST /api/v1/forecast
Body (validate with class-validator AND Zod):
{
  scenarioIds: string[] (1-5 items),
  priorityPressure: number (0.5-2.0),
  scopePercent: number (50-150),
  contingencyBuffer: number (0-0.30),
  allocations: Array<{ devPseudonym: string, scenarioExternalId: string, allocationPercent: number (1-100) }>
}
Response: { results: ForecastResult[], winner: { scenarioId, reason } }
Requires: forecast:read

### 4. Allocations Module (src/modules/allocations/)
- GET /api/v1/allocations?scenarioExternalId= — current allocations for tenant. Requires: allocations:read
- POST /api/v1/allocations — body: { devPseudonym, scenarioExternalId, allocationPercent }. Validates: dev exists, total allocation across ALL scenarios for this dev ≤ 100. If over → 400 "DEV_XX is allocated NN% elsewhere. Available: MM%". On success: upsert Allocation record, return { allocation, forecast: ForecastResult }. Requires: allocations:write
- POST /api/v1/allocations/bulk — body: { allocations: Array<{devPseudonym, scenarioExternalId, allocationPercent}> }. Same validation per item. Requires: allocations:write
- DELETE /api/v1/allocations/:scenarioExternalId/:devPseudonym — remove single allocation. Requires: allocations:write
- DELETE /api/v1/allocations/scenario/:scenarioExternalId — reset all allocations for a scenario. Requires: allocations:write

### 5. Determinism Unit Tests (src/modules/forecast/forecast-engine.spec.ts)
Write 15 tests:
1-2. Same inputs 100 times → identical hash
3. Zero allocations → graceful error (not NaN/Infinity)
4. Single dev at 100% → correct math
5. All devs at 100% → minimum timeline
6. contingencyBuffer=0 → riskAdjustedCost = projectCost × confidence factor only
7. priorityPressure=2.0 → doubles adjustedEffort
8. scopePercent=50 → halves adjustedEffort
9. frictionFactor=1.0 → no friction applied
10. frictionFactor=2.1 → adjustedEffort × 2.1
11. All C5 devs → higher cost than all C1 for same timeline
12. Adding a dev → reduces timeline
13. Removing a dev → increases timeline
14. Two scenarios → correct winner identified
15. allocationPercent=1 → very long timeline but no crash

After implementation:
1. npm test → all 15 determinism tests pass
2. POST /api/v1/forecast → returns in <100ms
3. Same forecast request 10 times → all responses byte-identical
4. POST /api/v1/allocations with valid data → returns allocation + forecast
5. POST /api/v1/allocations for over-allocated dev → returns 400 with clear message
```

---

## PROMPT 4 — Phase 3: AI Integration (Gemini + Debate)

```
Read ai-prompt/BE-tasks.md Phase 3 for context.

Phases 0-2 complete. We have full RBAC, data API, deterministic forecast engine with allocations.

Now implement Phase 3: AI Integration — Gemini structured-output parsing and the 4-agent adversarial debate.

### 1. AI Provider Interface (src/modules/ai/interfaces/ai-provider.interface.ts)
```typescript
export interface AiProvider {
  parseIngestion(source: 'jira' | 'git' | 'hrms', sanitisedData: any, schema: any): Promise<{ data: any; meta: AiMeta }>;
  chat(systemPrompt: string, userContent: string, responseSchema: any): Promise<{ content: any; meta: AiMeta }>;
}
export interface AiMeta { mode: 'live' | 'fixture' | 'cached'; durationMs: number; tokensUsed?: number; model?: string; }
```

### 2. Gemini Provider (src/modules/ai/providers/gemini.provider.ts)
- Uses @google/generative-ai SDK (install it: npm install @google/generative-ai)
- Model: gemini-2.0-flash (or gemini-1.5-flash as fallback)
- All calls use: generationConfig: { responseMimeType: 'application/json', responseSchema }
- parseIngestion: builds a system prompt per source type, sends sanitised data, validates response with Zod
- chat: generic method for debate agent calls
- Timeout: configurable, default 15 seconds per call
- On any error: throw, let the AI service handle fallback

### 3. Fixture Provider (src/modules/ai/providers/fixture.provider.ts)
- Reads from AiCache table (Prisma) for the current tenant
- Returns seeded fixture data with meta: { mode: 'fixture' }
- Zero cost, instant response

### 4. AI Cache Service (src/modules/ai/ai-cache.service.ts)
- Uses Redis (ioredis) as L1 cache, Prisma AiCache table as L2
- get(tenantId, cacheKey): check Redis → if miss check Prisma → if miss return null
- set(tenantId, cacheKey, type, data, ttlHours=24): write to both Redis and Prisma
- invalidate(tenantId, cacheKey): delete from both
- invalidateAll(tenantId): clear all for tenant

### 5. AI Service (src/modules/ai/ai.service.ts)
Orchestrator that decides which provider to use:
- If GEMINI_API_KEY env is empty → FixtureProvider always
- If cache hit and not expired → return cached (regardless of provider)
- If cache miss → try GeminiProvider → on failure → FixtureProvider with warning log
- If forceRefresh=true → skip cache, try GeminiProvider
- BEFORE every Gemini call: run PiiSanitiser, write AuditLog entry confirming sanitisation
- AFTER every Gemini call: validate response with Zod, write AuditLog with result

### 6. Zod Schemas (src/modules/ai/schemas/)
Create Zod schemas for every AI response:
- jira-ingestion.schema.ts → { velocityAnalysis: { teamVelocityIndex, overallOverrunRatio, sprintBreakdown[], totalEstimatedPoints, totalActualPoints }, developerContributions: [{pseudonym, ticketsCompleted, totalEstimated, totalActual, personalOverrunRatio, topLabels}], labelOverrunAnalysis: [{label, ticketCount, totalEstimated, totalActual, overrunRatio}], insights: string[] }
- git-ingestion.schema.ts → { complexityReport: { overallComplexityScore, breakdown: {...} }, dependencyRiskAssessment: [...], migrationReadiness: {...}, gitInferredSkills: [...] }
- hrms-ingestion.schema.ts → { skillCoverageMatrix: {...}, teamComposition: {...}, migrationTeamRecommendation: {...}, riskFlags: [...] }
- debate-result.schema.ts → { frictionFactor: z.number().min(0.5).max(5.0), confidenceScore: z.number().min(0).max(1), keyRisks: z.array(z.object({ risk: z.string(), severity: z.enum(['critical','high','medium','low']), sourceAgent: z.enum(['Researcher','Opposer','WorstCase']), evidence: z.string() })), debateLog: z.array(z.object({ round: z.number(), agent: z.string(), position: z.string(), argument: z.string(), evidenceCited: z.array(z.string()) })) }

### 7. Prompt Templates (src/modules/ai/prompts/)
Create system prompts for each AI call. Each prompt must:
- Define the AI's role clearly
- Specify the exact JSON response schema expected
- Instruct to cite specific evidence (ticket IDs, metrics, commit data)
- Include the word "RESPOND ONLY WITH JSON, NO MARKDOWN, NO BACKTICKS"

Files: jira-parser.prompt.ts, git-parser.prompt.ts, hrms-parser.prompt.ts, researcher.prompt.ts, opposer.prompt.ts, worst-case.prompt.ts, synthesizer.prompt.ts

### 8. Ingestion Module (src/modules/ingestion/)
- POST /api/v1/ingest/:source (source = jira|git|hrms) → loads raw data from DB, sanitises, sends to AI, caches result, returns parsed data. Requires: ingestion:trigger
- GET /api/v1/ingest/:source/parsed?forceRefresh=false → returns cached parsed data. Requires: ingestion:read
- POST /api/v1/ingest/all → triggers all 3 in parallel, returns combined results. Requires: ingestion:trigger
Response includes: { source, mode: 'live'|'fixture'|'cached', cachedAt, data: {...} }

### 9. Agent Hub — Debate Orchestrator (src/modules/debate/agent-hub.service.ts)
Orchestrates the 4-agent debate:
Round 1 (sequential):
  1. Researcher(evidence) → researcherR1
  2. Opposer(evidence + researcherR1) → opposerR1
  3. WorstCase(evidence + researcherR1 + opposerR1) → worstCaseR1
Round 2 (each sees all of Round 1):
  4. Researcher(evidence + fullR1) → researcherR2
  5. Opposer(evidence + fullR1 + researcherR2) → opposerR2
  6. WorstCase(evidence + fullR1 + researcherR2 + opposerR2) → worstCaseR2
Synthesis:
  7. Synthesizer(evidence + fullR1 + fullR2) → DebateResult

Total: 7 sequential AI calls.
Per-call timeout: 15s. If >2 agents fail in R1: abort, use fixture.
If R2 agents fail: Synthesizer uses R1 only (lower confidence).
Validate final result with debate-result Zod schema.
Save to DebateResult table.

### 10. Debate Controller (src/modules/debate/)
- POST /api/v1/debate — body: { scenarioExternalIds: string[] }. Runs debate per scenario. Returns array of debate results. Requires: debate:run
- GET /api/v1/debate/:scenarioExternalId — latest debate result. Requires: debate:read
Response: { scenarioExternalId, frictionFactor, confidenceScore, keyRisks[], debateLog[], meta: { mode, totalDurationMs, roundsCompleted } }

After implementation:
1. POST /api/v1/ingest/jira (without GEMINI_API_KEY) → returns fixture data with mode: "fixture"
2. POST /api/v1/debate (without GEMINI_API_KEY) → returns fixture debate with mode: "fixture"
3. Audit logs show sanitisation report for each AI-bound call
4. With GEMINI_API_KEY set: real AI calls work, responses pass Zod validation
5. Cache: second call to same ingestion is instant (cached)
```

---

## PROMPT 5 — Phase 4: Identity Map, Brief, Rate Limiting, Polish

```
Read ai-prompt/BE-tasks.md Phase 4 for context.

Phases 0-3 complete. We have full RBAC, data API, forecast engine, AI ingestion, and debate.

Implement Phase 4: Sensitive endpoints, brief generation, rate limiting, and production polish.

### 1. Identity Map Module (src/modules/identity-map/)
THE MOST SENSITIVE ENDPOINT. Defense in depth.

- GET /api/v1/identity-map → returns full pseudonym→{realName, email} map for current tenant
  Requires: identity-map:read (only engineering_manager and above have this)
  Double-check permission in service layer (not just guard)
  Rate limit: max 5 requests/minute per USER (not per tenant)
  Log EVERY access to AuditLog: { action: 'identity_map_access', resource: 'full_map', userId, tenantId }
  Returns 401 if no token, 403 if insufficient permissions

- GET /api/v1/identity-map/:pseudonym → single entry
  Same permissions, same logging

### 2. Brief Module (src/modules/brief/)
POST /api/v1/brief — body: { scenarioExternalId: string, includeRealNames?: boolean }
Requires: brief:generate

Service logic:
1. Load scenario from DB
2. Load latest ForecastResult for this scenario (or compute one with defaults if none exists)
3. Load latest DebateResult for this scenario (or null if no debate run)
4. Load allocated developers for this scenario
5. If includeRealNames=true: check if user has identity-map:read permission → if yes resolve names from PseudonymMap → if no, return 403
6. Assemble brief:
{
  generatedAt: ISO string,
  tenant: { name, brandName, logoUrl },
  scenario: { name, description, category, externalId },
  forecast: { timelineWeeks, projectCost, riskAdjustedCost, confidenceScore, frictionFactor, breakdown },
  team: [{ pseudonym, realName? (only if includeRealNames), role, costBand, allocationPercent, topSkills: string[] }],
  risks: top 5 from debate keyRisks sorted by severity (or empty if no debate),
  debateSummary: string (synthesizer summary or "No debate run yet"),
  recommendation: { scenarioId: winner, reason: string } (if 2+ scenarios have forecasts)
}

### 3. Rate Limiting
Use @nestjs/throttler:
- Global default: 60 req/min per user
- POST /api/v1/forecast: 120 req/min (high-frequency slider usage)
- POST /api/v1/debate: 5 req/min per user
- POST /api/v1/ingest/*: 10 req/min
- GET /api/v1/identity-map: 5 req/min per user
- POST /api/v1/auth/login: 5 req/min per IP (brute force protection)
429 response: { statusCode: 429, message: "Too many requests. Please wait a moment.", error: "Too Many Requests" }

### 4. Health Check
GET /api/v1/health — @Public()
Returns: { status: 'ok', uptime: process.uptime(), version: from package.json, timestamp: ISO, database: 'connected'|'disconnected' (test with prisma.$queryRaw`SELECT 1`), redis: 'connected'|'disconnected' (test with redis.ping()), ai: 'available'|'fixture_mode' (check GEMINI_API_KEY) }

### 5. Global Error Handling Polish
Update the global exception filter to handle:
- PrismaClientKnownRequestError P2002 → 409 "This record already exists"
- PrismaClientKnownRequestError P2025 → 404 "Record not found"
- ZodError → 400 with readable field messages
- HttpException → pass through
- Gemini errors → 503 "AI service temporarily unavailable"
- All others → 500 "Something went wrong. Please try again."
NEVER expose: stack traces, SQL queries, internal paths, env values

### 6. Swagger Polish
Ensure every endpoint has:
- @ApiTags (grouped by module)
- @ApiBearerAuth (except @Public endpoints)
- @ApiOperation with summary and description
- @ApiResponse for 200, 400, 401, 403, 404, 429, 500
- Request body DTOs with @ApiProperty decorators showing examples

After implementation:
1. GET /api/v1/identity-map with EM token → returns map, audit log recorded
2. GET /api/v1/identity-map with viewer token → 403
3. GET /api/v1/identity-map without token → 401
4. POST /api/v1/brief → returns full brief with all sections
5. POST /api/v1/brief with includeRealNames=true as EM → brief has real names
6. 6 rapid debate requests → 6th returns 429
7. GET /api/v1/health → shows all service statuses
8. Swagger at /api/docs shows all endpoints documented
9. Bad request body → clean 400 error, no stack trace
```

---

## PROMPT 6 — Phase 5: Docker, Compose, Production Config

```
Read ai-prompt/BE-tasks.md Phase 5 for context.

Phases 0-4 complete. The entire API works locally with PostgreSQL and Redis.

Implement Phase 5: Containerisation and production deployment config.

### 1. Dockerfile (at backend/Dockerfile)
Multi-stage build:
Stage 1 "builder":
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  COPY prisma ./prisma/
  RUN npm ci
  RUN npx prisma generate
  COPY . .
  RUN npm run build

Stage 2 "production":
  FROM node:20-alpine
  WORKDIR /app
  RUN apk add --no-cache curl (for healthcheck)
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/node_modules ./node_modules
  COPY --from=builder /app/prisma ./prisma
  COPY --from=builder /app/package.json ./
  COPY --from=builder /app/data ./data  (fixture files)
  EXPOSE 3000
  HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost:3000/api/v1/health || exit 1
  CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

### 2. Docker Compose (at infra/docker/docker-compose.yml)
services:
  db:
    image: postgres:16-alpine
    environment: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
    volumes: pgdata:/var/lib/postgresql/data
    ports: 5432:5432
    healthcheck: pg_isready

  redis:
    image: redis:7-alpine
    ports: 6379:6379
    healthcheck: redis-cli ping

  backend:
    build: context: ../../backend
    depends_on: db (healthy), redis (healthy)
    ports: 3000:3000
    env_file: .env
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/smartersprint
      REDIS_URL: redis://redis:6379

  frontend:
    build: context: ../../frontend
    depends_on: backend
    ports: 4200:80

volumes:
  pgdata:

### 3. Environment files
Create infra/docker/.env.example with all variables.
Create infra/docker/.env with development defaults.

### 4. Seed on first run
Create an entrypoint script (backend/docker-entrypoint.sh):
  npx prisma migrate deploy
  npx prisma db seed (only if SEED_ON_START=true)
  node dist/main.js

### 5. Nginx config for frontend (infra/docker/nginx.conf)
Simple config that:
- Serves Angular static files from /usr/share/nginx/html
- Proxies /api/* to backend:3000
- Handles SPA routing (try_files $uri $uri/ /index.html)

After implementation:
1. docker-compose up --build → all services start
2. Backend health check passes
3. Login works via http://localhost:3000/api/v1/auth/login
4. Frontend loads via http://localhost:4200 (once FE is built)
5. Seed data present in the database
```
