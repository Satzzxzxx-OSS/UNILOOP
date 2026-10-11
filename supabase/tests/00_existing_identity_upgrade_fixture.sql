-- DISPOSABLE CI ONLY. Seed an existing reviewed profile before backfill migration.
insert into auth.users(id,email) values
 ('aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa','existing-reviewed@example.test');
update public.profiles set display_name='Preserved name',account_status='suspended',
 created_at='2020-01-01T00:00:00Z'
where id='aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa';
