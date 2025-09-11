'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/admin/assets/workflows/AdminWorkflowEditModal.module.scss';
import { updateWorkflow } from '@/app/admin/api/workflow';
import { getGroupAvailableGroups } from '@/app/api/authAPI';
import { Workflow } from '@/app/main/types/index';
import { getDeployStatus } from '@/app/api/workflow/deploy';

interface AdminWorkflow {
    key_value: number;
    id: string;
    name: string;
    author: string;
    user_id: number;
    nodeCount: number;
    lastModified: string;
    status: 'active' | 'inactive';
    filename: string;
    error?: string;
    is_shared: boolean;
    share_group?: string;
    share_permissions?: string;
    description?: string;
}

interface AdminWorkflowEditModalProps {
    workflow: AdminWorkflow;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedWorkflow: AdminWorkflow, updatedDeploy: {[key: string]: boolean | null}) => void;
}

const AdminWorkflowEditModal: React.FC<AdminWorkflowEditModalProps> = ({
    workflow,
    isOpen,
    onClose,
    onUpdate
}) => {
    const [isShared, setIsShared] = useState<boolean>(false);
    const [toggleDeploy, setToggleDeploy] = useState<boolean>(false);
    const [shareGroup, setShareGroup] = useState<string>('');
    const [availableGroups, setAvailableGroups] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDeployStatus = async () => {
            if (workflow) {
                try {
                    const deployed = await getDeployStatus(workflow.name, String(workflow.user_id));
                    setToggleDeploy(deployed.is_deployed);
                } catch (err) {
                    console.error('Failed to fetch deploy status:', err);
                }
            }
        };

        fetchDeployStatus();
    }, [workflow]);

    // 워크플로우 정보로 폼 초기화
    useEffect(() => {
        if (workflow) {
            setIsShared(workflow.is_shared === true);
            setShareGroup(workflow.share_group || '');
        }
    }, [workflow]);

    // 사용 가능한 그룹 목록 로드
    useEffect(() => {
        const loadAvailableGroups = async () => {
            if (workflow && isOpen) {
                try {
                    const response = await getGroupAvailableGroups(workflow.user_id) as { available_groups: string[] };
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
    }, [workflow, isOpen]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            const updateDict = {
                is_shared: isShared,
                share_group: isShared ? shareGroup || null : null,
                enable_deploy: toggleDeploy,
                user_id: workflow.user_id
            };

            await updateWorkflow(workflow.name, updateDict);

            // 업데이트된 워크플로우 정보를 부모 컴포넌트에 전달
            const updatedWorkflow = {
                ...workflow,
                is_shared: isShared,
                share_group: isShared ? shareGroup || undefined : undefined,
                enable_deploy: toggleDeploy
            };

            const updatedDeploy = {[workflow.name]: toggleDeploy};

            onUpdate(updatedWorkflow, updatedDeploy);
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
                        disabled={false}
                    >
                        {toggleDeploy ? '배포 중' : '비공개'}
                    </button>
                </div>

                <div className={styles.formGroup}>
                    <label>워크플로우 공유</label>
                    <button
                        type="button"
                        className={`${styles.toggleButton} ${isShared ? styles.active : ''}`}
                        onClick={() => setIsShared(!isShared)}
                        disabled={false}
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
                                disabled={false}
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

export default AdminWorkflowEditModal;
