insert into storage.buckets (id, name, public)
values ('event-media', 'event-media', true)
on conflict (id) do nothing;

create policy "public can view event media"
on storage.objects
for select
to public
using (bucket_id = 'event-media');

create policy "authenticated users can upload event media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = 'covers'
  and (storage.foldername(name))[2] = public.current_app_user_id()
);

create policy "authenticated users can update their event media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = 'covers'
  and (storage.foldername(name))[2] = public.current_app_user_id()
)
with check (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = 'covers'
  and (storage.foldername(name))[2] = public.current_app_user_id()
);

create policy "authenticated users can delete their event media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-media'
  and (storage.foldername(name))[1] = 'covers'
  and (storage.foldername(name))[2] = public.current_app_user_id()
);
