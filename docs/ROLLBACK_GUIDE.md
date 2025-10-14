# 롤백 가이드

SQL 마이그레이션 문제 발생 시 안전하게 이전 상태로 되돌리는 절차

**중요**: 롤백은 신중하게 결정해야 합니다. 가능한 경우 문제 해결을 먼저 시도하세요.

---

## 🚨 롤백 결정 기준

다음 상황에서 롤백을 고려하세요:

### 긴급 롤백 (즉시 실행)
- ❌ 데이터 손실 또는 손상 발생
- ❌ 앱이 완전히 작동하지 않음
- ❌ 심각한 보안 취약점 발견
- ❌ 데이터베이스 복구 불가능

### 계획된 롤백 (문제 해결 후 실행)
- ⚠️ 성능이 심각하게 저하됨
- ⚠️ 중요 기능 작동 불능
- ⚠️ 마이그레이션 오류율 > 10%
- ⚠️ 사용자 불만 급증

---

## 📋 롤백 시나리오

### 시나리오 1: 마이그레이션 실패

**증상**:
- 마이그레이션 중 오류 발생
- 데이터가 부분적으로만 이전됨
- SQLite 데이터베이스가 생성되지 않음

**영향도**: 중간 (데이터는 안전하지만 새 기능 사용 불가)

**복구 절차**:

1. **현재 상태 확인**
   ```bash
   # 데이터베이스 파일 확인
   ls -lh ~/Library/Application\ Support/construction-management-installer/

   # IndexedDB 데이터 확인 (개발자 도구)
   # Application > IndexedDB > constructionDB
   ```

2. **마이그레이션 상태 초기화**
   ```javascript
   // 브라우저 개발자 도구 Console에서 실행
   localStorage.removeItem('migration_completed');
   localStorage.removeItem('migration_date');
   ```

3. **SQLite 데이터베이스 삭제** (실패한 마이그레이션 제거)
   ```bash
   rm ~/Library/Application\ Support/construction-management-installer/cms.db
   rm ~/Library/Application\ Support/construction-management-installer/cms.db-shm
   rm ~/Library/Application\ Support/construction-management-installer/cms.db-wal
   ```

4. **앱 재시작**
   - 앱을 완전히 종료
   - 앱 재실행
   - IndexedDB 데이터로 정상 작동 확인

5. **검증**
   - 모든 데이터가 보이는지 확인
   - 기본 기능 테스트 (건축주 조회, 견적서 생성 등)

---

### 시나리오 2: SQLite 데이터 손상

**증상**:
- 앱 시작 시 크래시
- "데이터베이스 열기 실패" 오류
- 데이터 조회 불가능

**영향도**: 높음 (앱 사용 불가)

**복구 절차**:

1. **긴급 조치: 손상된 데이터베이스 격리**
   ```bash
   # 손상된 DB를 백업 폴더로 이동 (추후 복구 시도 가능)
   mkdir -p ~/Desktop/db-recovery
   mv ~/Library/Application\ Support/construction-management-installer/cms.db \
      ~/Desktop/db-recovery/cms-corrupted-$(date +%Y%m%d-%H%M%S).db
   ```

2. **백업에서 복원 시도**
   ```bash
   # 최근 백업 파일이 있는 경우
   cp ~/Desktop/cms-backup-YYYYMMDD.db \
      ~/Library/Application\ Support/construction-management-installer/cms.db

   # 백업 검증
   node scripts/validate-database.js
   ```

3. **백업이 없는 경우: IndexedDB로 롤백**
   ```bash
   # SQLite 파일 완전 삭제
   rm -f ~/Library/Application\ Support/construction-management-installer/cms.db*
   ```

   ```javascript
   // 개발자 도구에서 마이그레이션 상태 초기화
   localStorage.removeItem('migration_completed');
   ```

4. **앱 재시작 및 검증**
   - 앱 완전 종료 후 재시작
   - IndexedDB 데이터 확인
   - 정상 작동 확인

5. **데이터 복구 시도** (선택)
   ```bash
   # SQLite 복구 도구 사용
   sqlite3 ~/Desktop/db-recovery/cms-corrupted-*.db ".recover" | \
   sqlite3 ~/Desktop/db-recovery/cms-recovered.db

   # 복구된 DB 검증
   node scripts/validate-database.js ~/Desktop/db-recovery/cms-recovered.db
   ```

---

### 시나리오 3: 성능 심각한 저하

**증상**:
- 앱 로딩 시간 > 10초
- 쿼리 응답 시간 > 5초
- UI 렉/프리징

**영향도**: 중간 (기능은 작동하지만 사용성 저하)

**복구 절차**:

1. **성능 문제 진단**
   ```bash
   # 데이터베이스 크기 확인
   ls -lh ~/Library/Application\ Support/construction-management-installer/cms.db

   # 데이터 개수 확인 (개발자 도구에서)
   ```

2. **데이터베이스 최적화 시도** (롤백 전)
   ```javascript
   // 개발자 도구 Console에서 실행
   // Electron 환경에서만 작동
   if (window.cms && window.cms.db) {
     // VACUUM 실행
     await window.cms.db.vacuum();

     // ANALYZE 실행
     await window.cms.db.analyze();

     console.log('데이터베이스 최적화 완료');
   }
   ```

3. **최적화로 해결되지 않으면 롤백**
   - 시나리오 1의 복구 절차 따름
   - IndexedDB로 전환
   - 성능 개선 확인

4. **문제 보고**
   - 성능 메트릭 수집
   - 데이터 규모 정보
   - 사용 패턴 정보

---

### 시나리오 4: 이전 버전으로 완전 롤백

**증상**:
- 새 버전 전체에 문제가 있음
- 여러 기능이 작동하지 않음
- 안정적인 구 버전 필요

**영향도**: 높음 (전체 시스템 영향)

**복구 절차**:

1. **현재 데이터 백업** (중요!)
   ```bash
   # IndexedDB 백업 (개발자 도구 Console)
   const backup = {
     clients: await dexieDb.clients.toArray(),
     estimates: await dexieDb.estimates.toArray(),
     invoices: await dexieDb.invoices.toArray(),
     workItems: await dexieDb.workItems.toArray(),
     companyInfo: await dexieDb.getCompanyInfo()
   };
   console.log('Backup:', JSON.stringify(backup));
   // 출력 결과를 복사하여 파일로 저장
   ```

2. **앱 언인스톨**
   ```bash
   # 앱 삭제 (macOS)
   rm -rf /Applications/ConstructionManagement.app

   # 데이터 폴더는 유지 (백업 목적)
   # ~/Library/Application Support/construction-management-installer/
   ```

3. **이전 버전 재설치**
   - 이전 버전 설치 파일 실행
   - 또는 Git에서 이전 태그 체크아웃 후 빌드

4. **데이터 복원**
   - IndexedDB는 자동으로 유지됨
   - 필요시 백업 파일에서 복원

5. **검증**
   - 모든 기능 정상 작동 확인
   - 데이터 무결성 확인
   - 사용자에게 안내

---

## 🔧 롤백 도구 및 스크립트

### 자동 롤백 스크립트

**rollback.sh** (macOS/Linux):
```bash
#!/bin/bash

echo "🔄 롤백 시작..."

# 1. SQLite DB 백업
if [ -f ~/Library/Application\ Support/construction-management-installer/cms.db ]; then
  echo "📦 SQLite DB 백업 중..."
  cp ~/Library/Application\ Support/construction-management-installer/cms.db \
     ~/Desktop/cms-rollback-backup-$(date +%Y%m%d-%H%M%S).db
fi

# 2. SQLite DB 삭제
echo "🗑️  SQLite DB 삭제 중..."
rm -f ~/Library/Application\ Support/construction-management-installer/cms.db*

# 3. 마이그레이션 상태 초기화 안내
echo "
⚠️  다음 단계를 수동으로 진행하세요:

1. 앱을 완전히 종료하세요
2. 앱을 다시 시작하세요
3. 개발자 도구(Cmd+Option+I)를 여세요
4. Console 탭에서 다음 명령을 실행하세요:

   localStorage.removeItem('migration_completed');
   localStorage.removeItem('migration_date');

5. 앱을 다시 시작하세요

✅ IndexedDB 데이터로 정상 작동하는지 확인하세요
"

echo "✅ 롤백 준비 완료"
```

### 데이터 검증 스크립트

**verify-rollback.js**:
```javascript
// 개발자 도구 Console에서 실행

async function verifyRollback() {
  console.log('🔍 롤백 검증 시작...');

  // IndexedDB 연결 확인
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('constructionDB');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  // 데이터 개수 확인
  const stores = ['clients', 'estimates', 'invoices', 'workItems'];
  for (const store of stores) {
    const count = await new Promise((resolve) => {
      const tx = db.transaction(store);
      const req = tx.objectStore(store).count();
      req.onsuccess = () => resolve(req.result);
    });
    console.log(`✅ ${store}: ${count}개`);
  }

  // 마이그레이션 상태 확인
  const migrated = localStorage.getItem('migration_completed');
  console.log(`마이그레이션 상태: ${migrated || 'null (정상)'}`);

  console.log('✅ 롤백 검증 완료');
}

verifyRollback();
```

---

## 📊 롤백 체크리스트

### 롤백 전
- [ ] 롤백 사유 명확히 문서화
- [ ] 현재 데이터 백업 생성
- [ ] 팀원에게 롤백 계획 공유
- [ ] 사용자에게 다운타임 안내

### 롤백 중
- [ ] 단계별 진행 로그 기록
- [ ] 각 단계 완료 확인
- [ ] 오류 발생 시 즉시 기록
- [ ] 중요 결정 사항 문서화

### 롤백 후
- [ ] 앱 정상 작동 확인
- [ ] 모든 데이터 접근 가능 확인
- [ ] 사용자 기능 테스트
- [ ] 사용자에게 복구 완료 안내
- [ ] 롤백 사유 분석 및 보고
- [ ] 재발 방지 대책 수립

---

## 🆘 긴급 연락처

### 기술 지원
- **개발팀**: [이메일/전화]
- **인프라팀**: [이메일/전화]
- **긴급 핫라인**: [전화번호]

### 에스컬레이션
1. 1단계: 개발자 자체 해결 시도 (15분)
2. 2단계: 팀 리드 에스컬레이션 (30분)
3. 3단계: CTO/시니어 엔지니어 (1시간)

---

## 📝 롤백 보고서 템플릿

```markdown
# 롤백 보고서

**날짜**: YYYY-MM-DD HH:MM
**롤백 담당자**: [이름]
**영향받은 사용자**: [숫자/범위]

## 롤백 사유
[상세 설명]

## 롤백 시나리오
[사용된 시나리오 번호]

## 실행 단계
1. [단계 1]
2. [단계 2]
...

## 발생한 이슈
[있다면 기록]

## 복구 결과
- 데이터 손실: [있음/없음]
- 복구 시간: [X분]
- 현재 상태: [정상/부분복구/복구실패]

## 재발 방지책
[향후 개선 계획]

## 교훈
[배운 점]
```

---

## ⚠️ 주의사항

1. **롤백은 최후의 수단입니다**
   - 가능한 문제 해결을 먼저 시도하세요
   - 롤백은 시간과 노력이 필요합니다

2. **백업은 필수입니다**
   - 롤백 전 반드시 현재 상태 백업
   - 백업 없는 롤백은 더 큰 문제 유발 가능

3. **단계적으로 진행하세요**
   - 각 단계를 확인하며 진행
   - 서두르지 말고 신중하게

4. **커뮤니케이션**
   - 팀원과 사용자에게 즉시 알림
   - 진행 상황 정기적으로 업데이트

5. **문서화**
   - 모든 과정을 상세히 기록
   - 향후 참고 자료로 활용

---

**최종 업데이트**: 2025-01-10
**문서 버전**: 1.0
**담당자**: Claude Code
