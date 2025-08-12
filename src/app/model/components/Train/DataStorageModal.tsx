'use client';
import React, { useState, useEffect } from 'react';
import {
    FiDatabase,
    FiRefreshCw,
    FiUser,
    FiClock,
    FiDownload,
    FiLock,
    FiUnlock,
    FiChevronUp,
    FiChevronDown,
    FiX,
    FiCheck,
} from 'react-icons/fi';
import styles from '@/app/model/assets/DataStorageModal.module.scss';
import { getHuggingFaceDatasets } from '@/app/api/huggingfaceAPI';

interface HuggingFaceDataset {
    id: string;
    author: string;
    private: boolean;
    downloads: number;
    created_at: string | null;
    additional_info?: Record<string, any>;
}

interface HuggingFaceDatasetsData {
    success: boolean;
    datasets: HuggingFaceDataset[];
    error?: string | null;
}

interface DataStorageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDataset: (datasetId: string) => void;
    currentDatasetId?: string;
}

type SortField = 'date' | 'downloads';
type SortOrder = 'asc' | 'desc';

const DataStorageModal: React.FC<DataStorageModalProps> = ({
    isOpen,
    onClose,
    onSelectDataset,
    currentDatasetId = ''
}) => {
    const [datasets, setDatasets] = useState<HuggingFaceDatasetsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const fetchDatasets = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getHuggingFaceDatasets();

            console.log('API Response:', data); // 디버깅용

            // API 응답 구조를 안전하게 처리
            let datasetsList: HuggingFaceDataset[] = [];

            if (data && typeof data === 'object') {
                if ('datasets' in data && Array.isArray(data.datasets)) {
                    datasetsList = data.datasets;
                } else if (Array.isArray(data)) {
                    datasetsList = data;
                }
            }

            console.log('Processed datasets:', datasetsList); // 디버깅용

            setDatasets({
                success: true,
                datasets: datasetsList,
                error: null
            });
        } catch (error) {
            console.error('Failed to fetch Hugging Face datasets:', error);

            // 에러 메시지에 따라 적절한 안내 메시지 설정
            const errorMessage = error instanceof Error ? error.message : 'Hugging Face 데이터셋을 불러오는데 실패했습니다.';

            if (errorMessage.includes('사용자 ID가 설정되지 않았습니다') ||
                errorMessage.includes('허브 토큰이 설정되지 않았습니다') ||
                errorMessage.includes('API가 설정되지 않았거나 사용할 수 없습니다')) {
                setError(errorMessage);
            } else {
                setError('Hugging Face 데이터셋을 불러오는데 실패했습니다.');
            }

            setDatasets({
                success: false,
                datasets: [],
                error: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchDatasets();
        }
    }, [isOpen]);

    const getCurrentDatasets = () => {
        if (!datasets || !datasets.datasets) return [];

        const datasetList = datasets.datasets || [];

        // 정렬 적용
        return datasetList.sort((a: HuggingFaceDataset, b: HuggingFaceDataset) => {
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

    const handleDatasetSelect = (datasetId: string) => {
        onSelectDataset(datasetId);
        onClose();
    };

    const isConfigurationError = (errorMessage: string | null) => {
        if (!errorMessage) return false;
        return errorMessage.includes('사용자 ID가 설정되지 않았습니다') ||
               errorMessage.includes('허브 토큰이 설정되지 않았습니다') ||
               errorMessage.includes('설정이 올바르지 않습니다') ||
               errorMessage.includes('API가 설정되지 않았거나 사용할 수 없습니다');
    };

    const currentDatasets = getCurrentDatasets();
    const currentError = datasets?.error;

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Hugging Face 데이터셋 선택</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        title="닫기"
                    >
                        <FiX />
                    </button>
                </div>

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
                        <button
                            className={`${styles.refreshButton} ${loading ? styles.spinning : ''}`}
                            onClick={fetchDatasets}
                            disabled={loading}
                            title="새로고침"
                        >
                            <FiRefreshCw />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className={styles.modalBody}>
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
                            <button onClick={fetchDatasets}>다시 시도</button>
                        </div>
                    )}

                    {/* Current Resource Type Error */}
                    {!loading && !error && currentError && (
                        <div className={isConfigurationError(currentError) ? styles.configErrorState : styles.errorState}>
                            <p>{currentError}</p>
                            <button onClick={fetchDatasets}>다시 시도</button>
                        </div>
                    )}

                    {/* Datasets Grid */}
                    {!loading && !error && !currentError && (
                        <div className={styles.datasetsGrid}>
                            {currentDatasets.map((dataset) => (
                                <div
                                    key={dataset.id}
                                    className={`${styles.datasetCard} ${dataset.id === currentDatasetId ? styles.selected : ''}`}
                                    onClick={() => handleDatasetSelect(dataset.id)}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.datasetIcon}>
                                            <FiDatabase />
                                        </div>
                                        <div className={styles.cardActions}>
                                            <div
                                                className={`${styles.status} ${dataset.private ? styles.statusPrivate : styles.statusPublic}`}
                                            >
                                                {dataset.private ? <FiLock /> : <FiUnlock />}
                                                {dataset.private ? '비공개' : '공개'}
                                            </div>
                                            {dataset.id === currentDatasetId && (
                                                <div className={styles.selectedIndicator}>
                                                    <FiCheck />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.cardContent}>
                                        <h3 className={styles.datasetName}>
                                            {dataset.id}
                                        </h3>

                                        <div className={styles.datasetMeta}>
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
            </div>
        </div>
    );
};

export default DataStorageModal;
