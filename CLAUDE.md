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
- JWT storage strategy: [TBD — fill in once chosen]
- Public entrypoint: nginx reverse proxy on :80 — single origin (`http://localhost`), avoids CORS, only one published port for the app.
- API routing: nginx sends `/api/`, `/admin/`, `/static/` → backend; everything else → frontend.
- Backend serving: gunicorn (3 workers) via `entrypoint.sh` that waits for Postgres, runs `migrate` + `collectstatic`, then starts.
- Frontend serving: `next build` + `next start` (not SSR data fetching); `NEXT_PUBLIC_API_BASE_URL` inlined at build time = `http://localhost/api`.
- Config: 12-factor — all settings via env (`.env`, copied from `.env.example`); `settings.py` reads env with helpers (env/env_bool/env_list).
- Object storage wiring: django-storages S3 backend pointed at MinIO; `minio-init` one-shot container auto-creates the `avatars` bucket (public-read). Boot does not touch S3, so a missing bucket can't break startup.
- DB readiness: compose healthchecks on db + minio; backend `depends_on` waits for healthy.
- Rate limiting (bonus): DRF AnonRateThrottle/UserRateThrottle enabled globally with env-configurable rates (scopes applied per-view later).
(Record every architectural decision here with a one-line reason.)

## Scoring Map (track what earns points)
- [~] Architecture & Docker — 20  (scaffold + compose verified booting; features pending)
- [ ] Auth & Roles (OAuth + JWT, enforcement) — 20
- [ ] Core Features (sessions CRUD, booking, dashboards) — 30
- [ ] Frontend UX (responsive, error handling) — 15
- [ ] Code Quality & Docs (.env.example, README) — 15
- [ ] Bonus: Razorpay payments + rate limiting + MinIO uploads — +15 (capped)

## Progress Tracker
Five pages: [ ] Home/Catalog  [ ] Session Detail  [ ] Auth Flow  [ ] User Dashboard  [ ] Creator Dashboard
Backend: [ ] models  [ ] GitHub OAuth+JWT  [ ] endpoints  [ ] permissions  [ ] seed data
Infra: [x] docker-compose  [x] nginx  [x] MinIO (container+bucket)  [x] .env.example  [x] README
Bonus: [ ] Razorpay payment flow  [~] rate limiting (DRF throttles wired, scopes TBD)  [ ] MinIO avatar uploads

## Changelog
- 2026-06-30 — Repo scaffold + Docker architecture (no feature code).
  - Created monorepo: `/frontend` (Next.js client-side), `/backend` (Django+DRF), `/nginx`, root `docker-compose.yml`.
  - Frontend: Dockerfile, minimal app-router placeholder page, `next.config.js`.
  - Backend: Dockerfile, `requirements.txt`, `config/` Django project (env-driven settings, DRF+SimpleJWT+CORS+storages wired), `/api/health` endpoint, `entrypoint.sh` (db-wait → migrate → collectstatic → gunicorn).
  - nginx: reverse proxy `/api`,`/admin`,`/static`→backend, `/`→frontend.
  - compose: 6 services (db, minio, minio-init, backend, frontend, nginx) on internal `appnet`; only nginx:80 + minio:9000/9001 published; healthchecks + depends_on ordering; pgdata/miniodata volumes.
  - `.env.example` with ALL vars (Postgres, Django, JWT, GitHub OAuth, Razorpay test, MinIO + django-storages S3, throttling, frontend); `.gitignore`.
  - README skeleton: Architecture (with justifications), Setup, GitHub OAuth setup, MinIO/bucket setup, Demo flow, layout.
  - VERIFIED `docker-compose up --build`: all containers up; nginx→backend `/api/health` 200, nginx→frontend `/` 200, backend→Postgres connection OK, minio-init created `avatars` bucket, backend→minio:9000 reachable. Moved Infra checkboxes to done; Architecture & Docker → in-progress.
