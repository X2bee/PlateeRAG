'use client';
import React, { useState, useEffect } from 'react';
import {
    FiFolder,
    FiUser,
    FiClock,
    FiRefreshCw,
    FiArrowLeft,
} from 'react-icons/fi';
import styles from '@/app/chat/assets/WorkflowSelection.module.scss';
import { listWorkflowsDetail } from '@/app/api/workflowAPI';
import toast from 'react-hot-toast';

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
}

interface WorkflowDetailResponse {
    workflow_name: string;
    workflow_id: string;
    node_count: number;
    updated_at: string;
    user_name?: string;
    has_startnode: boolean;
    has_endnode: boolean;
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

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            setError(null);
            const workflowDetails = (await listWorkflowsDetail()) as WorkflowDetailResponse[];
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

                    return {
                        id: detail.workflow_id,
                        name: detail.workflow_name.replace('.json', '') || detail.workflow_id,
                        author: detail.user_name || 'Unknown',
                        nodeCount: detail.node_count,
                        lastModified: detail.updated_at,
                        status: status,
                        workflow_name: detail.workflow_name,
                        error: detail.error,
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

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const filteredWorkflows = workflows.filter(
        (workflow) => filter === 'all' || workflow.status === filter,
    );

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
            toast.success(`"${workflow.name}" 워크플로우를 선택했습니다!`);
        } else {
            toast.error('활성 상태의 워크플로우만 선택할 수 있습니다.');
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
                            key={workflow.name}
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
                                <div className={`${styles.status} ${getStatusColor(workflow.status)}`}>
                                    {getStatusText(workflow.status)}
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
