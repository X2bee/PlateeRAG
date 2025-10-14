'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/main/workflowSection/assets/CollectionEditModal.module.scss';
import { updateWorkflow, renameWorkflow } from '@/app/_common/api/workflow/workflowAPI';
import { getGroupAvailableGroups } from '@/app/_common/api/authAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { Workflow } from '@/app/main/workflowSection/types/index';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import { devLog } from '@/app/_common/utils/logger';

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
    const [workflowName, setWorkflowName] = useState<string>('');
    const [isEditingName, setIsEditingName] = useState<boolean>(false);
    const [isShared, setIsShared] = useState<boolean>(false);
    const [toggleDeploy, setToggleDeploy] = useState<boolean>(false);
    const [shareGroup, setShareGroup] = useState<string>('');
    const [sharePermissions, setSharePermissions] = useState<string>('read');
    const [availableGroups, setAvailableGroups] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState<boolean>(false);

    // 워크플로우 정보로 폼 초기화
    useEffect(() => {
        if (workflow) {
            setWorkflowName(workflow.name);
            setIsShared(workflow.is_shared === true);
            setShareGroup(workflow.share_group || '');
            setSharePermissions(workflow.share_permissions || 'read');

            // 소유권 확인
            const isWorkflowOwner = user ? workflow.user_id === user.user_id : false;
            setIsOwner(isWorkflowOwner);

            const workflowDetail = workflow as any;
            if (workflowDetail.inquire_deploy) {
                setToggleDeploy(true);
            } else if (workflowDetail.is_deployed !== undefined) {
                setToggleDeploy(workflowDetail.is_deployed);
            } else {
                setToggleDeploy(false);
            }
        }
    }, [workflow, user]);

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

            const trimmedName = workflowName.trim();
            const finalName = trimmedName || workflow.name;
            let currentWorkflowName = workflow.name;

            // 1. 이름이 변경된 경우 먼저 이름 변경
            if (finalName !== workflow.name && isOwner) {
                try {
                    await renameWorkflow(workflow.name, finalName);
                    devLog.log('Workflow name changed from:', workflow.name, 'to:', finalName);
                    currentWorkflowName = finalName; // 이름 변경 성공 시 업데이트
                } catch (error) {
                    devLog.error('Failed to rename workflow:', error);

                    // 에러 메시지 파싱
                    const errorMessage = error instanceof Error ? error.message : String(error);

                    if (errorMessage.includes('already exists')) {
                        setError('이미 존재하는 이름입니다. 다른 이름으로 시도하세요.');
                    } else {
                        setError('워크플로우 이름 변경에 실패했습니다.');
                    }

                    // 사용자가 입력한 값은 유지 (초기화하지 않음)
                    setLoading(false);
                    return; // 이름 변경 실패 시 중단
                }
            }

            // 2. 다른 설정 업데이트 (변경된 이름 사용)
            const updateDict = {
                is_shared: isShared,
                share_group: isShared ? shareGroup || null : null,
                share_permissions: isShared ? sharePermissions : null,
                enable_deploy: toggleDeploy  // 백엔드에서 관리자 권한에 따라 처리
            };

            await updateWorkflow(currentWorkflowName, updateDict);

            // 3. 업데이트된 정보를 부모에게 전달
            const updatedWorkflow = {
                ...workflow,
                name: currentWorkflowName,
                filename: `${currentWorkflowName}.json`,
                is_shared: isShared,
                share_group: isShared ? shareGroup || null : null,
                share_permissions: isShared ? sharePermissions : null,
            };

            // 배포 상태: toggleDeploy가 true이면 'pending' (일반 사용자) 또는 true (관리자)
            const updatedDeploy: {[key: string]: boolean | 'pending' | null} = {
                [currentWorkflowName]: toggleDeploy ? 'pending' : false
            };

            // 성공 메시지
            if (finalName !== workflow.name && isOwner) {
                showSuccessToastKo('워크플로우 이름 및 설정이 업데이트되었습니다.');
            } else {
                showSuccessToastKo('워크플로우 설정이 업데이트되었습니다.');
            }

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
                    {isOwner ? (
                        <>
                            <input
                                type="text"
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                                onBlur={() => setIsEditingName(false)}
                                onFocus={() => setIsEditingName(true)}
                                disabled={loading}
                                className={isEditingName ? styles.editingInput : ''}
                            />
                            <small>워크플로우 이름을 변경한 후 아래 업데이트 버튼을 클릭하세요.</small>
                        </>
                    ) : (
                        <>
                            <input
                                type="text"
                                value={workflow.name}
                                disabled
                                className={styles.disabledInput}
                            />
                            <small>공유받은 워크플로우는 이름을 변경할 수 없습니다.</small>
                        </>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label>워크플로우 배포</label>
                    <button
                        type="button"
                        className={`${styles.toggleButton} ${
                            workflow.inquire_deploy
                                ? (toggleDeploy ? styles.pending : styles.pendingOff)
                                : toggleDeploy
                                ? styles.active
                                : ''
                        }`}
                        onClick={() => setToggleDeploy(!toggleDeploy)}
                        disabled={loading}
                    >
                        {workflow.inquire_deploy ? '배포 승인 대기중' : toggleDeploy ? '배포 활성화' : '배포 비활성화'}
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

                {isShared && (
                    <div className={styles.formGroup}>
                        <label>권한</label>
                        <select
                            value={sharePermissions}
                            onChange={(e) => setSharePermissions(e.target.value)}
                            disabled={loading}
                        >
                            <option value="read">Read Only</option>
                            <option value="read_write">Read and Write</option>
                        </select>
                        <small>
                            공유된 워크플로우에 대한 접근 권한을 설정합니다.
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
