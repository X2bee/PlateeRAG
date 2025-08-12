'use client';
import React, { useState, useEffect } from 'react';
import {
    FiDatabase,
    FiPackage,
    FiRefreshCw,
    FiUser,
    FiClock,
    FiDownload,
    FiTrendingUp,
    FiLock,
    FiUnlock,
    FiChevronUp,
    FiChevronDown,
} from 'react-icons/fi';
import ContentArea from '@/app/main/components/ContentArea';
import styles from '@/app/model/assets/StoragePage.module.scss';
import { getAllHuggingFaceResources } from '@/app/api/huggingfaceAPI';
import StorageModelInfoModal from './StorageModelInfoModal';
import StorageDatasetInfoModal from './StorageDatasetInfoModal';

interface HuggingFaceModel {
    id: string;
    author: string;
    private: boolean;
    downloads: number;
    created_at: string | null;
    additional_info?: Record<string, any>;
}

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
        data: { models: HuggingFaceModel[] } | null;
        error: string | null;
    };
    datasets: {
        success: boolean;
        data: { datasets: HuggingFaceDataset[] } | null;
        error: string | null;
    };
}

type SortField = 'date' | 'downloads';
type SortOrder = 'asc' | 'desc';

const StoragePageContent: React.FC = () => {
    const [resourceType, setResourceType] = useState<'models' | 'datasets'>('models');
    const [resources, setResources] = useState<HuggingFaceResourcesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedModel, setSelectedModel] = useState<HuggingFaceModel | null>(null);
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
            const errorMessage = error instanceof Error ? error.message : 'Hugging Face 리소스를 불러오는데 실패했습니다.';

            if (errorMessage.includes('사용자 ID가 설정되지 않았습니다') ||
                errorMessage.includes('허브 토큰이 설정되지 않았습니다') ||
                errorMessage.includes('API가 설정되지 않았거나 사용할 수 없습니다')) {
                setError(errorMessage);
            } else {
                setError('Hugging Face 리소스를 불러오는데 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const getCurrentResources = () => {
        if (!resources) return [];

        let resourceList = [];
        if (resourceType === 'models') {
            resourceList = resources.models.success && resources.models.data
                ? resources.models.data.models
                : [];
        } else {
            resourceList = resources.datasets.success && resources.datasets.data
                ? resources.datasets.data.datasets
                : [];
        }

        // 정렬 적용
        return resourceList.sort((a, b) => {
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

        let currentError = null;
        if (resourceType === 'models') {
            currentError = resources.models.error;
        } else {
            currentError = resources.datasets.error;
        }

        return currentError;
    };

    const isConfigurationError = (errorMessage: string | null) => {
        if (!errorMessage) return false;
        return errorMessage.includes('사용자 ID가 설정되지 않았습니다') ||
               errorMessage.includes('허브 토큰이 설정되지 않았습니다') ||
               errorMessage.includes('설정이 올바르지 않습니다') ||
               errorMessage.includes('API가 설정되지 않았거나 사용할 수 없습니다');
    };

    const currentResources = getCurrentResources();
    const currentError = getCurrentError();

    const handleModelClick = (model: HuggingFaceModel) => {
        setSelectedModel(model);
        setSelectedDataset(null);
        setIsModalOpen(true);
    };

    const handleDatasetClick = (dataset: HuggingFaceDataset) => {
        setSelectedDataset(dataset);
        setSelectedModel(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedModel(null);
        setSelectedDataset(null);
    };

    return (
        <ContentArea
            title="Hugging Face 저장소"
            description="Hugging Face에 저장된 모델과 데이터셋을 확인하고 관리하세요."
        >
            <div className={styles.container}>
            {/* Header with Sorting Controls and Actions */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    {!loading && !error && !currentError && currentResources.length > 0 && (
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
                    <div className={styles.filters}>
                        <button
                            onClick={() => setResourceType('models')}
                            className={`${styles.filterButton} ${resourceType === 'models' ? styles.active : ''}`}
                        >
                            모델
                        </button>
                        <button
                            onClick={() => setResourceType('datasets')}
                            className={`${styles.filterButton} ${resourceType === 'datasets' ? styles.active : ''}`}
                        >
                            데이터셋
                        </button>
                    </div>

                    <button
                        className={`${styles.refreshButton} ${loading ? styles.spinning : ''}`}
                        onClick={fetchResources}
                        disabled={loading}
                        title="새로고침"
                    >
                        <FiRefreshCw />
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className={styles.loadingState}>
                    <p>Hugging Face 리소스를 불러오는 중...</p>
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
                    {currentResources.map((resource) => (
                        <div
                            key={resource.id}
                            className={styles.resourceCard}
                            onClick={() => {
                                if (resourceType === 'models') {
                                    handleModelClick(resource as HuggingFaceModel);
                                } else {
                                    handleDatasetClick(resource as HuggingFaceDataset);
                                }
                            }}
                            style={{
                                cursor: 'pointer'
                            }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.resourceIcon}>
                                    {resourceType === 'models' ? <FiPackage /> : <FiDatabase />}
                                </div>
                                <div
                                    className={`${styles.status} ${resource.private ? styles.statusPrivate : styles.statusPublic}`}
                                >
                                    {resource.private ? <FiLock /> : <FiUnlock />}
                                    {resource.private ? '비공개' : '공개'}
                                </div>
                            </div>

                            <div className={styles.cardContent}>
                                <h3 className={styles.resourceName}>
                                    {resource.id}
                                </h3>

                                <div className={styles.resourceMeta}>
                                    <div className={styles.metaItem}>
                                        <FiUser />
                                        <span>{resource.author || resource.id.split('/')[0] || 'Unknown'}</span>
                                    </div>
                                    {resource.created_at && (
                                        <div className={styles.metaItem}>
                                            <FiClock />
                                            <span>
                                                {new Date(resource.created_at).toLocaleDateString('ko-KR')}
                                            </span>
                                        </div>
                                    )}
                                    <div className={styles.metaItem}>
                                        <FiDownload />
                                        <span>{resource.downloads?.toLocaleString() || 0} 다운로드</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && !currentError && currentResources.length === 0 && (
                <div className={styles.emptyState}>
                    {resourceType === 'models' ? <FiPackage className={styles.emptyIcon} /> : <FiDatabase className={styles.emptyIcon} />}
                    <h3>{resourceType === 'models' ? '모델이 없습니다' : '데이터셋이 없습니다'}</h3>
                    <p>
                        아직 Hugging Face에 {resourceType === 'models' ? '모델' : '데이터셋'}이 없습니다.
                    </p>
                </div>
            )}
            </div>

            {/* Model Info Modal */}
            {selectedModel && (
                <StorageModelInfoModal
                    model={selectedModel}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                />
            )}

            {/* Dataset Info Modal */}
            {selectedDataset && (
                <StorageDatasetInfoModal
                    dataset={selectedDataset}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                />
            )}
        </ContentArea>
    );
};

export default StoragePageContent;
