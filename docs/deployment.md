# Deployment guide

This guide prepares the Kodewar LMS for a production deployment. The API is the
only component that talks to TiDB; the frontend is a static Vite build.

## Deployment shapes

Two supported arrangements:

1. **Single service (recommended)** — Express serves both `/api/*` and the built
   React app from `frontend/dist`. This is the default when
   `NODE_ENV=production` and `SERVE_FRONTEND=true`.
2. **Split hosting** — the React build is hosted on a static platform and the
   API runs separately. Set `SERVE_FRONTEND=false` and point `VITE_API_URL` at
   the public API origin. The static host must rewrite unknown paths to
   `index.html` so client-side routes such as `/verify/KDW-…` work.

## 1. Production environment

Create the production `backend/.env` from `backend/.env.example` and fill in the
real values. The API refuses to start in production when these checks fail:

- `JWT_SECRET` is shorter than 32 characters;
- `CLIENT_URL` does not start with `https://`.

| Variable | Production guidance |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Port supplied by the host, often `5000` or `8080` |
| `CLIENT_URL` | Public HTTPS origin of the frontend, for example `https://lms.example.com` |
| `SERVE_FRONTEND` | `true` for the single-service option, otherwise `false` |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Real TiDB credentials |
| `DB_SSL` | `true` for TiDB Cloud |
| `JWT_SECRET` | Long random value, at least 32 characters. Never reuse the development value. |
| `JWT_EXPIRES_IN` | Session lifetime, for example `7d` |
| `MAX_FILE_SIZE_MB` | Upload size limit for future attachment support |

The auth cookie is `httpOnly`, `SameSite=Lax` and `secure` whenever
`NODE_ENV=production`, so the public site must use HTTPS.

For split hosting, create `frontend/.env.production`:

```dotenv
VITE_API_URL=https://api.example.com/api
```

and configure CORS by setting the API's `CLIENT_URL` to the exact frontend
origin.

## 2. Install, migrate and build

Run these commands from the repository root on the deployment host:

```bash
npm ci
npm run install:all
npm run db:migrate
npm run build
```

`db:migrate` applies the baseline schema plus every pending numbered migration
and records each one in `schema_migrations`. It is safe to run on every release.

Do **not** run `npm run db:seed` in production. It creates demo accounts with
well-known passwords. The seed script already refuses to run unless
`FORCE_SEED=true` is set explicitly; leave that unset.

## 3. Start the API

Single-service deployment:

```bash
NODE_ENV=production SERVE_FRONTEND=true node backend/server.js
```

On Windows PowerShell:

```powershell
$env:NODE_ENV = "production"
$env:SERVE_FRONTEND = "true"
node backend/server.js
```

Split deployment:

```bash
NODE_ENV=production SERVE_FRONTEND=false node backend/server.js
```

The process handles `SIGINT` and `SIGTERM` and closes the TiDB pool cleanly.
Configure the hosting platform to restart it automatically and to send SIGTERM
on redeploy.

## 4. Health check

Use `GET /api/health` as the platform health check. It runs a real database
query, so a `200` response means both the API process and TiDB are reachable.

## 5. Troubleshooting `502 Bad Gateway`

A `502` is produced by a proxy or hosting gateway, never by Express itself. It
means the gateway could not reach the API process. Work through this list:

1. **Process is not running.** Start/redeploy the API and check the host logs.
   A crash during boot (missing `JWT_SECRET`, invalid `CLIENT_URL` in
   production, missing DB credentials) makes the proxy return `502`.
2. **Wrong port.** The API must listen on the port the host/gateway forwards to
   (`$PORT`, commonly `5000` or `8080`). Do not hardcode a different port in the
   proxy configuration.
3. **Wrong upstream host.** Inside a container or VM, `localhost` refers to the
   container itself. Use the API service name or private IP from the proxy.
4. **Split deployment with no API rewrites.** If the frontend is static, either
   set `VITE_API_URL` to the public API origin and rebuild, or add a rewrite
   from `/api/*` to the API. Keep SPA deep links rewriting to `index.html`, but
   that fallback must not swallow `/api/*`.
5. **Health check path.** Point the platform health check at `/api/health`, not
   `/`. In single-service mode `/` returns the React app even when the API is
   unhealthy.
6. **HTTPS and CORS.** `CLIENT_URL` must be the exact public frontend origin and
   must use `https://` in production. A mismatch produces CORS errors, not a
   `502`, but it is the next failure to check.

## 6. Reverse proxy example

When nginx terminates TLS in front of the single-service deployment:

```nginx
server {
    listen 443 ssl;
    server_name lms.example.com;

    ssl_certificate     /etc/letsencrypt/live/lms.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lms.example.com/privkey.pem;

    client_max_body_size 12m;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Express already sends Helmet security headers. Keep TLS termination and HSTS at
the proxy or platform level.

## 7. Verify the release

With the API running against the target database:

```bash
npm run test:api
```

The test logs in with the seeded development accounts, so it is intended for
staging and local verification. It creates a temporary course, completes it,
checks that exactly one certificate is issued, verifies the public code and
deletes the course in a cleanup block. To point it at another environment:

```bash
API_BASE_URL=https://staging.example.com/api npm run test:api
```

Never run the API test against a production database that contains only real
accounts, because it expects the demo logins.

## 8. Production checklist

- [ ] `NODE_ENV=production` and `CLIENT_URL` uses HTTPS.
- [ ] `JWT_SECRET` is unique, random and at least 32 characters.
- [ ] TiDB credentials are stored in the host's secret manager, not in git.
- [ ] `backend/.env` and `frontend/.env*` are excluded from version control.
- [ ] `npm run db:migrate` has been applied and `schema_migrations` shows `002_add_certificates.sql`.
- [ ] `npm run build` succeeded and `frontend/dist` exists when `SERVE_FRONTEND=true`.
- [ ] Demo accounts are deleted or have their passwords changed.
- [ ] The TiDB password shared during development has been rotated.
- [ ] `GET /api/health` returns `200` through the public domain.
- [ ] `/verify`, `/login` and a deep link such as `/student/courses/1` load after a hard refresh.
- [ ] Sign-in works over HTTPS and the auth cookie is marked `Secure`.
- [ ] `npm run test:api` passes on staging.

## 9. Rollback

1. Deploy the previous build artifact and restart the API.
2. Migrations are additive and tracked. Do not delete a `schema_migrations` row
   to "undo" a migration; write a new forward migration instead.
3. The certificate table is safe to leave in place if the previous application
   version does not use it.
