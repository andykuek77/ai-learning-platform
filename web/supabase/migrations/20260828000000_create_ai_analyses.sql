create table public.ai_analyses (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_json jsonb not null,
  based_on_latest_attempt_at timestamptz not null,
  created_at timestamptz not null default now(),

  constraint ai_analyses_required_fields check (
    analysis_json ?& array[
      'summary',
      'strengths',
      'areasToImprove',
      'recommendedNextSteps'
    ]
  ),

  constraint ai_analyses_user_attempt_unique
    unique (user_id, based_on_latest_attempt_at)
);

create index ai_analyses_user_created_at_idx
  on public.ai_analyses (user_id, created_at desc);

alter table public.ai_analyses enable row level security;

create policy "Users can read their own AI analyses"
  on public.ai_analyses
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own AI analyses"
  on public.ai_analyses
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
