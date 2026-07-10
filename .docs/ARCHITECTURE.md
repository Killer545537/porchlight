# Porchlight — architecture

## Overview

Porchlight is a modular monolith: one FastAPI backend, one Next.js (TypeScript) frontend, SQLite for storage, local disk for uploaded images. The two apps deploy as separate services in a single Railway project, communicating over REST with JWT auth.

This is a deliberate choice for a 24-hour solo build — see [Trade-offs](#trade-offs) for why microservices and Vercel container functions were ruled out.

## System diagram

```mermaid
flowchart LR
    subgraph FE["frontend/ — Next.js (TS)"]
        UI[Pages & components]
    end

    subgraph BE["backend/ — FastAPI"]
        MW["middleware/logging.py<br/>request-ID + structured logs"]
        R["routers/<br/>listings · bookings · users · auth (Google) · uploads"]
        ORM[SQLAlchemy ORM]
        MW --> R --> ORM
    end

    DB[("porchlight.db<br/>SQLite, on volume")]
    FS[("static/uploads/<br/>on volume")]

    UI -- "REST/JSON + JWT" --> MW
    BE -- "response + X-Request-ID" --> UI
    ORM --> DB
    R --> FS
```

## Backend layout

```sh
backend/
├── main.py               app factory, CORS, static mount, middleware + router wiring
├── database.py            SQLAlchemy engine/session
├── models/                 ORM models, one file per entity (see DATABASE.md)
├── schemas.py               Pydantic request/response models
├── auth.py                  password hashing (bcrypt), JWT issue/verify, get_current_user, Google OAuth helpers
├── seed.py                  seed script (hosts, listings, photos, sample bookings) — not yet built
├── middleware/
│   ├── __init__.py
│   └── logging.py            request-ID middleware + structured logging setup
├── routers/
│   ├── users.py               signup/login/me
│   ├── auth.py                 Google OAuth login + callback
│   ├── listings.py            search/filter, CRUD (host-only write) — not yet built
│   ├── bookings.py            create with overlap check, my-trips — not yet built
│   └── uploads.py             image upload endpoint — not yet built
└── static/uploads/            stored listing photos
```

## Request flow

1. Frontend calls the backend over `NEXT_PUBLIC_API_URL`, attaching `Authorization: Bearer <jwt>` on authenticated routes.
2. `RequestLogMiddleware` (in `middleware/logging.py`) assigns a short request ID, logs entry/exit with duration, and returns it as an `X-Request-ID` response header for client-side correlation.
3. Router → service logic → SQLAlchemy session → SQLite file on a Railway-mounted volume.
4. Image uploads go to `/uploads` as multipart; the backend stores the file under `static/uploads/` and returns a static URL, which the frontend saves on the listing record.

## Data layer

- SQLite file + SQLAlchemy ORM. `Base.metadata.create_all()` runs on startup — no Alembic migrations for this scope.
- Booking overlap validation happens in the service layer via a query (SQLite doesn't support exclusion constraints cleanly), not as a DB constraint.
- Both the SQLite file and `static/uploads/` live on a Railway persistent volume so data survives redeploys and scale events.

## Auth

Real JWT: `bcrypt` for password hashing, `python-jose` for token issuance/verification, `get_current_user` FastAPI dependency for protected routes. Google sign-in (OAuth2 authorization code flow) is a second way to obtain the same JWT — accounts are linked by verified email, no separate `google_id` column. Access-token only, generous expiry — no refresh-token rotation or rate limiting. Acceptable for a demo; noted as a known simplification, not an oversight. Full design in [AUTH.md](AUTH.md).

## Logging and tracing

Stdlib `logging` to stdout (captured natively by Railway) plus a per-request correlation ID via `middleware/logging.py`:

- Every request logs an entry line (`→ METHOD path`) and exit line (`← METHOD path status (Nms)`) tagged with a short UUID.
- Business-logic code logs through `request_logger` (`middleware.logging`) instead of the stdlib `logging` module directly — it's a thin `LoggerAdapter` that stamps every call with the current request's ID automatically, no `extra=` boilerplate at call sites. `auth.py` and `routers/users.py`/`routers/auth.py` already use it for signup/login outcomes and rejected tokens.
- The ID is returned as `X-Request-ID` so a failed frontend request can be grepped straight to its full backend log trail.

No distributed tracing service (OpenTelemetry, Datadog, etc.) — single-process stdout logging is the whole story for one FastAPI service on Railway.

## Deployment

- Railway project with two services: `frontend` and `backend`, each with its own root and build.
- `backend` gets a persistent volume mounted for `porchlight.db` and `static/uploads/`.
- Environment variables cross-reference (frontend's API base URL points at backend's Railway-generated domain).
- uv-managed Python environment (`pyproject.toml` + `uv.lock`) — Railway's Python builder detects and uses uv natively, no Dockerfile required.

## Trade-offs

| Decision | Why | What it costs |
| --- | --- | --- |
| Modular monolith over microservices | Finishable in 24h solo, one clear request path to explain in evaluation | Doesn't scale as independent services under real load — out of scope here |
| SQLite over Postgres | Zero setup, fine for seeded demo data | Swap to Postgres later is a one-line connection string change via SQLAlchemy |
| Local disk uploads over S3/Cloudinary | No extra service, works with a Railway volume | Not horizontally scalable across multiple backend instances — fine for one instance |
| Stdout logging + request ID over APM/tracing service | Zero infra, fully sufficient for one process | No cross-service tracing, alerting, or long-term log retention |
| Access-token JWT only, no refresh rotation | Faster to build, standard FastAPI pattern | Less secure session lifecycle than production-grade auth |
| Google OAuth without a `state` CSRF param | Smaller surface for a demo | Callback isn't bound to the browser session that started it |

## Upgrade paths (not built, noted for the record)

- SQLite → Postgres: change `DATABASE_URL`, no ORM code changes needed.
- Local uploads → S3/Cloudinary: swap the storage call in `routers/uploads.py` behind the same response shape.
- Stdout logs → APM: same log format works as input to any log shipper once traffic justifies it.
