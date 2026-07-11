# Porchlight Docker

Run the full stack (FastAPI + Next.js) with Docker Compose.

## Database

The assignment SQLite file lives at [`data/porchlight.db`](data/porchlight.db). It is **copied verbatim** into the backend image at build time and seeded into the `porchlight-db` volume on first container start. `seed.py` is never run in Docker — the deployed app uses this exact file.

To refresh the bundled DB after local changes:

```bash
cp ../backend/porchlight.db data/porchlight.db
docker compose build backend
```

## Quick start

```bash
cd infra
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Health: http://localhost:8000/health

Demo logins (from the bundled DB):

- Guest: `guest@porchlight.test` / `porchlight`
- Host: `host@porchlight.test` / `porchlight`

## Volumes

| Volume | Purpose |
|--------|---------|
| `porchlight-db` | Persistent SQLite file (initialized from bundled `data/porchlight.db`) |
| `porchlight-uploads` | Listing photo uploads |

To reset to the original assignment data:

```bash
docker compose down -v
docker compose up --build
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `FRONTEND_URL` | `http://localhost:3000` | CORS + OAuth redirect target |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | API URL baked into frontend at build time |
| `SECRET_KEY` | (required) | JWT signing secret |
| `DATABASE_URL` | `sqlite:////data/porchlight.db` | Set by compose; do not point at a new empty file |

## Build notes

pnpm v11 blocks native build scripts unless explicitly allowed. The frontend
[`pnpm-workspace.yaml`](../frontend/pnpm-workspace.yaml) sets
`dangerouslyAllowAllBuilds: true` so `sharp` (required by Next.js) can install
inside Docker. The Dockerfile copies this file into the install stage.
