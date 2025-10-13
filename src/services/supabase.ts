/**
 * Supabase 연결 서비스
 *
 * Supabase PostgreSQL 데이터베이스에 연결하기 위한 서비스
 * @supabase/supabase-js SDK 사용
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig | null = null;

  /**
   * Supabase 클라이언트 초기화
   * @param config Supabase 설정
   */
  initialize(config: SupabaseConfig): void {
    try {
      console.log('🔌 Initializing Supabase connection...');
      console.log('📍 URL:', config.url);

      this.config = config;

      // Supabase 클라이언트 생성
      this.client = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-application-name': 'construction-management',
          },
        },
      });

      console.log('✅ Supabase initialized successfully');
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error);
      throw error;
    }
  }

  /**
   * 클라이언트 가져오기
   */
  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase not initialized. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * 현재 설정 가져오기
   */
  getConfig(): SupabaseConfig | null {
    return this.config;
  }

  /**
   * 헬스 체크
   */
  async healthCheck(): Promise<boolean> {
    try {
      const client = this.getClient();

      // 간단한 쿼리로 연결 테스트
      const { error } = await client
        .from('clients')
        .select('count', { count: 'exact', head: true });

      if (error && error.code !== 'PGRST116') {
        // PGRST116은 테이블이 없을 때 나오는 에러 (정상)
        console.error('Health check failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * 연결 통계
   */
  getStats() {
    if (!this.client) {
      return null;
    }

    return {
      connected: this.client !== null,
      config: this.config ? {
        url: this.config.url,
        hasAnonKey: !!this.config.anonKey,
        hasServiceRoleKey: !!this.config.serviceRoleKey,
      } : null,
    };
  }

  /**
   * SQL 쿼리 실행 (RPC 사용)
   */
  async query<T = any>(functionName: string, params?: any): Promise<T> {
    const client = this.getClient();
    const { data, error } = await client.rpc(functionName, params);

    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }

    return data as T;
  }

  /**
   * 트랜잭션 (Supabase는 자동으로 트랜잭션 처리)
   * PostgreSQL 함수로 구현 권장
   */
  async transaction<T>(callback: (client: SupabaseClient) => Promise<T>): Promise<T> {
    const client = this.getClient();
    return await callback(client);
  }
}

// 싱글톤 인스턴스
export const supabaseService = new SupabaseService();
export default supabaseService;
