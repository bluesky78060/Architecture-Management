/**
 * Google Cloud SQL 연결 서비스
 *
 * Cloud SQL 인스턴스에 안전하게 연결하기 위한 서비스
 * @google-cloud/cloud-sql-connector를 사용하여 IAM 인증 및 TLS 암호화 제공
 */

import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector';
import mysql from 'mysql2/promise';

export interface CloudSqlConfig {
  instanceConnectionName: string; // 형식: project:region:instance
  database: string;
  user: string;
  password?: string;
  authType?: AuthTypes;
  ipType?: 'PUBLIC' | 'PRIVATE' | 'PSC';
}

export interface CloudSqlConnectionOptions {
  host?: string;
  user: string;
  password?: string;
  database: string;
  waitForConnections?: boolean;
  connectionLimit?: number;
  queueLimit?: number;
  enableKeepAlive?: boolean;
  keepAliveInitialDelay?: number;
}

class CloudSqlService {
  private connector: Connector | null = null;
  private pool: mysql.Pool | null = null;
  private config: CloudSqlConfig | null = null;

  /**
   * Cloud SQL 연결 풀 초기화
   * @param config Cloud SQL 설정
   */
  async initialize(config: CloudSqlConfig): Promise<void> {
    try {
      console.log('🔌 Initializing Cloud SQL connection...');
      console.log('📍 Instance:', config.instanceConnectionName);
      console.log('🗄️  Database:', config.database);
      console.log('👤 User:', config.user);

      this.config = config;

      // Connector 인스턴스 생성
      this.connector = new Connector();

      // IP 타입 결정
      const ipType = this.getIpType(config.ipType);

      // Cloud SQL Connector 옵션 가져오기
      const clientOpts = await this.connector.getOptions({
        instanceConnectionName: config.instanceConnectionName,
        ipType: ipType,
        authType: config.authType,
      });

      // 연결 풀 설정
      const poolConfig: CloudSqlConnectionOptions = {
        ...clientOpts,
        user: config.user,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      };

      // 비밀번호 인증인 경우 비밀번호 추가
      if (config.authType !== 'IAM' && config.password) {
        poolConfig.password = config.password;
      }

      // 연결 풀 생성
      this.pool = mysql.createPool(poolConfig);

      // 연결 테스트
      const conn = await this.pool.getConnection();
      const [result] = await conn.query('SELECT NOW() as now');
      console.log('✅ Cloud SQL connected successfully at:', (result as any)[0].now);
      conn.release();

    } catch (error) {
      console.error('❌ Cloud SQL initialization failed:', error);
      throw error;
    }
  }

  /**
   * IP 타입 문자열을 IpAddressTypes로 변환
   */
  private getIpType(ipType?: string): IpAddressTypes {
    switch (ipType?.toUpperCase()) {
      case 'PRIVATE':
        return IpAddressTypes.PRIVATE;
      case 'PSC':
        return IpAddressTypes.PSC;
      case 'PUBLIC':
      default:
        return IpAddressTypes.PUBLIC;
    }
  }

  /**
   * 연결 풀 가져오기
   */
  getPool(): mysql.Pool {
    if (!this.pool) {
      throw new Error('Cloud SQL not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * 쿼리 실행 (헬퍼 메서드)
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const pool = this.getPool();
    const [results] = await pool.query(sql, params);
    return results as T;
  }

  /**
   * 단일 행 쿼리 실행
   */
  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T[]>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * INSERT 실행 후 삽입된 ID 반환
   */
  async insert(sql: string, params?: any[]): Promise<number> {
    const pool = this.getPool();
    const [result] = await pool.query(sql, params);
    return (result as any).insertId;
  }

  /**
   * UPDATE/DELETE 실행 후 영향받은 행 수 반환
   */
  async execute(sql: string, params?: any[]): Promise<number> {
    const pool = this.getPool();
    const [result] = await pool.query(sql, params);
    return (result as any).affectedRows;
  }

  /**
   * 트랜잭션 실행
   */
  async transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>
  ): Promise<T> {
    const pool = this.getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 연결 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const pool = this.getPool();
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * 현재 설정 가져오기
   */
  getConfig(): CloudSqlConfig | null {
    return this.config;
  }

  /**
   * 연결 통계 가져오기
   */
  getStats() {
    if (!this.pool) {
      return null;
    }

    return {
      // MySQL2 Pool은 직접적인 통계를 제공하지 않으므로
      // 연결 상태만 반환
      connected: this.pool !== null,
      config: this.config ? {
        instance: this.config.instanceConnectionName,
        database: this.config.database,
        user: this.config.user,
        authType: this.config.authType || 'PASSWORD',
        ipType: this.config.ipType || 'PUBLIC',
      } : null,
    };
  }

  /**
   * 연결 종료
   */
  async close(): Promise<void> {
    try {
      console.log('🔌 Closing Cloud SQL connection...');

      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        console.log('✅ Connection pool closed');
      }

      if (this.connector) {
        this.connector.close();
        this.connector = null;
        console.log('✅ Connector closed');
      }

      this.config = null;
    } catch (error) {
      console.error('❌ Error closing Cloud SQL connection:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const cloudSqlService = new CloudSqlService();
export default cloudSqlService;
