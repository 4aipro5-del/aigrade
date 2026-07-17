-- 이전 마이그레이션이 부분 적용되어 achievement_templates / assessment_items가
-- 라이브 DB에 없는 것으로 확인됨. 이미 존재하는 3개 테이블(students,
-- achievement_standards, assessments)은 건드리지 않고, 이 2개만 안전하게 채운다.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'achievement_level') then
    create type achievement_level as enum ('매우잘함', '잘함', '보통');
  end if;
end $$;

create table if not exists achievement_templates (
  id uuid primary key default gen_random_uuid(),
  standard_code text not null references achievement_standards(code) on delete cascade,
  level achievement_level not null,
  variant_no int not null default 1,
  template_text text not null,
  unique (standard_code, level, variant_no)
);

create table if not exists assessment_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  standard_code text not null references achievement_standards(code),
  level achievement_level not null,
  note text,
  created_at timestamptz not null default now(),
  unique (student_id, standard_code)
);

create index if not exists idx_assessment_items_student_id on assessment_items(student_id);
create index if not exists idx_templates_standard_level on achievement_templates(standard_code, level);

alter table achievement_templates enable row level security;
alter table assessment_items enable row level security;

drop policy if exists "teachers manage own assessment_items" on assessment_items;
create policy "teachers manage own assessment_items"
  on assessment_items for all
  using (exists (
    select 1 from students s
    where s.id = assessment_items.student_id and s.teacher_id = auth.uid()
  ))
  with check (exists (
    select 1 from students s
    where s.id = assessment_items.student_id and s.teacher_id = auth.uid()
  ));

drop policy if exists "authenticated read templates" on achievement_templates;
create policy "authenticated read templates"
  on achievement_templates for select
  to authenticated
  using (true);

grant select, insert, update, delete on public.assessment_items to authenticated;
grant select on public.achievement_templates to authenticated;

notify pgrst, 'reload schema';
