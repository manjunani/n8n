# n8n Community Edition on Hostinger VPS

This guide helps you run n8n CE with built-in workflow versioning (CE fallback) on a Hostinger VPS using Docker Compose.

## Requirements

- Hostinger VPS with Docker + Docker Compose
- A user with permission to run Docker
- Recommended resources:
  - Minimum: 1 vCPU, 2 GB RAM, 20 GB SSD
  - Recommended: 2 vCPU, 4 GB RAM, 40–60 GB SSD
  - Heavy/AI flows: 4 vCPU, 8+ GB RAM, 100+ GB SSD

## Setup

1) Create a working directory on the VPS and copy the files:

```
deploy/hostinger/docker-compose.yml
```

2) Create a `.env` file alongside `docker-compose.yml`:

```
N8N_HOST=your.server.ip.or.domain
N8N_IMAGE=ghcr.io/<your-gh-username>/n8n-ce:<tag>
POSTGRES_USER=n8n
POSTGRES_PASSWORD=strongpassword
POSTGRES_DB=n8n
GENERIC_TIMEZONE=UTC
```

3) Start the stack:

```
docker compose up -d
```

4) Access n8n at:

```
http://<N8N_HOST>:5678
```

## Optional: Reverse proxy + TLS

Put n8n behind Nginx/Traefik and set `N8N_PROTOCOL=https` and `WEBHOOK_URL=https://your.domain/`. Ensure 80/443 are open and proxy to `n8n:5678`.

## Data persistence

- n8n app data: volume `n8n_data` -> `/home/node/.n8n`
- Postgres data: volume `db_data` -> `/var/lib/postgresql/data`

Back up both volumes regularly (daily). For large instances, use offsite backups.

## Queue mode (optional)

Uncomment `redis` service and `EXECUTIONS_MODE` + `QUEUE_BULL_REDIS_*` envs in `docker-compose.yml`.

## Using CE workflow versioning

When the enterprise Workflow History is not licensed, CE endpoints become available:

- List versions: `GET /rest/workflows/:id/versions?take=20&skip=0`
- Get version: `GET /rest/workflows/:id/versions/:versionId`
- Snapshot now: `POST /rest/workflows/:id/versions`
- Restore version: `POST /rest/workflows/:id/versions/:versionId/restore`

Notes:
- A snapshot is automatically saved on workflow create/update (CE fallback).
- On restore, the current state is snapshotted first, then the selected version is applied.
