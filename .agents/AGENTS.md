<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Production Database & Migrations Rules

This project is deployed to production with a connected Supabase database via the `DATABASE_URL` environment variable.

1. **WARNING:** Do not run `prisma migrate reset` or drop the database under any circumstances.
2. **Schema Updates:** You may continue to use `npx prisma db push` to push schema updates. `db push` is safe because it will automatically abort if it detects a breaking change (data loss).
3. **Breaking Changes:** If a schema change is breaking (e.g. dropping a column) and it is for a non-critical module (e.g. anything other than the core `Task` or `User` models), you MUST ask for explicit user confirmation before running `npx prisma db push --accept-data-loss`.
4. **Critical Data Loss:** If a breaking change affects critical modules (like `Task`), do NOT use `--accept-data-loss`. Instead, you must write a custom SQL migration using `npx prisma migrate dev --create-only` to preserve the data, or discuss alternative strategies with the user.
