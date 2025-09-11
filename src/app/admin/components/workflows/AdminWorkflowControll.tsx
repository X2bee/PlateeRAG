'use client';
import React, { useState, useEffect } from 'react';
import {
    FiFolder,
    FiTrash2,
    FiUser,
    FiClock,
    FiRefreshCw,
    FiUsers,
    FiSearch,
    FiX,
    FiSettings,
} from 'react-icons/fi';
import styles from '@/app/admin/assets/workflows/AdminWorkflowControll.module.scss';
import { getAllWorkflowMeta, deleteWorkflowAdmin } from '@/app/admin/api/workflow';
import { getDeployStatus } from '@/app/api/workflow/deploy';

import { devLog } from '@/app/_common/utils/logger';
import {
    showWorkflowDeleteConfirmKo,
    showDeleteSuccessToastKo,
    showDeleteErrorToastKo,
} from '@/app/_common/utils/toastUtilsKo';
import AdminWorkflowEditModal from './AdminWorkflowEditModal';

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

const AdminWorkflowControll: React.FC = () => {
    const [workflows, setWorkflows] = useState<AdminWorkflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [deployed_list, setDeployed_list] = useState<{[key: string]: boolean | null}>({});
    const [editingWorkflow, setEditingWorkflow] = useState<AdminWorkflow | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            setError(null);

            // 관리자용 API로 모든 워크플로우 메타데이터 가져오기
            const response = await getAllWorkflowMeta(1, 1000, null); // 모든 사용자의 워크플로우
            const workflowDetails = (response as any)?.workflows || [];

            const transformedWorkflows: AdminWorkflow[] = workflowDetails.map((detail: any) => {
                let status: 'active' | 'inactive' = 'active';
                if (
                    !detail.has_startnode ||
                    !detail.has_endnode ||
                    detail.node_count < 3
                ) {
                    status = 'inactive';
                }

                // 배포 상태 가져오기
                fetchDeployStatus(detail.workflow_name, detail.user_id).then(deployStatus => {
                    setDeployed_list(prev => ({...prev, [detail.workflow_name]: deployStatus}));
                });

                return {
                    key_value: detail.id,
                    id: detail.workflow_id,
                    name: detail.workflow_name,
                    author: detail.username || 'Unknown',
                    user_id: detail.user_id,
                    nodeCount: detail.node_count,
                    lastModified: detail.updated_at,
                    status: status,
                    filename: `${detail.workflow_name}.json`,
                    error: detail.error,
                    is_shared: detail.is_shared || false,
                    share_group: detail.share_group,
                    share_permissions: detail.share_permissions,
                    description: detail.description,
                };
            });

            setWorkflows(transformedWorkflows);
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
            setError('워크플로우를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const fetchDeployStatus = async (workflowName: string, user_id: number | string) => {
        try {
            const status = await getDeployStatus(workflowName, String(user_id));
            return status.is_deployed;
        } catch (error) {
            devLog.error('Failed to fetch deploy status:', error);
            return null;
        }
    };

    useEffect(() => {
        fetchWorkflows();
    }, []);

    // 워크플로우 필터링 및 검색
    const getFilteredWorkflows = () => {
        let filtered = workflows;

        // 상태 필터링
        if (filter !== 'all') {
            filtered = filtered.filter(workflow => workflow.status === filter);
        }



        // 검색 필터링 (워크플로우 이름, 작성자명으로 검색)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(workflow =>
                workflow.name.toLowerCase().includes(query) ||
                workflow.author.toLowerCase().includes(query)
            );
        }

        return filtered;
    };

    const filteredWorkflows = getFilteredWorkflows();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return styles.statusActive;
            case 'inactive':
                return styles.statusDraft;
            default:
                return styles.statusActive;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return '활성';
            case 'inactive':
                return '비활성';
            default:
                return '활성';
        }
    };



    const handleEdit = (workflow: AdminWorkflow) => {
        setEditingWorkflow(workflow);
        setIsEditModalOpen(true);
    };

    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
        setEditingWorkflow(null);
    };

    const handleEditModalUpdate = (updatedWorkflow: AdminWorkflow, updatedDeploy: {[key: string]: boolean | null}) => {
        setWorkflows(prevWorkflows =>
            prevWorkflows.map(w =>
                w.key_value === updatedWorkflow.key_value ? updatedWorkflow : w
            )
        );
        setDeployed_list(prev => ({...prev, ...updatedDeploy}));
    };

    const handleDelete = (workflow: AdminWorkflow) => {
        showWorkflowDeleteConfirmKo(
            workflow.name,
            async () => {
                try {
                    await deleteWorkflowAdmin(workflow.user_id, workflow.name);
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

    const clearSearch = () => {
        setSearchQuery('');
    };

    return (
        <div className={styles.container}>
            {/* Header with Filters */}
            <div className={styles.header}>
                <div className={styles.headerActions}>
                    {/* 검색 기능 */}
                    <div className={styles.searchContainer}>
                        <FiSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="워크플로우명 또는 작성자명으로 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className={styles.clearButton}
                                title="검색 지우기"
                            >
                                <FiX />
                            </button>
                        )}
                    </div>

                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            {['all', 'active', 'inactive'].map(
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
                                              : '비활성'}
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
                                    <div
                                        className={`${styles.deployStatus} ${deployed_list[workflow.name] ? styles.statusDeployed : styles.statusNotDeployed}`}
                                    >
                                        {deployed_list[workflow.name] === null ? '배포 상태 오류' : deployed_list[workflow.name] ? '배포됨' : '미배포'}
                                    </div>
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
                                    <div className={styles.metaItem}>
                                        <FiUser />
                                        <span>{workflow.author}</span>
                                    </div>
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
                                    title="설정"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(workflow);
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
                        {searchQuery
                            ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
                            : '조건에 맞는 워크플로우가 없습니다.'
                        }
                    </p>
                </div>
            )}

            {editingWorkflow && (
                <AdminWorkflowEditModal
                    workflow={editingWorkflow}
                    isOpen={isEditModalOpen}
                    onClose={handleEditModalClose}
                    onUpdate={handleEditModalUpdate}
                />
            )}
        </div>
    );
};

export default AdminWorkflowControll;
