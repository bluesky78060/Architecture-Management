# Google Cloud SQL 배포 가이드

이 문서는 건축 관리 시스템을 Google Cloud SQL과 함께 배포하는 방법을 설명합니다.

---

## 📋 목차

1. [개요](#개요)
2. [사전 요구사항](#사전-요구사항)
3. [Cloud SQL 인스턴스 생성](#cloud-sql-인스턴스-생성)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [애플리케이션 설정](#애플리케이션-설정)
6. [배포 절차](#배포-절차)
7. [연결 테스트](#연결-테스트)
8. [보안 설정](#보안-설정)
9. [모니터링 및 유지보수](#모니터링-및-유지보수)
10. [문제 해결](#문제-해결)

---

## 개요

### 아키텍처

```
┌─────────────────┐
│   Web Browser   │
└────────┬────────┘
         │ HTTPS
┌────────▼────────┐
│   Cloud Run     │
│  (Frontend +    │
│   Node.js App)  │
└────────┬────────┘
         │ Cloud SQL Connector
         │ (Encrypted TLS 1.3)
┌────────▼────────┐
│  Cloud SQL      │
│  (MySQL 8.0)    │
└─────────────────┘
```

### 주요 특징

- **보안**: TLS 1.3 암호화 및 IAM 인증
- **확장성**: 자동 스케일링 및 읽기 복제본 지원
- **고가용성**: 자동 백업 및 failover
- **성능**: 연결 풀링 및 쿼리 최적화

---

## 사전 요구사항

### 1. Google Cloud 계정 및 프로젝트

```bash
# Google Cloud SDK 설치 확인
gcloud --version

# 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID

# 인증
gcloud auth login
```

### 2. 필요한 API 활성화

```bash
# Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com

# Cloud Run API (웹 배포 시)
gcloud services enable run.googleapis.com

# IAM API
gcloud services enable iam.googleapis.com
```

### 3. 권한 확인

필요한 IAM 역할:
- `roles/cloudsql.admin` - Cloud SQL 관리
- `roles/cloudsql.client` - Cloud SQL 연결
- `roles/iam.serviceAccountUser` - 서비스 계정 사용

---

## Cloud SQL 인스턴스 생성

### 1. 기본 인스턴스 생성

```bash
gcloud sql instances create construction-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=STRONG_ROOT_PASSWORD \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --database-flags=character_set_server=utf8mb4,default_time_zone=+09:00
```

### 2. 프로덕션 인스턴스 생성 (고가용성)

```bash
gcloud sql instances create construction-db-prod \
  --database-version=MYSQL_8_0 \
  --tier=db-n1-standard-2 \
  --region=us-central1 \
  --root-password=STRONG_ROOT_PASSWORD \
  --storage-type=SSD \
  --storage-size=100GB \
  --storage-auto-increase \
  --availability-type=REGIONAL \
  --backup \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --retained-backups-count=7 \
  --database-flags=character_set_server=utf8mb4,default_time_zone=+09:00
```

### 3. 인스턴스 확인

```bash
# 인스턴스 목록
gcloud sql instances list

# 인스턴스 상세 정보
gcloud sql instances describe construction-db

# 연결 이름 확인 (중요!)
gcloud sql instances describe construction-db \
  --format="value(connectionName)"
# 출력 예: my-project:us-central1:construction-db
```

---

## 데이터베이스 설정

### 1. 데이터베이스 생성

```bash
# Cloud SQL 인스턴스에 연결
gcloud sql connect construction-db --user=root

# MySQL 프롬프트에서:
CREATE DATABASE construction_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

SHOW DATABASES;
```

### 2. 애플리케이션 사용자 생성

```sql
-- 사용자 생성
CREATE USER 'app_user'@'%' IDENTIFIED BY 'STRONG_APP_PASSWORD';

-- 권한 부여
GRANT ALL PRIVILEGES ON construction_management.* TO 'app_user'@'%';

-- 권한 새로고침
FLUSH PRIVILEGES;

-- 확인
SELECT User, Host FROM mysql.user WHERE User='app_user';
```

### 3. IAM 인증 사용자 생성 (선택사항, 권장)

```bash
# 서비스 계정 생성
gcloud iam service-accounts create construction-app \
  --display-name="Construction Management App"

# Cloud SQL Client 역할 부여
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:construction-app@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

```sql
-- IAM 사용자 생성 (MySQL에서)
CREATE USER 'construction-app@YOUR_PROJECT_ID.iam'@'%'
  IDENTIFIED WITH authentication_string='cloudsql_iam_user';

GRANT ALL PRIVILEGES ON construction_management.*
  TO 'construction-app@YOUR_PROJECT_ID.iam'@'%';

FLUSH PRIVILEGES;
```

### 4. 스키마 초기화

스키마는 애플리케이션이 첫 시작 시 자동으로 생성됩니다. 또는 수동으로:

```bash
# MySQL 클라이언트로 연결
gcloud sql connect construction-db --user=app_user --database=construction_management

# 스키마 파일 실행 (로컬에서)
mysql -h 127.0.0.1 -u app_user -p construction_management < schema.sql
```

---

## 애플리케이션 설정

### 1. 환경 변수 설정

`.env.cloud` 파일 생성:

```bash
# .env.cloud.example을 복사
cp .env.cloud.example .env.cloud

# 편집
nano .env.cloud
```

```.env
# Cloud SQL 설정
CLOUD_SQL_INSTANCE_CONNECTION_NAME=my-project:us-central1:construction-db
CLOUD_SQL_DATABASE=construction_management
CLOUD_SQL_USER=app_user
CLOUD_SQL_PASSWORD=your-secure-password
CLOUD_SQL_AUTH_TYPE=PASSWORD
CLOUD_SQL_IP_TYPE=PUBLIC

# 데이터베이스 백엔드
DATABASE_BACKEND=cloud
```

### 2. IAM 인증 사용 시

```.env
# IAM 인증
CLOUD_SQL_INSTANCE_CONNECTION_NAME=my-project:us-central1:construction-db
CLOUD_SQL_DATABASE=construction_management
CLOUD_SQL_USER=construction-app@my-project.iam
CLOUD_SQL_AUTH_TYPE=IAM
CLOUD_SQL_IP_TYPE=PRIVATE

# 서비스 계정 키 (로컬 테스트용)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# 데이터베이스 백엔드
DATABASE_BACKEND=cloud
```

### 3. Private IP 사용 (VPC)

```bash
# VPC 연결 설정
gcloud sql instances patch construction-db \
  --network=projects/YOUR_PROJECT_ID/global/networks/default \
  --no-assign-ip
```

```.env
CLOUD_SQL_IP_TYPE=PRIVATE
```

---

## 배포 절차

### 1. 로컬 테스트

```bash
# 환경 변수 로드
export $(cat .env.cloud | xargs)

# Cloud SQL 연결 테스트
node scripts/test-cloud-sql.js

# 애플리케이션 실행
npm start
```

### 2. Cloud Run 배포

#### Dockerfile 생성

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci --only=production

# 애플리케이션 코드
COPY . .

# 빌드
RUN npm run build

# 프로덕션 서버 실행
EXPOSE 8080
CMD ["node", "server.js"]
```

#### 배포 명령

```bash
# Docker 이미지 빌드 및 푸시
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/construction-app

# Cloud Run 배포
gcloud run deploy construction-app \
  --image gcr.io/YOUR_PROJECT_ID/construction-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:construction-db \
  --set-env-vars "DATABASE_BACKEND=cloud" \
  --set-env-vars "CLOUD_SQL_INSTANCE_CONNECTION_NAME=YOUR_PROJECT_ID:us-central1:construction-db" \
  --set-env-vars "CLOUD_SQL_DATABASE=construction_management" \
  --set-secrets "CLOUD_SQL_USER=app-user:latest" \
  --set-secrets "CLOUD_SQL_PASSWORD=app-password:latest"
```

### 3. App Engine 배포 (선택사항)

#### app.yaml 생성

```yaml
runtime: nodejs18

env_variables:
  DATABASE_BACKEND: cloud
  CLOUD_SQL_INSTANCE_CONNECTION_NAME: YOUR_PROJECT_ID:us-central1:construction-db
  CLOUD_SQL_DATABASE: construction_management
  CLOUD_SQL_USER: app_user
  CLOUD_SQL_AUTH_TYPE: IAM
  CLOUD_SQL_IP_TYPE: PRIVATE

beta_settings:
  cloud_sql_instances: YOUR_PROJECT_ID:us-central1:construction-db
```

```bash
gcloud app deploy
```

---

## 연결 테스트

### 1. 기본 연결 테스트

```bash
node scripts/test-cloud-sql.js
```

예상 출력:

```
🧪 Cloud SQL Connection Test

============================================================
Configuration Validation
============================================================

ℹ️  Instance: my-project:us-central1:construction-db
ℹ️  Database: construction_management
ℹ️  User: app_user
ℹ️  Auth Type: PASSWORD
ℹ️  IP Type: PUBLIC
✅ Configuration validated

============================================================
Connection Test
============================================================

✅ Connected successfully!
  Server Time: 2025-10-13T20:00:00.000Z
  Database: construction_management
  User: app_user@%

============================================================
Test Summary
============================================================

✅ All tests passed!
```

### 2. 애플리케이션 Health Check

```bash
# 로컬 실행
npm start

# Health check 엔드포인트 호출
curl http://localhost:3000/api/health

# 예상 응답
{
  "status": "ok",
  "database": {
    "connected": true,
    "backend": "cloud",
    "instance": "my-project:us-central1:construction-db"
  }
}
```

---

## 보안 설정

### 1. 네트워크 보안

```bash
# Public IP 비활성화 (VPC 사용 권장)
gcloud sql instances patch construction-db --no-assign-ip

# 승인된 네트워크 추가 (Public IP 사용 시)
gcloud sql instances patch construction-db \
  --authorized-networks=203.0.113.0/24
```

### 2. SSL/TLS 인증서

```bash
# 서버 인증서 생성
gcloud sql ssl-certs create client-cert \
  --instance=construction-db

# 인증서 다운로드
gcloud sql ssl-certs describe client-cert \
  --instance=construction-db \
  --format="get(cert)" > client-cert.pem
```

### 3. IAM 인증 사용

IAM 인증은 비밀번호 없이 Google Cloud IAM을 통해 인증합니다:

- ✅ 비밀번호 관리 불필요
- ✅ 자동 로테이션
- ✅ 세분화된 권한 제어
- ✅ 감사 로깅

### 4. Secret Manager 사용

```bash
# Secret 생성
echo -n "app_user" | gcloud secrets create db-user --data-file=-
echo -n "password" | gcloud secrets create db-password --data-file=-

# Secret 액세스 권한 부여
gcloud secrets add-iam-policy-binding db-password \
  --member="serviceAccount:construction-app@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 모니터링 및 유지보수

### 1. Cloud Monitoring

```bash
# 메트릭 확인
gcloud sql operations list --instance=construction-db

# 로그 확인
gcloud logging read "resource.type=cloudsql_database" --limit 50
```

Cloud Console에서 확인:
- CPU 사용률
- 메모리 사용률
- 디스크 사용률
- 연결 수
- 쿼리 성능

### 2. 자동 백업

```bash
# 백업 목록
gcloud sql backups list --instance=construction-db

# 특정 시점 복구 (PITR) 테스트
gcloud sql backups create --instance=construction-db

# 백업에서 복원
gcloud sql backups restore BACKUP_ID \
  --backup-instance=construction-db \
  --backup-id=BACKUP_ID
```

### 3. 성능 최적화

```sql
-- 느린 쿼리 로그 활성화
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- 쿼리 성능 분석
EXPLAIN SELECT * FROM clients WHERE company_name LIKE '%ABC%';

-- 인덱스 확인
SHOW INDEX FROM clients;
```

### 4. 스케일링

```bash
# 수직 스케일링 (인스턴스 크기 변경)
gcloud sql instances patch construction-db \
  --tier=db-n1-standard-4

# 읽기 복제본 생성 (읽기 부하 분산)
gcloud sql instances create construction-db-read-replica \
  --master-instance-name=construction-db \
  --tier=db-n1-standard-2 \
  --region=us-east1
```

---

## 문제 해결

### 1. 연결 실패

**증상**: "Error: connect ETIMEDOUT"

**해결책**:
```bash
# 1. 인스턴스 상태 확인
gcloud sql instances describe construction-db

# 2. 방화벽 규칙 확인
gcloud compute firewall-rules list

# 3. 승인된 네트워크 확인
gcloud sql instances describe construction-db \
  --format="value(settings.ipConfiguration.authorizedNetworks)"

# 4. Cloud SQL Proxy 사용 (로컬 테스트)
cloud_sql_proxy -instances=YOUR_PROJECT_ID:us-central1:construction-db=tcp:3306
```

### 2. 인증 실패

**증상**: "Access denied for user"

**해결책**:
```sql
-- 사용자 확인
SELECT User, Host FROM mysql.user WHERE User='app_user';

-- 권한 확인
SHOW GRANTS FOR 'app_user'@'%';

-- 비밀번호 재설정
ALTER USER 'app_user'@'%' IDENTIFIED BY 'new-password';
FLUSH PRIVILEGES;
```

### 3. 성능 문제

**증상**: 쿼리 응답 느림

**해결책**:
```sql
-- 느린 쿼리 확인
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;

-- 프로세스 목록 확인
SHOW FULL PROCESSLIST;

-- 인덱스 추가
CREATE INDEX idx_custom ON table_name(column_name);

-- 테이블 최적화
OPTIMIZE TABLE clients;
```

### 4. 연결 풀 고갈

**증상**: "Too many connections"

**해결책**:
```bash
# 최대 연결 수 증가
gcloud sql instances patch construction-db \
  --database-flags max_connections=200

# 애플리케이션 연결 풀 설정 조정
# src/config/database.config.ts 에서:
# connectionLimit: 10 → 20
```

### 5. 디버깅 팁

```javascript
// src/services/cloudSql.ts 에서 디버그 로깅 활성화
console.log('Connection config:', {
  instance: config.instanceConnectionName,
  database: config.database,
  user: config.user,
  authType: config.authType,
  ipType: config.ipType,
});
```

---

## 비용 최적화

### 1. 인스턴스 크기 선택

| 용도 | 티어 | vCPU | 메모리 | 월 비용 (예상) |
|------|------|------|--------|----------------|
| 개발 | db-f1-micro | 공유 | 0.6GB | ~$7 |
| 테스트 | db-g1-small | 공유 | 1.7GB | ~$25 |
| 프로덕션 | db-n1-standard-1 | 1 | 3.75GB | ~$50 |
| 대규모 | db-n1-standard-4 | 4 | 15GB | ~$200 |

### 2. 비용 절감 팁

- ✅ 개발/테스트 환경은 업무 시간에만 실행
- ✅ 자동 스토리지 증가 활성화 (필요한 만큼만 사용)
- ✅ 백업 보관 기간 최적화 (7-30일)
- ✅ 읽기 복제본은 필요시에만 사용
- ✅ Cloud SQL Insights로 리소스 사용 모니터링

---

## 체크리스트

### 배포 전

- [ ] Cloud SQL 인스턴스 생성 완료
- [ ] 데이터베이스 및 사용자 생성 완료
- [ ] 환경 변수 설정 완료
- [ ] 로컬에서 연결 테스트 성공
- [ ] 스키마 초기화 완료
- [ ] 백업 설정 완료

### 배포 후

- [ ] 프로덕션 연결 테스트 성공
- [ ] Health check 엔드포인트 정상
- [ ] 모니터링 대시보드 설정
- [ ] 알림 설정 완료
- [ ] 백업 자동화 확인
- [ ] 롤백 계획 수립

### 보안

- [ ] IAM 인증 사용 (권장)
- [ ] Private IP 사용 (권장)
- [ ] SSL/TLS 인증서 설정
- [ ] Secret Manager 사용
- [ ] 승인된 네트워크 제한
- [ ] 정기 보안 감사

---

**최종 업데이트**: 2025년 10월 13일
**문서 버전**: 1.0
**작성자**: Claude Code

