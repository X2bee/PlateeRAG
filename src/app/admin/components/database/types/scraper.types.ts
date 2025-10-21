// Data Scraper 관련 타입 정의

/**
 * 스크래퍼 상태
 */
export type ScraperStatus = 'idle' | 'running' | 'completed' | 'error' | 'paused';

/**
 * 데이터 소스 타입
 */
export type DataSourceType =
  | 'web'           // 웹 스크래핑
  | 'document'      // 문서 (PDF, DOCX 등)
  | 'image'         // 이미지
  | 'database'      // 데이터베이스
  | 'email'         // 이메일
  | 'api';          // API

/**
 * 파싱 메서드
 */
export type ParsingMethod = 'json' | 'html' | 'xml' | 'csv' | 'raw';

/**
 * Robots.txt 허용 상태
 */
export interface RobotsCheckResult {
  allowed: boolean;
  userAgent: string;
  crawlDelay?: number;
  disallowedPaths?: string[];
  message: string;
}

/**
 * 스크래퍼 설정
 */
export interface ScraperConfig {
  id: string;
  name: string;
  endpoint: string;
  dataSourceType: DataSourceType;
  parsingMethod: ParsingMethod;
  interval?: number;              // 스크래핑 주기 (분 단위)
  maxDepth?: number;              // 웹 스크래핑 시 최대 깊이
  followLinks?: boolean;          // 링크 따라가기 여부
  respectRobotsTxt: boolean;      // robots.txt 준수 여부
  userAgent?: string;             // User-Agent
  headers?: Record<string, string>; // 추가 헤더
  authentication?: {              // 인증 정보
    type: 'none' | 'basic' | 'bearer' | 'api-key';
    credentials?: Record<string, string>;
  };
  filters?: {                     // 필터링 옵션
    includePatterns?: string[];
    excludePatterns?: string[];
    contentType?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * 스크래퍼 실행 통계
 */
export interface ScraperStats {
  scraperId: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalDataCollected: number;     // 수집된 데이터 항목 수
  totalDataSize: number;          // 수집된 데이터 크기 (bytes)
  lastRunAt?: string;
  averageRunTime?: number;        // 평균 실행 시간 (초)
}

/**
 * 스크래핑된 데이터 항목
 */
export interface ScrapedDataItem {
  id: string;
  scraperId: string;
  url?: string;
  title?: string;
  content: any;                   // 실제 데이터
  contentType: string;
  size: number;                   // 데이터 크기 (bytes)
  metadata?: Record<string, any>; // 추가 메타데이터
  parsingMethod: ParsingMethod;
  collectedAt: string;
  tags?: string[];
}

/**
 * 스크래핑 실행 로그
 */
export interface ScraperRunLog {
  id: string;
  scraperId: string;
  status: ScraperStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;              // 실행 시간 (초)
  itemsCollected: number;
  errors?: string[];
  warnings?: string[];
}

/**
 * 데이터 레이크 필터
 */
export interface DataLakeFilter {
  scraperId?: string;
  contentType?: string[];
  parsingMethod?: ParsingMethod[];
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  tags?: string[];
}

/**
 * 데이터 레이크 통계
 */
export interface DataLakeStats {
  totalItems: number;
  totalSize: number;
  itemsBySourceType: Record<string, number>;
  itemsByParsingMethod: Record<string, number>;
  recentItems: number;            // 최근 24시간 내 수집된 항목
}

/**
 * 파싱 결과
 */
export interface ParsedData {
  success: boolean;
  data?: any;
  error?: string;
  method: ParsingMethod;
  originalSize: number;
  parsedSize: number;
  parseTime: number;              // 파싱 시간 (ms)
}
