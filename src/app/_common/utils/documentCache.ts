/**
 * PDF 문서 캐싱 시스템
 * 메모리 기반 캐시로 동일한 문서의 반복 요청을 최적화
 */

interface CacheEntry {
  data: ArrayBuffer;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
}

class DocumentCacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly maxCacheSize: number; // 최대 캐시 크기 (bytes)
  private readonly maxEntries: number; // 최대 캐시 항목 수
  private readonly maxAge: number; // 캐시 만료 시간 (ms)
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hitCount: 0,
    missCount: 0,
    evictionCount: 0
  };

  constructor(
    maxCacheSize = 100 * 1024 * 1024, // 100MB
    maxEntries = 50,
    maxAge = 30 * 60 * 1000 // 30분
  ) {
    this.maxCacheSize = maxCacheSize;
    this.maxEntries = maxEntries;
    this.maxAge = maxAge;

    // 주기적으로 만료된 캐시 정리
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000); // 5분마다
  }

  /**
   * 캐시에서 문서 가져오기
   */
  get(filePath: string): ArrayBuffer | null {
    const entry = this.cache.get(filePath);
    
    if (!entry) {
      this.stats.missCount++;
      return null;
    }

    // 만료 확인
    if (this.isExpired(entry)) {
      this.cache.delete(filePath);
      this.updateStatsAfterRemoval(entry);
      this.stats.missCount++;
      return null;
    }

    // 캐시 히트
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hitCount++;
    
    console.log(`🎯 [DocumentCache] Cache hit for: ${filePath}`);
    return entry.data;
  }

  /**
   * 캐시에 문서 저장
   */
  set(filePath: string, data: ArrayBuffer): void {
    const now = Date.now();
    const size = data.byteLength;

    // 용량 확인 및 공간 확보
    this.ensureSpace(size);

    const entry: CacheEntry = {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      size
    };

    // 기존 항목이 있다면 제거
    const existingEntry = this.cache.get(filePath);
    if (existingEntry) {
      this.updateStatsAfterRemoval(existingEntry);
    }

    this.cache.set(filePath, entry);
    this.updateStatsAfterAdd(entry);

    console.log(`💾 [DocumentCache] Cached document: ${filePath} (${this.formatSize(size)})`);
    this.logCacheStats();
  }

  /**
   * 특정 문서 캐시 삭제
   */
  delete(filePath: string): boolean {
    const entry = this.cache.get(filePath);
    if (entry) {
      this.cache.delete(filePath);
      this.updateStatsAfterRemoval(entry);
      console.log(`🗑️ [DocumentCache] Removed from cache: ${filePath}`);
      return true;
    }
    return false;
  }

  /**
   * 전체 캐시 클리어
   */
  clear(): void {
    const entriesCount = this.cache.size;
    this.cache.clear();
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hitCount: this.stats.hitCount,
      missCount: this.stats.missCount,
      evictionCount: this.stats.evictionCount + entriesCount
    };
    console.log(`🧹 [DocumentCache] Cache cleared (${entriesCount} entries removed)`);
  }

  /**
   * 캐시 통계 가져오기
   */
  getStats(): CacheStats & { hitRate: number; avgSize: number } {
    const totalRequests = this.stats.hitCount + this.stats.missCount;
    const hitRate = totalRequests > 0 ? (this.stats.hitCount / totalRequests) * 100 : 0;
    const avgSize = this.stats.totalEntries > 0 ? this.stats.totalSize / this.stats.totalEntries : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      avgSize: Math.round(avgSize)
    };
  }

  /**
   * 캐시에 문서가 있는지 확인
   */
  has(filePath: string): boolean {
    const entry = this.cache.get(filePath);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * 만료된 항목인지 확인
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.maxAge;
  }

  /**
   * 공간 확보 (LRU + 크기 기반)
   */
  private ensureSpace(newItemSize: number): void {
    // 항목 수 제한 확인
    while (this.cache.size >= this.maxEntries) {
      this.evictLeastRecentlyUsed();
    }

    // 크기 제한 확인
    while (this.stats.totalSize + newItemSize > this.maxCacheSize) {
      if (this.cache.size === 0) break; // 캐시가 비어있으면 중단
      this.evictLeastRecentlyUsed();
    }
  }

  /**
   * LRU 기반 항목 제거
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      this.cache.delete(oldestKey);
      this.updateStatsAfterRemoval(entry);
      this.stats.evictionCount++;
      console.log(`⏰ [DocumentCache] Evicted LRU item: ${oldestKey}`);
    }
  }

  /**
   * 만료된 항목들 정리
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      const entry = this.cache.get(key)!;
      this.cache.delete(key);
      this.updateStatsAfterRemoval(entry);
      this.stats.evictionCount++;
    });

    if (expiredKeys.length > 0) {
      console.log(`🧼 [DocumentCache] Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * 항목 추가 후 통계 업데이트
   */
  private updateStatsAfterAdd(entry: CacheEntry): void {
    this.stats.totalEntries++;
    this.stats.totalSize += entry.size;
  }

  /**
   * 항목 제거 후 통계 업데이트
   */
  private updateStatsAfterRemoval(entry: CacheEntry): void {
    this.stats.totalEntries = Math.max(0, this.stats.totalEntries - 1);
    this.stats.totalSize = Math.max(0, this.stats.totalSize - entry.size);
  }

  /**
   * 크기를 읽기 쉬운 형태로 포맷
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${Math.round(size * 100) / 100}${units[unitIndex]}`;
  }

  /**
   * 캐시 통계 로깅
   */
  private logCacheStats(): void {
    const stats = this.getStats();
    console.log(`📊 [DocumentCache] Stats: ${stats.totalEntries} entries, ${this.formatSize(stats.totalSize)}, ${stats.hitRate}% hit rate`);
  }
}

// 싱글톤 인스턴스
export const documentCache = new DocumentCacheManager();

// 개발 환경에서 전역으로 접근 가능하도록
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).documentCache = documentCache;
}