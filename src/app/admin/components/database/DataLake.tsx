'use client';

import React, { useState, useEffect } from 'react';
import {
  FiArrowLeft,
  FiX,
  FiPackage,
  FiHardDrive,
  FiPlusCircle,
  FiFileText,
  FiGlobe,
  FiImage,
  FiFile,
  FiFolder,
  FiCheckCircle,
  FiXCircle,
  FiCode
} from 'react-icons/fi';
import styles from '@/app/admin/assets/DataLake.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import {
  showSuccessToastKo,
  showErrorToastKo
} from '@/app/_common/utils/toastUtilsKo';
import {
  ScrapedDataItem,
  DataLakeStats,
  ParsingMethod,
  ParsedData
} from './types/scraper.types';
import {
  fetchScrapedData,
  fetchDataLakeStats,
  parseDataItem
} from '@/app/admin/api/dataScraper';

interface DataLakeProps {
  onClose: () => void;
}

/**
 * DataLake - 수집된 데이터 관리 컴포넌트
 */
const DataLake: React.FC<DataLakeProps> = ({ onClose }) => {
  const [data, setData] = useState<ScrapedDataItem[]>([]);
  const [stats, setStats] = useState<DataLakeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ScrapedDataItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [parsingResult, setParsingResult] = useState<ParsedData | null>(null);
  const [parsing, setParsing] = useState(false);
  const [currentParsingMethod, setCurrentParsingMethod] = useState<ParsingMethod>('json');

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);

      const [dataItems, lakeStats] = await Promise.all([
        fetchScrapedData(),
        fetchDataLakeStats()
      ]);

      setData(dataItems);
      setStats(lakeStats);

      devLog.log('Data lake loaded:', dataItems.length, 'items');
    } catch (error) {
      devLog.error('Failed to load data lake:', error);
      showErrorToastKo('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 데이터 파싱
  const handleParse = async (method: ParsingMethod) => {
    if (!selectedItem) return;

    try {
      setParsing(true);
      setCurrentParsingMethod(method);

      const result = await parseDataItem(selectedItem.id, method);
      setParsingResult(result);

      if (result.success) {
        showSuccessToastKo(`${method.toUpperCase()} 파싱이 완료되었습니다.`);
      } else {
        showErrorToastKo(`파싱 실패: ${result.error}`);
      }
    } catch (error) {
      devLog.error('Failed to parse data:', error);
      showErrorToastKo('데이터 파싱에 실패했습니다.');
    } finally {
      setParsing(false);
    }
  };

  // 데이터 크기 포맷
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // 날짜 포맷
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 데이터 타입 아이콘
  const getContentTypeIcon = (contentType: string): React.ReactNode => {
    if (contentType.includes('json')) return <FiCode />;
    if (contentType.includes('html')) return <FiGlobe />;
    if (contentType.includes('pdf')) return <FiFileText />;
    if (contentType.includes('image')) return <FiImage />;
    if (contentType.includes('text')) return <FiFile />;
    return <FiPackage />;
  };

  // 상세 뷰로 전환
  const handleViewDetail = (item: ScrapedDataItem) => {
    setSelectedItem(item);
    setViewMode('detail');
    setParsingResult(null);
  };

  // 목록 뷰로 전환
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedItem(null);
    setParsingResult(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 상세 뷰 렌더링
  if (viewMode === 'detail' && selectedItem) {
    return (
      <div className={styles.container}>
        {/* 헤더 */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <button className={styles.backButton} onClick={handleBackToList}>
              <FiArrowLeft />
              뒤로가기
            </button>
            <h2>데이터 상세 정보</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* 상세 정보 */}
        <div className={styles.detailContainer}>
          {/* 메타데이터 */}
          <section className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>메타데이터</h3>
            <div className={styles.metadataGrid}>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>제목:</span>
                <span className={styles.metadataValue}>{selectedItem.title || '(제목 없음)'}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>URL:</span>
                <span className={styles.metadataValue}>{selectedItem.url || '-'}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>콘텐츠 타입:</span>
                <span className={styles.metadataValue}>
                  {getContentTypeIcon(selectedItem.contentType)} {selectedItem.contentType}
                </span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>크기:</span>
                <span className={styles.metadataValue}>{formatSize(selectedItem.size ?? 0)}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>파싱 방법:</span>
                <span className={styles.metadataValue}>{selectedItem.parsingMethod}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>수집 시간:</span>
                <span className={styles.metadataValue}>{formatDate(selectedItem.collectedAt)}</span>
              </div>
            </div>

            {selectedItem.tags && selectedItem.tags.length > 0 && (
              <div className={styles.tagsContainer}>
                <span className={styles.metadataLabel}>태그:</span>
                <div className={styles.tags}>
                  {selectedItem.tags.map((tag, idx) => (
                    <span key={idx} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 파싱 옵션 */}
          <section className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>데이터 파싱</h3>
            <div className={styles.parsingButtons}>
              <button
                className={styles.parseButton}
                onClick={() => handleParse('json')}
                disabled={parsing}
              >
                <FiCode />
                JSON 파싱
              </button>
              <button
                className={styles.parseButton}
                onClick={() => handleParse('html')}
                disabled={parsing}
              >
                <FiGlobe />
                HTML 파싱
              </button>
            </div>

            {parsing && (
              <div className={styles.parsingStatus}>
                <div className={styles.miniSpinner}></div>
                <span>파싱 중...</span>
              </div>
            )}

            {parsingResult && (
              <div className={`${styles.parsingResult} ${
                parsingResult.success ? styles.success : styles.error
              }`}>
                <div className={styles.resultHeader}>
                  <span className={styles.resultIcon}>
                    {parsingResult.success ? <FiCheckCircle /> : <FiXCircle />}
                  </span>
                  <span className={styles.resultTitle}>
                    {parsingResult.success ? '파싱 성공' : '파싱 실패'}
                  </span>
                  <span className={styles.resultTime}>
                    ({parsingResult.parseTime}ms)
                  </span>
                </div>

                {parsingResult.success ? (
                  <div className={styles.resultContent}>
                    <div className={styles.resultStats}>
                      <span>원본: {formatSize(parsingResult.originalSize)}</span>
                      <span>파싱 후: {formatSize(parsingResult.parsedSize)}</span>
                    </div>
                    <pre className={styles.resultData}>
                      {JSON.stringify(parsingResult.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className={styles.resultError}>
                    {parsingResult.error}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 원본 데이터 */}
          <section className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>원본 데이터</h3>
            <div className={styles.rawDataContainer}>
              <pre className={styles.rawData}>
                {typeof selectedItem.content === 'string'
                  ? selectedItem.content
                  : JSON.stringify(selectedItem.content, null, 2)}
              </pre>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // 목록 뷰 렌더링
  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <button className={styles.backButton} onClick={onClose}>
            <FiArrowLeft />
            뒤로가기
          </button>
          <h2>데이터 레이크</h2>
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          <FiX />
        </button>
      </div>

      {/* 통계 */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><FiPackage size={28} /></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.totalItems.toLocaleString()}</div>
              <div className={styles.statLabel}>총 항목</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><FiHardDrive size={28} /></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{formatSize(stats.totalSize)}</div>
              <div className={styles.statLabel}>총 크기</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><FiPlusCircle size={28} /></div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.recentItems}</div>
              <div className={styles.statLabel}>최근 24시간</div>
            </div>
          </div>
        </div>
      )}

      {/* 데이터 목록 */}
      <div className={styles.dataListContainer}>
        <div className={styles.listHeader}>
          <h3>수집된 데이터</h3>
          <span className={styles.count}>{data.length}개</span>
        </div>

        {data.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><FiFolder size={64} /></div>
            <h4>수집된 데이터가 없습니다</h4>
            <p>스크래퍼를 실행하여 데이터를 수집하세요.</p>
          </div>
        ) : (
          <div className={styles.dataList}>
            {data.map(item => (
              <div
                key={item.id}
                className={styles.dataCard}
                onClick={() => handleViewDetail(item)}
              >
                <div className={styles.dataCardHeader}>
                  <span className={styles.dataIcon}>
                    {getContentTypeIcon(item.contentType)}
                  </span>
                  <h4 className={styles.dataTitle}>
                    {item.title || '(제목 없음)'}
                  </h4>
                </div>

                <div className={styles.dataInfo}>
                  {item.url && (
                    <div className={styles.dataInfoRow}>
                      <span className={styles.infoLabel}>URL:</span>
                      <span className={styles.infoValue}>{item.url}</span>
                    </div>
                  )}
                  <div className={styles.dataInfoRow}>
                    <span className={styles.infoLabel}>타입:</span>
                    <span className={styles.infoValue}>{item.contentType}</span>
                  </div>
                  <div className={styles.dataInfoRow}>
                    <span className={styles.infoLabel}>크기:</span>
                    <span className={styles.infoValue}>{formatSize(item.size)}</span>
                  </div>
                  <div className={styles.dataInfoRow}>
                    <span className={styles.infoLabel}>수집:</span>
                    <span className={styles.infoValue}>{formatDate(item.collectedAt)}</span>
                  </div>
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div className={styles.dataTags}>
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className={styles.dataTag}>{tag}</span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className={styles.dataTag}>+{item.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataLake;
