'use client';
import React, { useState, useEffect } from 'react';
import {
    FiDatabase,
    FiPackage,
    FiUser,
    FiClock,
    FiDownload,
    FiTrendingUp,
    FiLock,
    FiUnlock,
    FiChevronUp,
    FiChevronDown,
} from 'react-icons/fi';
import ContentArea from '@/app/main/workflowSection/components/ContentArea';
import styles from '@/app/main/modelSection/assets/StoragePage.module.scss';
import { getAllHuggingFaceResources } from '@/app/_common/api/huggingfaceAPI';
import StorageModelInfoModal from './Storage/StorageModelInfoModal';
import RefreshButton from '@/app/_common/icons/refresh';

interface HuggingFaceModel {
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
        data: { datasets: any[] } | null;
        error: string | null;
    };
}

type SortField = 'date' | 'downloads';
type SortOrder = 'asc' | 'desc';

const StoragePageContent: React.FC = () => {
    const [resources, setResources] = useState<HuggingFaceResourcesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [selectedModel, setSelectedModel] = useState<HuggingFaceModel | null>(null);
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
            const errorMessage = error instanceof Error ? error.message : 'Hugging Face 모델을 불러오는데 실패했습니다.';

            if (errorMessage.includes('사용자 ID가 설정되지 않았습니다') ||
                errorMessage.includes('허브 토큰이 설정되지 않았습니다') ||
                errorMessage.includes('API가 설정되지 않았거나 사용할 수 없습니다')) {
                setError(errorMessage);
            } else {
                setError('Hugging Face 모델을 불러오는데 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const getCurrentModels = () => {
        if (!resources || !resources.models.success || !resources.models.data) return [];

        const models = resources.models.data.models;

        // 정렬 적용
        return models.sort((a, b) => {
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
        return resources.models.error;
    };

    const isConfigurationError = (errorMessage: string | null) => {
        if (!errorMessage) return false;
        return errorMessage.includes('사용자 ID가 설정되지 않았습니다') ||
               errorMessage.includes('허브 토큰이 설정되지 않았습니다') ||
               errorMessage.includes('설정이 올바르지 않습니다') ||
               errorMessage.includes('API가 설정되지 않았거나 사용할 수 없습니다');
    };

    const currentModels = getCurrentModels();
    const currentError = getCurrentError();

    const handleModelClick = (model: HuggingFaceModel) => {
        setSelectedModel(model);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedModel(null);
    };

    return (
        <ContentArea
            title="Hugging Face 모델 저장소"
            description="Hugging Face에 저장된 모델을 확인하고 관리하세요."
        >
            <div className={styles.container}>
            {/* Header with Sorting Controls and Actions */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    {!loading && !error && !currentError && currentModels.length > 0 && (
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
                    <p>Hugging Face 모델을 불러오는 중...</p>
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
                    {currentModels.map((model) => (
                        <div
                            key={model.id}
                            className={styles.resourceCard}
                            onClick={() => handleModelClick(model)}
                            style={{
                                cursor: 'pointer'
                            }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.resourceIcon}>
                                    <FiPackage />
                                </div>
                                <div
                                    className={`${styles.status} ${model.private ? styles.statusPrivate : styles.statusPublic}`}
                                >
                                    {model.private ? <FiLock /> : <FiUnlock />}
                                    {model.private ? '비공개' : '공개'}
                                </div>
                            </div>

                            <div className={styles.cardContent}>
                                <h3 className={styles.resourceName}>
                                    {model.id}
                                </h3>

                                <div className={styles.resourceMeta}>
                                    <div className={styles.metaItem}>
                                        <FiUser />
                                        <span>{model.author || model.id.split('/')[0] || 'Unknown'}</span>
                                    </div>
                                    {model.created_at && (
                                        <div className={styles.metaItem}>
                                            <FiClock />
                                            <span>
                                                {new Date(model.created_at).toLocaleDateString('ko-KR')}
                                            </span>
                                        </div>
                                    )}
                                    <div className={styles.metaItem}>
                                        <FiDownload />
                                        <span>{model.downloads?.toLocaleString() || 0} 다운로드</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && !currentError && currentModels.length === 0 && (
                <div className={styles.emptyState}>
                    <FiPackage className={styles.emptyIcon} />
                    <h3>모델이 없습니다</h3>
                    <p>
                        아직 Hugging Face에 모델이 없습니다.
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
        </ContentArea>
    );
};

export default StoragePageContent;
