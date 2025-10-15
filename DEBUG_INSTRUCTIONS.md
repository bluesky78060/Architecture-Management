# 409 Conflict 오류 디버깅 가이드

## 브라우저에서 확인할 사항

### 1. Network 탭에서 상세 오류 확인
1. **F12** 키 → **Network** 탭 클릭
2. **Preserve log** 체크
3. 작업 항목 생성 시도
4. `work_items` POST 요청 찾기 (빨간색, 409 상태)
5. 클릭 → **Response** 탭 → **오류 메시지 전체 복사**

### 2. 확인해야 할 내용
```
예상 응답:
{
  "code": "23505",
  "details": "Key (컬럼명)=(값) already exists.",
  "hint": null,
  "message": "duplicate key value violates unique constraint \"제약조건명\""
}
```

### 3. Supabase Table Editor 확인
1. https://supabase.com/dashboard
2. **Table Editor** → **work_items**
3. **Constraints** 탭 확인
4. UNIQUE 제약 조건이 있는지 확인

### 4. 데이터 확인
```sql
-- work_items 테이블의 모든 데이터 확인
SELECT * FROM work_items ORDER BY work_item_id DESC LIMIT 10;

-- UNIQUE 제약 조건 확인
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'work_items'::regclass;
```

## 가능한 원인들

### 원인 1: 중복 INSERT 시도
- UI에서 빠르게 두 번 클릭
- 네트워크 지연으로 재시도

### 원인 2: UNIQUE 제약 조건
- user_id + name 조합
- user_id + client_id + name 조합
- 다른 필드 조합

### 원인 3: Migration 파일
`supabase/migrations/` 폴더에 UNIQUE 제약 조건 추가한 파일이 있을 수 있음

## 해결 방법

### 임시 해결책
```sql
-- Supabase SQL Editor에서 실행
-- 1. 모든 UNIQUE 제약 조건 확인
SELECT conname FROM pg_constraint
WHERE conrelid = 'work_items'::regclass AND contype = 'u';

-- 2. UNIQUE 제약 조건 제거 (제약조건명을 확인 후)
ALTER TABLE work_items DROP CONSTRAINT IF EXISTS 제약조건명;
```

### 근본 해결책
코드에서 중복 방지 로직 추가 또는 제약 조건에 맞게 수정
