# Migration files

The baseline schema for authentication, courses, assessments, assignments and
progress lives in `database/schema.sql` and is applied by `npm run db:migrate`.
The statement blocks use `CREATE TABLE IF NOT EXISTS`, so they are safe to
re-run.

Numbered `NNN_*.sql` files in this folder are applied in order by the same
command. Each filename is recorded in `schema_migrations` and never applied
twice. To change an applied migration, add a new one instead of editing it.

Current files:

```
001_phase7_publish_defaults_and_indexes.sql
    - assessments and assignments default to unpublished
    - index for the correct-option grading lookup
002_add_certificates.sql
    - certificates table with unique code and one certificate per student/course
003_remove_super_admin_role.sql
    - moves any super admin account to admin and deletes the role
```

Rules for new migrations:

1. Use the next number, for example `002_add_certificates.sql`.
2. Keep the SQL safe to review and safe to apply to existing data.
3. Do not edit a migration that has already been applied.
4. Run `npm run db:migrate` against TiDB to verify it.

The migration runner and seed script are in `backend/scripts/`.
