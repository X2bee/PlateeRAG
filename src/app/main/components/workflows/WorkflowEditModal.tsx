'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/main/assets/CollectionEditModal.module.scss';
import { updateWorkflow } from '@/app/api/workflow/workflowAPI';
import { getGroupAvailableGroups } from '@/app/api/authAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { Workflow } from '@/app/main/types/index';

interface WorkflowEditModalProps {
    workflow: Workflow;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedWorkflow: Workflow, updatedDeploy: {[key: string]: boolean | 'pending' | null}) => void;
}

const WorkflowEditModal: React.FC<WorkflowEditModalProps> = ({
    workflow,
    isOpen,
    onClose,
    onUpdate
}) => {
    const { user } = useAuth();
    const [isShared, setIsShared] = useState<boolean>(false);
    const [toggleDeploy, setToggleDeploy] = useState<boolean>(false);
    const [shareGroup, setShareGroup] = useState<string>('');
    const [availableGroups, setAvailableGroups] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 워크플로우 정보로 폼 초기화
    useEffect(() => {
        if (workflow) {
            setIsShared(workflow.is_shared === true);
            setShareGroup(workflow.share_group || '');

            const workflowDetail = workflow as any;
            if (workflowDetail.inquire_deploy) {
                setToggleDeploy(true);
            } else if (workflowDetail.is_deployed !== undefined) {
                setToggleDeploy(workflowDetail.is_deployed);
            } else {
                setToggleDeploy(false);
            }
        }
    }, [workflow]);

    // 사용 가능한 그룹 목록 로드
    useEffect(() => {
        const loadAvailableGroups = async () => {
            if (user && isOpen) {
                try {
                    const response = await getGroupAvailableGroups(user.user_id) as { available_groups: string[] };
                    if (response.available_groups && response.available_groups.length > 0) {
                        setAvailableGroups(response.available_groups);
                    } else {
                        setAvailableGroups([]);
                    }
                } catch (error) {
                    console.error('Failed to load available groups:', error);
                    setAvailableGroups([]);
                }
            }
        };

        loadAvailableGroups();
    }, [user, isOpen]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            const updateDict = {
                is_shared: isShared,
                share_group: isShared ? shareGroup || null : null,
                enable_deploy: toggleDeploy  // 백엔드에서 관리자 권한에 따라 처리
            };

            await updateWorkflow(workflow.name, updateDict);

            const updatedWorkflow = {
                ...workflow,
                is_shared: isShared,
                share_group: isShared ? shareGroup || null : null,
            };

            // 배포 상태: toggleDeploy가 true이면 'pending' (일반 사용자) 또는 true (관리자)
            const updatedDeploy: {[key: string]: boolean | 'pending' | null} = {
                [workflow.name]: toggleDeploy ? 'pending' : false
            };

            onUpdate(updatedWorkflow as any, updatedDeploy);
            onClose();
        } catch (err) {
            setError('워크플로우 업데이트에 실패했습니다.');
            console.error('Failed to update workflow:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3>워크플로우 설정 편집</h3>

                <div className={styles.formGroup}>
                    <label>워크플로우 이름</label>
                    <input
                        type="text"
                        value={workflow.name}
                        disabled
                        className={styles.disabledInput}
                    />
                    <small>워크플로우 이름은 변경할 수 없습니다.</small>
                </div>

                <div className={styles.formGroup}>
                    <label>워크플로우 배포</label>
                    <button
                        type="button"
                        className={`${styles.toggleButton} ${toggleDeploy ? styles.active : ''}`}
                        onClick={() => setToggleDeploy(!toggleDeploy)}
                        disabled={loading}
                    >
                        {toggleDeploy ? '배포 활성화' : '배포 비활성화'}
                    </button>
                    <small>
                        관리자인 경우 즉시 배포, 일반 사용자인 경우 관리자 승인 후 배포됩니다.
                    </small>
                </div>

                <div className={styles.formGroup}>
                    <label>워크플로우 공유</label>
                    <button
                        type="button"
                        className={`${styles.toggleButton} ${isShared ? styles.active : ''}`}
                        onClick={() => setIsShared(!isShared)}
                        disabled={loading}
                    >
                        {isShared ? '공유 중' : '비공개'}
                    </button>
                </div>

                {isShared && (
                    <div className={styles.formGroup}>
                        <label>공유 그룹</label>
                        {availableGroups.length > 0 ? (
                            <select
                                value={shareGroup}
                                onChange={(e) => setShareGroup(e.target.value)}
                                disabled={loading}
                            >
                                <option value="">그룹을 선택하세요</option>
                                {availableGroups.map((group, index) => (
                                    <option key={index} value={group}>
                                        {group}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <select disabled>
                                <option>소속된 조직이 없습니다.</option>
                            </select>
                        )}
                        <small>
                            {availableGroups.length > 0
                                ? "공유 그룹을 지정하지 않으면 공유되지 않습니다."
                                : "그룹에 소속되어야 특정 그룹과 공유할 수 있습니다."
                            }
                        </small>
                    </div>
                )}

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
                        {loading ? '업데이트 중...' : '업데이트'}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default WorkflowEditModal;
