# Database

This folder holds the TiDB schema, numbered migrations and sample data.

- `schema.sql` - baseline tables for roles, authentication, courses/modules/lessons, enrolments, lesson completions, assessments (questions, options, attempts, answers), assignments, submissions, certificates and migration tracking. Safe to run repeatedly.
- `migrations/` - numbered, ordered SQL changes applied once by `npm run db:migrate` and recorded in `schema_migrations`.
- `seed.sql` - role descriptions that are safe to store in source control.
- `backend/scripts/seed.js` - creates the three development demo accounts plus a small demo course with two weekly modules, two quizzes and one assignment. Passwords are bcrypt-hashed at run time, so no plain-text password or reusable hash is committed.

The dedicated database (`kodewar_lms`) is created by `npm run db:check`.
Running `npm run db:seed` also resets the demo student's progress on the demo
course so the unlock chain can be demonstrated repeatedly. This is
development-only data; no application data lives in the frontend or backend
source code.

## Commands

```powershell
npm run db:check     # connect and create the database if missing
npm run db:migrate   # apply schema.sql, then pending numbered migrations
npm run db:seed      # create/restore the three demo accounts and demo course
```

The migration runner creates `schema_migrations`, applies every pending
`database/migrations/NNN_*.sql` file in numeric order, and skips files that
have already been applied. New assessment and assignment rows default to
unpublished at the database level, matching the staff API.

The seed script refuses to run when `NODE_ENV=production` unless
`FORCE_SEED=true` is set explicitly. Remove demo accounts before deploying.
