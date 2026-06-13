# Deployment Guide

## Targets

- **Local Dev** — Docker Compose (default).
- **Staging / Pilot** — Single-node Kubernetes (k3s, EKS-small, AKS-small).
- **Enterprise SaaS** — Multi-AZ Kubernetes with managed Postgres + Redis.
- **Gov / Public Sector** — Air-gapped K8s; replace managed services with self-hosted equivalents; AI provider behind allow-listed egress.

## 1. Docker Compose (single host)

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run db:seed   # first deploy only
```

Reverse-proxy nginx in `infra/docker/nginx.conf` already terminates `/api/*` to backend and serves SPA otherwise.

## 2. Kubernetes

Manifests live in `infra/k8s/`.

```bash
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/secrets.example.yaml   # edit first
kubectl apply -f infra/k8s/postgres.yaml
kubectl apply -f infra/k8s/redis.yaml
kubectl apply -f infra/k8s/backend.yaml
kubectl apply -f infra/k8s/frontend.yaml
```

- Backend `replicas: 2`, requests `200m / 256Mi`, limits `1000m / 1Gi`.
- Frontend served by nginx; reads `/api` through the same Ingress.
- Liveness/readiness probes hit `/health`.

### Migrations

Backend entrypoint runs `prisma migrate deploy` before `node dist/main.js`. For zero-downtime: use an init-container or a separate Job, gate the rolling update on its success.

## 3. Managed services swap

| Component | Self-hosted | Managed alt |
| --------- | ----------- | ----------- |
| Postgres  | StatefulSet | RDS / Cloud SQL / Azure Postgres |
| Redis     | Deployment  | ElastiCache / Memorystore / Azure Cache |
| Object storage | n/a | S3 / GCS / Blob — wire from `infrastructure/external` |
| Secrets   | K8s Secret  | AWS Secrets Manager / GCP Secret Manager / Vault |

## 4. CI/CD

`.github/workflows/ci.yml` runs:

1. Backend — install, generate, migrate, lint, test, build.
2. Frontend — install, lint, build.
3. Docker — build both images (no push by default; wire to your registry).

For CD, add a deploy job triggered on `main` that:

- Pushes images to GHCR / ECR / Artifact Registry
- Runs `kubectl set image deployment/backend backend=<repo>:<sha>` (or argo/flux sync).

## 5. Hardening for prod

- Set strong `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (≥32 random bytes).
- Set `NODE_ENV=production`; lock CORS to your real frontend origin.
- Replace seeded admin password before exposing the host.
- Enable TLS at the Ingress (cert-manager + Let's Encrypt).
- Restrict egress to AI provider endpoints + integration hosts only.
- Ship logs to your SIEM; alert on `AUDIT_READ` denials and forecast/debate failures.

## 6. Rollback

```bash
kubectl rollout undo deployment/backend  -n smartersprint
kubectl rollout undo deployment/frontend -n smartersprint
```

DB migrations are forward-only; for schema rollback, restore from latest snapshot.
