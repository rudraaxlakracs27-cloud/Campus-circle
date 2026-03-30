# Campus Circles

Campus Circles is a social platform starter where students from multiple universities can post upcoming college events, attach media, and interact with a shared campus feed.

## What works now

- Multi-university event feed backed by Prisma and Supabase Postgres
- Supabase Auth email/password sign-in with cookie-based SSR sessions
- Working event composer that creates a new post, including Supabase Storage image uploads
- Social interactions with likes, interest toggles, and post comments
- Search and filter support across universities and event categories
- Dedicated event detail pages for deeper discovery
- Signed-in profile page that shows account details and posts from that student
- Reporting flow plus an admin moderation dashboard foundation
- Notification center for likes, comments, and moderation activity
- Saved events and organizer following
- In-app RSVP tracking with Going and Maybe states
- Threaded comment replies for richer event discussions
- Date-based discovery with presets and custom ranges
- Smarter feed ranking based on freshness, engagement, campus relevance, follows, saves, and RSVP behavior
- Shared validation rules for signup, profile edits, comments, and event create/edit flows
- Client-side toast notifications for transient success and warning feedback
- Reusable server-side data layer in [lib/store.ts](/Users/rudraaxlakra/Documents/New%20project/lib/store.ts)

## Current architecture

- Frontend: Next.js App Router with TypeScript
- Auth scaffold: Supabase SSR auth clients and cookie-backed session refresh
- Mutations: Next.js server actions in [app/actions.ts](/Users/rudraaxlakra/Documents/New%20project/app/actions.ts)
- Persistence: Prisma ORM with Supabase-managed PostgreSQL
- Media uploads: Supabase Storage bucket for event cover images

## Demo flow

1. Open `/sign-in`
2. Create your own account at `/sign-up` or sign in at `/sign-in`
3. Visit `/create-post`
4. Publish an event
5. Return to `/` and `/profile` to see the update

You can either paste an external image URL or upload an image file directly from the event composer.
If email verification is enabled in Supabase Auth, confirm your email from your inbox before signing in.

## Database commands

- `npm run db:generate`
- `npm run db:migrate:dev`
- `npm run db:migrate:deploy`
- `npm run db:push`
- `npm run db:seed`

## Supabase setup

1. Create a Supabase project from the dashboard.
2. In the SQL editor, run [supabase/prisma-role.sql](/Users/rudraaxlakra/Documents/New%20project/supabase/prisma-role.sql) to create a dedicated Prisma role.
3. Copy [.env.example](/Users/rudraaxlakra/Documents/New%20project/.env.example) to `.env.local` or `.env` and fill in your project values.
4. Use the Supavisor session pooler string for `DATABASE_URL`.
5. Use the direct connection string for `DIRECT_URL` if your environment supports IPv6; otherwise use the session pooler string there too.
6. Sync and seed:
   `npm run db:push`
   `npm run db:seed`
7. In the Supabase SQL editor, run [supabase/storage.sql](/Users/rudraaxlakra/Documents/New%20project/supabase/storage.sql) to create the `event-media` bucket and upload policies.
8. If you want moderation/reporting, run [supabase/moderation.sql](/Users/rudraaxlakra/Documents/New%20project/supabase/moderation.sql) to add the reports table.
9. If you want notifications on likes/comments/reports, run [supabase/notifications.sql](/Users/rudraaxlakra/Documents/New%20project/supabase/notifications.sql) to add the notifications table.
10. If you want saved events and following on an existing Supabase DB, run [supabase/social.sql](/Users/rudraaxlakra/Documents/New%20project/supabase/social.sql).
11. If you want in-app RSVP tracking on an existing Supabase DB, run [supabase/rsvp.sql](/Users/rudraaxlakra/Documents/New%20project/supabase/rsvp.sql).
12. If you want threaded replies on an existing Supabase DB, run [supabase/threaded-comments.sql](/Users/rudraaxlakra/Documents/New%20project/supabase/threaded-comments.sql).
13. Start the app:
   `npm run dev`

Important:
- `DATABASE_URL` is the Prisma runtime connection.
- `DIRECT_URL` is used by Prisma for direct database operations when available.
- If you use a Supabase transaction-mode or PgBouncer-style connection, Supabase’s Prisma troubleshooting guide says to add `pgbouncer=true` to the connection string.

## Migration baseline

This project now includes a baseline Prisma migration in [prisma/migrations/20260330003000_baseline/migration.sql](/Users/rudraaxlakra/Documents/New%20project/prisma/migrations/20260330003000_baseline/migration.sql).

For an existing Supabase database that was created manually, mark that migration as already applied before using normal Prisma deploy flows:

`npx prisma migrate resolve --applied 20260330003000_baseline`

After that, use:

- `npm run db:migrate:dev` for local development changes
- `npm run db:migrate:deploy` for applying checked-in migrations

For a brand new database, you can use the migration directly instead of bootstrapping with manual SQL.

## Supabase security setup

1. Run [supabase/rls.sql](/Users/rudraaxlakra/Documents/New%20project/supabase/rls.sql) in the Supabase SQL editor to enable starter Row Level Security policies for the public tables.
2. Run [supabase/storage.sql](/Users/rudraaxlakra/Documents/New%20project/supabase/storage.sql) after [supabase/rls.sql](/Users/rudraaxlakra/Documents/New%20project/supabase/rls.sql) so the storage bucket policies can reference `public.current_app_user_id()`.
3. Rotate any secrets that were previously exposed and move production values into your deployment environment instead of keeping them in shared local files.

## Operational notes

- Rate limiting is now implemented in-process for auth, reporting, comments, and post mutation routes. This is a good development guardrail but should be replaced with a shared store such as Redis or Upstash in production.
- Prisma-backed server mutations currently bypass RLS, so the new Supabase RLS policies are a safety baseline for future direct client/database access and for storage enforcement.

## Production upgrade path

### Improve Supabase production setup

- Add Prisma migrations instead of relying only on `db push`
- Move from local cookie auth to Supabase Auth
- Improve Supabase Storage with image cleanup, file metadata, and private/public variants
- Add Row Level Security policies if you later access data via the Supabase client directly
- Keep extending models for `MediaAsset`, `Follow`, notifications, and moderation

### Improve auth

- Require university email verification and moderation roles
- Add profile editing and stronger account lifecycle management

### Add true media uploads

- Replace local `public/uploads` storage with Cloudinary, Supabase Storage, or S3
- Store upload metadata and generated thumbnails
- Support images, short videos, posters, and PDFs

### Expand interactions

- Saves and reposts
- Comment moderation
- Reminder notifications
- Following clubs and campuses

## Suggested next build step

The best next production phase is full Supabase integration: Supabase Auth for sign-in, Supabase Storage for uploads, and RLS-backed data access where it makes sense.
