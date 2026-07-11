# Porchlight

A vacation-rental marketplace inspired by Airbnb — browse coastal cabins and lofts, book stays, and manage listings as a host. Built as an SDE fullstack assignment with a photo-forward UI, real JWT auth, and a modular FastAPI backend.

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, TanStack Query |
| Backend | Python 3.14, FastAPI, SQLAlchemy 2.0, Pydantic |
| Database | SQLite (`backend/porchlight.db`) |
| Auth | JWT (bcrypt + python-jose), Google OAuth |
| Maps | MapCN / MapLibre GL (CARTO tiles) |
| Tooling | uv (Python), pnpm (Node), Biome, Ruff |

## Quick start

### Option A — Docker (recommended for demo/deploy)

Runs both services with the **bundled assignment database** — no seed step required.

```bash
cd infra
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:8000
- Health: http://localhost:8000/health

See [`infra/README.md`](infra/README.md) for volume management and environment variables.

### Option B — Local development

**Prerequisites:** Node 22+, pnpm 11+, Python 3.14+, [uv](https://docs.astral.sh/uv/)

**1. Backend**

```bash
cd backend
cp .env.example .env   # or create .env from the template below
uv sync
uv run python seed.py  # only if porchlight.db is missing or empty
uv run uvicorn main:app --reload --port 8000
```

**2. Frontend** (separate terminal)

```bash
cd frontend
pnpm install
NEXT_PUBLIC_API_URL=http://localhost:8000 pnpm dev
```

Open http://localhost:3000.

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Guest | `guest@porchlight.test` | `porchlight` |
| Host | `host@porchlight.test` | `porchlight` |

The seeded database includes six editorial listings (Big Sur, Tahoe, Mendocino, etc.), sample bookings, and reviews.

## Environment variables

### Backend (`backend/.env`)

```env
SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:3000

# Optional — Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# Optional — defaults to backend/porchlight.db
# DATABASE_URL=sqlite:///./porchlight.db
```

### Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For Docker, set these in `infra/.env` (see `infra/.env.example`).

## Architecture

Porchlight is a **modular monolith**: one FastAPI service and one Next.js app communicating over REST/JSON with JWT bearer tokens.

```
frontend/          Next.js App Router UI
  app/             Pages (home, explore, listing detail, trips, host, auth)
  components/      UI components (cards, calendar, map, booking drawer)
  lib/             API client, React Query hooks, types

backend/           FastAPI API
  routers/         HTTP handlers (thin — parse request, call service)
  domain/          Business logic per entity (service → repository)
  models/          SQLAlchemy ORM models
  auth.py          JWT + Google OAuth plumbing
  static/uploads/  Listing photos (local disk)
```

**Request flow:** Browser → `RequestLogMiddleware` (request ID) → router → domain service → repository → SQLite. Image uploads are stored on disk; the API returns `/static/uploads/...` URLs.

**Layering:** Handlers never touch the database directly. Services own business rules (overlap checks, ownership, review eligibility) and raise domain exceptions that map to HTTP status codes via `domain/errors.py`.

More detail: [`.docs/ARCHITECTURE.md`](.docs/ARCHITECTURE.md)

## Database schema

Eight tables with standard marketplace relationships:

```
User ──┬── hosts ──> Listing ──┬── Photo
       │                       ├── Booking
       ├── books ──────────────┤
       ├── writes ──> Review   ├── Review
       └── favorites ──> Favorite
Listing ──<many-to-many>── Amenity
```

| Table | Purpose |
|-------|---------|
| `users` | Accounts (email/password or Google-only) |
| `listings` | Properties with lat/lng, price, capacity, amenities |
| `photos` | Uploaded images per listing |
| `amenities` | Lookup (`wifi`, `kitchen`, …) via `listing_amenities` |
| `bookings` | Date-range reservations with overlap validation |
| `reviews` | One review per user per listing (after completed stay) |
| `favorites` | User wishlist |

Booking overlap is enforced in the service layer (SQLite lacks exclusion constraints). Cancellation is a hard delete — no status column.

Full ER diagram and design notes: [`.docs/DATABASE.md`](.docs/DATABASE.md)

Verify the schema:

```bash
cd backend && uv run python -m models
```

## API overview

Base URL: `http://localhost:8000` — interactive docs at `/docs`.

| Group | Endpoints |
|-------|-----------|
| **System** | `GET /health` |
| **Users** | `POST /users/signup`, `POST /users/login`, `GET /users/me` |
| **Google OAuth** | `GET /auth/google/login`, `GET /auth/google/callback` |
| **Listings** | `GET /listings` (search/filter), `POST /listings`, `GET/PATCH/DELETE /listings/{id}` |
| **Bookings** | `POST /bookings`, `GET /bookings/me`, `GET /bookings/hosting`, `GET/PATCH/DELETE /bookings/{id}` |
| **Reviews** | `POST/GET /listings/{id}/reviews`, `PATCH/DELETE /reviews/{id}` |
| **Favorites** | `POST /favorites`, `GET /favorites/me`, `DELETE /favorites/{listing_id}` |
| **Uploads** | `POST/DELETE /listings/{id}/photos/{photo_id}` |
| **Static** | `GET /static/uploads/*` |

**Listing search filters:** `city`, `min_price`, `max_price`, `max_guests`, bounding box (`min/max_latitude/longitude`), `limit`, `offset`.

## Features

### Core (assignment requirements)

| Feature | Status |
|---------|--------|
| Home & explore grid with search | Done |
| Filters (price, amenities, guests, city) | Done |
| Listing detail (gallery, calendar, price breakdown, reviews) | Done |
| Booking flow with mocked checkout | Done |
| My Trips (upcoming/past, cancel, leave review) | Done |
| Host CRUD (create/edit/delete listings, photo upload) | Done |
| Favorites / wishlist | Done |
| Toasts and navigation chrome | Done |
| Real JWT auth (+ optional Google OAuth) | Done |

### Bonus

| Feature | Status |
|---------|--------|
| Interactive map (MapCN / MapLibre) | Done — split list+map on desktop |
| Leave a review after completed stay | Done |
| Dark mode | Done |
| Image upload (local disk) | Done |
| Responsive layout | Partial |

### Known limitations / mocked

- **Payments** — checkout is mocked; no Stripe or real charges.
- **Messaging, identity verification** — not implemented.
- **Pagination** — listings load up to 100; no infinite scroll yet.
- **Search dates** — collected in the UI but not used for availability filtering on the backend.
- **Calendar blocked dates** — overlap is enforced at booking time; the calendar does not grey out booked dates.
- **Host dashboard** — shows reservation counts, not per-booking guest detail UI.
- **Superhost badges** — not implemented.

## Assumptions

1. **Single role model** — any authenticated user can both book and host; there is no separate guest/host account type.
2. **SQLite is sufficient** — fine for demo/assignment scale; `DATABASE_URL` can point at Postgres without ORM changes.
3. **Local file storage** — photos live on disk (`static/uploads/`), not S3/Cloudinary.
4. **Access-token only** — JWT with a one-week expiry; no refresh-token rotation.
5. **Bundled database for deploy** — Docker ships `infra/data/porchlight.db` verbatim; `seed.py` is for local dev only.
6. **Design direction** — Porchlight uses an editorial, coast-house aesthetic rather than a pixel-perfect Airbnb clone, while following the same browse → detail → book workflow.

## Project structure

```
porchlight/
├── backend/          FastAPI API, SQLAlchemy models, seed script
├── frontend/         Next.js UI
├── infra/            Docker Compose, Dockerfiles, bundled SQLite DB
├── .docs/            Architecture, database, and auth design notes
└── PROBLEM_STATEMENT.md
```

## Development commands

```bash
# Backend
cd backend
uv run uvicorn main:app --reload    # dev server
uv run ruff check .                 # lint
uv run python seed.py --force       # reseed database

# Frontend
cd frontend
pnpm dev                            # dev server
pnpm build                          # production build
pnpm lint                           # Biome check
```

## Deployment

- **Docker:** `cd infra && docker compose up --build` (see [`infra/README.md`](infra/README.md))
- **Split services:** Deploy `frontend/` and `backend/` separately (e.g. Vercel + Railway). Mount a persistent volume for `porchlight.db` and `static/uploads/` on the backend. Set `NEXT_PUBLIC_API_URL` to the backend's public URL and `FRONTEND_URL` to the frontend origin for CORS.

## License

Assignment project — see repository for usage terms.
