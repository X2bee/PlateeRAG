'use client';
import React, { useState, useEffect } from 'react';
import styles from '@/app/_common/assets/DocumentFileModal.module.scss';
import { uploadDocument } from '@/app/api/rag/retrievalAPI';
import { useDocumentFileModal } from '@/app/_common/contexts/DocumentFileModalContext';

interface UploadProgress {
    fileName: string;
    status: 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
}

const GlobalDocumentFileModal: React.FC = () => {
    const {
        isOpen,
        selectedCollection,
        isFolderUpload,
        closeModal,
        onUploadComplete
    } = useDocumentFileModal();

    const [chunkSize, setChunkSize] = useState(4000);
    const [overlapSize, setOverlapSize] = useState(1000);
    const [processType, setProcessType] = useState<string>('default');
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

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
                    setProcessType(parsed.processType || 'default');
                    setIsMinimized(parsed.isMinimized || false);

                    // 업로드 중인 항목이 있으면 loading 상태
                    const hasUploading = parsed.uploadProgress.some((item: UploadProgress) => item.status === 'uploading');
                    setLoading(hasUploading);
                }
            } catch (error) {
                console.error('Failed to restore upload state:', error);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

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
        setProcessType('default');
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
                            idx === index ? { ...item, status: 'success' as const, progress: 100 } : item
                        ));

                    } catch (error) {
                        setUploadProgress(prev => prev.map((item, idx) =>
                            idx === index ? {
                                ...item,
                                status: 'error' as const,
                                progress: 0,
                                error: error instanceof Error ? error.message : '업로드 실패'
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
                        { upload_type: 'single', process_type: processType },
                        processType
                    );

                    setUploadProgress(prev => prev.map((item, index) =>
                        index === 0 ? { ...item, status: 'success' as const, progress: 100 } : item
                    ));

                } catch (err) {
                    setUploadProgress(prev => prev.map((item, index) =>
                        index === 0 ? {
                            ...item,
                            status: 'error' as const,
                            progress: 0,
                            error: '업로드 실패'
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

                    // 3초 후 자동 닫기
                    setTimeout(() => {
                        if (onUploadComplete) {
                            onUploadComplete();
                        }
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

    return (
        <div className={styles.modalBackdrop} onClick={handleClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3>{isFolderUpload ? '폴더 업로드 설정' : '단일 파일 업로드 설정'}</h3>

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
                        <option value="default">자동 선택 (기본값)</option>
                        <option value="text">텍스트 추출 (PDF/DOCX 공통)</option>
                        <option value="ocr">OCR 처리 (PDF/DOCX 공통)</option>
                        <option value="html">HTML 변환 (DOCX 전용)</option>
                        <option value="html_pdf_ocr">HTML+PDF OCR (DOCX 전용)</option>
                    </select>
                    <div className={styles.helpText}>
                        <small>
                            • <strong>자동 선택:</strong> 시스템이 최적의 방식을 자동으로 선택<br/>
                            • <strong>텍스트 추출:</strong> OCR 없이 기계적 텍스트 추출만 사용<br/>
                            • <strong>OCR 처리:</strong> 이미지 OCR을 강제로 사용<br/>
                            • <strong>HTML 변환:</strong> DOCX를 HTML로 변환 후 처리 (DOCX만)<br/>
                            • <strong>HTML+PDF OCR:</strong> HTML 참조 + PDF OCR 복합 방식 (DOCX만)
                        </small>
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button
                        onClick={handleClose}
                        className={`${styles.button} ${styles.secondary}`}
                        disabled={loading}
                    >
                        {loading && uploadProgress.some(item => item.status === 'uploading') ? '최소화' : '취소'}
                    </button>
                    <button
                        onClick={handleConfirmChunkSettings}
                        className={`${styles.button} ${styles.primary}`}
                        disabled={loading}
                    >
                        {loading ? '업로드 중...' : '설정 완료'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalDocumentFileModal;
