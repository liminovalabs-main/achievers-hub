# Architecture decisions

## Deployment shape

The repository is a pnpm/Turborepo monorepo with two independently deployable applications:

- `apps/web` is the Next.js browser application and backend-for-frontend. It owns the HTTP-only browser session cookie and forwards authorised requests to the API.
- `apps/api` is the NestJS domain API. Vercel recognises the conventional `src/main.ts` entry point and deploys the application as one function.

Create two Vercel projects from the same Git repository and set their Root Directories to `apps/web` and `apps/api`. Connect them as Related Projects after project IDs exist, or set `API_URL` explicitly for each web environment.

## Trust boundaries

- Browser JavaScript never receives the session token after login; it is stored in a secure HTTP-only cookie.
- NestJS guards enforce roles on protected controllers.
- Relationship services repeat ownership checks before every parent-controlled operation.
- Tutor access requires an active `TutorStudentLink`; UI visibility is not treated as authorisation.
- Invitation tokens are random, time-limited, and stored as SHA-256 hashes.
- Access-changing actions write immutable audit events.

## Database

PostgreSQL is the source of truth. Prisma provides typed access and checked migrations. Application records use UUIDs so IDs are not enumerable. Attempts and progress data will be added in the next learning-engine slice without changing the identity and relationship boundaries established here.

## Vercel environment variables

API project:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `WEB_URL`
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` only for an intentional seed operation

Web project:

- `API_URL` for server-side calls
- `NEXT_PUBLIC_API_URL` only if a public API origin is required

Use a PostgreSQL provider in a UK or EU region and place the API function near the database.
