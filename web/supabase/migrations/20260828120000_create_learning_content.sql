create table public.courses (
  id text primary key,
  title text not null,
  description text not null,
  level_id text,
  level_label text,
  level_kind text,
  subject_id text not null,
  subject_label text not null,
  programme_id text,
  programme_label text,
  category_id text,
  category_label text,
  curriculum_id text not null,
  curriculum_title text not null,
  curriculum_jurisdiction text,
  curriculum_version text,
  status text not null default 'draft',
  content_origin text not null,
  authors text[] not null default '{}',
  curriculum_references text[] not null default '{}',
  ai_assisted boolean not null default false,
  reviewer text,
  reviewed_at timestamptz,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint courses_slug_check check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint courses_status_check check (status in ('draft', 'reviewed', 'approved', 'published')),
  constraint courses_origin_check check (content_origin in ('original', 'adapted', 'licensed', 'commissioned')),
  constraint courses_level_kind_check check (level_kind is null or level_kind in ('primary', 'secondary', 'programme', 'open')),
  constraint courses_level_fields_check check (
    (level_id is null and level_label is null and level_kind is null)
    or (level_id is not null and level_label is not null and level_kind is not null)
  ),
  constraint courses_programme_fields_check check (
    (programme_id is null and programme_label is null)
    or (programme_id is not null and programme_label is not null)
  ),
  constraint courses_category_fields_check check (
    (category_id is null and category_label is null)
    or (category_id is not null and category_label is not null)
  )
);

create table public.course_modules (
  course_id text not null references public.courses(id) on delete cascade,
  id text not null,
  title text not null,
  description text not null,
  position integer not null,
  status text not null default 'draft',
  content_origin text not null,
  authors text[] not null default '{}',
  curriculum_references text[] not null default '{}',
  ai_assisted boolean not null default false,
  reviewer text,
  reviewed_at timestamptz,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (course_id, id),
  unique (course_id, position),
  constraint course_modules_slug_check check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint course_modules_position_check check (position >= 0),
  constraint course_modules_status_check check (status in ('draft', 'reviewed', 'approved', 'published')),
  constraint course_modules_origin_check check (content_origin in ('original', 'adapted', 'licensed', 'commissioned'))
);

create table public.lessons (
  course_id text not null,
  module_id text not null,
  id text not null,
  title text not null,
  description text not null,
  position integer not null,
  topic_id text not null,
  skill_id text not null,
  targeted_practice_skill_id text not null,
  guided_practice_skill_id text,
  independent_practice_skill_id text,
  status text not null default 'draft',
  content_origin text not null,
  authors text[] not null default '{}',
  curriculum_references text[] not null default '{}',
  ai_assisted boolean not null default false,
  reviewer text,
  reviewed_at timestamptz,
  internal_notes text,
  learning_objectives text[] not null default '{}',
  explanation_sections jsonb not null default '[]'::jsonb,
  worked_examples jsonb not null default '[]'::jsonb,
  key_points text[],
  prerequisite_lesson_ids text[],
  difficulty text,
  estimated_duration_minutes integer,
  media jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (course_id, id),
  foreign key (course_id, module_id)
    references public.course_modules(course_id, id) on delete cascade,
  unique (course_id, module_id, position),
  constraint lessons_slug_check check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint lessons_position_check check (position >= 0),
  constraint lessons_status_check check (status in ('draft', 'reviewed', 'approved', 'published')),
  constraint lessons_origin_check check (content_origin in ('original', 'adapted', 'licensed', 'commissioned')),
  constraint lessons_difficulty_check check (difficulty is null or difficulty in ('foundation', 'standard', 'advanced', 'challenge')),
  constraint lessons_duration_check check (estimated_duration_minutes is null or estimated_duration_minutes > 0),
  constraint lessons_explanations_array_check check (jsonb_typeof(explanation_sections) = 'array'),
  constraint lessons_examples_array_check check (jsonb_typeof(worked_examples) = 'array'),
  constraint lessons_media_object_check check (media is null or jsonb_typeof(media) = 'object')
);

create index courses_catalogue_idx
  on public.courses (status, subject_id, level_id, programme_id);

create index course_modules_published_order_idx
  on public.course_modules (course_id, position)
  where status = 'published';

create index lessons_published_order_idx
  on public.lessons (course_id, module_id, position)
  where status = 'published';

create index lessons_taxonomy_idx
  on public.lessons (topic_id, skill_id)
  where status = 'published';

alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;

revoke all on public.courses from anon, authenticated;
revoke all on public.course_modules from anon, authenticated;
revoke all on public.lessons from anon, authenticated;

grant select on public.courses to authenticated;
grant select on public.course_modules to authenticated;
grant select on public.lessons to authenticated;

create policy "Authenticated learners can read published courses"
  on public.courses
  for select
  to authenticated
  using (status = 'published');

create policy "Authenticated learners can read published course modules"
  on public.course_modules
  for select
  to authenticated
  using (
    status = 'published'
    and exists (
      select 1
      from public.courses
      where courses.id = course_modules.course_id
        and courses.status = 'published'
    )
  );

create policy "Authenticated learners can read published lessons"
  on public.lessons
  for select
  to authenticated
  using (
    status = 'published'
    and exists (
      select 1
      from public.course_modules
      where course_modules.course_id = lessons.course_id
        and course_modules.id = lessons.module_id
        and course_modules.status = 'published'
    )
    and exists (
      select 1
      from public.courses
      where courses.id = lessons.course_id
        and courses.status = 'published'
    )
  );

insert into public.courses (
  id, title, description,
  level_id, level_label, level_kind,
  subject_id, subject_label,
  category_id, category_label,
  curriculum_id, curriculum_title, curriculum_jurisdiction,
  status, content_origin, authors, curriculum_references,
  ai_assisted, reviewer, reviewed_at
) values (
  'primary-3-mathematics',
  'Primary 3 Mathematics',
  'Build confidence with clear explanations, worked examples, and focused practice.',
  'primary-3', 'Primary 3', 'primary',
  'mathematics', 'Mathematics',
  'core-curriculum', 'Core curriculum',
  'singapore-primary-mathematics', 'Singapore Primary Mathematics', 'Singapore',
  'published', 'original', array['LearnAI curriculum team'],
  array['Singapore Primary Mathematics curriculum'], false,
  'LearnAI curriculum review', '2026-08-28T00:00:00+08:00'
) on conflict (id) do nothing;

insert into public.course_modules (
  course_id, id, title, description, position,
  status, content_origin, authors, curriculum_references,
  ai_assisted, reviewer, reviewed_at
) values (
  'primary-3-mathematics', 'whole-numbers', 'Whole Numbers',
  'Understand how whole numbers are connected and use them to solve problems.', 0,
  'published', 'original', array['LearnAI curriculum team'],
  array['Singapore Primary Mathematics curriculum'], false,
  'LearnAI curriculum review', '2026-08-28T00:00:00+08:00'
) on conflict (course_id, id) do nothing;

insert into public.lessons (
  course_id, module_id, id, title, description, position,
  topic_id, skill_id, targeted_practice_skill_id,
  status, content_origin, authors, curriculum_references,
  ai_assisted, reviewer, reviewed_at,
  learning_objectives, explanation_sections, worked_examples, key_points,
  difficulty, estimated_duration_minutes
) values (
  'primary-3-mathematics', 'whole-numbers', 'comparison-and-change-problems',
  'Comparison and Change Problems',
  'Learn to compare quantities and follow how an amount changes.', 0,
  'whole-numbers', 'comparison-and-change-problems', 'comparison-and-change-problems',
  'published', 'original', array['LearnAI curriculum team'],
  array['Singapore Primary Mathematics curriculum'], false,
  'LearnAI curriculum review', '2026-08-28T00:00:00+08:00',
  array[
    'Identify the two quantities being compared.',
    'Find an unknown starting amount, change, or final amount.',
    'Choose addition or subtraction and explain why it works.'
  ],
  '[{"id":"compare-quantities","title":"Compare two quantities","paragraphs":["Comparison problems tell us how much more or how much less one quantity is than another. A simple bar model can help us see the difference."]},{"id":"track-a-change","title":"Track what changes","paragraphs":["Change problems have a starting amount, a change, and a final amount. Mark the unknown part, then decide whether to add or subtract."]}]'::jsonb,
  '[{"id":"sticker-comparison","title":"Comparing sticker collections","problem":"Maya has 36 stickers. She has 9 more stickers than Ravi. How many stickers does Ravi have?","steps":["Maya has the greater quantity.","The difference between their collections is 9.","Subtract the difference from Maya''s amount: 36 - 9 = 27."],"answer":"Ravi has 27 stickers."}]'::jsonb,
  array[
    'Underline words such as more, fewer, gained, or left.',
    'Draw bars of different lengths when comparing quantities.',
    'Check that your answer makes sense in the story.'
  ],
  'standard', 10
) on conflict (course_id, id) do nothing;

