'use client';
import React, { useState, useEffect } from 'react';
import {
    FiPackage,
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
import styles from '@/app/model/assets/ModelStorageModal.module.scss';
import { getHuggingFaceModels } from '@/app/api/huggingfaceAPI';

interface HuggingFaceModel {
    id: string;
    author: string;
    private: boolean;
    downloads: number;
    created_at: string | null;
    additional_info?: Record<string, any>;
}

interface HuggingFaceModelsData {
    success: boolean;
    models: HuggingFaceModel[];
    error?: string | null;
}

interface ModelStorageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectModel: (modelId: string) => void;
    currentModelId?: string;
}

type SortField = 'date' | 'downloads';
type SortOrder = 'asc' | 'desc';

const ModelStorageModal: React.FC<ModelStorageModalProps> = ({
    isOpen,
    onClose,
    onSelectModel,
    currentModelId = ''
}) => {
    const [models, setModels] = useState<HuggingFaceModelsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const fetchModels = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getHuggingFaceModels();

            console.log('API Response:', data); // 디버깅용

            // API 응답 구조를 안전하게 처리
            let modelsList: HuggingFaceModel[] = [];

            if (data && typeof data === 'object') {
                if ('models' in data && Array.isArray(data.models)) {
                    modelsList = data.models;
                } else if (Array.isArray(data)) {
                    modelsList = data;
                }
            }

            console.log('Processed models:', modelsList); // 디버깅용

            setModels({
                success: true,
                models: modelsList,
                error: null
            });
        } catch (error) {
            console.error('Failed to fetch Hugging Face models:', error);

            // 에러 메시지에 따라 적절한 안내 메시지 설정
            const errorMessage = error instanceof Error ? error.message : 'Hugging Face 모델을 불러오는데 실패했습니다.';

            if (errorMessage.includes('사용자 ID가 설정되지 않았습니다') ||
                errorMessage.includes('허브 토큰이 설정되지 않았습니다') ||
                errorMessage.includes('API가 설정되지 않았거나 사용할 수 없습니다')) {
                setError(errorMessage);
            } else {
                setError('Hugging Face 모델을 불러오는데 실패했습니다.');
            }

            setModels({
                success: false,
                models: [],
                error: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchModels();
        }
    }, [isOpen]);

    const getCurrentModels = () => {
        if (!models || !models.models) return [];

        const modelList = models.models || [];

        // 정렬 적용
        return modelList.sort((a: HuggingFaceModel, b: HuggingFaceModel) => {
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

    const handleModelSelect = (modelId: string) => {
        onSelectModel(modelId);
        onClose();
    };

    const isConfigurationError = (errorMessage: string | null) => {
        if (!errorMessage) return false;
        return errorMessage.includes('사용자 ID가 설정되지 않았습니다') ||
               errorMessage.includes('허브 토큰이 설정되지 않았습니다') ||
               errorMessage.includes('설정이 올바르지 않습니다') ||
               errorMessage.includes('API가 설정되지 않았거나 사용할 수 없습니다');
    };

    const currentModels = getCurrentModels();
    const currentError = models?.error;

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Hugging Face 모델 선택</h2>
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
                        <button
                            className={`${styles.refreshButton} ${loading ? styles.spinning : ''}`}
                            onClick={fetchModels}
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
                            <p>Hugging Face 모델을 불러오는 중...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className={isConfigurationError(error) ? styles.configErrorState : styles.errorState}>
                            <p>{error}</p>
                            <button onClick={fetchModels}>다시 시도</button>
                        </div>
                    )}

                    {/* Current Resource Type Error */}
                    {!loading && !error && currentError && (
                        <div className={isConfigurationError(currentError) ? styles.configErrorState : styles.errorState}>
                            <p>{currentError}</p>
                            <button onClick={fetchModels}>다시 시도</button>
                        </div>
                    )}

                    {/* Models Grid */}
                    {!loading && !error && !currentError && (
                        <div className={styles.modelsGrid}>
                            {currentModels.map((model) => (
                                <div
                                    key={model.id}
                                    className={`${styles.modelCard} ${model.id === currentModelId ? styles.selected : ''}`}
                                    onClick={() => handleModelSelect(model.id)}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.modelIcon}>
                                            <FiPackage />
                                        </div>
                                        <div className={styles.cardActions}>
                                            <div
                                                className={`${styles.status} ${model.private ? styles.statusPrivate : styles.statusPublic}`}
                                            >
                                                {model.private ? <FiLock /> : <FiUnlock />}
                                                {model.private ? '비공개' : '공개'}
                                            </div>
                                            {model.id === currentModelId && (
                                                <div className={styles.selectedIndicator}>
                                                    <FiCheck />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.cardContent}>
                                        <h3 className={styles.modelName}>
                                            {model.id}
                                        </h3>

                                        <div className={styles.modelMeta}>
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
            </div>
        </div>
    );
};

export default ModelStorageModal;
