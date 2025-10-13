/**
 * 메모리 캐싱 서비스
 * 데이터베이스 쿼리 결과를 메모리에 캐싱하여 성능 향상
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private TTL: number = 60000; // 1분 (밀리초)
  private maxSize: number = 100; // 최대 캐시 항목 수
  private hits: number = 0;
  private misses: number = 0;

  /**
   * 캐시에서 데이터 조회
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // TTL 만료 확인
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // 조회 횟수 증가
    entry.hits++;
    this.hits++;
    return entry.data as T;
  }

  /**
   * 캐시에 데이터 저장
   */
  set<T>(key: string, data: T): void {
    // 캐시 크기 제한 확인
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  /**
   * 특정 키 삭제
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 패턴으로 키 삭제 (예: 'clients:*' -> 모든 clients 관련 캐시 삭제)
   */
  deletePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * 전체 캐시 초기화
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 캐시 통계 조회
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0
    };
  }

  /**
   * TTL 설정
   */
  setTTL(milliseconds: number): void {
    this.TTL = milliseconds;
  }

  /**
   * 최대 크기 설정
   */
  setMaxSize(size: number): void {
    this.maxSize = size;
  }

  /**
   * 가장 적게 사용된 항목 제거 (LRU)
   */
  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let minHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < minHits) {
        minHits = entry.hits;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  /**
   * 만료된 항목 정리
   */
  cleanup(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * 함수 결과를 캐싱하는 래퍼
   */
  async cached<T>(
    key: string,
    fn: () => Promise<T> | T,
    ttl?: number
  ): Promise<T> {
    // 캐시 확인
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 함수 실행
    const result = await fn();

    // 결과 캐싱
    if (ttl) {
      const originalTTL = this.TTL;
      this.TTL = ttl;
      this.set(key, result);
      this.TTL = originalTTL;
    } else {
      this.set(key, result);
    }

    return result;
  }
}

// 싱글톤 인스턴스 생성
export const cacheService = new CacheService();

// 자동 정리: 5분마다 만료된 항목 제거
if (typeof window !== 'undefined') {
  setInterval(() => {
    const cleaned = cacheService.cleanup();
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: ${cleaned} expired entries removed`);
    }
  }, 5 * 60 * 1000); // 5분
}

export default cacheService;
