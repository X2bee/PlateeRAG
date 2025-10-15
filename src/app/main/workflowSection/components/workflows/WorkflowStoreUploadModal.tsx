'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/main/workflowSection/assets/CollectionEditModal.module.scss';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import { devLog } from '@/app/_common/utils/logger';
import { listWorkflows } from '@/app/_common/api/workflow/workflowAPI';
import { uploadWorkflowToStore } from '@/app/_common/api/workflow/workflowStoreAPI';

interface WorkflowStoreUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const WorkflowStoreUploadModal: React.FC<WorkflowStoreUploadModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [selectedWorkflow, setSelectedWorkflow] = useState('');
    const [workflows, setWorkflows] = useState<string[]>([]);
    const [loadingWorkflows, setLoadingWorkflows] = useState(false);

    // 워크플로우 목록 로드
    useEffect(() => {
        const fetchWorkflows = async () => {
            if (isOpen) {
                try {
                    setLoadingWorkflows(true);
                    const workflowList: string[] = await listWorkflows();
                    setWorkflows(workflowList);
                } catch (err) {
                    devLog.error('Failed to load workflows:', err);
                    showErrorToastKo('워크플로우 목록을 불러오는데 실패했습니다.');
                } finally {
                    setLoadingWorkflows(false);
                }
            }
        };

        fetchWorkflows();
    }, [isOpen]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            // 필수 입력값 검증
            if (!selectedWorkflow || selectedWorkflow.trim() === '') {
                setError('워크플로우를 선택해주세요.');
                setLoading(false);
                return;
            }

            if (!title || title.trim() === '') {
                setError('제목을 입력해주세요.');
                setLoading(false);
                return;
            }

            // 태그 정합 검증 및 처리
            let processedTags: string[] = [];
            if (tags && tags.trim() !== '') {
                // 쉼표로 분리하고 공백 제거
                processedTags = tags
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0); // 빈 문자열 제거

                // 중복 제거
                processedTags = Array.from(new Set(processedTags));

                devLog.log('Processed tags:', processedTags);
            }

            devLog.info('Upload workflow to store', {
                workflowName: selectedWorkflow,
                uploadName: title.trim(),
                description: description.trim(),
                tags: processedTags
            });

            // API 호출
            const result = await uploadWorkflowToStore(
                selectedWorkflow,
                title.trim(),
                description.trim(),
                processedTags
            );

            showSuccessToastKo('워크플로우가 성공적으로 업로드되었습니다.');
            devLog.log('Upload result:', result);

            if (onSuccess) {
                onSuccess();
            }

            onClose();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '워크플로우 업로드에 실패했습니다.';
            setError(errorMessage);
            devLog.error('Failed to upload workflow:', err);
            showErrorToastKo(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3>워크플로우 스토어에 업로드</h3>

                <div className={styles.formGroup}>
                    <label>워크플로우 선택</label>
                    <select
                        value={selectedWorkflow}
                        onChange={(e) => setSelectedWorkflow(e.target.value)}
                        disabled={loading || loadingWorkflows}
                    >
                        <option value="">워크플로우를 선택하세요</option>
                        {workflows.map((filename, index) => {
                            const workflowName = filename.replace('.json', '');
                            return (
                                <option key={index} value={workflowName}>
                                    {workflowName}
                                </option>
                            );
                        })}
                    </select>
                    <small>
                        {loadingWorkflows
                            ? '워크플로우 목록을 불러오는 중...'
                            : '워크플로우는 현재 선택된 버전이 업로드됩니다.'}
                    </small>
                </div>

                <div className={styles.formGroup}>
                    <label>제목</label>
                    <input
                        type="text"
                        placeholder="워크플로우 제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>설명</label>
                    <textarea
                        placeholder="워크플로우 설명을 입력하세요"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        disabled={loading}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>태그</label>
                    <input
                        type="text"
                        placeholder="태그를 쉼표로 구분하여 입력하세요"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        disabled={loading}
                    />
                    <small>여러 태그는 쉼표(,)로 구분하여 입력하세요(예: AI, 자동화, 데이터분석).</small>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.modalActions}>
                    <button
                        onClick={onClose}
                        className={`${styles.button} ${styles.secondary}`}
                        disabled={loading}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`${styles.button} ${styles.primary}`}
                        disabled={loading}
                    >
                        {loading ? '업로드 중...' : '업로드'}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default WorkflowStoreUploadModal;
