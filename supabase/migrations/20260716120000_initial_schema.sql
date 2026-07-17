-- 초등 교과평가 종합의견 자동 생성기: 초기 스키마
-- 규칙 기반(rule-based) 문장 합성 구조 — 외부 LLM API 미사용

create extension if not exists pgcrypto;

create type achievement_level as enum ('매우잘함', '잘함', '보통');

-- 2022 개정 교육과정 성취기준 (참조용 공용 데이터, 개인정보 없음)
create table achievement_standards (
  code text primary key,           -- 예: '6국01-01'
  subject text not null,           -- 예: '국어'
  domain text,                     -- 예: '듣기·말하기'
  grade text not null default '6학년',
  description text not null
);

-- 성취기준 × 성취수준별 서술형 템플릿 문장
-- 같은 (code, level) 조합에 variant를 여러 개 두어, 같은 성취수준을 받은
-- 학생들의 종합의견이 토씨 하나 안 틀리고 동일해지는 것을 방지함
-- 실제 나이스(NEIS) 입력 화면처럼 학생 이름은 별도 칸에 있으므로
-- template_text에는 주어를 넣지 않고 술어("~함", "~음")로만 끝나도록 작성함
create table achievement_templates (
  id uuid primary key default gen_random_uuid(),
  standard_code text not null references achievement_standards(code) on delete cascade,
  level achievement_level not null,
  variant_no int not null default 1,
  template_text text not null,
  unique (standard_code, level, variant_no)
);

-- 가명화된 학생 레코드. 실명은 절대 저장하지 않음 (로컬스토리지에서만 매핑)
create table students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  pseudo_label text not null,      -- 예: '학생A', '60101'
  grade int,
  class_no int,
  student_no int,
  term text not null,              -- 예: '2026-1학기'
  created_at timestamptz not null default now()
);

-- 학생별 성취기준 체크 결과 (원자료)
create table assessment_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  standard_code text not null references achievement_standards(code),
  level achievement_level not null,
  note text,
  created_at timestamptz not null default now(),
  unique (student_id, standard_code)
);

-- 교과별 최종 합성 종합의견. template_text가 이미 주어 없는 술어형이므로
-- generated_comment에도 실명·가명 어떤 형태의 식별 정보도 포함되지 않음
create table assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  subject text not null,
  term text not null,
  generated_comment text,
  status text not null default 'draft' check (status in ('draft', 'final')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, subject, term)
);

create index idx_students_teacher_id on students(teacher_id);
create index idx_assessment_items_student_id on assessment_items(student_id);
create index idx_assessments_student_id on assessments(student_id);
create index idx_templates_standard_level on achievement_templates(standard_code, level);

-- RLS

alter table students enable row level security;
alter table assessment_items enable row level security;
alter table assessments enable row level security;
alter table achievement_standards enable row level security;
alter table achievement_templates enable row level security;

create policy "teachers manage own students"
  on students for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

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

create policy "teachers manage own assessments"
  on assessments for all
  using (exists (
    select 1 from students s
    where s.id = assessments.student_id and s.teacher_id = auth.uid()
  ))
  with check (exists (
    select 1 from students s
    where s.id = assessments.student_id and s.teacher_id = auth.uid()
  ));

create policy "authenticated read standards"
  on achievement_standards for select
  to authenticated
  using (true);

create policy "authenticated read templates"
  on achievement_templates for select
  to authenticated
  using (true);
