-- RLS 정책만으로는 부족함: Postgres는 GRANT(테이블 레벨 권한)를 먼저 확인하고
-- 그 다음에 RLS(행 레벨 정책)를 적용한다. 대시보드 테이블 편집기로 만든 테이블은
-- Supabase가 이 GRANT를 자동으로 걸어주지만, SQL Editor로 직접 만든 테이블은
-- 수동으로 걸어줘야 한다.

grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.assessment_items to authenticated;
grant select, insert, update, delete on public.assessments to authenticated;
grant select on public.achievement_standards to authenticated;
grant select on public.achievement_templates to authenticated;

-- 테이블은 있는데 PostgREST가 아직 인식 못하는 경우(스키마 캐시 미갱신) 대비
notify pgrst, 'reload schema';
