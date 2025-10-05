# 건축 관리 시스템 데이터베이스 및 저장소 개선 방안

## 📋 목차
1. [현재 저장 구조 분석](#현재-저장-구조-분석)
2. [주요 문제점 식별](#주요-문제점-식별)
3. [통합 개선 방안](#통합-개선-방안)
4. [구현 로드맵](#구현-로드맵)
5. [예상 개선 효과](#예상-개선-효과)

---

## 🔍 현재 저장 구조 분석

### 다층 저장 시스템 (Multi-Layer Storage Architecture)

현재 시스템은 4개 층의 복합 저장 구조를 운영하고 있습니다:

#### 1️⃣ Electron JSON Storage (Primary)
- **위치**: `userData/cms-data/`
- **구현**: 개별 JSON 파일 (`users.json`, `invoices.json` 등)
- **특징**: 동기식 파일 I/O, 레거시 지원
- **성능**: 높음 (직접 파일 시스템 접근)
- **제약**: 트랜잭션 미지원, 동시성 제어 부족

#### 2️⃣ Browser localStorage (Fallback)
- **용량**: 5-10MB 제한
- **보안**: XOR 암호화 래퍼 적용
- **역할**: Electron 실패 시 자동 폴백
- **민감 데이터**: 자동 암호화 (사용자, 로그인, 도장)

#### 3️⃣ File System Access API (Chrome/Edge)
- **구현**: `browserFs.ts` - 사용자 선택 디렉토리
- **제한**: Chrome/Edge만 지원
- **권한**: 사용자 명시적 승인 필요
- **활용**: 백업 및 데이터 이동성

#### 4️⃣ IndexedDB (Handle Storage)
- **현재 용도**: File System 핸들 저장만
- **잠재력**: 고성능 구조화 데이터 저장소
- **미활용**: 주요 비즈니스 데이터 미사용

### 🔐 보안 시스템 현황

**XOR 암호화 시스템**
```typescript
// 현재 구현 (secureStorage.ts)
- 알고리즘: XOR + Base64
- 키: 'CMS_2024_SECURE_KEY' (하드코딩)
- 무결성: 체크섬 검증
- 대상: 사용자, 로그인, 도장 이미지
```

---

## 🚨 주요 문제점 식별

### 1. 데이터 일관성 문제
- **트랜잭션 부재**: 부분 업데이트 시 데이터 손상 위험
- **동시성 미제어**: 멀티탭 환경에서 데이터 충돌
- **저장소 간 불일치**: 4개 저장소 간 동기화 보장 부족

### 2. 성능 제약사항
- **전체 파일 I/O**: JSON 파일 전체 읽기/쓰기로 비효율
- **메모리 부족**: 대용량 데이터 처리 시 위험
- **쿼리 한계**: 복잡한 검색/정렬 기능 부족

### 3. 보안 취약점
- **약한 암호화**: XOR는 암호학적으로 취약
- **키 관리**: 하드코딩된 고정 키
- **키 교체 불가**: 보안 업그레이드 메커니즘 부재

### 4. 확장성 한계
- **관계형 모델링 불가**: 복잡한 데이터 관계 표현 어려움
- **인덱싱 부재**: 대용량 데이터 검색 성능 저하
- **백업 체계 부족**: 체계적인 백업/복원 전략 부재

---

## 💡 통합 개선 방안

### 1. 데이터베이스 아키텍처 재설계

#### Phase 1: IndexedDB 중심 아키텍처

```typescript
interface UnifiedDatabaseSchema {
  // 비즈니스 엔티티
  estimates: EstimateEntity & { 
    indexes: ['clientId', 'date', 'status'] 
  };
  invoices: InvoiceEntity & { 
    indexes: ['estimateId', 'clientId', 'dueDate'] 
  };
  clients: ClientEntity & { 
    indexes: ['name', 'businessNumber', 'region'] 
  };
  workItems: WorkItemEntity & { 
    indexes: ['clientId', 'category', 'priority'] 
  };
  
  // 시스템 엔티티
  users: UserEntity & { encrypted: true };
  companyInfo: CompanyInfoEntity;
  attachments: AttachmentEntity & { storage: 'fileSystem' };
}
```

#### Phase 2: 하이브리드 저장 전략
- **핫 데이터**: IndexedDB (빠른 CRUD 작업)
- **콜드 데이터**: File System (첨부파일, 백업)
- **캐시**: localStorage (설정, 임시 데이터)
- **레거시**: Electron JSON (기존 데이터 호환성)

### 2. 성능 최적화 전략

#### 🚀 지능형 인덱싱

```typescript
class OptimizedQuery {
  // 복합 인덱스 활용
  async getClientInvoicesByStatus(clientId: string, status: string) {
    return await db.invoices
      .where(['clientId', 'status'])
      .equals([clientId, status])
      .sortBy('dueDate');
  }
  
  // 풀텍스트 검색
  async searchClients(query: string) {
    return await db.clients
      .where('name')
      .startsWithIgnoreCase(query)
      .or('businessNumber')
      .equals(query);
  }
}
```

#### 🎯 스마트 캐싱

```typescript
class MultiLevelCache {
  // L1: 메모리 캐시 (최근 사용 데이터)
  private memoryCache = new LRUCache<string, any>(100);
  
  // L2: localStorage (자주 접근하는 설정)
  private configCache = new PersistentCache('config');
  
  // L3: IndexedDB (전체 데이터)
  private persistentCache = new DatabaseCache();
}
```

### 3. 보안 강화 시스템

#### 🔒 AES-256 암호화 업그레이드

```typescript
class ModernSecureStorage {
  // Web Crypto API 활용
  private async generateUserKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    return await crypto.subtle.deriveKey(
      { 
        name: 'PBKDF2', 
        salt, 
        iterations: 100000, 
        hash: 'SHA-256' 
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  async encryptSensitiveData(data: string, userKey: CryptoKey): Promise<EncryptedBlob> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      userKey,
      new TextEncoder().encode(data)
    );
    
    return { 
      encrypted, 
      iv, 
      algorithm: 'AES-GCM-256' 
    };
  }
}
```

#### 🛡️ 키 라이프사이클 관리
- 사용자별 키 파생 (PBKDF2 + salt)
- 자동 키 교체 (90일 주기)
- 키 백업 및 복구 메커니즘

### 4. 지능형 백업/복원 시스템

#### 📦 자동화된 백업 전략

```typescript
class IntelligentBackupManager {
  async createIncrementalBackup(): Promise<BackupManifest> {
    const changes = await this.detectChanges();
    const compressed = await this.compress(changes);
    const encrypted = await this.encrypt(compressed);
    
    return {
      type: 'incremental',
      version: '2.0',
      timestamp: Date.now(),
      parentBackup: this.lastFullBackup,
      changes: encrypted,
      integrity: await this.generateHMAC(encrypted)
    };
  }
  
  // 스마트 복원 (충돌 해결)
  async restoreWithConflictResolution(backup: BackupManifest) {
    const conflicts = await this.detectConflicts(backup);
    return await this.resolveConflicts(conflicts, 'timestamp-wins');
  }
}
```

#### ⚡ 실시간 동기화

```typescript
// Service Worker 기반 백그라운드 동기화
self.addEventListener('sync', event => {
  if (event.tag === 'data-backup') {
    event.waitUntil(
      createBackup()
        .then(uploadToCloud)
        .then(updateSyncStatus)
    );
  }
});
```

### 5. 클라우드 통합 전략

#### ☁️ Progressive Sync Architecture

```typescript
class CloudSyncManager {
  // 오프라인 우선 (Offline-First)
  async syncData() {
    const localChanges = await this.getPendingChanges();
    const remoteChanges = await this.fetchRemoteChanges();
    
    const merged = await this.mergeChanges(localChanges, remoteChanges);
    await this.applyChanges(merged);
  }
  
  // 충돌 해결 전략
  private async resolveConflict(local: Entity, remote: Entity): Promise<Entity> {
    // 타임스탬프 기반 + 사용자 선택
    if (Math.abs(local.lastModified - remote.lastModified) < 1000) {
      return await this.requestUserResolution(local, remote);
    }
    return local.lastModified > remote.lastModified ? local : remote;
  }
}
```

#### 🌐 멀티 클라우드 지원
- Google Drive API
- Microsoft OneDrive
- Dropbox API
- AWS S3 (엔터프라이즈)

---

## 🎯 구현 로드맵

### Priority 1 (즉시 - 1개월)

1. **IndexedDB 마이그레이션**
   - 기존 JSON 데이터를 구조화된 DB로 전환
   - 복합 인덱스 구성
   - 자동 마이그레이션 스크립트

2. **보안 업그레이드**
   - XOR → AES-256-GCM 전환
   - Web Crypto API 도입
   - 사용자별 키 파생 시스템

3. **자동 백업 시스템**
   - 일일 증분 백업
   - 로컬 백업 저장소
   - 백업 무결성 검증

### Priority 2 (3개월)

1. **클라우드 동기화**
   - Google Drive API 통합
   - 오프라인 우선 아키텍처
   - 충돌 해결 메커니즘

2. **성능 최적화**
   - 다단계 캐싱 시스템
   - 지연 로딩 구현
   - 쿼리 최적화

3. **고급 쿼리 기능**
   - 복잡한 검색/필터링
   - 풀텍스트 검색
   - 관계형 쿼리 지원

### Priority 3 (6개월)

1. **엔터프라이즈 기능**
   - 팀 협업 기능
   - 권한 관리 시스템
   - 감사 로그

2. **고급 보안**
   - 2단계 인증 (2FA)
   - 하드웨어 키 지원
   - 암호화 정책 관리

3. **분석 대시보드**
   - 사용 패턴 분석
   - 성능 모니터링
   - 비즈니스 인텔리전스

---

## 📊 예상 개선 효과

### 성능 향상

| 영역 | 현재 상태 | 개선 후 | 향상률 |
|------|-----------|---------|--------|
| 조회 속도 | JSON 전체 파싱 | IndexedDB 인덱싱 | **70% 향상** |
| 메모리 효율 | 전체 데이터 로딩 | 지연 로딩 | **50% 감소** |
| 앱 시작 시간 | 모든 데이터 로딩 | 스마트 캐싱 | **40% 단축** |

### 보안 강화

| 보안 요소 | 현재 | 개선 후 |
|-----------|------|---------|
| 암호화 알고리즘 | XOR (취약) | AES-256-GCM (군사급) |
| 키 관리 | 하드코딩 | 사용자별 PBKDF2 파생 |
| 무결성 검증 | 체크섬 | HMAC-SHA256 |
| 키 교체 | 불가능 | 자동 90일 주기 |

### 사용자 경험

| 기능 | 현재 | 개선 후 |
|------|------|---------|
| 오프라인 지원 | 제한적 | 완전 기능 지원 |
| 데이터 동기화 | 수동 | 자동 백그라운드 |
| 데이터 복구 | 복잡한 과정 | 원클릭 복원 |
| 검색 기능 | 기본적 | 고급 풀텍스트 |

### 운영 효율성

| 영역 | 현재 | 개선 후 |
|------|------|---------|
| 백업 주기 | 수동 | 자동 일일 백업 |
| 시스템 업그레이드 | 데이터 손실 위험 | 무중단 마이그레이션 |
| 장애 대응 | 수동 모니터링 | 실시간 상태 추적 |
| 확장성 | 제한적 | 엔터프라이즈 확장 가능 |

---

## 🛡️ 위험 관리

### 마이그레이션 위험 완화
- **점진적 전환**: 기존 시스템과 병행 운영
- **완전 백업**: 마이그레이션 전 전체 데이터 백업
- **롤백 계획**: 실패 시 즉시 원복 가능한 체계

### 성능 모니터링
- **실시간 메트릭**: 성능 지표 실시간 추적
- **임계치 알림**: 성능 저하 시 자동 알림
- **자동 최적화**: 병목 구간 자동 감지 및 조치

### 보안 컴플라이언스
- **정기 보안 감사**: 분기별 보안 검토
- **취약점 스캔**: 자동화된 보안 취약점 검사
- **규정 준수**: 개인정보보호 및 데이터 보안 규정 준수

---

## 📞 문의 및 지원

이 개선 계획에 대한 추가 정보나 구현 지원이 필요한 경우:

- **기술 문의**: [프로젝트 이슈 트래커](../../issues)
- **구현 지원**: 단계별 구현 가이드 제공 가능
- **맞춤 컨설팅**: 특정 요구사항에 맞는 아키텍처 설계

---

**문서 버전**: 1.0  
**작성일**: 2025년 10월 4일  
**최종 수정**: 2025년 10월 4일  
**작성자**: Claude Code Assistant