# Supabase Security Warnings Fix

## 📋 개요

Vercel Security Advisor에서 발견된 보안 경고를 해결하는 마이그레이션입니다.

**마이그레이션 파일**: `20251023_fix_security_warnings.sql`

---

## 🔍 발견된 보안 문제

### 1. Function Search Path Mutable (6 Warnings) 🟡

**문제**:
- PostgreSQL 함수에서 `search_path` 파라미터가 설정되지 않음
- SQL Injection 공격에 취약

**영향받는 함수**:
- `public.is_user_approved(UUID)`
- `public.update_user_approvals_updated_at()`
- `public.notify_admin_new_approval()`
- `public.update_updated_at_column()`

**해결 방법**:
```sql
ALTER FUNCTION public.function_name() SET search_path = public;
```

**위험도**: 🟡 중간 (SQL Injection 가능성)

---

### 2. Extension in Public (1 Warning) 🟢

**문제**:
- `pg_net` extension이 `public` 스키마에 설치됨
- 보안 권장사항: extensions는 별도 스키마 사용

**현재 상태**:
```sql
-- pg_net이 public 스키마에 설치됨
CREATE EXTENSION pg_net; -- installed in public schema
```

**이상적인 해결**:
```sql
CREATE SCHEMA extensions;
CREATE EXTENSION pg_net SCHEMA extensions;
```

**실제 상황**:
- ⚠️ Supabase managed extension은 이동 불가
- ⚠️ `pg_net`은 Supabase가 관리하는 extension
- ✅ 이 경고는 알려진 제한사항이며 무시 가능

**위험도**: 🟢 낮음 (권장사항, Supabase 제한사항)

---

### 3. Leaked Password Protection Disabled (1 Warning) 🟡

**문제**:
- 유출된 비밀번호 보호 기능이 비활성화됨
- Have I Been Pwned 데이터베이스와 대조하여 보안 강화

**해결 방법**:
SQL로는 설정 불가능 - **수동 설정 필요**

**설정 방법**:
1. Supabase Dashboard 접속
2. **Authentication** → **Policies** 메뉴
3. **Leaked Password Protection** 찾기
4. 토글 **ON**으로 변경

**효과**:
- 알려진 유출 비밀번호 사용 방지
- 계정 탈취 위험 감소
- 사용자에게 더 안전한 비밀번호 사용 유도

**위험도**: 🟡 중간 (계정 보안)

---

## 🚀 마이그레이션 적용 방법

### 방법 1: Supabase Dashboard (권장)

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **SQL Editor 열기**
   - 좌측 메뉴: **SQL Editor** 클릭

3. **마이그레이션 실행**
   - **New Query** 버튼 클릭
   - `20251023_fix_security_warnings.sql` 파일 내용 복사
   - 붙여넣기 후 **Run** 버튼 클릭

4. **검증 로그 확인**
   - 하단 **Logs** 탭에서 검증 결과 확인
   - ✅ 표시가 있는지 확인

---

### 방법 2: Supabase CLI

```bash
# 1. Supabase 로그인 (처음 1회만)
npx supabase login

# 2. 로컬 프로젝트 연결 (처음 1회만)
npx supabase link --project-ref YOUR_PROJECT_REF

# 3. 마이그레이션 적용
npx supabase db push

# 또는 특정 파일만 실행
npx supabase db execute --file supabase/migrations/20251023_fix_security_warnings.sql
```

---

## ✅ 적용 후 검증

### 1. 마이그레이션 실행 후 로그 확인

실행 시 다음과 같은 로그가 출력됩니다:

```
=== Function Search Path Verification ===
Function: is_user_approved(uuid) - Search Path: {search_path=public}
Function: update_user_approvals_updated_at() - Search Path: {search_path=public}
Function: notify_admin_new_approval() - Search Path: {search_path=public}
Function: update_updated_at_column() - Search Path: {search_path=public}
---
Total functions checked: 4
Functions with search_path set: 4
✅ All functions have search_path configured correctly

=== Extension Location Verification ===
pg_net extension schema: public
⚠️  pg_net is in public schema (Supabase managed - cannot be moved)
ℹ️  This is a known limitation and can be safely ignored

=== Migration 20251023_fix_security_warnings Complete ===

✅ Fixed: Function Search Path Mutable (4 functions)
ℹ️  Acknowledged: Extension in Public (Supabase managed)
⚠️  Manual Action Required: Enable Leaked Password Protection in Dashboard
```

### 2. 함수 search_path 확인

```sql
-- 함수들의 search_path 설정 확인
SELECT
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.proconfig as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'is_user_approved',
    'update_user_approvals_updated_at',
    'notify_admin_new_approval',
    'update_updated_at_column'
);
```

**예상 결과**:
모든 함수의 `search_path_config`에 `{search_path=public}` 포함

### 3. Vercel Security Advisor 재실행

1. Vercel Dashboard 접속
2. **Security** → **Advisors** 메뉴
3. **Refresh** 버튼 클릭
4. 경고 개수 확인:
   - ✅ Function Search Path Mutable: 6 → 0
   - ℹ️ Extension in Public: 1 (유지 - 정상)
   - ⚠️ Leaked Password Protection: 수동 설정 후 0

---

## 📝 수동 작업 체크리스트

### Leaked Password Protection 활성화

- [ ] Supabase Dashboard 접속
- [ ] Authentication → Policies 메뉴 이동
- [ ] Leaked Password Protection 찾기
- [ ] 토글 ON으로 변경
- [ ] 변경사항 저장
- [ ] Vercel Security Advisor 재실행으로 검증

---

## 🔒 보안 영향 분석

| 문제 | 수정 전 | 수정 후 | 위험 감소 |
|------|---------|---------|-----------|
| Function Search Path | 🔴 취약 | 🟢 안전 | SQL Injection 방지 |
| Extension in Public | 🟡 권장사항 | 🟡 제한사항 | N/A (Supabase 관리) |
| Leaked Password | 🔴 비활성 | 🟢 활성 | 계정 탈취 방지 |

**종합 평가**:
- ✅ 4개 함수 보안 강화
- ✅ SQL Injection 공격 벡터 제거
- ✅ 유출 비밀번호 사용 방지 (수동 설정 시)

---

## 🚨 문제 해결

### 마이그레이션 실행 시 오류

**오류**: `function "function_name" does not exist`
```
해결: 함수가 아직 생성되지 않았을 수 있습니다.
ALTER FUNCTION IF EXISTS를 사용했으므로 무시해도 됩니다.
```

**오류**: `permission denied`
```
해결: Supabase Dashboard의 SQL Editor를 사용하세요.
Dashboard는 자동으로 관리자 권한으로 실행됩니다.
```

### Vercel Security Advisor 여전히 경고 표시

**경고가 사라지지 않는 경우**:
1. 마이그레이션 실행 후 **5-10분 대기**
2. Vercel Dashboard에서 **Refresh** 버튼 클릭
3. 브라우저 캐시 삭제 후 재접속

**Extension in Public 경고**:
- 이 경고는 Supabase 제한사항으로 무시 가능
- Supabase managed extension은 이동 불가능

---

## 📚 참고 자료

- [PostgreSQL Search Path Security](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/postgres/security)
- [Have I Been Pwned - Password Checking](https://haveibeenpwned.com/)
- [Vercel Security Advisor](https://vercel.com/docs/security/security-advisor)

---

## 📅 마이그레이션 정보

- **생성일**: 2025-10-23
- **파일명**: `20251023_fix_security_warnings.sql`
- **작성자**: Claude Code
- **목적**: Vercel Security Advisor 경고 해결
- **영향**: 4개 함수, 1개 extension
- **롤백**: 필요 시 함수 search_path 제거 가능

---

## ✅ 적용 완료 후

마이그레이션 적용이 완료되면:

1. ✅ Git 커밋
```bash
git add supabase/migrations/20251023_fix_security_warnings.sql
git add supabase/migrations/README_SECURITY_FIX.md
git commit -m "fix: resolve Supabase security warnings

- Fix Function Search Path Mutable (4 functions)
- Document Extension in Public limitation
- Add instructions for Leaked Password Protection

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

2. ✅ Leaked Password Protection 활성화
3. ✅ Vercel Security Advisor 재실행
4. ✅ 보안 경고 해결 확인

---

**문의**: 문제가 있으면 bluesky78060@gmail.com으로 연락주세요.
