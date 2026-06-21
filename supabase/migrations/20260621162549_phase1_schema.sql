-- Phase 1 schema: auth roles, classes, one-subject lesson/homework flow,
-- mastery scoring, teacher comments. Conduct ledger and academic-standing
-- yearly checkpoints (PRD §6) are out of scope for Phase 1.

create type public.user_role as enum ('student', 'parent', 'teacher', 'admin', 'commission');
create type public.subject_track as enum ('davlat', 'qoshimcha');
create type public.lesson_status as enum ('draft', 'scheduled', 'published');
create type public.homework_stage_type as enum ('video_theory', 'vocabulary', 'listening', 'reading');

-- One row per auth.users entry. Role assignment flow (who can become a
-- teacher/parent/commission member) is decided in the auth-strategy step,
-- not here -- this table only models the shape.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  created_at timestamptz not null default now()
);

-- Many-to-many: a parent can have several children, a student several guardians.
create table public.student_parents (
  student_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid not null references public.profiles (id) on delete cascade,
  primary key (student_id, parent_id)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- e.g. "2-A"
  grade smallint not null check (grade between 1 and 11),
  academic_year text not null, -- e.g. "2026-2027"
  created_at timestamptz not null default now()
);

create table public.class_enrollments (
  student_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  primary key (student_id, class_id)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- e.g. "Matematika"
  track public.subject_track not null,
  created_at timestamptz not null default now()
);

-- Which teacher is responsible for which subject in which class.
create table public.teaching_assignments (
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  primary key (teacher_id, subject_id, class_id)
);

-- One lesson = one subject, one class, one calendar day. scheduled_date
-- drives the daily-unlock model (§5.1) and doubles as the content-calendar
-- record the Commission plans ~1 chorak ahead.
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  title text not null,
  video_url text,
  theory_content text,
  scheduled_date date not null,
  status public.lesson_status not null default 'draft',
  created_by uuid not null references public.profiles (id),
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index lessons_subject_class_date_idx on public.lessons (subject_id, class_id, scheduled_date);

create table public.homework_stages (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  stage_type public.homework_stage_type not null,
  stage_order smallint not null,
  pass_threshold numeric(4, 3) not null default 0.75,
  content jsonb not null default '{}'::jsonb, -- exercises/questions payload
  created_at timestamptz not null default now(),
  unique (lesson_id, stage_order)
);

-- One attempt per student per stage. answers stores per-question
-- correctness so mastery drill-down can point at the exact topic/question.
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  homework_stage_id uuid not null references public.homework_stages (id) on delete cascade,
  answers jsonb not null default '[]'::jsonb,
  score numeric(5, 4) not null, -- 0..1
  correct_count smallint not null,
  total_count smallint not null,
  submitted_at timestamptz not null default now(),
  unique (student_id, homework_stage_id)
);

-- Rolling mastery % per student per subject, recomputed by trigger
-- (see 20260621162550_mastery_trigger.sql) -- not written directly by clients.
create table public.mastery_scores (
  student_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  mastery_pct numeric(5, 4) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (student_id, subject_id)
);

create table public.teacher_comments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id),
  student_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete set null,
  comment_text text not null,
  created_at timestamptz not null default now()
);

create index teacher_comments_student_idx on public.teacher_comments (student_id, created_at desc);
