'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/main/workflowSection/assets/WorkflowVersionModal.module.scss';
import { listWorkflowVersions, updateWorkflowVersion, updateWorkflowVersionLabel, deleteWorkflowVersion } from '@/app/_common/api/workflow/workflowAPI';
import { FiX, FiClock, FiTag, FiEdit, FiTrash2 } from 'react-icons/fi';
import { showSuccessToastKo, showErrorToastKo, showWorkflowVersionChangeConfirmKo, showDeleteConfirmToastKo } from '@/app/_common/utils/toastUtilsKo';

interface WorkflowVersionModalProps {
    workflowName: string;
    userId: string | number;
    isOpen: boolean;
    onClose: () => void;
}

interface WorkflowVersion {
    id: number;
    user_id: number;
    workflow_meta_id: number;
    version: string;
    version_label: string;
    workflow_id: string;
    workflow_name: string;
    current_use: boolean;
    created_at?: string;
    updated_at?: string;
    description?: string;
}

const WorkflowVersionModal: React.FC<WorkflowVersionModalProps> = ({
    workflowName,
    userId,
    isOpen,
    onClose
}) => {
    const [versions, setVersions] = useState<WorkflowVersion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [changingVersion, setChangingVersion] = useState<string | null>(null);
    const [editingVersionId, setEditingVersionId] = useState<number | null>(null);
    const [editingLabel, setEditingLabel] = useState<string>('');

    // 버전 목록 로드
    const fetchVersions = async () => {
        if (!workflowName || !userId) return;

        try {
            setLoading(true);
            setError(null);
            const versionList = await listWorkflowVersions(workflowName, userId);
            setVersions((versionList || []) as WorkflowVersion[]);
        } catch (error) {
            console.error('Failed to fetch workflow versions:', error);
            setError('워크플로우 버전을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 버전 변경 핸들러
    const handleVersionChange = async (version: string) => {
        try {
            setChangingVersion(version);
            await updateWorkflowVersion(workflowName, parseFloat(version));

            // 성공 메시지 표시
            showSuccessToastKo(`버전 ${version}으로 변경되었습니다.`);

            // 버전 목록 새로고침
            await fetchVersions();
        } catch (error) {
            console.error('Failed to change workflow version:', error);
            showErrorToastKo(`버전 변경에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setChangingVersion(null);
        }
    };

    // 버전 카드 클릭 핸들러
    const handleVersionCardClick = (version: WorkflowVersion) => {
        // 편집 중이거나 현재 사용 중인 버전이면 클릭 무시
        if (version.current_use || changingVersion === version.version || editingVersionId === version.id) {
            return;
        }

        // 토스트로 확인 후 변경
        showWorkflowVersionChangeConfirmKo(
            version.version_label || `버전 ${version.version}`,
            () => handleVersionChange(version.version)
        );
    };

    // 라벨 편집 시작
    const handleStartEditLabel = (version: WorkflowVersion, event: React.MouseEvent) => {
        event.stopPropagation();
        setEditingVersionId(version.id);
        setEditingLabel(version.version_label || `v${version.version}`);
    };

    // 라벨 편집 취소
    const handleCancelEditLabel = () => {
        setEditingVersionId(null);
        setEditingLabel('');
    };

    // 라벨 편집 저장
    const handleSaveEditLabel = async (version: WorkflowVersion) => {
        try {
            await updateWorkflowVersionLabel(workflowName, parseFloat(version.version), editingLabel);
            showSuccessToastKo('버전 라벨이 변경되었습니다.');
            await fetchVersions();
        } catch (error) {
            console.error('Failed to update version label:', error);
            showErrorToastKo(`라벨 변경에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setEditingVersionId(null);
            setEditingLabel('');
        }
    };

    // 엔터키 처리
    const handleLabelKeyDown = (event: React.KeyboardEvent, version: WorkflowVersion) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSaveEditLabel(version);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            handleCancelEditLabel();
        }
    };

    // 버전 삭제
    const handleDeleteVersion = (version: WorkflowVersion, event: React.MouseEvent) => {
        event.stopPropagation();

        if (version.current_use) {
            showErrorToastKo('현재 사용 중인 버전은 삭제할 수 없습니다.');
            return;
        }

        showDeleteConfirmToastKo({
            title: '버전 삭제',
            message: `${version.version_label || `버전 ${version.version}`}을(를) 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
            itemName: version.version_label || `버전 ${version.version}`,
            onConfirm: async () => {
                try {
                    await deleteWorkflowVersion(workflowName, parseFloat(version.version));
                    showSuccessToastKo('버전이 삭제되었습니다.');
                    await fetchVersions();
                } catch (error) {
                    console.error('Failed to delete version:', error);
                    showErrorToastKo(`버전 삭제에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        });
    };    // 모달이 열릴 때 버전 목록 로드
    useEffect(() => {
        if (isOpen) {
            fetchVersions();
        }
    }, [isOpen, workflowName, userId]);

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>워크플로우 버전 히스토리</h2>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="닫기"
                    >
                        <FiX />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.workflowInfo}>
                        <h3>{workflowName}</h3>
                        <p>총 {versions.length}개의 버전이 있습니다.</p>
                    </div>

                    {loading && (
                        <div className={styles.loadingState}>
                            <p>버전 목록을 불러오는 중...</p>
                        </div>
                    )}

                    {error && (
                        <div className={styles.errorState}>
                            <p>{error}</p>
                            <button onClick={fetchVersions}>다시 시도</button>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className={styles.versionList}>
                            {versions.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <p>버전 정보가 없습니다.</p>
                                </div>
                            ) : (
                                versions.map((version) => (
                                    <div
                                        key={version.id}
                                        className={`${styles.versionItem} ${version.current_use ? styles.currentVersion : ''} ${!version.current_use && changingVersion !== version.version ? styles.clickable : ''}`}
                                        onClick={() => handleVersionCardClick(version)}
                                    >
                                        <div className={styles.versionHeader}>
                                            <div className={styles.versionNumber}>
                                                <FiTag />
                                                {editingVersionId === version.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingLabel}
                                                        onChange={(e) => setEditingLabel(e.target.value)}
                                                        onKeyDown={(e) => handleLabelKeyDown(e, version)}
                                                        onBlur={() => handleCancelEditLabel()}
                                                        className={styles.editInput}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span>{version.version_label || `버전 ${version.version}`}</span>
                                                )}
                                                {version.current_use && (
                                                    <span className={styles.currentBadge}>현재 사용중</span>
                                                )}
                                            </div>
                                            {version.created_at && (
                                                <div className={styles.versionDate}>
                                                    <FiClock />
                                                    <span>
                                                        {new Date(version.created_at).toLocaleString('ko-KR')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {version.description && (
                                            <div className={styles.versionDescription}>
                                                {version.description}
                                            </div>
                                        )}
                                        <div className={styles.versionMeta}>
                                            <div className={styles.metaInfo}>
                                                {version.updated_at && version.updated_at !== version.created_at && (
                                                    <span>
                                                        마지막 사용 및 편집: {new Date(version.updated_at).toLocaleString('ko-KR')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.versionActions}>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={(e) => handleStartEditLabel(version, e)}
                                                    title="라벨 편집"
                                                    disabled={editingVersionId !== null}
                                                >
                                                    <FiEdit />
                                                </button>
                                                <button
                                                    className={`${styles.actionButton} ${styles.deleteButton}`}
                                                    onClick={(e) => handleDeleteVersion(version, e)}
                                                    title="버전 삭제"
                                                    disabled={version.current_use || editingVersionId !== null}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={onClose}
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default WorkflowVersionModal;
