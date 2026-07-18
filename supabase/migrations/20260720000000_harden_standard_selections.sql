-- standard_selections에 대한 방어적 보강.
-- 1) 혹시 모를 중복 행(teacher_id, subject, term, grade 조합 중복)이 있다면
--    가장 최근에 갱신된 1건만 남기고 정리한다 — UPSERT가 "여러 행 중 하나만
--    갱신"되는 것처럼 보이는 현상을 원천 차단하기 위함.
-- 2) unique 제약이 없는 상태로 테이블이 존재할 가능성에 대비해, 없으면
--    추가한다(이미 있으면 아무 일도 하지 않음).
-- 기존 students / assessment_items / assessments 등은 전혀 건드리지 않는다.

do $$
begin
  if to_regclass('public.standard_selections') is not null then
    delete from standard_selections a
    using standard_selections b
    where a.teacher_id = b.teacher_id
      and a.subject = b.subject
      and a.term = b.term
      and a.grade = b.grade
      and a.updated_at < b.updated_at;

    delete from standard_selections a
    using standard_selections b
    where a.ctid < b.ctid
      and a.teacher_id = b.teacher_id
      and a.subject = b.subject
      and a.term = b.term
      and a.grade = b.grade
      and a.updated_at = b.updated_at;
  end if;
end $$;

-- 이름이 아니라 "정확히 이 4개 컬럼 조합"을 덮는 unique 제약이 있는지로
-- 판단한다 (CREATE TABLE에서 무명으로 만들어진 제약과 이름이 달라도 중복
-- 생성하지 않기 위함).
do $$
declare
  has_constraint boolean;
begin
  if to_regclass('public.standard_selections') is null then
    return;
  end if;

  select exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.standard_selections'::regclass
      and c.contype = 'u'
      and (
        select array_agg(a.attname order by a.attname)
        from unnest(c.conkey) as k(attnum)
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
      ) = array['grade', 'subject', 'teacher_id', 'term']::name[]
  ) into has_constraint;

  if not has_constraint then
    alter table standard_selections
      add constraint standard_selections_teacher_subject_term_grade_key
      unique (teacher_id, subject, term, grade);
  end if;
end $$;

notify pgrst, 'reload schema';
