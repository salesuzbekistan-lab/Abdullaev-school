-- Local dev seed: just the Phase 1 reference subject and a class to enroll
-- test users into later. No auth.users rows here -- that depends on the
-- auth-strategy decision (how roles get assigned), not yet finalized.

insert into public.subjects (name, track) values
  ('Matematika', 'davlat');

insert into public.classes (name, grade, academic_year) values
  ('2-A', 2, '2026-2027');
