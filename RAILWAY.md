# Railway Deployment

Porchlight deploys to Railway as two services from this same GitHub repo:

- `porchlight-backend`: FastAPI API, built with `infra/Dockerfile.backend`
- `porchlight-frontend`: Next.js app, built with `infra/Dockerfile.frontend`

Do not set the Railway root directory to `backend` or `frontend`; both Dockerfiles use the repository root as their build context.

## Backend service

1. Create a Railway service from the GitHub repo.
2. In service settings, set the Railway config file path to `/railway.backend.json`.
3. Generate a public Railway domain for the backend.
4. Add a Railway volume mounted at `/data` so the bundled SQLite database survives redeploys.
5. Set variables:

```env
SECRET_KEY=<generate-a-long-random-value>
DATABASE_URL=sqlite:////data/porchlight.db
FRONTEND_URL=https://<frontend-domain>
```

The image seeds `/data/porchlight.db` from `infra/data/porchlight.db` on first boot only.

## Frontend service

1. Create a second Railway service from the same GitHub repo.
2. In service settings, set the Railway config file path to `/railway.frontend.json`.
3. Generate a public Railway domain for the frontend.
4. Set variables:

```env
BACKEND_URL=https://<backend-domain>
```

The frontend proxies browser API requests through `/api/backend/*`, so this value
is read at runtime by the Next.js server. Do not set `NEXT_PUBLIC_API_URL` for
the Railway frontend unless you intentionally want to bypass the proxy.

## After Both Domains Exist

Update the backend `FRONTEND_URL` variable to the final frontend URL, then redeploy the backend. If Google OAuth is enabled, also set:

```env
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_REDIRECT_URI=https://<backend-domain>/auth/google/callback
```
