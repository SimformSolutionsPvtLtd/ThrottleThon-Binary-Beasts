# Setup Guide

## Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose (recommended)
- (Optional, host) PostgreSQL 16, Redis 7

## 1. Clone & configure

```bash
git clone <repo-url> smartersprint
cd smartersprint
cp .env.example .env
# fill GEMINI_API_KEY / integration tokens as needed
```

## 2. Docker (one-shot)

```bash
docker compose up --build
```

- API: http://localhost:3000  (Swagger: /api/docs)
- Web: http://localhost:4200
- Postgres: localhost:5432
- Redis: localhost:6379

## 3. Local dev (no Docker)

### Backend

```bash
cd backend
npm install --legacy-peer-deps
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

## 4. Default credentials

After seed:

| Email                       | Password    | Role |
| --------------------------- | ----------- | ---- |
| admin@smartersprint.io      | Admin@12345 | ADMIN |
| cto@smartersprint.io        | Admin@12345 | CTO   |

Rotate before going anywhere near production.

## 5. Common tasks

```bash
# Prisma studio
cd backend && npm run prisma:studio

# Run backend tests
cd backend && npm test

# Lint
cd backend && npm run lint
cd frontend && npm run lint

# Production build
cd backend && npm run build
cd frontend && npm run build
```

## 6. Resetting

```bash
docker compose down -v   # nukes postgres + redis volumes
```
