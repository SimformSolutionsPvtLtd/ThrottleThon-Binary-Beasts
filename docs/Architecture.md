# Architecture

## Goals

- Enterprise-grade: secure, auditable, multi-tenant ready.
- AI-augmented decision support — **deterministic forecasts** + **probabilistic debate**.
- Modular monolith now; microservice extraction without rewrites.

## Layers (Clean Architecture)

| Layer | Responsibility | Source |
| ----- | -------------- | ------ |
| `domain/` | Entities, value-objects, domain events, repository contracts. No framework deps. | `backend/src/domain` |
| `application/` | CQRS commands/queries/handlers, application DTOs. Orchestrates domain. | `backend/src/application` |
| `infrastructure/` | Prisma, Redis, BullMQ, external HTTP, messaging. Implements ports. | `backend/src/infrastructure` |
| `modules/` | HTTP/feature surface — controllers, services, DTOs. | `backend/src/modules` |
| `common/` | Cross-cutting: guards, interceptors, filters, decorators. | `backend/src/common` |
| `config/` | Env-typed config registration + Zod validation. | `backend/src/config` |

Dependencies flow inward only: `modules → application → domain`; `infrastructure → domain`. The domain never imports outward.

## Patterns

- **DDD** — bounded contexts: Auth/Users, Projects, Scenarios, Forecast, Debate, Allocations, Reports, Integrations, Audit.
- **CQRS** — command and query handlers (`@nestjs/cqrs`), distinct write/read paths where load justifies.
- **Repository** — Prisma is hidden behind repository contracts; domain code talks to interfaces.
- **Event-Driven** — `EventEmitter2` for in-process domain events; BullMQ (Redis) for jobs that escape the request scope (AI calls, report rendering, integration sync).
- **Adapter** — every external system (GitHub/GitLab/Bitbucket/Jira/Zoho Projects/BambooHR/Zoho People/Workday) implements a thin port interface.

## Deterministic Forecast vs Probabilistic Debate

Two engines, intentionally separated:

- **Forecast Engine** (`modules/forecast/engines/*`) — *pure functions*. Given inputs, output is byte-identical across runs. No AI calls. Testable, auditable, reproducible. Used wherever the answer must be defensible to finance/legal.
- **Debate Engine** (`modules/debate`) — multi-agent (Researcher → Opponent → WorstCase → Synthesizer) over an `AIProvider` port. Output is non-deterministic and stored verbatim (transcript + structured risks). Used for qualitative pressure-testing, not for billing.

## Authentication & Authorization

- JWT access (`15m`) + refresh (`7d`); refresh token hashed at rest.
- Role hierarchy: `ADMIN > CTO/CFO/CEO > ENGINEERING_MANAGER > USER`.
- Permission grid (`common/constants/roles.enum.ts`) drives route-level `@Permissions(...)`.
- Global guards: `ThrottlerGuard`, `JwtAuthGuard`, `RolesGuard`. Public routes opt out via `@Public()`.

## Multi-Tenancy (forward path)

`User`, `Project`, `Scenario` carry no `tenantId` today (single-tenant MVP). To go multi-tenant: add `tenantId` column + composite indexes, a `TenantGuard` (resolves tenant from JWT claim), and a `PrismaService` extension that injects `where: { tenantId }` automatically.

## Observability

- Winston logger (JSON in prod, pretty in dev) → stdout → cluster log shipper.
- Per-request `x-request-id` (middleware) for trace correlation.
- `HealthController` exposes `/health` for k8s probes.

## Security baseline

- Helmet (CSP/HSTS/etc).
- `class-validator` whitelist + forbidNonWhitelisted on all DTOs.
- Zod env validation — boot fails fast on misconfig.
- BCrypt password hashing (cost 10) + hashed refresh tokens.
- Audit log on auth events, forecast/debate runs, report generation.

## Diagram

```
┌──────────────┐    HTTPS / JWT    ┌─────────────────────────┐
│ Angular SPA  │ ─────────────────▶│ NestJS API (REST + WS)  │
└──────────────┘                   │  ─────────────────────  │
                                   │  Guards · Interceptors  │
                                   │  CQRS · EventBus        │
                                   └─────┬───────┬───────────┘
                                         │       │
                              ┌──────────▼──┐  ┌─▼────────────┐
                              │ PostgreSQL  │  │ Redis/BullMQ │
                              │  (Prisma)   │  │  AI · Reports│
                              └─────────────┘  └─┬────────────┘
                                                 │
                              ┌──────────────────▼──────────────┐
                              │ AI Provider (Gemini · OpenAI)   │
                              │ Integrations (GH/GL/BB/Jira/HR) │
                              └─────────────────────────────────┘
```
