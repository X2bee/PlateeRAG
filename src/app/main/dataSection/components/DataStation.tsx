'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_common/components/CookieProvider';
import {
    FiDatabase,
    FiPlus,
    FiTrash2,
    FiPlay,
    FiUser,
    FiCpu,
    FiHardDrive,
    FiClock,
    FiFolder,
    FiGitBranch,
    FiLayers,
} from 'react-icons/fi';
import RefreshButton from '@/app/_common/icons/refresh';
import {
    createDataManager,
    listDataManagers,
    deleteDataManager,
    getDataManagerStatus,
    formatResourceUsage,
} from '@/app/_common/api/dataManagerAPI';
import {
    showSuccessToastKo,
    showErrorToastKo,
    showDeleteSuccessToastKo,
    showDeleteErrorToastKo,
    showDeleteConfirmToastKo,
} from '@/app/_common/utils/toastUtilsKo';
import DataProcessor from './DataProcessor';
import styles from '../assets/DataStation.module.scss';

interface DataManager {
    manager_id: string;
    user_id: string;
    user_name: string;
    created_at: string;
    is_active: boolean;
    current_instance_memory_mb: number;
    initial_instance_memory_mb: number;
    peak_instance_memory_mb: number;
    memory_growth_mb: number;
    dataset_memory_mb: number;
    has_dataset: boolean;
    memory_distribution: {
        dataset_percent: number;
        other_percent: number;
    };
    // 버전 관리 필드
    current_version?: number;
    dataset_id?: string;
    dataset_load_count?: number;  // 추가
    version_management_enabled?: boolean;
    status?: 'active' | 'inactive' | 'error';
}

interface DataManagerResponse {
    managers: { [key: string]: DataManager };
    total: number;
}

const DataStation: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [dataManagers, setDataManagers] = useState<DataManager[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedManager, setSelectedManager] = useState<DataManager | null>(null);

    const fetchDataManagers = async () => {
        try {
            setLoading(true);
            setError(null);
            const managersData = await listDataManagers() as DataManagerResponse;

            let managersArray: DataManager[] = [];
            if (managersData.managers && typeof managersData.managers === 'object') {
                managersArray = Object.values(managersData.managers).map(manager => ({
                    ...manager,
                    status: manager.is_active ? 'active' : 'inactive'
                }));
            }

            setDataManagers(managersArray);
        } catch (error) {
            console.error('Failed to fetch data managers:', error);
            setError('데이터 매니저를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDataManagers();
        setRefreshing(false);
    };

    const handleCreateManager = async () => {
        try {
            setIsCreating(true);
            const newManager = await createDataManager();
            showSuccessToastKo('새로운 데이터 매니저가 생성되었습니다!');
            await fetchDataManagers();
        } catch (error) {
            console.error('Failed to create data manager:', error);
            showErrorToastKo(`데이터 매니저 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteManager = (manager: DataManager) => {
        showDeleteConfirmToastKo({
            title: '데이터 매니저 삭제',
            message: `"${manager.manager_id.slice(0, 8)}..." 데이터 매니저를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
            itemName: manager.manager_id.slice(0, 8) + '...',
            onConfirm: async () => {
                try {
                    await deleteDataManager(manager.manager_id);
                    showDeleteSuccessToastKo({
                        itemName: manager.manager_id.slice(0, 8) + '...',
                        itemType: '데이터 매니저',
                    });
                    fetchDataManagers();
                } catch (error) {
                    console.error('Failed to delete data manager:', error);
                    showDeleteErrorToastKo({
                        itemName: manager.manager_id.slice(0, 8) + '...',
                        itemType: '데이터 매니저',
                        error: error instanceof Error ? error : 'Unknown error',
                    });
                }
            }
        });
    };

    const handleUseManager = (manager: DataManager) => {
        setSelectedManager(manager);
    };

    const handleBackToStation = () => {
        setSelectedManager(null);
        fetchDataManagers();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return styles.statusActive;
            case 'inactive':
                return styles.statusInactive;
            case 'error':
                return styles.statusError;
            default:
                return styles.statusInactive;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return '활성';
            case 'inactive':
                return '비활성';
            case 'error':
                return '오류';
            default:
                return '비활성';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR');
    };

    // 데이터셋 버전 표시 헬퍼 함수
    const getDatasetVersionLabel = (loadCount?: number) => {
        if (!loadCount || loadCount === 0) return null;
        if (loadCount === 1) return 'v1 (초기)';
        return `v${loadCount}`;
    };

    useEffect(() => {
        fetchDataManagers();
    }, []);

    if (selectedManager && user) {
        return (
            <DataProcessor
                managerId={selectedManager.manager_id}
                userId={user.user_id.toString()}
                onBack={handleBackToStation}
            />
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerActions}>
                    <button
                        className={styles.createButton}
                        onClick={handleCreateManager}
                        disabled={isCreating}
                    >
                        <FiPlus />
                        {isCreating ? '생성 중...' : '새 데이터 매니저'}
                    </button>

                    <RefreshButton
                        onClick={handleRefresh}
                        loading={refreshing}
                        disabled={refreshing}
                        title="새로고침"
                    />
                </div>
            </div>

            {loading && (
                <div className={styles.loadingState}>
                    <p>데이터 매니저를 불러오는 중...</p>
                </div>
            )}

            {error && (
                <div className={styles.errorState}>
                    <p>{error}</p>
                    <button onClick={fetchDataManagers}>다시 시도</button>
                </div>
            )}

            {!loading && !error && (
                <div className={styles.managersGrid}>
                    {dataManagers.map((manager) => (
                        <div
                            key={manager.manager_id}
                            className={styles.managerCard}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.managerIcon}>
                                    <FiDatabase />
                                </div>
                                <div className={styles.statusContainer}>
                                    <span className={`${styles.status} ${getStatusColor(manager.status || 'inactive')}`}>
                                        {getStatusText(manager.status || 'inactive')}
                                    </span>
                                </div>
                            </div>

                            <div className={styles.cardContent}>
                                <div className={styles.managerDescription}>
                                    <strong>ID:</strong> {manager.manager_id.slice(0, 20)}...
                                </div>

                                {/* 데이터셋 로드 버전 정보 */}
                                {manager.has_dataset && manager.dataset_load_count && manager.dataset_load_count > 0 && (
                                    <div className={styles.datasetVersionInfo}>
                                        <div className={styles.versionBadgeRow}>
                                            <span className={styles.datasetVersionBadge}>
                                                <FiLayers />
                                                {getDatasetVersionLabel(manager.dataset_load_count)}
                                            </span>
                                            {manager.dataset_load_count > 1 && (
                                                <span className={styles.reloadedBadge}>
                                                    재업로드됨
                                                </span>
                                            )}
                                        </div>
                                        {manager.dataset_id && (
                                            <span className={styles.datasetId}>
                                                {manager.dataset_id.substring(0, 30)}...
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* 버전 관리 정보 */}
                                {manager.version_management_enabled && (
                                    <div className={styles.versionInfo}>
                                        <span className={styles.versionBadge}>
                                            <FiGitBranch />
                                            변경 이력: v{manager.current_version || 0}
                                        </span>
                                    </div>
                                )}

                                {/* 메모리 성장 정보 */}
                                {manager.memory_growth_mb > 0.001 && (
                                    <div className={styles.memoryGrowth}>
                                        <span className={styles.growthLabel}>메모리 증가:</span>
                                        <span className={styles.growthValue}>
                                            +{manager.memory_growth_mb.toFixed(3)}MB
                                        </span>
                                    </div>
                                )}

                                <div className={styles.managerMeta}>
                                    <div className={styles.metaItem}>
                                        <FiUser />
                                        <span>{manager.user_name}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <FiClock />
                                        <span>{formatDate(manager.created_at)}</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <FiHardDrive />
                                        <span>현재: {manager.current_instance_memory_mb.toFixed(3)}MB</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <FiDatabase />
                                        <span>최대: {manager.peak_instance_memory_mb.toFixed(3)}MB</span>
                                    </div>
                                    {manager.has_dataset && (
                                        <div className={styles.metaItem}>
                                            <FiFolder />
                                            <span>데이터셋: {manager.dataset_memory_mb.toFixed(3)}MB</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                            {(manager.is_active || manager.has_dataset) ? (
                                <button
                                    className={styles.actionButton}
                                    onClick={() => handleUseManager(manager)}
                                    title={manager.is_active ? "데이터 매니저 사용" : "저장소에서 로드 후 사용"}
                                >
                                    <FiPlay />
                                    {!manager.is_active && manager.has_dataset && (
                                        <span className={styles.loadIndicator}>📦</span>
                                    )}
                                </button>
                            ) : (
                                <div className={styles.inactiveMessage}>
                                    사용 불가
                                </div>
                                    )}

                                {user && String(manager.user_id) === String(user.user_id) && (
                                    <button
                                        className={`${styles.actionButton} ${styles.danger}`}
                                        onClick={() => handleDeleteManager(manager)}
                                        title="데이터 매니저 삭제"
                                    >
                                        <FiTrash2 />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && dataManagers.length === 0 && (
                <div className={styles.emptyState}>
                    <FiDatabase className={styles.emptyIcon} />
                    <h3>데이터 스테이션에 오신 것을 환영합니다!</h3>
                    <p>
                        첫 번째 데이터 매니저를 생성하고 데이터 관리를 시작해보세요.
                        <br />
                        강력한 데이터 처리 환경이 기다리고 있습니다.
                    </p>
                    <button
                        className={styles.startButton}
                        onClick={handleCreateManager}
                        disabled={isCreating}
                    >
                        <FiPlus />
                        {isCreating ? '생성 중...' : '시작하기'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default DataStation;