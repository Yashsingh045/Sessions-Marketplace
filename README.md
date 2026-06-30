# Sessions Marketplace

A marketplace where **Creators** publish live sessions and **Users** browse and
book them. Full stack, containerized, one command to run.

> **Status:** infrastructure scaffold. All containers boot and reach each other;
> feature code (auth, sessions, bookings, payments, dashboards) lands next.

---

## Architecture

```
                         ┌─────────────────────────────────────────┐
   browser  ── :80 ──▶   │  nginx (reverse proxy)                   │
                         │    /api/  /admin/  /static/ ─▶ backend   │
                         │    /                         ─▶ frontend │
                         └───────────────┬─────────────────────────┘
                                         │  (internal network: appnet)
          ┌──────────────┬───────────────┴───────────────┬───────────────┐
          ▼              ▼                                ▼               ▼
     frontend        backend ──────────────────────▶  db (Postgres)   minio (S3)
     Next.js         Django + DRF (gunicorn)                           avatars bucket
```

**Why these choices**

- **nginx reverse proxy as the single entrypoint.** Browser hits one origin
  (`http://localhost`), so there are no cross-origin headaches for same-site
  cookies/requests and only one port is exposed publicly. `/api` routes to
  Django, everything else to Next.js.
- **Separate containers per concern** (frontend / backend / db / minio / nginx).
  Each scales and restarts independently and mirrors a realistic deployment.
- **Next.js, client-side only.** Rendering and all data fetching happen in the
  browser against `NEXT_PUBLIC_API_BASE_URL`; the backend is the single source
  of truth and auth, keeping the frontend a thin SPA-style client.
- **Django + DRF.** Batteries-included auth/ORM/admin plus a clean REST layer
  and first-class JWT (SimpleJWT) and throttling support.
- **PostgreSQL** for relational data (users, sessions, bookings, payments).
- **MinIO** gives an S3-compatible API locally, so avatar uploads use the exact
  `django-storages` S3 backend we'd use in production — no code change to ship.
- **Config via environment** (`.env`) so the same images run anywhere.

---

## Setup

**Prerequisites:** Docker + Docker Compose.

```bash
# 1. Clone, then create your env file
cp .env.example .env
#    Edit .env — at minimum set strong secrets and your GitHub OAuth keys.

# 2. Build and start everything
docker-compose up --build
```

That's it. Services:

| URL                          | What                                  |
| ---------------------------- | ------------------------------------- |
| http://localhost             | App (via nginx → frontend)            |
| http://localhost/api/health  | Backend health check                  |
| http://localhost/admin/      | Django admin                          |
| http://localhost:9001        | MinIO console (login = MinIO creds)   |

To stop: `Ctrl+C`, then `docker-compose down` (add `-v` to wipe data volumes).

---

## GitHub OAuth setup

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Fill in:
   - **Application name:** Sessions Marketplace (local)
   - **Homepage URL:** `http://localhost`
   - **Authorization callback URL:** `http://localhost/api/auth/github/callback`
3. Create the app, then copy the **Client ID** and generate a **Client Secret**.
4. Put them in `.env`:
   ```
   GITHUB_OAUTH_CLIENT_ID=...
   GITHUB_OAUTH_CLIENT_SECRET=...
   GITHUB_OAUTH_CALLBACK_URL=http://localhost/api/auth/github/callback
   ```
5. Restart: `docker-compose up --build`.

**Flow (once implemented):** browser → GitHub authorize → GitHub redirects to the
callback → backend exchanges the code for a GitHub token, fetches the profile,
upserts the user, and issues its own **JWT** to the frontend.

---

## MinIO / bucket setup

MinIO runs as a container and the `minio-init` one-shot service **creates the
bucket automatically** on first `up` (named by `MINIO_BUCKET`, default `avatars`)
and makes it publicly readable for avatar display — no manual steps needed.

- Console: http://localhost:9001 (log in with `MINIO_ROOT_USER` /
  `MINIO_ROOT_PASSWORD`).
- The backend writes uploads via `django-storages` + `boto3` over the internal
  network at `AWS_S3_ENDPOINT_URL=http://minio:9000`, using **path-style**
  addressing (`AWS_S3_ADDRESSING_STYLE=path`, required by MinIO).
- Public object URLs are built from `AWS_S3_CUSTOM_DOMAIN=localhost:9000/avatars`
  with `AWS_S3_URL_PROTOCOL=http:`, so the browser can load avatars directly.
- **Avatar upload:** Profile page → "Upload avatar" → `POST /api/me/avatar/`
  (multipart). The backend stores the file at key `user_<id>/avatar.<ext>` in the
  bucket and saves the resulting URL on the user (overwrites on re-upload).
- To use real AWS S3 instead, point the `AWS_*` vars at AWS, set
  `AWS_S3_ENDPOINT_URL` empty, `AWS_S3_URL_PROTOCOL=https:`, and drop the
  path-style override.

---

## Razorpay (test mode) payments

Paid sessions require a verified Razorpay payment before the booking is
confirmed; free sessions (price 0) are booked directly.

1. Get **test** keys from the Razorpay Dashboard → Settings → API Keys (Test
   Mode) and set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in `.env`.
2. Flow: frontend calls `POST /api/payments/order/` → backend creates a Razorpay
   order → Razorpay Checkout opens in the browser → on success the frontend calls
   `POST /api/payments/verify/`, where the backend **verifies the payment
   signature** and only then creates the booking (storing the order/payment IDs).
3. Test card: `4111 1111 1111 1111`, any future expiry, any CVV, any name.

Both payment endpoints (and direct booking creation) are rate-limited
(`THROTTLE_BOOKING`, default 30/min); the OAuth endpoints use `THROTTLE_AUTH`
(default 20/min).

---

## Demo flow (target)

1. Open http://localhost — browse the **session catalog**.
2. Click a session for the **detail page**.
3. **Sign in with GitHub** — backend issues a JWT.
4. As a **User**: book a session → pay via **Razorpay (test mode)** → see it in
   your **User Dashboard**.
5. As a **Creator**: create/edit sessions, upload an **avatar** (stored in
   MinIO), and manage bookings from the **Creator Dashboard**.

---

## Project layout

```
.
├── docker-compose.yml      # one-command full stack
├── .env.example            # all environment variables (copy to .env)
├── frontend/               # Next.js (client-side only)
│   ├── Dockerfile
│   └── app/                # routes
├── backend/                # Django + DRF
│   ├── Dockerfile
│   ├── entrypoint.sh       # waits for db, migrates, runs gunicorn
│   └── config/             # settings, urls, wsgi/asgi
└── nginx/
    └── nginx.conf          # reverse proxy config
```

---

## Environment variables

See [`.env.example`](.env.example) — every variable the stack reads is documented
there, grouped by service (Postgres, Django, JWT, GitHub OAuth, Razorpay, MinIO,
rate limiting, frontend).
