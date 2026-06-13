# API Guide

Base URL: `http://localhost:3000/api`  ·  Swagger: `/api/docs`

All endpoints (except `/auth/login`, `/health`) require `Authorization: Bearer <accessToken>`.

Responses are wrapped:

```json
{ "success": true, "data": <payload>, "timestamp": "2026-06-13T10:00:00.000Z" }
```

Errors:

```json
{ "success": false, "statusCode": 400, "message": "...", "path": "...", "timestamp": "..." }
```

## Auth

### `POST /auth/login`
```json
{ "email": "admin@smartersprint.io", "password": "Admin@12345" }
→ { "accessToken": "...", "refreshToken": "..." }
```

### `POST /auth/refresh`
Header: `Authorization: Bearer <refreshToken>` → new `{ accessToken, refreshToken }`.

### `POST /auth/logout`
204. Invalidates the stored refresh hash.

## Users

| Method | Path | Permission |
| ------ | ---- | ---------- |
| GET | `/users` | `user:manage` |
| POST | `/users` | Role `ADMIN` |

## Projects

| Method | Path | Permission |
| ------ | ---- | ---------- |
| GET | `/projects` | `project:read` |
| GET | `/projects/:id` | `project:read` |
| POST | `/projects` | `project:write` |

## Scenarios

| Method | Path | Permission |
| ------ | ---- | ---------- |
| GET | `/scenarios?projectId=...` | `scenario:read` |
| GET | `/scenarios/:id` | `scenario:read` |
| POST | `/scenarios` | `scenario:write` |

## Allocations

| Method | Path | Permission |
| ------ | ---- | ---------- |
| GET | `/allocations?scenarioId=...` | `scenario:read` |
| POST | `/allocations` | `allocation:write` |

## Forecast

| Method | Path | Permission |
| ------ | ---- | ---------- |
| POST | `/forecast` | `forecast:run` |

```json
// request
{ "scenarioId": "uuid" }
// response
{
  "id": "uuid",
  "timelineDays": 84,
  "cost": 120000,
  "riskAdjustedCost": 144000,
  "confidence": 0.83,
  "breakdown": { ... }
}
```

## Debate

| Method | Path | Permission |
| ------ | ---- | ---------- |
| POST | `/debate` | `debate:run` |

```json
// request
{ "scenarioId": "uuid" }
// response
{
  "id": "uuid",
  "confidenceScore": 0.72,
  "frictionFactor": 0.34,
  "summary": "...",
  "risks": [{ "title": "...", "severity": "HIGH" }],
  "transcript": { "researcher": {...}, "opponent": {...}, "worstCase": {...}, "synthesizer": {...} }
}
```

## Reports

| Method | Path | Permission |
| ------ | ---- | ---------- |
| POST | `/reports/brief` | `report:generate` |

```json
{ "scenarioId": "uuid", "audience": "CEO" }
```

## Integrations

| Method | Path |
| ------ | ---- |
| GET | `/integrations/status` |

Returns per-adapter configured/connected flags for SCM (GitHub/GitLab/Bitbucket), issue trackers (Jira/Zoho Projects), and HRIS (BambooHR/Zoho People/Workday).

## Audit

| Method | Path | Permission |
| ------ | ---- | ---------- |
| GET | `/audit?entity=...&entityId=...` | `audit:read` |
