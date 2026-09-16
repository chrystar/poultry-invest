-- Farm operations gallery
-- Run this once in the Supabase SQL editor.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.farm_media (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('photo', 'video')),
  title text not null default '',
  caption text not null default '',
  storage_path text not null unique,
  public_url text not null,
  mime_type text,
  file_size integer,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index if not exists farm_media_published_idx
  on public.farm_media (is_published, sort_order, created_at desc);

alter table public.farm_media enable row level security;

drop policy if exists "farm_media_select" on public.farm_media;
create policy "farm_media_select"
  on public.farm_media for select
  to authenticated
  using (is_published = true or public.is_admin());

drop policy if exists "farm_media_insert" on public.farm_media;
create policy "farm_media_insert"
  on public.farm_media for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "farm_media_update" on public.farm_media;
create policy "farm_media_update"
  on public.farm_media for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "farm_media_delete" on public.farm_media;
create policy "farm_media_delete"
  on public.farm_media for delete
  to authenticated
  using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'farm-media',
  'farm-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "farm_media_storage_select" on storage.objects;
create policy "farm_media_storage_select"
  on storage.objects for select
  to public
  using (bucket_id = 'farm-media');

drop policy if exists "farm_media_storage_insert" on storage.objects;
create policy "farm_media_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'farm-media' and public.is_admin());

drop policy if exists "farm_media_storage_update" on storage.objects;
create policy "farm_media_storage_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'farm-media' and public.is_admin());

drop policy if exists "farm_media_storage_delete" on storage.objects;
create policy "farm_media_storage_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'farm-media' and public.is_admin());
