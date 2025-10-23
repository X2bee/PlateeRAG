'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/_common/assets/DocumentFileModal.module.scss';
import { uploadDocument } from '@/app/_common/api/rag/retrievalAPI';
import { getEmbeddingConfigStatus } from '@/app/_common/api/rag/embeddingAPI';
import { useDocumentFileModal } from '@/app/_common/contexts/DocumentFileModalContext';
import RepositoryUploadTab from './RepositoryUploadTab';

interface UploadProgress {
    fileName: string;
    status: 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
    completedAt?: number;  // 완료 시간 타임스탬프
}

interface EmbeddingConfig {
    client_initialized: boolean;
    client_available: boolean;
    provider_info: {
        provider: string;
        model: string;
        dimension: number;
        api_key_configured: boolean;
        available: boolean;
    };
}

const GlobalDocumentFileModal: React.FC = () => {
    const {
        isOpen,
        selectedCollection,
        currentFolder,
        isFolderUpload,
        closeModal,
        onUploadComplete
    } = useDocumentFileModal();

    const [activeTab, setActiveTab] = useState<'file' | 'repository'>('file');
    const [chunkSize, setChunkSize] = useState(4000);
    const [overlapSize, setOverlapSize] = useState(1000);
    const [processType, setProcessType] = useState<string>('text');
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // Embedding 관련 상태
    const [embeddingConfig, setEmbeddingConfig] = useState<EmbeddingConfig | null>(null);
    const [embeddingLoading, setEmbeddingLoading] = useState(true);
    const [dimensionMismatch, setDimensionMismatch] = useState(false);
    const [modelMismatch, setModelMismatch] = useState(false);
    const [ignoreDimensionMismatch, setIgnoreDimensionMismatch] = useState(false);
    const [ignoreModelMismatch, setIgnoreModelMismatch] = useState(false);

    // 로컬 스토리지 키
    const STORAGE_KEY = 'global_upload_state';

    // 컴포넌트 마운트 시 저장된 상태 복원
    useEffect(() => {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.uploadProgress && parsed.uploadProgress.length > 0) {
                    setUploadProgress(parsed.uploadProgress);
                    setChunkSize(parsed.chunkSize || 4000);
                    setOverlapSize(parsed.overlapSize || 1000);
                    setProcessType(parsed.processType || 'text');
                    setIsMinimized(parsed.isMinimized || false);
                    const now = Date.now();
                    const MAX_AGE = 10 * 60 * 1000; // 10분


                    // 저장된 시간이 10분 이상 지났으면 무시
                    if (parsed.timestamp && (now - parsed.timestamp) > MAX_AGE) {
                        console.log('Clearing old upload state (older than 10 minutes)');
                        localStorage.removeItem(STORAGE_KEY);
                        return;
                    }

                    // uploading 상태인데 completedAt이 없거나 5초 이상 지난 항목은 error로 변경
                    const cleanedProgress = parsed.uploadProgress.map((item: UploadProgress) => {
                        if (item.status === 'uploading') {
                            // completedAt이 없으면 오래된 업로드로 간주
                            if (!item.completedAt) {
                                return {
                                    ...item,
                                    status: 'error' as const,
                                    error: '업로드가 중단되었습니다',
                                    completedAt: now
                                };
                            }
                        }
                        return item;
                    });

                    // 완료된 작업 중 5초 이상 지난 것은 제거
                    const filteredProgress = cleanedProgress.filter((item: UploadProgress) => {
                        if (item.status === 'uploading') return true;
                        if (!item.completedAt) return true;
                        return (now - item.completedAt) < 5000;
                    });

                    // 남은 항목이 있으면 복원
                    if (filteredProgress.length > 0) {
                        setUploadProgress(filteredProgress);
                        setChunkSize(parsed.chunkSize || 4000);
                        setOverlapSize(parsed.overlapSize || 1000);
                        setProcessType(parsed.processType || 'default');
                        setIsMinimized(parsed.isMinimized || false);

                        // 실제 업로드 중인 항목이 있으면 loading 상태
                        const hasUploading = filteredProgress.some((item: UploadProgress) => item.status === 'uploading');
                        setLoading(hasUploading);
                    } else {
                        // 모든 항목이 필터링되었으면 localStorage 정리
                        localStorage.removeItem(STORAGE_KEY);
                    }
                }
            } catch (error) {
                console.error('Failed to restore upload state:', error);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    // Embedding 설정 로드
    useEffect(() => {
        const loadEmbeddingConfig = async () => {
            try {
                setEmbeddingLoading(true);
                const config = await getEmbeddingConfigStatus() as EmbeddingConfig;
                setEmbeddingConfig(config);

                // 차원 불일치 체크
                if (selectedCollection && config.provider_info.dimension !== selectedCollection.vector_size) {
                    setDimensionMismatch(true);
                } else {
                    setDimensionMismatch(false);
                }

                // 모델 불일치 체크
                if (selectedCollection && selectedCollection.init_embedding_model &&
                    config.provider_info.model !== selectedCollection.init_embedding_model) {
                    setModelMismatch(true);
                } else {
                    setModelMismatch(false);
                }
            } catch (error) {
                setError('Embedding 설정을 불러오는데 실패했습니다.');
            } finally {
                setEmbeddingLoading(false);
            }
        };

        if (isOpen && selectedCollection) {
            loadEmbeddingConfig();
        }
    }, [isOpen, selectedCollection]);

    // 상태 변경 시 로컬 스토리지에 저장
    useEffect(() => {
        if (uploadProgress.length > 0) {
            const stateToSave = {
                uploadProgress,
                chunkSize,
                overlapSize,
                processType,
                isMinimized,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [uploadProgress, chunkSize, overlapSize, processType, isMinimized]);

    // 완료된 업로드 작업 자동 정리 (5초 후)
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            setUploadProgress(prev => {
                const now = Date.now();
                const CLEANUP_DELAY = 5000; // 5초

                // 완료/에러 상태이고 5초 이상 경과한 작업 제거
                const filtered = prev.filter(item => {
                    if (item.status === 'uploading') return true;
                    if (!item.completedAt) return true;
                    return (now - item.completedAt) < CLEANUP_DELAY;
                });

                return filtered;
            });
        }, 1000); // 1초마다 체크

        return () => clearInterval(cleanupInterval);
    }, []);

    const handleClose = () => {
        // 업로드 중이면 최소화
        if (loading && uploadProgress.some(item => item.status === 'uploading')) {
            setIsMinimized(true);
        } else {
            // 완전히 초기화
            resetModal();
            closeModal();
        }
    };

    const resetModal = () => {
        setChunkSize(4000);
        setOverlapSize(1000);
        setProcessType('text');
        setUploadProgress([]);
        setError(null);
        setIsMinimized(false);
        setIsCompleted(false);
        setLoading(false);
        localStorage.removeItem(STORAGE_KEY);
    };

    const handleFileUpload = async (files: FileList, isFolder: boolean = false) => {
        if (!selectedCollection) {
            setError('컬렉션을 먼저 선택해주세요.');
            return;
        }

        // 차원 불일치 체크
        if (dimensionMismatch && !ignoreDimensionMismatch) {
            setError('벡터 차원이 일치하지 않습니다. 설정을 확인하거나 "차원 불일치 무시" 옵션을 체크해주세요.');
            return;
        }

        // 모델 불일치 체크
        if (modelMismatch && !ignoreModelMismatch) {
            setError('임베딩 모델이 일치하지 않습니다. 설정을 확인하거나 "모델 불일치 무시" 옵션을 체크해주세요.');
            return;
        }

        const fileArray = Array.from(files);
        const initialProgress: UploadProgress[] = fileArray.map(file => ({
            fileName: file.name,
            status: 'uploading',
            progress: 0
        }));

        setUploadProgress(initialProgress);
        setLoading(true);
        setError(null);

        try {
            if (isFolder) {
                // 폴더 업로드 - 순차 처리
                for (let index = 0; index < fileArray.length; index++) {
                    const file = fileArray[index];

                    try {
                        // 진행 상태 업데이트
                        setUploadProgress(prev => prev.map((item, idx) =>
                            idx === index ? { ...item, progress: 10 } : item
                        ));

                        const relativePath = file.webkitRelativePath || file.name;
                        const folderPath = relativePath.substring(0, relativePath.lastIndexOf('/')) || '';

                        const metadata = {
                            upload_type: 'folder',
                            folder_path: folderPath,
                            directory_full_path: currentFolder?.full_path || `/${selectedCollection.collection_make_name}`,
                            relative_path: relativePath,
                            original_name: file.name,
                            current_index: index + 1,
                            total_files: fileArray.length,
                            process_type: processType
                        };

                        setUploadProgress(prev => prev.map((item, idx) =>
                            idx === index ? { ...item, progress: 50 } : item
                        ));

                        await uploadDocument(
                            file,
                            selectedCollection.collection_name,
                            chunkSize,
                            overlapSize,
                            metadata,
                            processType
                        );

                        setUploadProgress(prev => prev.map((item, idx) =>
                            idx === index ? { ...item, status: 'success' as const, progress: 100, completedAt: Date.now() } : item
                        ));

                    } catch (error) {
                        setUploadProgress(prev => prev.map((item, idx) =>
                            idx === index ? {
                                ...item,
                                status: 'error' as const,
                                progress: 0,
                                error: error instanceof Error ? error.message : '업로드 실패',
                                completedAt: Date.now()
                            } : item
                        ));
                        console.error(`Failed to upload file ${file.name}:`, error);
                    }

                    if (index < fileArray.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            } else {
                // 단일 파일 업로드
                const file = fileArray[0];
                try {
                    setUploadProgress(prev => prev.map((item, index) =>
                        index === 0 ? { ...item, progress: 50 } : item
                    ));

                    await uploadDocument(
                        file,
                        selectedCollection.collection_name,
                        chunkSize,
                        overlapSize,
                        {
                            upload_type: 'single',
                            directory_full_path: currentFolder?.full_path || `/${selectedCollection.collection_make_name}`,
                            process_type: processType
                        },
                        processType
                    );

                    setUploadProgress(prev => prev.map((item, index) =>
                        index === 0 ? { ...item, status: 'success' as const, progress: 100, completedAt: Date.now() } : item
                    ));

                } catch (err) {
                    setUploadProgress(prev => prev.map((item, index) =>
                        index === 0 ? {
                            ...item,
                            status: 'error' as const,
                            progress: 0,
                            error: '업로드 실패',
                            completedAt: Date.now()
                        } : item
                    ));
                    console.error(`Failed to upload file ${file.name}:`, err);
                    setError('파일 업로드에 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('Upload process failed:', error);
            setError('업로드 처리 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }

        // 업로드 완료 확인
        setTimeout(() => {
            setUploadProgress(currentProgress => {
                const allCompleted = currentProgress.every(item => item.status !== 'uploading');

                if (allCompleted) {
                    setIsCompleted(true);

                    // 업로드 완료 후 콜백 호출 (문서 목록 갱신) - 다음 이벤트 루프에서 실행
                    setTimeout(() => {
                        if (onUploadComplete) {
                            onUploadComplete();
                        }
                    }, 0);

                    // 3초 후 자동 닫기
                    setTimeout(() => {
                        resetModal();
                        closeModal();
                    }, 3000);
                }

                return currentProgress;
            });
        }, 500);
    };

    const handleConfirmChunkSettings = () => {
        const input = document.createElement('input');
        input.type = 'file';

        if (isFolderUpload) {
            input.webkitdirectory = true;
            input.multiple = true;
        }

        input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) handleFileUpload(files, isFolderUpload);
        };
        input.click();
    };

    const handleReopenFromMinimized = () => {
        setIsMinimized(false);
    };

    // 최소화된 버튼 렌더링
    if (isMinimized && uploadProgress.length > 0) {
        const activeUploads = uploadProgress.filter(item => item.status === 'uploading').length;
        const totalUploads = uploadProgress.length;
        const hasActiveUpload = activeUploads > 0;

        return (
            <div className={styles.minimizedButton} onClick={handleReopenFromMinimized}>
                <span className={styles.uploadIcon}>📤</span>
                <span className={styles.uploadText}>
                    {hasActiveUpload
                        ? `업로드 중 (${activeUploads}/${totalUploads})`
                        : `업로드 완료 (${totalUploads})`
                    }
                </span>
            </div>
        );
    }

    if (!isOpen) return null;

    const handleRepositoryUploadStart = () => {
        setLoading(true);
        setError(null);
    };

    const handleRepositoryUploadProgress = (progress: UploadProgress) => {
        setUploadProgress([progress]);
    };

    const handleRepositoryUploadComplete = () => {
        setLoading(false);
        setIsCompleted(true);

        // 업로드 완료 후 콜백 호출
        setTimeout(() => {
            if (onUploadComplete) {
                onUploadComplete();
            }
        }, 0);

        // 3초 후 자동 닫기
        setTimeout(() => {
            resetModal();
            closeModal();
        }, 3000);
    };

    const handleRepositoryError = (errorMessage: string) => {
        setError(errorMessage);
        setLoading(false);
    };

    const modalContent = (
        <div className={styles.modalBackdrop} onClick={handleClose}>
            <div className={`${styles.modalContent} ${styles.wideModal}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.headerTop}>
                        <div className={styles.titleSection}>
                            <h3>📤 문서 업로드</h3>
                            <button
                                className={styles.closeButton}
                                onClick={handleClose}
                                aria-label="닫기"
                            >
                                ✕
                            </button>
                        </div>
                        <div className={styles.collectionInfoCompact}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>컬렉션</span>
                                <span className={styles.infoValue}>{selectedCollection?.collection_make_name}</span>
                            </div>
                            <div className={styles.infoDivider}>•</div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>폴더</span>
                                <span className={styles.infoValue}>{currentFolder?.full_path || `/${selectedCollection?.collection_make_name}`}</span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.tabContainer}>
                        <button
                            className={`${styles.tab} ${activeTab === 'file' ? styles.active : ''}`}
                            onClick={() => setActiveTab('file')}
                        >
                            <span className={styles.tabIcon}>📄</span>
                            <span className={styles.tabLabel}>파일 업로드</span>
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'repository' ? styles.active : ''}`}
                            onClick={() => setActiveTab('repository')}
                        >
                            <span className={styles.tabIcon}>📦</span>
                            <span className={styles.tabLabel}>GitLab 레포지토리</span>
                        </button>
                    </div>
                </div>

                <div className={styles.modalBody}>
                    {activeTab === 'repository' ? (
                        /* 레포지토리 업로드 탭 */
                        <div className={styles.fullPanel}>
                            {error && <div className={styles.error}>{error}</div>}

                            {/* 업로드 완료 메시지 */}
                            {isCompleted && (
                                <div className={styles.completedMessage}>
                                    <span className={styles.completedIcon}>✅</span>
                                    <span>업로드가 완료되었습니다! 3초 후에 자동으로 닫힙니다.</span>
                                </div>
                            )}

                            {/* 업로드 진행 상태 */}
                            {uploadProgress.length > 0 && (
                                <div className={styles.uploadProgressContainer}>
                                    <div className={styles.progressHeader}>
                                        <h4>업로드 진행 상태</h4>
                                    </div>
                                    <div className={styles.progressList}>
                                        {uploadProgress.map((item, index) => (
                                            <div key={index} className={`${styles.progressItem} ${styles[item.status]}`}>
                                                <div className={styles.fileInfo}>
                                                    <span className={styles.fileName} title={item.fileName}>
                                                        {item.fileName}
                                                    </span>
                                                    {item.status === 'uploading' && (
                                                        <span className={styles.progressPercent}>
                                                            {item.progress}%
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={styles.progressStatus}>
                                                    {item.status === 'uploading' && (
                                                        <div className={styles.progressBar}>
                                                            <div
                                                                className={styles.progressFill}
                                                                style={{ width: `${item.progress}%` }}
                                                            ></div>
                                                        </div>
                                                    )}
                                                    <span className={`${styles.statusText} ${styles[item.status]}`}>
                                                        {item.status === 'uploading' && '📤 업로드 중...'}
                                                        {item.status === 'success' && '✅ 완료'}
                                                        {item.status === 'error' && `❌ ${item.error || '실패'}`}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <RepositoryUploadTab
                                selectedCollection={selectedCollection}
                                currentFolder={currentFolder}
                                chunkSize={chunkSize}
                                overlapSize={overlapSize}
                                onUploadStart={handleRepositoryUploadStart}
                                onUploadProgress={handleRepositoryUploadProgress}
                                onUploadComplete={handleRepositoryUploadComplete}
                                onError={handleRepositoryError}
                            />
                        </div>
                    ) : (
                        /* 파일 업로드 탭 */
                        <>
                    {/* 왼쪽: Embedding 정보 */}
                    <div className={styles.leftPanel}>
                        <div className={styles.embeddingInfo}>
                            <h4>현재 Embedding 설정</h4>
                            {embeddingLoading ? (
                                <div className={styles.loadingText}>설정 로드 중...</div>
                            ) : embeddingConfig ? (
                                <div className={styles.embeddingDetails}>
                                    <div className={styles.infoRow}>
                                        <label>Provider:</label>
                                        <span className={styles.providerName}>
                                            {embeddingConfig.provider_info.provider}
                                        </span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <label>Embedding Model:</label>
                                        <span className={`${styles.modelName} ${modelMismatch ? styles.mismatch : ''}`}>
                                            {embeddingConfig.provider_info.model}
                                        </span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <label>Dimension:</label>
                                        <span className={`${styles.dimension} ${dimensionMismatch ? styles.mismatch : ''}`}>
                                            {embeddingConfig.provider_info.dimension}
                                        </span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <label>Embedding Model (Collection):</label>
                                        <span className={`${styles.modelName} ${modelMismatch ? styles.mismatch : ''}`}>
                                            {selectedCollection?.init_embedding_model || 'N/A'}
                                        </span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <label>Dimension (Collection):</label>
                                        <span className={`${styles.dimension} ${dimensionMismatch ? styles.mismatch : ''}`}>
                                            {selectedCollection?.vector_size || 'N/A'}
                                        </span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <label>상태:</label>
                                        <span className={`${styles.status} ${embeddingConfig.client_available && embeddingConfig.provider_info.available ? styles.available : styles.unavailable}`}>
                                            {embeddingConfig.client_available && embeddingConfig.provider_info.available ? '✅ 사용 가능' : '❌ 사용 불가'}
                                        </span>
                                    </div>

                                    {/* 차원 불일치 경고 */}
                                    {dimensionMismatch && (
                                        <div className={styles.warningSection}>
                                            <div className={styles.warningMessage}>
                                                벡터 차원이 일치하지 않습니다!
                                                <br />
                                                Model: {embeddingConfig.provider_info.dimension} 차원
                                                <br />
                                                Collection: {selectedCollection?.vector_size} 차원
                                            </div>
                                            <label className={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={ignoreDimensionMismatch}
                                                    onChange={(e) => setIgnoreDimensionMismatch(e.target.checked)}
                                                />
                                                차원 불일치 무시하고 실행
                                            </label>
                                        </div>
                                    )}

                                    {/* 모델 불일치 경고 */}
                                    {modelMismatch && (
                                        <div className={styles.warningSection}>
                                            <div className={styles.warningMessage}>
                                                임베딩 모델이 일치하지 않습니다!
                                                <br />
                                                현재 Model: {embeddingConfig.provider_info.model}
                                                <br />
                                                Collection 초기 Model: {selectedCollection?.init_embedding_model}
                                            </div>
                                            <label className={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={ignoreModelMismatch}
                                                    onChange={(e) => setIgnoreModelMismatch(e.target.checked)}
                                                />
                                                모델 불일치 무시하고 실행
                                            </label>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.errorText}>설정을 불러올 수 없습니다.</div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽: 업로드 설정 및 진행상태 */}
                    <div className={styles.rightPanel}>
                        {error && <div className={styles.error}>{error}</div>}

                        {/* 업로드 완료 메시지 */}
                        {isCompleted && (
                            <div className={styles.completedMessage}>
                                <span className={styles.completedIcon}>✅</span>
                                <span>업로드가 완료되었습니다! 3초 후에 자동으로 닫힙니다.</span>
                            </div>
                        )}

                        {/* 업로드 진행 상태 */}
                        {uploadProgress.length > 0 && (
                            <div className={styles.uploadProgressContainer}>
                                <div className={styles.progressHeader}>
                                    <h4>업로드 진행 상태</h4>
                                    <div className={styles.progressSummary}>
                                        <span className={styles.totalCount}>
                                            총 {uploadProgress.length}개 파일
                                        </span>
                                        <span className={styles.successCount}>
                                            성공: {uploadProgress.filter(item => item.status === 'success').length}
                                        </span>
                                        <span className={styles.errorCount}>
                                            실패: {uploadProgress.filter(item => item.status === 'error').length}
                                        </span>
                                        <span className={styles.uploadingCount}>
                                            진행 중: {uploadProgress.filter(item => item.status === 'uploading').length}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.progressList}>
                                    {uploadProgress.map((item, index) => (
                                        <div key={index} className={`${styles.progressItem} ${styles[item.status]}`}>
                                            <div className={styles.fileInfo}>
                                                <span className={styles.fileName} title={item.fileName}>
                                                    {item.fileName}
                                                </span>
                                                {item.status === 'uploading' && (
                                                    <span className={styles.progressPercent}>
                                                        {item.progress}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.progressStatus}>
                                                {item.status === 'uploading' && (
                                                    <div className={styles.progressBar}>
                                                        <div
                                                            className={styles.progressFill}
                                                            style={{ width: `${item.progress}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                                <span className={`${styles.statusText} ${styles[item.status]}`}>
                                                    {item.status === 'uploading' && '📤 업로드 중...'}
                                                    {item.status === 'success' && '✅ 완료'}
                                                    {item.status === 'error' && `❌ ${item.error || '실패'}`}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 청크 설정 */}
                        <div className={styles.formGroup}>
                            <label>청크 사이즈</label>
                            <input
                                type="number"
                                value={chunkSize}
                                onChange={(e) => setChunkSize(Number(e.target.value))}
                                placeholder="4000"
                                min="100"
                                max="65000"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>오버랩 사이즈</label>
                            <input
                                type="number"
                                value={overlapSize}
                                onChange={(e) => setOverlapSize(Number(e.target.value))}
                                placeholder="1000"
                                min="0"
                                max="65000"
                            />
                        </div>

                        {/* 처리 방식 선택 */}
                        <div className={styles.formGroup}>
                            <label>문서 처리 방식 (PDF/DOCX 파일에만 적용)</label>
                            <select
                                value={processType}
                                onChange={(e) => setProcessType(e.target.value)}
                                className={styles.selectInput}
                            >
                                <option value="text">텍스트 추출 (PDF/DOCX 공통)</option>
                                <option value="ocr">OCR 처리 (PDF/DOCX 공통)</option>
                                <option value="html">HTML 변환 (DOCX 전용)</option>
                                <option value="html_pdf_ocr">HTML+PDF OCR (DOCX 전용)</option>
                            </select>
                            <div className={styles.helpText}>
                                <small>
                                    • <strong>자동 선택:</strong> 시스템이 최적의 방식을 자동으로 선택<br />
                                    • <strong>텍스트 추출:</strong> OCR 없이 기계적 텍스트 추출만 사용<br />
                                    • <strong>OCR 처리:</strong> 이미지 OCR을 강제로 사용<br />
                                    • <strong>HTML 변환:</strong> DOCX를 HTML로 변환 후 처리 (DOCX만)<br />
                                    • <strong>HTML+PDF OCR:</strong> HTML 참조 + PDF OCR 복합 방식 (DOCX만)
                                </small>
                            </div>
                        </div>
                    </div>
                    </>
                    )}
                </div>

                <div className={styles.modalActions}>
                    <button
                        onClick={handleClose}
                        className={`${styles.button} ${styles.secondary}`}
                        disabled={loading}
                    >
                        {loading && uploadProgress.some(item => item.status === 'uploading') ? '최소화' : '취소'}
                    </button>
                    {activeTab === 'file' && (
                        <button
                            onClick={handleConfirmChunkSettings}
                            className={`${styles.button} ${styles.primary}`}
                            disabled={loading || (dimensionMismatch && !ignoreDimensionMismatch) || (modelMismatch && !ignoreModelMismatch) || !embeddingConfig?.client_available}
                        >
                            {loading ? '업로드 중...' : '설정 완료'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default GlobalDocumentFileModal;
