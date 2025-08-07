'use client';
import React, { useState, useEffect } from 'react';
import {
    FiFolder,
    FiPlay,
    FiEdit,
    FiTrash2,
    FiUser,
    FiClock,
    FiRefreshCw,
} from 'react-icons/fi';
import styles from '@/app/main/assets/CompletedWorkflows.module.scss';
import { listWorkflowsDetail, deleteWorkflow } from '@/app/api/workflowAPI';
import { useRouter } from 'next/navigation';
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
    key_value?: number;
}

interface WorkflowDetailResponse {
    id: number;
    workflow_name: string;
    workflow_id: string;
    user_name: string;
    node_count: number;
    updated_at: string;
    has_startnode: boolean;
    has_endnode: boolean;
    error?: string;
}

const CompletedWorkflows: React.FC = () => {
    const router = useRouter();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<
        'all' | 'active' | 'draft' | 'archived'
    >('all');

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

                    return {
                        key_value: detail.id,
                        id: detail.workflow_id,
                        name:
                            detail.workflow_name,
                        author: detail.user_name,
                        nodeCount: detail.node_count,
                        lastModified: detail.updated_at,
                        status: status,
                        filename: `${detail.workflow_name}.json`,
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

    // Handle workflow execution
    const handleExecute = (workflow: Workflow) => {
        // 채팅 페이지로 이동하며 새 채팅 모드와 선택된 워크플로우 정보 전달
        router.push(
            `/chat?mode=new-chat&workflowName=${encodeURIComponent(workflow.name)}&workflowId=${encodeURIComponent(workflow.id)}`,
        );
    };

    // Handle workflow editing
    const handleEdit = (workflow: Workflow) => {
        router.push(
            `/canvas?load=${encodeURIComponent(workflow.name)}`,
        );
    };

    // Handle workflow deletion with Toast confirmation
    const handleDelete = (workflow: Workflow) => {
        const confirmToast = toast(
            (t) => (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                    }}
                >
                    <div
                        style={{
                            fontWeight: '600',
                            color: '#dc2626',
                            fontSize: '1rem',
                        }}
                    >
                        Delete Workflow
                    </div>
                    <div
                        style={{
                            fontSize: '0.9rem',
                            color: '#374151',
                            lineHeight: '1.4',
                        }}
                    >
                        Are you sure you want to delete &quot;
                        <strong>{workflow.name}</strong>&quot;?
                        <br />
                        This action cannot be undone.
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'flex-end',
                            marginTop: '4px',
                        }}
                    >
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#ffffff',
                                border: '2px solid #6b7280',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                color: '#374151',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                toast.dismiss(t.id);
                                try {
                                    await deleteWorkflow(workflow.name);
                                    toast.success(
                                        `Workflow "${workflow.name}" deleted successfully!`,
                                    );
                                    fetchWorkflows(); // 목록 새로고침
                                } catch (error) {
                                    console.error(
                                        'Failed to delete workflow:',
                                        error,
                                    );
                                    toast.error(
                                        `Failed to delete workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                    );
                                }
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: '2px solid #b91c1c',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ),
            {
                duration: Infinity,
                style: {
                    maxWidth: '420px',
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    border: '2px solid #374151',
                    borderRadius: '12px',
                    boxShadow:
                        '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                    color: '#374151',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                },
            },
        );
    };

    return (
        <div className={styles.container}>
            {/* Header with Filters */}
            <div className={styles.header}>

                <div className={styles.headerActions}>
                    <div className={styles.filters}>
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
                                <div
                                    className={`${styles.status} ${getStatusColor(workflow.status)}`}
                                >
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
                                                {new Date(
                                                    workflow.lastModified,
                                                ).toLocaleDateString('ko-KR')}
                                            </span>
                                        </div>
                                    )}
                                    <div className={styles.metaItem}>
                                        <span>{workflow.nodeCount}개 노드</span>
                                    </div>
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
                        아직 저장된 워크플로우가 없습니다. 새로운 워크플로우를
                        만들어보세요.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CompletedWorkflows;
