create or replace function public.current_app_user_id()
returns text
language sql
stable
as $$
  select u."id"
  from public."User" u
  where lower(u."email") = lower(coalesce(auth.jwt()->>'email', ''))
  limit 1
$$;

alter table public."User" enable row level security;
alter table public."EventPost" enable row level security;
alter table public."Comment" enable row level security;
alter table public."PostInteraction" enable row level security;
alter table public."EventRsvp" enable row level security;
alter table public."Report" enable row level security;
alter table public."Follow" enable row level security;
alter table public."SavedPost" enable row level security;
alter table public."University" enable row level security;

create policy "public can read universities"
on public."University"
for select
using (true);

create policy "authenticated users can read profiles"
on public."User"
for select
to authenticated
using (true);

create policy "users can update own profile"
on public."User"
for update
to authenticated
using ("id" = public.current_app_user_id())
with check ("id" = public.current_app_user_id());

create policy "authenticated users can read event posts"
on public."EventPost"
for select
to authenticated
using (true);

create policy "users can create own event posts"
on public."EventPost"
for insert
to authenticated
with check ("authorId" = public.current_app_user_id());

create policy "users can update own event posts"
on public."EventPost"
for update
to authenticated
using ("authorId" = public.current_app_user_id())
with check ("authorId" = public.current_app_user_id());

create policy "users can delete own event posts"
on public."EventPost"
for delete
to authenticated
using ("authorId" = public.current_app_user_id());

create policy "authenticated users can read comments"
on public."Comment"
for select
to authenticated
using (true);

create policy "users can create own comments"
on public."Comment"
for insert
to authenticated
with check ("authorId" = public.current_app_user_id());

create policy "users can update own comments"
on public."Comment"
for update
to authenticated
using ("authorId" = public.current_app_user_id())
with check ("authorId" = public.current_app_user_id());

create policy "users can delete own comments"
on public."Comment"
for delete
to authenticated
using ("authorId" = public.current_app_user_id());

create policy "authenticated users can read interactions"
on public."PostInteraction"
for select
to authenticated
using (true);

create policy "users can create own interactions"
on public."PostInteraction"
for insert
to authenticated
with check ("userId" = public.current_app_user_id());

create policy "users can delete own interactions"
on public."PostInteraction"
for delete
to authenticated
using ("userId" = public.current_app_user_id());

create policy "authenticated users can read event rsvps"
on public."EventRsvp"
for select
to authenticated
using (true);

create policy "users can create own event rsvps"
on public."EventRsvp"
for insert
to authenticated
with check ("userId" = public.current_app_user_id());

create policy "users can update own event rsvps"
on public."EventRsvp"
for update
to authenticated
using ("userId" = public.current_app_user_id())
with check ("userId" = public.current_app_user_id());

create policy "users can delete own event rsvps"
on public."EventRsvp"
for delete
to authenticated
using ("userId" = public.current_app_user_id());

create policy "authenticated users can read follows"
on public."Follow"
for select
to authenticated
using (true);

create policy "users can create own follows"
on public."Follow"
for insert
to authenticated
with check ("followerId" = public.current_app_user_id());

create policy "users can delete own follows"
on public."Follow"
for delete
to authenticated
using ("followerId" = public.current_app_user_id());

create policy "authenticated users can read saved posts"
on public."SavedPost"
for select
to authenticated
using ("userId" = public.current_app_user_id());

create policy "users can create own saved posts"
on public."SavedPost"
for insert
to authenticated
with check ("userId" = public.current_app_user_id());

create policy "users can delete own saved posts"
on public."SavedPost"
for delete
to authenticated
using ("userId" = public.current_app_user_id());

create policy "users can create own reports"
on public."Report"
for insert
to authenticated
with check ("reporterId" = public.current_app_user_id());

create policy "users can read own reports"
on public."Report"
for select
to authenticated
using (
  "reporterId" = public.current_app_user_id()
  or exists (
    select 1 from public."User" u
    where u."id" = public.current_app_user_id()
      and lower(u."role") like '%admin%'
  )
);

create policy "admins can review reports"
on public."Report"
for update
to authenticated
using (
  exists (
    select 1 from public."User" u
    where u."id" = public.current_app_user_id()
      and lower(u."role") like '%admin%'
  )
)
with check (
  exists (
    select 1 from public."User" u
    where u."id" = public.current_app_user_id()
      and lower(u."role") like '%admin%'
  )
);
