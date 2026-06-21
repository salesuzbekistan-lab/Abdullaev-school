-- Recomputes mastery_scores(student, subject) as the average submission
-- score for that subject whenever a submission is inserted or updated.
create or replace function public.recompute_mastery() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_subject_id uuid;
  v_avg numeric(5, 4);
begin
  v_student_id := new.student_id;

  select l.subject_id into v_subject_id
  from public.homework_stages hs
  join public.lessons l on l.id = hs.lesson_id
  where hs.id = new.homework_stage_id;

  select avg(s.score) into v_avg
  from public.submissions s
  join public.homework_stages hs on hs.id = s.homework_stage_id
  join public.lessons l on l.id = hs.lesson_id
  where s.student_id = v_student_id
    and l.subject_id = v_subject_id;

  insert into public.mastery_scores (student_id, subject_id, mastery_pct, updated_at)
  values (v_student_id, v_subject_id, coalesce(v_avg, 0), now())
  on conflict (student_id, subject_id)
  do update set mastery_pct = excluded.mastery_pct, updated_at = excluded.updated_at;

  return new;
end;
$$;

create trigger submissions_recompute_mastery
  after insert or update on public.submissions
  for each row execute function public.recompute_mastery();
