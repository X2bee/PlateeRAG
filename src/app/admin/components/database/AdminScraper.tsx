'use client';

import React, { useState, useEffect } from 'react';
import {
  FiArrowLeft,
  FiGlobe,
  FiZap,
  FiDatabase,
  FiFileText,
  FiImage,
  FiMail,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle
} from 'react-icons/fi';
import styles from '@/app/admin/assets/AdminScraper.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import {
  showSuccessToastKo,
  showErrorToastKo
} from '@/app/_common/utils/toastUtilsKo';
import {
  ScraperConfig,
  DataSourceType,
  ParsingMethod,
  RobotsCheckResult
} from './types/scraper.types';
import { mockScraperAPI } from './mocks/scraper.mock';

interface AdminScraperProps {
  scraperId: string | null;
  onClose: () => void;
  onSave: () => void;
}

/**
 * AdminScraper - 스크래퍼 생성/수정 컴포넌트
 */
const AdminScraper: React.FC<AdminScraperProps> = ({ scraperId, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [dataSourceType, setDataSourceType] = useState<DataSourceType>('web');
  const [parsingMethod, setParsingMethod] = useState<ParsingMethod>('html');
  const [interval, setInterval] = useState(60);
  const [maxDepth, setMaxDepth] = useState(2);
  const [followLinks, setFollowLinks] = useState(true);
  const [respectRobotsTxt, setRespectRobotsTxt] = useState(true);
  const [userAgent, setUserAgent] = useState('xgen bot/1.0');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [robotsCheckResult, setRobotsCheckResult] = useState<RobotsCheckResult | null>(null);
  const [checkingRobots, setCheckingRobots] = useState(false);

  // 편집 모드일 경우 기존 데이터 로드
  useEffect(() => {
    if (scraperId) {
      loadScraperData(scraperId);
    }
  }, [scraperId]);

  const loadScraperData = async (id: string) => {
    try {
      setLoading(true);
      const scrapers = await mockScraperAPI.getScrapers();
      const scraper = scrapers.find(s => s.id === id);

      if (scraper) {
        setName(scraper.name);
        setEndpoint(scraper.endpoint);
        setDataSourceType(scraper.dataSourceType);
        setParsingMethod(scraper.parsingMethod);
        setInterval(scraper.interval || 60);
        setMaxDepth(scraper.maxDepth || 2);
        setFollowLinks(scraper.followLinks || false);
        setRespectRobotsTxt(scraper.respectRobotsTxt);
        setUserAgent(scraper.userAgent || 'xgen bot/1.0');
      }
    } catch (error) {
      devLog.error('Failed to load scraper:', error);
      showErrorToastKo('스크래퍼 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // robots.txt 확인
  const handleCheckRobotsTxt = async () => {
    if (!endpoint.trim()) {
      showErrorToastKo('엔드포인트를 먼저 입력해주세요.');
      return;
    }

    try {
      setCheckingRobots(true);
      setRobotsCheckResult(null);

      const result = await mockScraperAPI.checkRobotsTxt(endpoint);
      setRobotsCheckResult(result);

      if (result.allowed) {
        showSuccessToastKo('크롤링이 허용됩니다.');
      } else {
        showErrorToastKo('크롤링이 제한됩니다.');
      }
    } catch (error) {
      devLog.error('Failed to check robots.txt:', error);
      showErrorToastKo('robots.txt 확인에 실패했습니다.');
    } finally {
      setCheckingRobots(false);
    }
  };

  // 스크래퍼 저장
  const handleSave = async () => {
    // 유효성 검사
    if (!name.trim()) {
      showErrorToastKo('스크래퍼 이름을 입력해주세요.');
      return;
    }
    if (!endpoint.trim()) {
      showErrorToastKo('엔드포인트를 입력해주세요.');
      return;
    }

    try {
      setSaving(true);

      const scraperData = {
        name: name.trim(),
        endpoint: endpoint.trim(),
        dataSourceType,
        parsingMethod,
        interval,
        maxDepth,
        followLinks,
        respectRobotsTxt,
        userAgent
      };

      if (scraperId) {
        // 수정
        await mockScraperAPI.updateScraper(scraperId, scraperData);
        showSuccessToastKo('스크래퍼가 수정되었습니다.');
      } else {
        // 생성
        await mockScraperAPI.createScraper(scraperData);
        showSuccessToastKo('스크래퍼가 생성되었습니다.');
      }

      onSave();
    } catch (error) {
      devLog.error('Failed to save scraper:', error);
      showErrorToastKo('스크래퍼 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 스크래핑 테스트
  const handleTestScraping = async () => {
    if (!endpoint.trim()) {
      showErrorToastKo('엔드포인트를 먼저 입력해주세요.');
      return;
    }

    showSuccessToastKo('테스트 스크래핑이 시작되었습니다. (Mock)');
    devLog.log('Test scraping for:', endpoint);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>스크래퍼 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <button className={styles.backButton} onClick={onClose}>
            <FiArrowLeft />
            뒤로가기
          </button>
          <h2>{scraperId ? '스크래퍼 수정' : '새 스크래퍼 생성'}</h2>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            onClick={onClose}
          >
            취소
          </button>
          <button
            className={styles.primaryButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* 폼 */}
      <div className={styles.formContainer}>
        {/* 기본 정보 */}
        <section className={styles.formSection}>
          <h3 className={styles.sectionTitle}>기본 정보</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              스크래퍼 이름 <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: Tech News Aggregator"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              엔드포인트 <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="예: https://example.com"
            />
            <p className={styles.hint}>
              웹사이트 URL, API 엔드포인트, 데이터베이스 연결 문자열 등
            </p>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>데이터 소스 타입</label>
              <select
                className={styles.select}
                value={dataSourceType}
                onChange={(e) => setDataSourceType(e.target.value as DataSourceType)}
              >
                <option value="web">웹 스크래핑</option>
                <option value="api">API</option>
                <option value="database">데이터베이스</option>
                <option value="document">문서</option>
                <option value="image">이미지</option>
                <option value="email">이메일</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>파싱 메서드</label>
              <select
                className={styles.select}
                value={parsingMethod}
                onChange={(e) => setParsingMethod(e.target.value as ParsingMethod)}
              >
                <option value="html">HTML 파싱</option>
                <option value="json">JSON 파싱</option>
                <option value="xml">XML 파싱</option>
                <option value="csv">CSV 파싱</option>
                <option value="raw">원본 데이터</option>
              </select>
            </div>
          </div>
        </section>

        {/* Robots.txt 확인 */}
        {dataSourceType === 'web' && (
          <section className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Robots.txt 확인</h3>

            <div className={styles.robotsCheckContainer}>
              <button
                className={styles.checkButton}
                onClick={handleCheckRobotsTxt}
                disabled={checkingRobots || !endpoint.trim()}
              >
                {checkingRobots ? '확인 중...' : (
                  <>
                    <FiAlertCircle />
                    Robots.txt 확인
                  </>
                )}
              </button>

              {robotsCheckResult && (
                <div className={`${styles.robotsResult} ${
                  robotsCheckResult.allowed ? styles.allowed : styles.disallowed
                }`}>
                  <div className={styles.resultHeader}>
                    <span className={styles.resultIcon}>
                      {robotsCheckResult.allowed ? <FiCheckCircle /> : <FiXCircle />}
                    </span>
                    <span className={styles.resultTitle}>
                      {robotsCheckResult.allowed ? '크롤링 허용' : '크롤링 제한'}
                    </span>
                  </div>
                  <p className={styles.resultMessage}>{robotsCheckResult.message}</p>

                  {robotsCheckResult.crawlDelay && (
                    <p className={styles.resultDetail}>
                      권장 크롤 지연: {robotsCheckResult.crawlDelay}초
                    </p>
                  )}

                  {robotsCheckResult.disallowedPaths && robotsCheckResult.disallowedPaths.length > 0 && (
                    <div className={styles.resultDetail}>
                      <strong>제한된 경로:</strong>
                      <ul className={styles.pathList}>
                        {robotsCheckResult.disallowedPaths.map((path, idx) => (
                          <li key={idx}>{path}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 스크래핑 옵션 */}
        <section className={styles.formSection}>
          <h3 className={styles.sectionTitle}>스크래핑 옵션</h3>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>실행 주기 (분)</label>
              <input
                type="number"
                className={styles.input}
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 60)}
                min="1"
              />
            </div>

            {dataSourceType === 'web' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>최대 깊이</label>
                <input
                  type="number"
                  className={styles.input}
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(parseInt(e.target.value) || 1)}
                  min="1"
                  max="10"
                />
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>User Agent</label>
            <input
              type="text"
              className={styles.input}
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
              placeholder="xgen bot/1.0"
            />
          </div>

          {dataSourceType === 'web' && (
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={followLinks}
                  onChange={(e) => setFollowLinks(e.target.checked)}
                />
                <span>링크 따라가기</span>
              </label>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={respectRobotsTxt}
                  onChange={(e) => setRespectRobotsTxt(e.target.checked)}
                />
                <span>Robots.txt 준수</span>
              </label>
            </div>
          )}
        </section>

        {/* 테스트 */}
        <section className={styles.formSection}>
          <h3 className={styles.sectionTitle}>테스트</h3>
          <button
            className={styles.testButton}
            onClick={handleTestScraping}
            disabled={!endpoint.trim()}
          >
            🧪 테스트 스크래핑 실행
          </button>
          <p className={styles.hint}>
            설정한 옵션으로 실제 스크래핑을 테스트합니다.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AdminScraper;
