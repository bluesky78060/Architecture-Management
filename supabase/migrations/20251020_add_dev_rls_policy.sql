-- 개발 환경에서 전체 접근 허용 (RLS 우회)
-- 프로덕션에서는 이 정책을 제거해야 합니다!

-- 기존 정책 삭제 (재생성을 위해)
DROP POLICY IF EXISTS "Dev: Allow all access" ON schedules;

-- 개발 환경 전체 접근 정책
CREATE POLICY "Dev: Allow all access"
  ON schedules
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 참고: 프로덕션 배포 시 이 정책을 제거하고 user_id 기반 정책만 사용해야 합니다.
