'use client';
import React, { useState, useEffect, use } from 'react';
import {
    FiFolder,
    FiPlay,
    FiEdit,
    FiTrash2,
    FiUser,
    FiClock,
    FiRefreshCw,
    FiUsers,
    FiSettings,
    FiCopy,
} from 'react-icons/fi';
import styles from '@/app/main/assets/CompletedWorkflows.module.scss';
import { listWorkflowsDetail, deleteWorkflow, duplicateWorkflow } from '@/app/api/workflow/workflowAPI';
import { getDeployStatus } from '@/app/api/workflow/deploy';
import { useRouter } from 'next/navigation';
import { Workflow, WorkflowDetailResponse } from '@/app/main/types/index';
import {
    showWorkflowDeleteConfirmKo,
    showDeleteSuccessToastKo,
    showDeleteErrorToastKo
} from '@/app/_common/utils/toastUtilsKo';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import { useAuth } from '@/app/_common/components/CookieProvider';
import WorkflowEditModal from '@/app/main/components/workflows/WorkflowEditModal';
import { devLog } from '@/app/_common/utils/logger';

const CompletedWorkflows: React.FC = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<
        'all' | 'active' | 'draft' | 'archived'
    >('all');
    const [workflowFilter, setWorkflowFilter] = useState<
        'all' | 'personal' | 'shared'
    >('all');
    const [showEditModal, setShowEditModal] = useState(false);
    const [workflowToEdit, setWorkflowToEdit] = useState<Workflow | null>(null);
    const [deployed_list, setDeployed_list] = useState<{[key: string]: boolean | null}>({});

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            setError(null);
            const workflowDetails =
                (await listWorkflowsDetail()) as WorkflowDetailResponse[];
            const transformedWorkflows: Workflow[] = workflowDetails.map(
                (detail: WorkflowDetailResponse) => {
                    let status: 'active' | 'draft' | 'archived' = 'active';
                    if (
                        !detail.has_startnode ||
                        !detail.has_endnode ||
                        detail.node_count < 3
                    ) {
                        status = 'draft';
                    }

                    if (user && detail.user_id === user.user_id) {
                        devLog.log('Fetching deploy status for', detail.workflow_name, detail.user_id, user.user_id);
                        fetchDeployStatus(detail.workflow_name, detail.user_id).then(status => {
                            setDeployed_list(prev => ({...prev, [detail.workflow_name]: status}));
                        });
                    }


                    return {
                        key_value: detail.id,
                        id: detail.workflow_id,
                        name:
                            detail.workflow_name,
                        author: detail.user_name,
                        user_id: detail.user_id,
                        nodeCount: detail.node_count,
                        lastModified: detail.updated_at,
                        status: status,
                        filename: `${detail.workflow_name}.json`,
                        error: detail.error,
                        is_shared: detail.is_shared,
                        share_group: detail.share_group,
                        share_permissions: detail.share_permissions,
                    };
                },
            );

            setWorkflows(transformedWorkflows);
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
            setError('워크플로우를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDeployStatus = async (workflowName: string, user_id?: number | string) => {
        try {
            const status = await getDeployStatus(workflowName, String(user_id));
            return status.is_deployed;
        } catch (error) {
            showErrorToastKo('워크플로우 배포 상태를 불러오는데 실패했습니다.');
            return null;
        }
    };

    useEffect(() => {
        fetchWorkflows();
    }, []);

    // 워크플로우 필터링
    const getFilteredWorkflows = () => {
        const statusFiltered = workflows.filter(
            (workflow) => filter === 'all' || workflow.status === filter,
        );

        switch (workflowFilter) {
            case 'personal':
                return statusFiltered.filter(workflow => !workflow.is_shared);
            case 'shared':
                return statusFiltered.filter(workflow => workflow.is_shared === true);
            case 'all':
            default:
                return statusFiltered;
        }
    };

    const filteredWorkflows = getFilteredWorkflows();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return styles.statusActive;
            case 'draft':
                return styles.statusDraft;
            case 'archived':
                return styles.statusArchived;
            default:
                return styles.statusActive;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return '활성';
            case 'draft':
                return '초안';
            case 'archived':
                return '보관됨';
            default:
                return '활성';
        }
    };

    const handleExecute = (workflow: Workflow) => {
        router.push(
            `/chat?mode=new-chat&workflowName=${encodeURIComponent(workflow.name)}&workflowId=${encodeURIComponent(workflow.id)}&user_id=${workflow.user_id}`,
        );
    };

    const handleEdit = (workflow: Workflow) => {
        router.push(
            `/canvas?load=${encodeURIComponent(workflow.name)}`,
        );
    };

    const handleEditSettings = (workflow: Workflow) => {
        setWorkflowToEdit(workflow);
        setShowEditModal(true);
    };

    const handleUpdateWorkflow = (updatedWorkflow: Workflow, updatedDeploy: {[key: string]: boolean | null}) => {
        setWorkflows(prevWorkflows =>
            prevWorkflows.map(workflow =>
                workflow.key_value === updatedWorkflow.key_value
                    ? updatedWorkflow
                    : workflow
            )
        );
        setDeployed_list(prev => ({
            ...prev,
            ...updatedDeploy
        }));
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setWorkflowToEdit(null);
    };

    const handleDuplicate = async (workflow: Workflow) => {
        if (!workflow.user_id) {
            showErrorToastKo('워크플로우 복사에 실패했습니다: 사용자 정보가 없습니다.');
            return;
        }

        try {
            const result = await duplicateWorkflow(workflow.name, workflow.user_id);
            showSuccessToastKo(`"${workflow.name}" 워크플로우가 성공적으로 복사되었습니다!`);
            fetchWorkflows();
        } catch (error) {
            console.error('Failed to duplicate workflow:', error);
            showErrorToastKo(`워크플로우 복사에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleDelete = (workflow: Workflow) => {
        showWorkflowDeleteConfirmKo(
            workflow.name,
            async () => {
                try {
                    await deleteWorkflow(workflow.name);
                    showDeleteSuccessToastKo({
                        itemName: workflow.name,
                        itemType: '워크플로우',
                    });
                    fetchWorkflows(); // 목록 새로고침
                } catch (error) {
                    console.error('Failed to delete workflow:', error);
                    showDeleteErrorToastKo({
                        itemName: workflow.name,
                        itemType: '워크플로우',
                        error: error instanceof Error ? error : 'Unknown error',
                    });
                }
            }
        );
    };

    return (
        <div className={styles.container}>
            {/* Header with Filters */}
            <div className={styles.header}>

                <div className={styles.headerActions}>
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            {['all', 'active', 'draft', 'archived'].map(
                                (filterType) => (
                                    <button
                                        key={filterType}
                                        onClick={() => setFilter(filterType as any)}
                                        className={`${styles.filterButton} ${filter === filterType ? styles.active : ''}`}
                                    >
                                        {filterType === 'all'
                                            ? '전체'
                                            : filterType === 'active'
                                              ? '활성'
                                              : filterType === 'draft'
                                                ? '초안'
                                                : '보관됨'}
                                    </button>
                                ),
                            )}
                        </div>

                        <div className={styles.filterGroup}>
                            {['all', 'personal', 'shared'].map(
                                (filterType) => (
                                    <button
                                        key={filterType}
                                        onClick={() => setWorkflowFilter(filterType as any)}
                                        className={`${styles.filterButton} ${workflowFilter === filterType ? styles.active : ''}`}
                                    >
                                        {filterType === 'all'
                                            ? '전체'
                                            : filterType === 'personal'
                                              ? '개인'
                                              : '공유'}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>

                    <button
                        className={`${styles.refreshButton} ${loading ? styles.spinning : ''}`}
                        onClick={fetchWorkflows}
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
                    <p>워크플로우를 불러오는 중...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className={styles.errorState}>
                    <p>{error}</p>
                    <button onClick={fetchWorkflows}>다시 시도</button>
                </div>
            )}

            {/* Workflows Grid */}
            {!loading && !error && (
                <div className={styles.workflowsGrid}>
                    {filteredWorkflows.map((workflow) => (
                        <div
                            key={workflow.key_value}
                            className={styles.workflowCard}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.workflowIcon}>
                                    <FiFolder />
                                </div>
                                <div className={styles.statusContainer}>
                                    <div
                                        className={`${styles.status} ${getStatusColor(workflow.status)}`}
                                    >
                                        {getStatusText(workflow.status)}
                                    </div>
                                    <div
                                        className={`${styles.shareStatus} ${workflow.is_shared ? styles.statusShared : styles.statusPersonal}`}
                                    >
                                        {workflow.is_shared ? '공유' : '개인'}
                                    </div>
                                    {user && workflow.user_id === user.user_id && (
                                        <div
                                            className={`${styles.deployStatus} ${deployed_list[workflow.name] ? styles.statusDeployed : styles.statusNotDeployed}`}
                                        >
                                            {deployed_list[workflow.name] === null ? '배포 상태 오류' : deployed_list[workflow.name] ? '배포됨' : '미배포'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardContent}>
                                <h3 className={styles.workflowName}>
                                    {workflow.name}
                                </h3>
                                {workflow.description && (
                                    <p className={styles.workflowDescription}>
                                        {workflow.description}
                                    </p>
                                )}
                                {workflow.error && (
                                    <p className={styles.workflowError}>
                                        오류: {workflow.error}
                                    </p>
                                )}

                                <div className={styles.workflowMeta}>
                                    {user && workflow.user_id === user.user_id && (
                                        <div className={styles.metaItem}>
                                            <FiUser />
                                            <span>{workflow.author}</span>
                                        </div>
                                    )}
                                    {workflow.lastModified && (
                                        <div className={styles.metaItem}>
                                            <FiClock />
                                            <span>
                                                {new Date(
                                                    workflow.lastModified,
                                                ).toLocaleDateString('ko-KR')}
                                            </span>
                                        </div>
                                    )}
                                    <div className={styles.metaItem}>
                                        <span>{workflow.nodeCount}개 노드</span>
                                    </div>
                                    {workflow.share_group && (
                                        <div className={styles.metaItem}>
                                            <FiUsers />
                                            <span>조직: {workflow.share_group}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <button
                                    className={styles.actionButton}
                                    title="실행"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleExecute(workflow);
                                    }}
                                >
                                    <FiPlay />
                                </button>
                                {user && workflow.user_id === user.user_id ? (
                                    <>
                                        <button
                                            className={styles.actionButton}
                                            title="편집"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(workflow);
                                            }}
                                        >
                                            <FiEdit />
                                        </button>
                                        <button
                                            className={styles.actionButton}
                                            title="설정"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditSettings(workflow);
                                            }}
                                        >
                                            <FiSettings />
                                        </button>
                                        <button
                                            className={`${styles.actionButton} ${styles.danger}`}
                                            title="삭제"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(workflow);
                                            }}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className={styles.actionButton}
                                            title="복사"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDuplicate(workflow);
                                            }}
                                        >
                                            <FiCopy />
                                        </button>
                                        <div className={styles.sharedMessage}>
                                            공유받은 워크플로우는 편집이 불가능합니다.
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && filteredWorkflows.length === 0 && (
                <div className={styles.emptyState}>
                    <FiFolder className={styles.emptyIcon} />
                    <h3>워크플로우가 없습니다</h3>
                    <p>
                        아직 저장된 워크플로우가 없습니다. 새로운 워크플로우를
                        만들어보세요.
                    </p>
                </div>
            )}

            {/* 워크플로우 편집 모달 */}
            {showEditModal && workflowToEdit && (
                <WorkflowEditModal
                    workflow={workflowToEdit}
                    isOpen={showEditModal}
                    onClose={handleCloseEditModal}
                    onUpdate={handleUpdateWorkflow}
                />
            )}
        </div>
    );
};

export default CompletedWorkflows;
