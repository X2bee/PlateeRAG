'use client';
import React, { useState, useEffect } from 'react';
import {
    FiArrowLeft,
    FiPlay,
    FiClock,
    FiCheckCircle,
    FiRefreshCw,
    FiSearch,
    FiFilter,
    FiUser,
    FiUsers,
    FiFolder
} from 'react-icons/fi';
import styles from '@/app/main/chatSection/assets/WorkflowSelection.module.scss';
import { listWorkflowsDetail } from '@/app/api/workflow/workflowAPI';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';

interface Workflow {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    lastModified?: string;
    author: string;
    nodeCount: number;
    status: 'active' | 'draft' | 'archived';
    filename?: string;
    error?: string;
    is_shared?: boolean;
    share_group?: string | null;
    user_id: number;
}

interface WorkflowDetailResponse {
    id: number;
    workflow_name: string;
    workflow_id: string;
    username: string;
    user_id: number;
    full_name?: string;
    node_count: number;
    edge_count: number;
    updated_at: string;
    created_at: string;
    has_startnode: boolean;
    has_endnode: boolean;
    is_completed: boolean;
    is_shared: boolean;
    share_group: string | null;
    share_permissions: string;
    metadata: any;
    error?: string;
}

interface WorkflowSelectionProps {
    onBack: () => void;
    onSelectWorkflow: (workflow: Workflow) => void;
}

const WorkflowSelection: React.FC<WorkflowSelectionProps> = ({ onBack, onSelectWorkflow }) => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'draft'>('active');
    const [workflowFilter, setWorkflowFilter] = useState<'all' | 'personal' | 'shared'>('all');

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            setError(null);
            const workflowDetails = (await listWorkflowsDetail()) as WorkflowDetailResponse[];
            const transformedWorkflows: Workflow[] = workflowDetails
                .filter((detail: WorkflowDetailResponse) => {
                    // is_accepted가 false인 워크플로우는 완전히 제외
                    return (detail as any).is_accepted !== false;
                })
                .map((detail: WorkflowDetailResponse) => {
                    let status: 'active' | 'draft' | 'archived' = 'active';
                    if (
                        !detail.has_startnode ||
                        !detail.has_endnode ||
                        detail.node_count < 3
                    ) {
                        status = 'draft';
                    }

                    return {
                        id: detail.workflow_id,
                        name: detail.workflow_name.replace('.json', '') || detail.workflow_id,
                        author: detail.username || detail.full_name || 'Unknown',
                        nodeCount: detail.node_count,
                        lastModified: detail.updated_at,
                        status: status,
                        workflow_name: detail.workflow_name,
                        error: detail.error,
                        is_shared: detail.is_shared,
                        share_group: detail.share_group,
                        user_id: detail.user_id,
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

    const handleSelectWorkflow = (workflow: Workflow) => {
        if (workflow.status === 'active') {
            onSelectWorkflow(workflow);
            showSuccessToastKo(`"${workflow.name}" 워크플로우를 선택했습니다!`);
        } else {
            showErrorToastKo('활성 상태의 워크플로우만 선택할 수 있습니다.');
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <button className={styles.backButton} onClick={onBack}>
                        <FiArrowLeft />
                    </button>
                    <div>
                        <h2>워크플로우 선택</h2>
                        <p>새로운 대화를 시작할 워크플로우를 선택하세요.</p>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            {['all', 'active', 'draft'].map((filterType) => (
                                <button
                                    key={filterType}
                                    onClick={() => setFilter(filterType as any)}
                                    className={`${styles.filterButton} ${filter === filterType ? styles.active : ''}`}
                                >
                                    {filterType === 'all'
                                        ? '전체'
                                        : filterType === 'active'
                                          ? '활성'
                                          : '초안'}
                                </button>
                            ))}
                        </div>

                        <div className={styles.filterGroup}>
                            {['all', 'personal', 'shared'].map((filterType) => (
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
                            ))}
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
                            key={`${workflow.user_id}-${workflow.id}-${workflow.name}`}
                            className={`${styles.workflowCard} ${workflow.status !== 'active' ? styles.disabled : ''}`}
                            onClick={() => handleSelectWorkflow(workflow)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleSelectWorkflow(workflow);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.workflowIcon}>
                                    <FiFolder />
                                </div>
                                <div className={styles.statusContainer}>
                                    <div className={`${styles.status} ${getStatusColor(workflow.status)}`}>
                                        {getStatusText(workflow.status)}
                                    </div>
                                    <div className={`${styles.shareStatus} ${workflow.is_shared ? styles.statusShared : styles.statusPersonal}`}>
                                        {workflow.is_shared ? '공유' : '개인'}
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
                                    {workflow.share_group && (
                                        <div className={styles.metaItem}>
                                            <FiUsers />
                                            <span>조직: {workflow.share_group}</span>
                                        </div>
                                    )}
                                    {workflow.lastModified && (
                                        <div className={styles.metaItem}>
                                            <FiClock />
                                            <span>
                                                {new Date(workflow.lastModified).toLocaleDateString('ko-KR')}
                                            </span>
                                        </div>
                                    )}
                                    <div className={styles.metaItem}>
                                        <span>{workflow.nodeCount}개 노드</span>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && filteredWorkflows.length === 0 && (
                <div className={styles.emptyState}>
                    <FiFolder className={styles.emptyIcon} />
                    <h3>워크플로우가 없습니다</h3>
                    <p>아직 저장된 워크플로우가 없습니다. 새로운 워크플로우를 만들어보세요.</p>
                </div>
            )}
        </div>
    );
};

export default WorkflowSelection;
