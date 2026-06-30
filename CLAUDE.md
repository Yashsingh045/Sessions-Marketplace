# CLAUDE.md — Sessions Marketplace 
## How to use this file
- Read this file fully before starting any work.
- After completing any unit of work, update the Progress Tracker and Changelog below.
- Never drift from the Locked Requirements without flagging it to me first.

## Locked Requirements (DO NOT VIOLATE)
- Frontend: Next.js, client-side only
- Backend: Django + Django REST Framework
- Database: PostgreSQL
- Infra: Docker, multi-container (frontend, backend, db, nginx reverse proxy, MinIO)
- Must start with a single `docker-compose up --build`
- Auth: GitHub OAuth → backend issues JWT
- Roles: USER (browse/book) and CREATOR (create/manage sessions)
- Must include: .env.example with ALL vars, README (setup + GitHub OAuth setup + demo flow)
- Bonus being attempted: Rate limiting + Razorpay (test mode) payments + MinIO/S3 uploads (avatars).

## Decisions Log
- Frontend framework: Next.js (client-side only)
- OAuth provider: GitHub
- Payment gateway: Razorpay (test mode)
- File storage: MinIO (S3-compatible, local container)
- JWT storage strategy: **localStorage on the client** (access + refresh). Frontend is a client-side-only SPA with no Next.js server to set httpOnly cookies during the OAuth redirect; localStorage lets the SPA attach `Authorization: Bearer` to API calls through the nginx proxy. Tradeoff: XSS-exposed — mitigated by short access-token lifetime (60m) + refresh rotation, React auto-escaping, and no `dangerouslySetInnerHTML`. Tokens are delivered via the OAuth redirect **URL fragment** (`#`), so they never hit server logs.
- Public entrypoint: nginx reverse proxy on :80 — single origin (`http://localhost`), avoids CORS, only one published port for the app.
- API routing: nginx sends `/api/`, `/admin/`, `/static/` → backend; everything else → frontend.
- Backend serving: gunicorn (3 workers) via `entrypoint.sh` that waits for Postgres, runs `migrate` + `collectstatic`, then starts.
- Frontend serving: `next build` + `next start` (not SSR data fetching); `NEXT_PUBLIC_API_BASE_URL` inlined at build time = `http://localhost/api`.
- Config: 12-factor — all settings via env (`.env`, copied from `.env.example`); `settings.py` reads env with helpers (env/env_bool/env_list).
- Object storage wiring: django-storages S3 backend pointed at MinIO; `minio-init` one-shot container auto-creates the `avatars` bucket (public-read). Boot does not touch S3, so a missing bucket can't break startup.
- DB readiness: compose healthchecks on db + minio; backend `depends_on` waits for healthy.
- Rate limiting (bonus): DRF AnonRateThrottle/UserRateThrottle enabled globally with env-configurable rates (scopes applied per-view later).
- ⚠️ DEVIATION (flagged): Auth uses a **custom GitHub OAuth flow** (`requests` + djangorestframework-simplejwt), NOT dj-rest-auth/allauth or social-auth. Reason: those carry session/Site/template machinery that fights a JWT+SPA design; a ~120-line custom flow gives full control over issuing our own JWT with the role claim and is far cleaner to read/grade. Locked requirement ("GitHub OAuth → backend issues JWT") is fully met. Tell me if you'd rather use allauth.
- Custom user: `accounts.User` (AbstractUser); `github_id` is the stable identity key, `username` mirrors GitHub login, no local password.
- App naming: sessions app is called `catalog` to avoid clashing with `django.contrib.sessions`.
- Role in token: JWT carries `role`, `username`, `name` claims (set on refresh, copied to access by SimpleJWT) so authz needs no extra DB lookup.
- Role management: `PATCH /api/auth/me` lets a USER self-upgrade to CREATOR (demo-friendly "become a creator"); new users can also be created as CREATOR via `?role=CREATOR` round-tripped through OAuth `state`.
- Booking integrity: unique (user, session) constraint + serializer guards for duplicate booking and full-capacity (`seats_left`).
- Profile route: exposed at both `/api/me/` (spec) and `/api/auth/me/` (auth group); same view.
- Creator overview: `GET /api/creator/bookings/` (CREATOR-only via `IsCreatorRole`) lists bookings across the creator's sessions with booker identity (`CreatorBookingSerializer`); supports `?session=<id>`.
- Booking temporal flag: `Booking.is_past` derived from `session.datetime` (accurate regardless of stored `status`); user bookings support `?status=ACTIVE|PAST`.
- Demo seeding: idempotent `seed_demo` mgmt command (1 CREATOR, 1 USER, 4 sessions incl. one past + 2 bookings); auto-runs on container start when `SEED_DEMO_DATA=true`.
- Frontend structure: app-router, every page `"use client"`; `lib/` (config, jwt decode, api wrapper, auth-context, format) + `components/` (Navbar, SessionCard, SessionForm, Protected, ui primitives) + pages. No CSS framework — hand-written design system in `globals.css` (CSS variables, dark theme, responsive grid) to keep the Docker build dependency-free.
- Auth context: hydrates from localStorage token by calling `/api/me/` (authoritative role from DB, not just the token claim — so a role change takes effect without re-login); exposes `user/role/isAuthenticated/isCreator/login/logout/applyUser`.
- API wrapper (`lib/api.js`): attaches Bearer token, on 401 does a single silent `/auth/token/refresh/` then retries; on refresh failure clears tokens + fires auth-failure handler; normalizes DRF error shapes (`detail`/`non_field_errors`/field errors) to a message.
- Route protection: `<Protected role?>` client guard redirects unauthenticated → `/login`, wrong-role → `/`. Creator pages gated on `role==='CREATOR'`.
- OAuth callback: `/auth/callback` reads tokens from the URL **fragment**, stores them, scrubs the URL via `history.replaceState`, routes by role (CREATOR→/creator, USER→/dashboard).
- Toasts: app-wide `ToastProvider`/`useToast` (fixed bottom-right, auto-dismiss ~3.8s, ok/error/info, click-to-close) wrapping the tree above AuthProvider; all mutations (book, cancel, session create/edit/delete, profile save) report via toast. Inline alerts kept only for in-form/load errors.
- Page polish: Home shows a login CTA banner when logged out; User Dashboard leads with a profile summary card (avatar/name/email/role + Edit link); Creator "My sessions" is a responsive CRUD table (Title/When/Price/Booked/Actions).
(Record every architectural decision here with a one-line reason.)

## Scoring Map (track what earns points)
- [~] Architecture & Docker — 20  (scaffold + compose verified booting; features pending)
- [x] Auth & Roles (OAuth + JWT, enforcement) — 20  (backend + frontend auth flow done; needs live GitHub creds for full e2e)
- [x] Core Features (sessions CRUD, booking, dashboards) — 30  (REST API + all frontend pages done & building)
- [x] Frontend UX (responsive, error handling) — 15  (responsive design system, loading/error/empty states + toasts throughout; needs live OAuth for full click-through)
- [ ] Code Quality & Docs (.env.example, README) — 15
- [ ] Bonus: Razorpay payments + rate limiting + MinIO uploads — +15 (capped)

## Progress Tracker
Five pages: [x] Home/Catalog  [x] Session Detail  [x] Auth Flow  [x] User Dashboard  [x] Creator Dashboard  (+[x] Profile)
Backend: [x] models  [x] GitHub OAuth+JWT  [x] endpoints  [x] permissions  [x] seed data
Infra: [x] docker-compose  [x] nginx  [x] MinIO (container+bucket)  [x] .env.example  [x] README
Bonus: [ ] Razorpay payment flow  [~] rate limiting (DRF throttles wired, scopes TBD)  [ ] MinIO avatar uploads

## Changelog
- 2026-06-30 — Page polish vs API: toasts, login CTA, dashboard profile section, creator table.
  - New `lib/toast-context.js` (ToastProvider/useToast); wired into `layout.js` above AuthProvider; toast styles in `globals.css`.
  - Home: login CTA banner when logged out. Session detail: book → success/error toast (replaced inline notice), "Book Now" label. User Dashboard: profile summary card (avatar/name/email/role + Edit) above bookings; cancel → toast. Creator: My-sessions rendered as responsive CRUD table (Title/When/Price/Booked/Actions); create/edit/delete → toasts. Profile: save → toast (replaced inline message).
  - Added CSS: `.toast*`, `.cta-banner`, `.profile-summary`, `.table.sessions` + mobile rules.
  - VERIFIED: `docker compose build frontend` compiles clean (9/9 static); all routes 200 via nginx; new UI strings present in shipped JS bundles ("Sign in to book…", "Booking cancelled", "Session created", "Edit profile", "toast-wrap"); authenticated `/api/me/` + `/api/bookings/` round-trip 200 with a minted demo_user token. Full click-through still needs live GitHub OAuth creds.
- 2026-06-30 — Next.js frontend (client-side only): all pages + auth flow.
  - `lib/`: `config` (API base + token keys), `jwt` (decode/expiry), `api` (Bearer + silent-refresh-on-401 + DRF error normalize + tokenStore), `auth-context` (AuthProvider/useAuth, hydrate via /me, applyUser syncs role), `format`.
  - `components/`: Navbar (role-aware links), SessionCard, SessionForm (create/edit), Protected (route guard w/ optional role), ui (Loading/ErrorMessage/Notice/EmptyState).
  - Pages: `/` Home/Catalog (search + grid), `/sessions/[id]` detail+book, `/login` (GitHub as USER/CREATOR), `/auth/callback` (fragment→store→route-by-role), `/dashboard` (user bookings, upcoming/past, cancel), `/creator` (my sessions CRUD + bookings overview), `/profile` (edit name/avatar/role).
  - `globals.css` hand-written responsive dark design system; `layout.js` wraps AuthProvider+Navbar+footer.
  - VERIFIED: `docker compose build frontend` succeeds (all 8 routes compile; 7 static + dynamic `/sessions/[id]`); on running stack every route returns 200 via nginx; home renders hero, login renders role buttons; `NEXT_PUBLIC_API_BASE_URL=http://localhost/api` baked into bundle; public `/api/sessions/` reachable same-origin. NOTE: full OAuth round-trip needs real GitHub creds in `.env` (flow wired end-to-end, not yet exercised live).
- 2026-06-30 — REST API completion + demo seed.
  - Added `GET/PATCH /api/me/` (spec alias alongside `/api/auth/me/`).
  - Added `GET /api/creator/bookings/` (`CreatorBookingsView` + `IsCreatorRole` + `CreatorBookingSerializer`): creator sees who booked their sessions; `?session=<id>` filter.
  - `Booking.is_past` property (derived from session datetime) surfaced in serializers; `GET /api/bookings/?status=ACTIVE|PAST` filter.
  - `seed_demo` management command (catalog) — idempotent: 1 CREATOR, 1 USER, 4 sessions (incl. a past one), 2 bookings (ACTIVE+PAST). Wired into `entrypoint.sh` behind `SEED_DEMO_DATA` (added to .env/.env.example, default True).
  - VERIFIED on clean stack: seed populated 4 sessions/2 bookings; `/api/me/` GET+PATCH 200; user bookings show active+past with is_past; `?status` filter works; `creator/bookings` → anon 401 / USER 403 / CREATOR 200 with booker identity; session POST USER→403 CREATOR→201, owner PATCH→200, DELETE→204. Full sessions catalog public read OK.
- 2026-06-30 — Backend foundation: models, GitHub OAuth→JWT, role permissions, admin.
  - `accounts` app: custom `User` (role USER/CREATOR, name, avatar=MinIO URL/key, github_id); `tokens.get_tokens_for_user` mints JWT pair with `role` claim; views for GitHub OAuth (`login` URL builder, `callback` redirect-with-fragment, `exchange` JSON-for-SPA), `me` (GET/PATCH self-upgrade), SimpleJWT `token/refresh`. UserSerializer + admin (extends UserAdmin).
  - `catalog` app: `Session` (title/desc/creator FK/datetime/price/capacity, booked_count+seats_left props) and `Booking` (user/session FK, status ACTIVE/PAST, created_at, unique (user,session)); ModelViewSets + DefaultRouter; `IsCreatorOrReadOnly` permission (creator-only writes, owner-only edits); booking duplicate/capacity guards; `?mine=1` creator filter; admin registered.
  - settings: `AUTH_USER_MODEL=accounts.User`, registered apps, `FRONTEND_BASE_URL`; root urls include `accounts`/`catalog` under `/api/`. Migrations generated (`accounts.0001`, `catalog.0001`).
  - Decided JWT storage = localStorage (tokens via OAuth URL fragment); flagged auth-library deviation (custom flow vs allauth) in Decisions Log.
  - VERIFIED on running stack (clean volume, custom-user migrations applied OK): anon read 200 / anon write 401; USER create→403, CREATOR create→201; USER book→201, duplicate→400, full-capacity guarded; seats_left decrements; non-owner creator delete→403; `me` returns role; PATCH role self-upgrade→CREATOR; token refresh→200; JWT decode shows `role` claim; login URL builds. Note: a few test users/session/booking now live in the dev pgdata volume (harmless; replaced when seed data lands).
- 2026-06-30 — Repo scaffold + Docker architecture (no feature code).
  - Created monorepo: `/frontend` (Next.js client-side), `/backend` (Django+DRF), `/nginx`, root `docker-compose.yml`.
  - Frontend: Dockerfile, minimal app-router placeholder page, `next.config.js`.
  - Backend: Dockerfile, `requirements.txt`, `config/` Django project (env-driven settings, DRF+SimpleJWT+CORS+storages wired), `/api/health` endpoint, `entrypoint.sh` (db-wait → migrate → collectstatic → gunicorn).
  - nginx: reverse proxy `/api`,`/admin`,`/static`→backend, `/`→frontend.
  - compose: 6 services (db, minio, minio-init, backend, frontend, nginx) on internal `appnet`; only nginx:80 + minio:9000/9001 published; healthchecks + depends_on ordering; pgdata/miniodata volumes.
  - `.env.example` with ALL vars (Postgres, Django, JWT, GitHub OAuth, Razorpay test, MinIO + django-storages S3, throttling, frontend); `.gitignore`.
  - README skeleton: Architecture (with justifications), Setup, GitHub OAuth setup, MinIO/bucket setup, Demo flow, layout.
  - VERIFIED `docker-compose up --build`: all containers up; nginx→backend `/api/health` 200, nginx→frontend `/` 200, backend→Postgres connection OK, minio-init created `avatars` bucket, backend→minio:9000 reachable. Moved Infra checkboxes to done; Architecture & Docker → in-progress.
