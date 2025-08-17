'use client';

import React, { useState, useEffect } from 'react';
import { FiDatabase, FiTrash2, FiInfo } from 'react-icons/fi';
import { getDocumentCacheStats, clearAllDocumentCache, hasDocumentInCache } from '../../../api/documentAPI';
import styles from './CacheStatusIndicator.module.scss';

interface CacheStatusIndicatorProps {
  filePath?: string;
  className?: string;
}

const CacheStatusIndicator: React.FC<CacheStatusIndicatorProps> = ({ filePath, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isInCache, setIsInCache] = useState(false);

  const updateStats = () => {
    const currentStats = getDocumentCacheStats();
    setStats(currentStats);
    
    if (filePath) {
      setIsInCache(hasDocumentInCache(filePath));
    }
  };

  useEffect(() => {
    updateStats();
    
    // 주기적으로 통계 업데이트
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [filePath]);

  const handleClearCache = () => {
    clearAllDocumentCache();
    updateStats();
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
  };

  if (!stats) return null;

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <button 
        className={styles.trigger}
        onClick={() => setIsExpanded(!isExpanded)}
        title="캐시 상태 보기"
      >
        <FiDatabase />
        <span className={styles.badgeCount}>{stats.totalEntries}</span>
        {filePath && isInCache && <span className={styles.cachedIndicator}>●</span>}
      </button>

      {isExpanded && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h4>
              <FiInfo /> 문서 캐시 상태
            </h4>
            <button 
              className={styles.clearButton}
              onClick={handleClearCache}
              title="캐시 전체 삭제"
            >
              <FiTrash2 />
            </button>
          </div>
          
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.label}>캐시된 문서:</span>
              <span className={styles.value}>{stats.totalEntries}개</span>
            </div>
            
            <div className={styles.statItem}>
              <span className={styles.label}>사용 중인 메모리:</span>
              <span className={styles.value}>{formatSize(stats.totalSize)}</span>
            </div>
            
            <div className={styles.statItem}>
              <span className={styles.label}>평균 파일 크기:</span>
              <span className={styles.value}>{formatSize(stats.avgSize)}</span>
            </div>
            
            <div className={styles.statItem}>
              <span className={styles.label}>캐시 적중률:</span>
              <span className={`${styles.value} ${styles.hitRate}`}>
                {stats.hitRate.toFixed(1)}%
              </span>
            </div>
            
            <div className={styles.statItem}>
              <span className={styles.label}>요청 수 (적중/실패):</span>
              <span className={styles.value}>
                {stats.hitCount}/{stats.missCount}
              </span>
            </div>
            
            {stats.evictionCount > 0 && (
              <div className={styles.statItem}>
                <span className={styles.label}>제거된 항목:</span>
                <span className={styles.value}>{stats.evictionCount}개</span>
              </div>
            )}
          </div>

          {filePath && (
            <div className={styles.currentFile}>
              <div className={styles.fileStatus}>
                <span className={styles.label}>현재 파일:</span>
                <span className={`${styles.status} ${isInCache ? styles.cached : styles.notCached}`}>
                  {isInCache ? '캐시됨' : '캐시 안됨'}
                </span>
              </div>
              <div className={styles.fileName} title={filePath}>
                {filePath.split('/').pop() || filePath}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CacheStatusIndicator;