-- RLS 정책 적용 확인

-- 1. RLS 활성화 확인 (rowsecurity가 true여야 함)
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'user_approvals';

-- 2. 생성된 모든 정책 확인
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_approvals'
ORDER BY policyname;
