-- Helper functions (security definer: they check membership tables
-- without re-triggering RLS on those tables, avoiding recursive policies).

create or replace function public.current_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'commission')
  );
$$;

create or replace function public.is_parent_of(p_student_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.student_parents
    where student_id = p_student_id and parent_id = auth.uid()
  );
$$;

create or replace function public.teaches_class(p_class_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.teaching_assignments
    where class_id = p_class_id and teacher_id = auth.uid()
  );
$$;

create or replace function public.teaches_student(p_student_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.class_enrollments ce
    join public.teaching_assignments ta on ta.class_id = ce.class_id
    where ce.student_id = p_student_id and ta.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_enrolled_in_class(p_class_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.class_enrollments
    where class_id = p_class_id and student_id = auth.uid()
  );
$$;

create or replace function public.parent_can_see_class(p_class_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.class_enrollments ce
    join public.student_parents sp on sp.student_id = ce.student_id
    where ce.class_id = p_class_id and sp.parent_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.student_parents enable row level security;
alter table public.classes enable row level security;
alter table public.class_enrollments enable row level security;
alter table public.subjects enable row level security;
alter table public.teaching_assignments enable row level security;
alter table public.lessons enable row level security;
alter table public.homework_stages enable row level security;
alter table public.submissions enable row level security;
alter table public.mastery_scores enable row level security;
alter table public.teacher_comments enable row level security;

-- profiles
create policy "profiles_select_self_or_related" on public.profiles for select
  using (
    id = auth.uid()
    or public.is_staff()
    or public.is_parent_of(id)
    or public.teaches_student(id)
  );
create policy "profiles_update_self" on public.profiles for update
  using (id = auth.uid());

-- student_parents
create policy "student_parents_select" on public.student_parents for select
  using (parent_id = auth.uid() or student_id = auth.uid() or public.is_staff());
create policy "student_parents_manage_staff" on public.student_parents for all
  using (public.is_staff()) with check (public.is_staff());

-- classes
create policy "classes_select_authenticated" on public.classes for select
  using (auth.role() = 'authenticated');
create policy "classes_manage_staff" on public.classes for all
  using (public.is_staff()) with check (public.is_staff());

-- class_enrollments
create policy "class_enrollments_select" on public.class_enrollments for select
  using (
    student_id = auth.uid()
    or public.is_parent_of(student_id)
    or public.teaches_class(class_id)
    or public.is_staff()
  );
create policy "class_enrollments_manage_staff" on public.class_enrollments for all
  using (public.is_staff()) with check (public.is_staff());

-- subjects (plain catalog, readable by anyone signed in)
create policy "subjects_select_authenticated" on public.subjects for select
  using (auth.role() = 'authenticated');
create policy "subjects_manage_staff" on public.subjects for all
  using (public.is_staff()) with check (public.is_staff());

-- teaching_assignments
create policy "teaching_assignments_select" on public.teaching_assignments for select
  using (teacher_id = auth.uid() or public.is_staff());
create policy "teaching_assignments_manage_staff" on public.teaching_assignments for all
  using (public.is_staff()) with check (public.is_staff());

-- lessons: students/parents only see published lessons on/after their
-- scheduled_date (daily unlock); teachers/staff see everything for their
-- classes, including future-dated calendar entries.
create policy "lessons_select_unlocked" on public.lessons for select
  using (
    (
      status = 'published'
      and scheduled_date <= current_date
      and (public.is_enrolled_in_class(class_id) or public.parent_can_see_class(class_id))
    )
    or public.teaches_class(class_id)
    or public.is_staff()
  );
create policy "lessons_manage_teacher_or_staff" on public.lessons for all
  using (public.teaches_class(class_id) or public.is_staff())
  with check (public.teaches_class(class_id) or public.is_staff());

-- homework_stages follow the parent lesson's visibility
create policy "homework_stages_select_unlocked" on public.homework_stages for select
  using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_id
        and (
          (
            l.status = 'published'
            and l.scheduled_date <= current_date
            and (public.is_enrolled_in_class(l.class_id) or public.parent_can_see_class(l.class_id))
          )
          or public.teaches_class(l.class_id)
          or public.is_staff()
        )
    )
  );
create policy "homework_stages_manage_teacher_or_staff" on public.homework_stages for all
  using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_id and (public.teaches_class(l.class_id) or public.is_staff())
    )
  )
  with check (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_id and (public.teaches_class(l.class_id) or public.is_staff())
    )
  );

-- submissions: a student only ever writes/reads their own; parents/teachers/staff read.
create policy "submissions_select" on public.submissions for select
  using (
    student_id = auth.uid()
    or public.is_parent_of(student_id)
    or public.teaches_student(student_id)
    or public.is_staff()
  );
create policy "submissions_insert_self" on public.submissions for insert
  with check (student_id = auth.uid());
create policy "submissions_update_self" on public.submissions for update
  using (student_id = auth.uid());

-- mastery_scores: read-only to clients, written only by the trigger
-- (security definer) or staff.
create policy "mastery_scores_select" on public.mastery_scores for select
  using (
    student_id = auth.uid()
    or public.is_parent_of(student_id)
    or public.teaches_student(student_id)
    or public.is_staff()
  );
create policy "mastery_scores_manage_staff" on public.mastery_scores for all
  using (public.is_staff()) with check (public.is_staff());

-- teacher_comments: teacher of that student writes; student/parent/staff read.
create policy "teacher_comments_select" on public.teacher_comments for select
  using (
    student_id = auth.uid()
    or public.is_parent_of(student_id)
    or teacher_id = auth.uid()
    or public.teaches_student(student_id)
    or public.is_staff()
  );
create policy "teacher_comments_insert_teacher" on public.teacher_comments for insert
  with check (teacher_id = auth.uid() and public.teaches_student(student_id));
create policy "teacher_comments_update_author" on public.teacher_comments for update
  using (teacher_id = auth.uid());
