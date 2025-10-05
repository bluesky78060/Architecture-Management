# 건축 관리 시스템 데이터베이스 아키텍처 분석 및 개선 방안

## 현재 저장 구조 분석

### 1. 다층 저장 시스템 (Multi-Layer Storage)

**Layer 1: Electron JSON Storage**
- 위치: `app.getPath('userData')/cms-data/`
- 구현: `public/electron.js` (readKeySync/writeKeySync)
- 형태: 개별 JSON 파일 (예: `users.json`, `invoices.json`)
- 장점: 파일 시스템 직접 접근, 높은 성능
- 단점: 동시성 제어 부족, 트랜잭션 미지원

**Layer 2: Browser localStorage**
- 구현: `src/services/storage.ts`
- 폴백 메커니즘: Electron 실패 시 자동 전환
- 제한: 5-10MB 용량 제한
- 보안: XOR 암호화 적용 (`src/utils/secureStorage.ts`)

**Layer 3: File System Access API**
- 구현: `src/services/browserFs.ts`
- 지원: Chrome/Edge만 지원
- 저장소: 사용자 선택 디렉토리
- 핸들 관리: IndexedDB에 FileSystemDirectoryHandle 저장

**Layer 4: IndexedDB**
- 용도: File System Access API 핸들 저장
- DB명: 'cms-fs', Store: 'handles'
- 제한적 활용: 핸들 관리만 사용

### 2. 보안 시스템

**XOR 암호화 시스템**
- 키: 'CMS_2024_SECURE_KEY' (하드코딩)
- 대상: 민감 데이터 (사용자, 로그인, 도장 이미지)
- 무결성: 체크섬 검증
- 마이그레이션: 기존 평문 데이터 자동 암호화

### 3. 데이터 타입별 저장 패턴

**비즈니스 엔티티**
- 견적서 (Estimates)
- 청구서 (Invoices)  
- 건축주 (Clients)
- 작업 항목 (WorkItems)
- 회사 정보 (CompanyInfo)

**시스템 데이터**
- 사용자 정보 (Users) - 암호화
- 로그인 상태 - 암호화
- 도장 이미지 - 암호화

## 현재 아키텍처의 문제점

### 1. 데이터 일관성 문제
- 트랜잭션 미지원으로 부분 업데이트 위험
- 다층 저장소 간 동기화 불일치 가능성
- 동시 접근 제어 부재

### 2. 성능 제약
- JSON 파일 전체 읽기/쓰기로 인한 비효율
- 대용량 데이터 처리 시 메모리 부족 위험
- 인덱싱 및 쿼리 최적화 부재

### 3. 보안 취약점
- XOR 암호화는 보안 강도 낮음
- 암호화 키 하드코딩
- 키 교체 메커니즘 부재

### 4. 확장성 한계
- 관계형 데이터 모델링 불가
- 복잡한 쿼리 처리 어려움
- 백업/복원 체계 부족

### 5. 플랫폼 호환성
- File System Access API 브라우저 제한
- 저장소별 용량 제한 상이

## 개선 방안

### 1. 데이터베이스 아키텍처 개선

**Phase 1: IndexedDB 전면 도입**
```typescript
// 통합 데이터베이스 스키마
interface DatabaseSchema {
  estimates: EstimateEntity;
  invoices: InvoiceEntity;
  clients: ClientEntity;
  workItems: WorkItemEntity;
  companyInfo: CompanyInfoEntity;
  users: UserEntity;
  attachments: AttachmentEntity;
}

// 인덱스 전략
const indexes = {
  estimates: ['clientId', 'date', 'status'],
  invoices: ['estimateId', 'clientId', 'date', 'status'],
  clients: ['name', 'businessNumber', 'region'],
  workItems: ['clientId', 'category', 'status']
};
```

**Phase 2: 하이브리드 아키텍처**
- 핫 데이터: IndexedDB (빠른 조회/수정)
- 콜드 데이터: File System (대용량 첨부파일)
- 메타데이터: localStorage (설정, 캐시)

### 2. 성능 최적화 전략

**쿼리 최적화**
```typescript
// 복합 인덱스 활용
const clientInvoicesIndex = ['clientId', 'date'];
const statusDateIndex = ['status', 'date'];

// 지연 로딩 구현
class LazyDataLoader {
  async loadEstimateDetails(id: string) {
    // 기본 정보만 먼저 로드, 상세는 필요시
  }
}
```

**캐싱 전략**
- L1: 메모리 캐시 (최근 조회 데이터)
- L2: localStorage (자주 사용하는 설정)
- L3: IndexedDB (전체 데이터)

**백그라운드 동기화**
```typescript
// Service Worker 활용
self.addEventListener('sync', event => {
  if (event.tag === 'background-data-sync') {
    event.waitUntil(syncDataToCloud());
  }
});
```

### 3. 보안 강화 방안

**암호화 업그레이드**
```typescript
// Web Crypto API 활용
class SecureStorage {
  private async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  async encryptData(data: string, key: CryptoKey): Promise<ArrayBuffer> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    return await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(data)
    );
  }
}
```

**키 관리 시스템**
- 사용자별 키 파생 (PBKDF2)
- 키 교체 메커니즘
- 하드웨어 보안 모듈 연동 (가능시)

### 4. 백업/복원 시스템

**자동 백업 전략**
```typescript
class BackupManager {
  async createBackup(): Promise<BackupManifest> {
    const data = await this.exportAllData();
    const compressed = await this.compress(data);
    const encrypted = await this.encrypt(compressed);
    
    return {
      version: '1.0',
      timestamp: Date.now(),
      checksum: await this.generateChecksum(encrypted),
      data: encrypted
    };
  }
}
```

**증분 백업**
- 변경된 레코드만 백업
- 타임스탬프 기반 추적
- 압축 및 중복 제거

### 5. 클라우드 통합 방안

**Progressive Web App (PWA) 확장**
```typescript
// 오프라인 우선 동기화
class CloudSync {
  async syncWhenOnline() {
    if (navigator.onLine) {
      await this.uploadPendingChanges();
      await this.downloadRemoteChanges();
    }
  }
  
  private async resolveConflicts(local: Entity, remote: Entity) {
    // 타임스탬프 기반 충돌 해결
    return local.lastModified > remote.lastModified ? local : remote;
  }
}
```

**클라우드 저장소 옵션**
- Google Drive API
- OneDrive API
- AWS S3 (엔터프라이즈)
- 자체 서버 API

### 6. 구현 우선순위

**우선순위 1 (즉시 구현)**
1. IndexedDB 마이그레이션
2. Web Crypto API 보안 강화
3. 자동 백업 시스템

**우선순위 2 (3개월 내)**
1. 클라우드 동기화
2. 성능 최적화
3. 고급 쿼리 시스템

**우선순위 3 (6개월 내)**
1. 엔터프라이즈 기능
2. 고급 보안 기능
3. 분석 및 리포팅

## 예상 효과

### 성능 개선
- 조회 속도: 70% 향상 (인덱싱 효과)
- 메모리 사용량: 50% 감소 (지연 로딩)
- 앱 시작 시간: 40% 단축

### 보안 강화
- 암호화 강도: 256-bit AES-GCM
- 키 보안: 사용자별 파생 키
- 무결성: 암호화 기반 검증

### 사용자 경험
- 오프라인 지원: 완전 기능
- 클라우드 동기화: 자동
- 데이터 복구: 원클릭 복원

### 운영 효율성
- 자동 백업: 매일
- 업그레이드: 무중단
- 모니터링: 실시간