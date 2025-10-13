'use client';

import React, { useState, useEffect } from 'react';
import {
    FiRefreshCw,
    FiPlus,
    FiDatabase,
    FiGlobe,
    FiFileText,
    FiImage,
    FiMail,
    FiZap,
    FiPlay,
    FiEdit2,
    FiTrash2,
    FiSearch,
    FiSettings,
    FiActivity,
    FiPackage,
    FiHardDrive,
    FiCheckCircle,
    FiBarChart2
} from 'react-icons/fi';
import styles from '@/app/admin/assets/AdminDataScraper.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import {
    showSuccessToastKo,
    showErrorToastKo
} from '@/app/_common/utils/toastUtilsKo';
import { ScraperConfig, ScraperStats } from './types/scraper.types';
import { mockScraperAPI } from './mocks/scraper.mock';
import AdminScraper from '@/app/admin/components/database/AdminScraper';
import DataLake from '@/app/admin/components/database/DataLake';

type ViewMode = 'dashboard' | 'scraper' | 'datalake';

/**
 * AdminDataScraper 메인 컴포넌트
 * 데이터 스크래핑 시스템의 대시보드
 */
const AdminDataScraper: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
    const [scrapers, setScrapers] = useState<ScraperConfig[]>([]);
    const [stats, setStats] = useState<Record<string, ScraperStats>>({});
    const [loading, setLoading] = useState(true);
    const [selectedScraperId, setSelectedScraperId] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // 스크래퍼 목록 및 통계 로드
    const loadScrapers = async () => {
        try {
            setLoading(true);

            const scrapersList = await mockScraperAPI.getScrapers();
            setScrapers(scrapersList);

            // 각 스크래퍼의 통계 로드
            const statsPromises = scrapersList.map(scraper =>
                mockScraperAPI.getScraperStats(scraper.id)
            );
            const statsResults = await Promise.all(statsPromises);

            const statsMap: Record<string, ScraperStats> = {};
            statsResults.forEach(stat => {
                statsMap[stat.scraperId] = stat;
            });
            setStats(statsMap);

            devLog.log('Scrapers loaded:', scrapersList.length);
        } catch (error) {
            devLog.error('Failed to load scrapers:', error);
            showErrorToastKo('스크래퍼 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadScrapers();
    }, [refreshTrigger]);

    // 스크래퍼 삭제
    const handleDeleteScraper = async (scraperId: string) => {
        if (!confirm('정말로 이 스크래퍼를 삭제하시겠습니까?')) {
            return;
        }

        try {
            await mockScraperAPI.deleteScraper(scraperId);
            showSuccessToastKo('스크래퍼가 삭제되었습니다.');
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            devLog.error('Failed to delete scraper:', error);
            showErrorToastKo('스크래퍼 삭제에 실패했습니다.');
        }
    };

    // 스크래퍼 실행
    const handleRunScraper = async (scraperId: string) => {
        try {
            devLog.log('Running scraper:', scraperId);
            const runLog = await mockScraperAPI.runScraper(scraperId);

            if (runLog.status === 'completed') {
                showSuccessToastKo(
                    `스크래핑 완료! ${runLog.itemsCollected}개의 항목을 수집했습니다.`
                );
                setRefreshTrigger(prev => prev + 1);
            } else {
                showErrorToastKo('스크래핑 중 오류가 발생했습니다.');
            }
        } catch (error) {
            devLog.error('Failed to run scraper:', error);
            showErrorToastKo('스크래퍼 실행에 실패했습니다.');
        }
    };

    // 스크래퍼 편집
    const handleEditScraper = (scraperId: string) => {
        setSelectedScraperId(scraperId);
        setViewMode('scraper');
    };

    // 데이터 타입 아이콘
    const getDataSourceIcon = (type: string) => {
        const iconMap: Record<string, React.ReactNode> = {
            web: <FiGlobe />,
            document: <FiFileText />,
            image: <FiImage />,
            database: <FiDatabase />,
            email: <FiMail />,
            api: <FiZap />
        };
        return iconMap[type] || <FiBarChart2 />;
    };

    // 상태 배지
    const getStatusBadge = (scraperId: string) => {
        const stat = stats[scraperId];
        if (!stat || !stat.lastRunAt) {
            return <span className={styles.statusBadge_idle}>대기중</span>;
        }

        const lastRun = new Date(stat.lastRunAt);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastRun.getTime()) / 1000 / 60;

        if (diffMinutes < 5) {
            return <span className={styles.statusBadge_running}>실행중</span>;
        } else if (stat.successfulRuns > 0 && stat.failedRuns / stat.totalRuns < 0.1) {
            return <span className={styles.statusBadge_success}>정상</span>;
        } else {
            return <span className={styles.statusBadge_warning}>주의필요</span>;
        }
    };

    // 데이터 크기 포맷
    const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    // 날짜 포맷
    const formatDate = (dateString?: string): string => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 새 스크래퍼 생성 완료 핸들러
    const handleScraperCreated = () => {
        setViewMode('dashboard');
        setSelectedScraperId(null);
        setRefreshTrigger(prev => prev + 1);
    };

    // 뷰 모드에 따른 렌더링
    if (viewMode === 'scraper') {
        return (
            <AdminScraper
                scraperId={selectedScraperId}
                onClose={() => {
                    setViewMode('dashboard');
                    setSelectedScraperId(null);
                }}
                onSave={handleScraperCreated}
            />
        );
    }

    if (viewMode === 'datalake') {
        return (
            <DataLake
                onClose={() => setViewMode('dashboard')}
            />
        );
    }

    // 대시보드 렌더링
    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>스크래퍼 목록을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // 전체 통계 계산
    const totalStats = {
        totalScrapers: scrapers.length,
        activeScrapers: Object.values(stats).filter(s => {
            if (!s.lastRunAt) return false;
            const diffMinutes = (new Date().getTime() - new Date(s.lastRunAt).getTime()) / 1000 / 60;
            return diffMinutes < 30;
        }).length,
        totalDataCollected: Object.values(stats).reduce((sum, s) => sum + s.totalDataCollected, 0),
        totalDataSize: Object.values(stats).reduce((sum, s) => sum + s.totalDataSize, 0),
        successRate: (() => {
            const total = Object.values(stats).reduce((sum, s) => sum + s.totalRuns, 0);
            const successful = Object.values(stats).reduce((sum, s) => sum + s.successfulRuns, 0);
            return total > 0 ? ((successful / total) * 100).toFixed(1) : '0';
        })()
    };

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.header}>
                <div className={styles.headerActions}>
                    <button
                        className={styles.secondaryButton}
                        onClick={() => setViewMode('datalake')}
                    >
                        <FiBarChart2 />
                        데이터 레이크 보기
                    </button>
                    <button
                        className={styles.primaryButton}
                        onClick={() => {
                            setSelectedScraperId(null);
                            setViewMode('scraper');
                        }}
                    >
                        <FiPlus />
                        New Scraper
                    </button>
                </div>
                <button
                    className={styles.refreshButton}
                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                >
                    <FiRefreshCw />
                </button>
            </div>

            {/* 통계 카드 */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><FiSettings size={32} /></div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{totalStats.totalScrapers}</div>
                        <div className={styles.statLabel}>총 스크래퍼</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><FiActivity size={32} /></div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{totalStats.activeScrapers}</div>
                        <div className={styles.statLabel}>활성 스크래퍼</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><FiPackage size={32} /></div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{totalStats.totalDataCollected.toLocaleString()}</div>
                        <div className={styles.statLabel}>수집된 항목</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><FiHardDrive size={32} /></div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{formatSize(totalStats.totalDataSize)}</div>
                        <div className={styles.statLabel}>총 데이터 크기</div>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><FiCheckCircle size={32} /></div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{totalStats.successRate}%</div>
                        <div className={styles.statLabel}>성공률</div>
                    </div>
                </div>
            </div>

            {/* 스크래퍼 목록 */}
            <div className={styles.scrapersSection}>
                <div className={styles.sectionHeader}>
                    <h3>스크래퍼 목록</h3>
                    <span className={styles.count}>{scrapers.length}개</span>
                </div>

                {scrapers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}><FiSearch size={64} /></div>
                        <h4>스크래퍼가 없습니다</h4>
                        <p>새 스크래퍼를 생성하여 데이터 수집을 시작하세요.</p>
                        <button
                            className={styles.primaryButton}
                            onClick={() => setViewMode('scraper')}
                        >
                            <FiPlus />
                            첫 스크래퍼 만들기
                        </button>
                    </div>
                ) : (
                    <div className={styles.scraperGrid}>
                        {scrapers.map(scraper => {
                            const stat = stats[scraper.id];
                            return (
                                <div key={scraper.id} className={styles.scraperCard}>
                                    <div className={styles.scraperHeader}>
                                        <div className={styles.scraperTitle}>
                                            <span className={styles.scraperIcon}>
                                                {getDataSourceIcon(scraper.dataSourceType)}
                                            </span>
                                            <h4>{scraper.name}</h4>
                                        </div>
                                        {getStatusBadge(scraper.id)}
                                    </div>

                                    <div className={styles.scraperInfo}>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>엔드포인트:</span>
                                            <span className={styles.infoValue} title={scraper.endpoint}>
                                                {scraper.endpoint}
                                            </span>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>데이터 소스:</span>
                                            <span className={styles.infoValue}>{scraper.dataSourceType}</span>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>파싱 방법:</span>
                                            <span className={styles.infoValue}>{scraper.parsingMethod}</span>
                                        </div>
                                        {scraper.interval && (
                                            <div className={styles.infoRow}>
                                                <span className={styles.infoLabel}>실행 주기:</span>
                                                <span className={styles.infoValue}>{scraper.interval}분마다</span>
                                            </div>
                                        )}
                                    </div>

                                    {stat && (
                                        <div className={styles.scraperStats}>
                                            <div className={styles.statItem}>
                                                <span className={styles.statNumber}>{stat.totalRuns}</span>
                                                <span className={styles.statText}>총 실행</span>
                                            </div>
                                            <div className={styles.statItem}>
                                                <span className={styles.statNumber}>{stat.totalDataCollected.toLocaleString()}</span>
                                                <span className={styles.statText}>수집 항목</span>
                                            </div>
                                            <div className={styles.statItem}>
                                                <span className={styles.statNumber}>{formatSize(stat.totalDataSize)}</span>
                                                <span className={styles.statText}>데이터 크기</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.scraperFooter}>
                                        <div className={styles.lastRun}>
                                            마지막 실행: {formatDate(stat?.lastRunAt)}
                                        </div>
                                        <div className={styles.scraperActions}>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handleRunScraper(scraper.id)}
                                                title="실행"
                                            >
                                                <FiPlay />
                                            </button>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handleEditScraper(scraper.id)}
                                                title="편집"
                                            >
                                                <FiEdit2 />
                                            </button>
                                            <button
                                                className={styles.actionButton_danger}
                                                onClick={() => handleDeleteScraper(scraper.id)}
                                                title="삭제"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDataScraper;
