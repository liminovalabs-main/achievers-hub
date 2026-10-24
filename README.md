# The Achievers Hub

Custom learning-platform foundation for GCSE Maths and Economics. The first delivery slice covers platform setup, authentication, role-aware onboarding, parent/student family relationships, and controlled tutor access.

## Applications

- `apps/web` — Next.js App Router frontend for students, parents, tutors, and administrators.
- `apps/api` — NestJS API with JWT authentication and role/relationship authorization.
- `packages/database` — PostgreSQL schema and Prisma client.
- `packages/contracts` — Shared validation schemas and role types.
- `packages/ui` — Shared visual primitives and design tokens.

## Local setup

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL with `docker compose up -d postgres`, or supply another PostgreSQL `DATABASE_URL`.
3. Install packages with `pnpm install`.
4. Generate the database client with `pnpm db:generate`.
5. Apply the initial migration with `pnpm db:migrate`.
6. Seed the administrator with `pnpm db:seed`.
7. Run both apps with `pnpm dev`.

The web app runs on `http://localhost:3000`, the API on `http://localhost:4000`, and API documentation on `http://localhost:4000/docs`.

For UI-only development without a database, set `ACHIEVERS_PREVIEW_ROLE` to `STUDENT`, `PARENT`, `TUTOR`, or `ADMIN` before running the web app. The preview identity is disabled automatically in production.

## Day 1–4 scope

- Monorepo, environment contract, PostgreSQL schema, API documentation, and CI-ready scripts.
- Email/password authentication with short-lived JWT sessions and server-only browser cookies.
- Student, parent, tutor, and administrator roles.
- Parent-created families and student invitations.
- Tutor invitation, acceptance, parent approval, rejection, and revocation controls.
- Role-aware onboarding and dashboard shells.
- Audit records for relationship and access changes.

The learning engine, Daily 5, curriculum content, assessment marking, progress calculations, and paid subscriptions are intentionally left for the next delivery slices.
