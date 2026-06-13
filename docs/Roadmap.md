# Development Roadmap

## Phase 0 — Boilerplate (DONE)

- NestJS + Angular scaffolds, Prisma schema, JWT+RBAC, AI port, Debate orchestrator skeleton, deterministic Forecast engine, 8 integration adapters, Docker, CI, K8s, docs.

## Phase 1 — MVP (Weeks 1–4)

- **Auth**: password reset, invite-by-email, SSO (OIDC stub).
- **Projects**: edit, archive, repository linking via SCM adapters.
- **Scenarios**: clone-and-tweak, assumption editor UI.
- **Forecast**: monte-carlo overlay on deterministic baseline (still no AI dependency).
- **Debate**: stream agent outputs via SSE/WebSocket to UI.
- **Reports**: PDF render (Puppeteer queue job).
- **Tests**: ≥70 % unit coverage on `forecast/engines` and `debate/agents` mocks.

## Phase 2 — Enterprise Pilot (Weeks 5–8)

- **Multi-tenancy** — `tenantId` everywhere, tenant guard, per-tenant rate limits.
- **SSO** — Azure AD / Okta via passport-openidconnect.
- **Audit** — immutable log shipped to S3/Blob with object-lock.
- **Integrations** — webhook ingestion (push) not just pull.
- **Observability** — OpenTelemetry traces; Prometheus metrics; Grafana dashboards.

## Phase 3 — SaaS GA (Weeks 9–14)

- **Billing** — Stripe metered usage (forecast/debate runs).
- **Tenant admin console** — invite users, manage roles, view audit.
- **Edge caching** — Cloudflare in front; per-tenant cache keys.
- **AI fallbacks** — automatic provider failover (Gemini → OpenAI → local).
- **Backups** — automated PITR for Postgres; cross-region replication.

## Phase 4 — Government / Public Sector

- **Air-gapped deploy** — bundle local LLM (e.g. Llama 3 70B) as `LocalProvider`.
- **FedRAMP-aligned** controls — FIPS-140 crypto, hardened images, STIG-compliant base.
- **Tenant isolation** — option for dedicated DB schema or dedicated cluster per tenant.
- **Data residency** — region pinning per tenant.

## Tech debt to track

- Replace Passport with native JWT impl when Nest 11 drops bundled support.
- Consider extracting `Forecast` and `Debate` to separate services once load justifies.
- Migrate `class-validator` DTOs to Zod end-to-end (already used at env layer).
