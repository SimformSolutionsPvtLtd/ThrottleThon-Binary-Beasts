# SmarterSprint

AI-powered project forecasting, scenario simulation, workforce planning, and executive decision-support platform.

Targets: MVP · Enterprise Pilot · Multi-Tenant SaaS · Government / Public Sector.

## Stack

**Frontend:** Angular 20+ (Standalone, Signals), Angular Material, Tailwind, Chart.js, CDK DnD, RxJS, TypeScript strict.

**Backend:** NestJS, TypeScript, PostgreSQL, Prisma, Redis, BullMQ, JWT, RBAC, Swagger, Zod, Winston.

**Infra:** Docker, Docker Compose, GitHub Actions, Nginx, Kubernetes-ready.

## Architecture

Clean Architecture · DDD · SOLID · CQRS · Repository Pattern · Event-Driven · Modular Monolith (microservice-ready).

```
.
├── backend/         NestJS API
├── frontend/        Angular SPA
├── infra/
│   ├── docker/      Dockerfiles, nginx
│   └── k8s/         Kubernetes manifests
├── .github/         CI/CD workflows
└── docs/            Architecture, Setup, API, Deployment
```

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

- Backend → http://localhost:3000  (Swagger: /api/docs)
- Frontend → http://localhost:4200
- Postgres → localhost:5432
- Redis → localhost:6379

## Docs

- [Architecture](docs/Architecture.md)
- [Setup Guide](docs/Setup.md)
- [API Guide](docs/API.md)
- [Deployment Guide](docs/Deployment.md)
- [Roadmap](docs/Roadmap.md)

## License

Proprietary — SmarterSprint.
