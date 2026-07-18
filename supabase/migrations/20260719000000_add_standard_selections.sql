-- 성취기준 탭에서 고른 "이번 평가에 사용할 성취기준" 선택 내역을
-- 브라우저 localStorage가 아닌 서버(Supabase)에 저장하기 위한 테이블.
-- 교사/교과/학기/학년 조합별로 코드 배열 1건만 유지(upsert)한다.
-- 기존 students / assessment_items / assessments / achievement_* 테이블은
-- 전혀 건드리지 않는다.

create table if not exists standard_selections (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  term text not null,
  grade int not null,
  standard_codes text[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (teacher_id, subject, term, grade)
);

create index if not exists idx_standard_selections_teacher
  on standard_selections(teacher_id);

alter table standard_selections enable row level security;

drop policy if exists "teachers manage own standard_selections" on standard_selections;
create policy "teachers manage own standard_selections"
  on standard_selections for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

grant select, insert, update, delete on public.standard_selections to authenticated;

notify pgrst, 'reload schema';
