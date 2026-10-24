# Day 1–4 delivery record

## Completed foundation

- pnpm/Turborepo workspace with separate Next.js and NestJS applications.
- PostgreSQL/Prisma schema, checked initial migration, seed script, and local Compose service.
- Shared contracts, visual tokens, environment contract, and CI workflow.
- Swagger API documentation and health endpoint.

## Completed identity and relationships

- Student, parent, tutor, and administrator roles.
- Email/password registration with Argon2 password hashes.
- Short-lived JWT access sessions held in HTTP-only browser cookies.
- Parent-created families and student invitations.
- Student activation and invitation acceptance paths.
- Parent-issued tutor invitations and tutor-issued access requests.
- Explicit approval, rejection, and revocation state for tutor access.
- Audit events for account, family, invitation, and access changes.

## Completed frontend slice

- Responsive login, registration, and student activation screens.
- Role-aware onboarding for parent, student, and tutor journeys.
- Distinct student, parent, tutor, and administrator dashboards.
- Browser-to-API proxy that keeps credentials out of client JavaScript.
- Development-only role previews that are compiled out of production behavior.

## Deferred to Day 5 onward

- Curriculum import and question authoring.
- Daily 5 selection, marking, explanations, and mastery updates.
- Assessment planner, homework, progress reports, and notifications.
- Email delivery provider for invitations.
- Subscription billing and paid entitlements.
