'use client';
import React, { useState, useEffect } from 'react';
import {
    FiDatabase,
    FiUser,
    FiClock,
    FiDownload,
    FiLock,
    FiUnlock,
    FiChevronUp,
    FiChevronDown,
} from 'react-icons/fi';
import ContentArea from '@/app/main/workflowSection/components/ContentArea';
import styles from '@/app/main/dataSection/assets/DataStoragePage.module.scss';
import { getAllHuggingFaceResources } from '@/app/_common/api/huggingfaceAPI';
import DataStorageInfoModal from './modals/DataStorageInfoModal';
import RefreshButton from '@/app/_common/icons/refresh';


interface HuggingFaceDataset {
    id: string;
    author: string;
    private: boolean;
    downloads: number;
    created_at: string | null;
    additional_info?: Record<string, any>;
}

interface HuggingFaceResourcesData {
    success: boolean;
    models: {
        success: boolean;
        data: { models: any[] } | null;
        error: string | null;
    };
    datasets: {
        success: boolean;
        data: { datasets: HuggingFaceDataset[] } | null;
        error: string | null;
    };
}

interface ExtendedDataset extends HuggingFaceDataset {
    version_info?: {
        current_version: number;
        has_lineage: boolean;
        mlflow_runs: string[];
    };
}

type SortField = 'date' | 'downloads';
type SortOrder = 'asc' | 'desc';

const DataStorage: React.FC = () => {
    const [resources, setResources] = useState<HuggingFaceResourcesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedDataset, setSelectedDataset] = useState<HuggingFaceDataset | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchResources = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllHuggingFaceResources();
            setResources(data as HuggingFaceResourcesData);
        } catch (error) {
            console.error('Failed to fetch Hugging Face resources:', error);

            // 에러 메시지에 따라 적절한 안내 메시지 설정
            const errorMessage = error instanceof Error ? error.message : 'Hugging Face 데이터셋을 불러오는데 실패했습니다.';

            if (errorMessage.includes('사용자 ID가 설정되지 않았습니다') ||
                errorMessage.includes('허브 토큰이 설정되지 않았습니다') ||
                errorMessage.includes('API가 설정되지 않았거나 사용할 수 없습니다')) {
                setError(errorMessage);
            } else {
                setError('Hugging Face 데이터셋을 불러오는데 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const getCurrentDatasets = () => {
        if (!resources || !resources.datasets.success || !resources.datasets.data) return [];

        const datasets = resources.datasets.data.datasets;

        // 정렬 적용
        return datasets.sort((a, b) => {
            let compareValue = 0;

            if (sortField === 'date') {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                compareValue = dateB - dateA; // 기본적으로 최신 날짜가 먼저
            } else if (sortField === 'downloads') {
                compareValue = (b.downloads || 0) - (a.downloads || 0); // 기본적으로 다운로드 많은 것이 먼저
            }

            return sortOrder === 'asc' ? -compareValue : compareValue;
        });
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    const getCurrentError = () => {
        if (!resources) return null;
        return resources.datasets.error;
    };

    const isConfigurationError = (errorMessage: string | null) => {
        if (!errorMessage) return false;
        return errorMessage.includes('사용자 ID가 설정되지 않았습니다') ||
               errorMessage.includes('허브 토큰이 설정되지 않았습니다') ||
               errorMessage.includes('설정이 올바르지 않습니다') ||
               errorMessage.includes('API가 설정되지 않았거나 사용할 수 없습니다');
    };

    const currentDatasets = getCurrentDatasets();
    const currentError = getCurrentError();

    const handleDatasetClick = (dataset: HuggingFaceDataset) => {
        setSelectedDataset(dataset);
        setIsModalOpen(true);
        setSelectedDataset({
            ...dataset,
            // version_info: versionInfo
        } as ExtendedDataset);
        setIsModalOpen(true);
    
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDataset(null);
    };

    return (
        <ContentArea
            title="Hugging Face 데이터셋 저장소"
            description="Hugging Face에 저장된 데이터셋을 확인하고 관리하세요."
        >
            <div className={styles.container}>
            {/* Header with Sorting Controls and Actions */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    {!loading && !error && !currentError && currentDatasets.length > 0 && (
                        <div className={styles.sortControls}>
                            <span className={styles.sortLabel}>정렬:</span>
                            <button
                                className={`${styles.sortButton} ${sortField === 'date' ? styles.active : ''}`}
                                onClick={() => handleSort('date')}
                            >
                                <FiClock />
                                날짜
                                {sortField === 'date' && (
                                    sortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                                )}
                            </button>
                            <button
                                className={`${styles.sortButton} ${sortField === 'downloads' ? styles.active : ''}`}
                                onClick={() => handleSort('downloads')}
                            >
                                <FiDownload />
                                다운로드
                                {sortField === 'downloads' && (
                                    sortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.headerActions}>
                    <RefreshButton
                        onClick={fetchResources}
                        loading={loading}
                        disabled={loading}
                        title="새로고침"
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className={styles.loadingState}>
                    <p>Hugging Face 데이터셋을 불러오는 중...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className={isConfigurationError(error) ? styles.configErrorState : styles.errorState}>
                    <p>{error}</p>
                    <button onClick={fetchResources}>다시 시도</button>
                </div>
            )}

            {/* Current Resource Type Error */}
            {!loading && !error && currentError && (
                <div className={isConfigurationError(currentError) ? styles.configErrorState : styles.errorState}>
                    <p>{currentError}</p>
                    <button onClick={fetchResources}>다시 시도</button>
                </div>
            )}

            {/* Resources Grid */}
            {!loading && !error && !currentError && (
                <div className={styles.resourcesGrid}>
                    {currentDatasets.map((dataset) => (
                        <div
                            key={dataset.id}
                            className={styles.resourceCard}
                            onClick={() => handleDatasetClick(dataset)}
                            style={{
                                cursor: 'pointer'
                            }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.resourceIcon}>
                                    <FiDatabase />
                                </div>
                                <div
                                    className={`${styles.status} ${dataset.private ? styles.statusPrivate : styles.statusPublic}`}
                                >
                                    {dataset.private ? <FiLock /> : <FiUnlock />}
                                    {dataset.private ? '비공개' : '공개'}
                                </div>
                            </div>

                            <div className={styles.cardContent}>
                                <h3 className={styles.resourceName}>
                                    {dataset.id}
                                </h3>

                                <div className={styles.resourceMeta}>
                                    <div className={styles.metaItem}>
                                        <FiUser />
                                        <span>{dataset.author || dataset.id.split('/')[0] || 'Unknown'}</span>
                                    </div>
                                    {dataset.created_at && (
                                        <div className={styles.metaItem}>
                                            <FiClock />
                                            <span>
                                                {new Date(dataset.created_at).toLocaleDateString('ko-KR')}
                                            </span>
                                        </div>
                                    )}
                                    <div className={styles.metaItem}>
                                        <FiDownload />
                                        <span>{dataset.downloads?.toLocaleString() || 0} 다운로드</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && !currentError && currentDatasets.length === 0 && (
                <div className={styles.emptyState}>
                    <FiDatabase className={styles.emptyIcon} />
                    <h3>데이터셋이 없습니다</h3>
                    <p>
                        아직 Hugging Face에 데이터셋이 없습니다.
                    </p>
                </div>
            )}
            </div>

            {/* Dataset Info Modal */}
            {selectedDataset && (
                <DataStorageInfoModal
                    dataset={selectedDataset}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                />
            )}
        </ContentArea>
    );
};

export default DataStorage;
