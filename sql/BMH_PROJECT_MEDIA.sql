-- Apply AFTER BMH_CUSTOMER_CLOUD.sql using the existing Supabase project.
-- Only set BMH_MEDIA_READY=true after testing this private bucket with two users.
-- Storage owns object bytes; do not directly INSERT/DELETE storage.objects.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('bmh-project-media','bmh-project-media',false,2097152,array['image/jpeg','image/png','image/webp','application/pdf'])
 on conflict(id) do update set public=false,file_size_limit=2097152,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists bmh_media_select_own_project on storage.objects;
create policy bmh_media_select_own_project on storage.objects for select to authenticated using (
 bucket_id='bmh-project-media'
 and (storage.foldername(name))[1]=(select auth.uid()::text)
 and exists(select 1 from public.bmh_projects p where p.user_id=(select auth.uid()) and p.id::text=(storage.foldername(name))[2])
);
drop policy if exists bmh_media_insert_own_project on storage.objects;
create policy bmh_media_insert_own_project on storage.objects for insert to authenticated with check (
 bucket_id='bmh-project-media'
 and (storage.foldername(name))[1]=(select auth.uid()::text)
 and exists(select 1 from public.bmh_projects p where p.user_id=(select auth.uid()) and p.id::text=(storage.foldername(name))[2])
);
-- No UPDATE/UPSERT: immutable content-hash keys; no public read.
-- Account/project deletion needs an authenticated Storage cleanup operation;
-- deleting database metadata alone does not remove provider bytes.
commit;
