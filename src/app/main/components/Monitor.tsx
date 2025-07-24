'use client';
import React, { useState, useEffect, useRef } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { FiBarChart2 } from 'react-icons/fi';
import { getWorkflowPerformance, deleteWorkflowPerformance } from '@/app/api/workflowAPI';
import { devLog } from '@/app/_common/utils/logger';
import toast from 'react-hot-toast';
import styles from '@/app/main/assets/Monitor.module.scss';
import ChartDashboard from './charts/ChartDashboard';
import { usePagesLayout } from '@/app/_common/components/PagesLayoutContent';

interface Workflow {
    workflow_name: string;
    workflow_id: string;
    node_count: number;
    updated_at: string;
    has_startnode: boolean;
    has_endnode: boolean;
}

interface PerformanceStats {
    node_id: string;
    node_name: string;
    avg_processing_time_ms: number;
    avg_cpu_usage_percent: number;
    avg_ram_usage_mb: number;
    avg_gpu_usage_percent: number | null;
    avg_gpu_memory_mb: number | null;
    execution_count: number;
    gpu_execution_count: number;
}

interface WorkflowPerformance {
    workflow_name: string;
    workflow_id: string;
    summary?: {
        total_executions: number;
        avg_total_processing_time_ms: number;
        avg_total_cpu_usage_percent: number;
        avg_total_ram_usage_mb: number;
        gpu_stats: any;
    };
    performance_stats: PerformanceStats[];
    message?: string; // 실행 기록이 없는 경우 API가 반환하는 메시지
}

interface WorkflowPartsProps {
    workflow: Workflow | null;
}

const Monitor: React.FC<WorkflowPartsProps> = ({ workflow }) => {
    const layoutContext = usePagesLayout();
    const sidebarWasOpenRef = useRef<boolean | null>(null);

    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
        null,
    );
    const [performanceData, setPerformanceData] =
        useState<WorkflowPerformance | null>(null);
    const [performanceLoading, setPerformanceLoading] = useState(false);
    const [deletingPerformance, setDeletingPerformance] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [noPerformanceData, setNoPerformanceData] = useState(false); // 실행 기록이 없는 경우를 위한 상태
    const [isChartDashboardOpen, setIsChartDashboardOpen] = useState(false);

    const isAnyModalOpen = isChartDashboardOpen

    useEffect(() => {
            if (layoutContext) {
                const { isSidebarOpen, setIsSidebarOpen } = layoutContext;
                if (isAnyModalOpen) {
                    if (sidebarWasOpenRef.current === null) {
                        sidebarWasOpenRef.current = isSidebarOpen;
                        if (isSidebarOpen) {
                            setIsSidebarOpen(false);
                        }
                    }
                } else {
                    if (sidebarWasOpenRef.current === true) {
                        setIsSidebarOpen(true);
                    }
                    sidebarWasOpenRef.current = null;
                }
            }
        }, [isAnyModalOpen, layoutContext]);

    useEffect(() => {
        loadPerformanceData(workflow);
    }, [workflow]);

    // 선택된 워크플로우의 성능 데이터 로드
    const loadPerformanceData = async (workflow: Workflow | null) => {
        if (workflow) {
            try {
                setPerformanceLoading(true);
                setError(null);
                setNoPerformanceData(false);
                const workflowName = workflow.workflow_name.replace('.json', '');
                const data = (await getWorkflowPerformance(
                    workflowName,
                    workflow.workflow_id,
                )) as WorkflowPerformance;

                // 실행 기록이 없는 경우 체크
                if (
                    data.message ===
                    'No performance data found for this workflow' ||
                    !data.performance_stats ||
                    data.performance_stats.length === 0
                ) {
                    setNoPerformanceData(true);
                    setPerformanceData(data);
                } else {
                    setNoPerformanceData(false);
                    setPerformanceData(data);
                }

                setSelectedWorkflow(workflow);
            } catch (err) {
                setError('성능 데이터를 불러오는데 실패했습니다.');
                devLog.error('Failed to load performance data:', err);
            } finally {
                setPerformanceLoading(false);
            }
        } else {
            setPerformanceData(null);
            setSelectedWorkflow(null);
            setNoPerformanceData(false);
        }
    };

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms.toFixed(2)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatMemory = (mb: number) => {
        if (mb < 1) return `${(mb * 1024).toFixed(1)}KB`;
        if (mb > 1024) return `${(mb / 1024).toFixed(2)}GB`;
        return `${mb.toFixed(2)}MB`;
    };

    // Handle performance data deletion with Toast confirmation (exactly like Executor)
    const clearPerformanceData = async () => {
        if (!selectedWorkflow) {
            return;
        }

        const workflowName = selectedWorkflow.workflow_name.replace('.json', '');

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
                        성능 데이터 삭제
                    </div>
                    <div
                        style={{
                            fontSize: '0.9rem',
                            color: '#374151',
                            lineHeight: '1.4',
                        }}
                    >
                        &quot;<strong>{workflowName}</strong>&quot; 워크플로우의 모든 성능 데이터를 삭제하시겠습니까?
                        <br />
                        이 작업은 되돌릴 수 없습니다.
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
                            취소
                        </button>
                        <button
                            onClick={async () => {
                                toast.dismiss(t.id);
                                try {
                                    setDeletingPerformance(true);
                                    setError(null);

                                    const result = await deleteWorkflowPerformance(
                                        workflowName,
                                        selectedWorkflow.workflow_id
                                    );

                                    // 성공 시 성능 데이터 초기화
                                    setPerformanceData(null);
                                    setNoPerformanceData(true);

                                    // 성공 토스트 메시지
                                    const deletedCount = (result as any).deleted_count || 0;
                                    toast.success(
                                        `"${workflowName}" 워크플로우의 성능 데이터가 성공적으로 삭제되었습니다! (${deletedCount}개 기록 제거됨)`,
                                    );
                                } catch (error) {
                                    console.error('Failed to delete performance data:', error);
                                    setError('성능 데이터 삭제에 실패했습니다.');
                                    toast.error(
                                        `성능 데이터 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                                    );
                                } finally {
                                    setDeletingPerformance(false);
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
                            삭제
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
        <>
            <div className={styles.performancePanel}>
                {!selectedWorkflow ? (
                    <div className={styles.placeholder}>
                        <h3>워크플로우를 선택하세요</h3>
                        <p>
                            왼쪽 목록에서 워크플로우를 선택하면 성능 모니터링
                            정보를 확인할 수 있습니다.
                        </p>
                    </div>
                ) : noPerformanceData ? (
                    <div className={styles.placeholder}>
                        <h3>실행 기록이 없습니다</h3>
                        <p>
                            &quot;
                            <strong>
                                {selectedWorkflow.workflow_name.replace('.json', '')}
                            </strong>
                            &quot; 워크플로우의 실행 기록이 없습니다.
                            <br />
                            워크플로우를 먼저 실행한 후에 모니터링 데이터를
                            확인할 수 있습니다.
                        </p>
                        <button
                            onClick={() =>
                                loadPerformanceData(selectedWorkflow)
                            }
                            className={styles.refreshButton}
                            disabled={performanceLoading}
                        >
                            {performanceLoading ? '로딩 중...' : '새로고침'}
                        </button>
                    </div>
                ) : performanceData ? (
                    <div className={styles.performanceData}>
                        <div className={styles.performanceHeader}>
                            <h3>
                                {performanceData.workflow_name} 성능 모니터링
                            </h3>
                            <div className={styles.headerActions}>
                                <button
                                    onClick={() => setIsChartDashboardOpen(true)}
                                    className={`${styles.refreshButton} ${styles.chartButton}`}
                                    disabled={performanceLoading}
                                >
                                    <FiBarChart2 style={{marginRight: '8px'}} />
                                    차트 보기
                                </button>
                                <button
                                    onClick={() =>
                                        loadPerformanceData(selectedWorkflow)
                                    }
                                    className={styles.refreshButton}
                                    disabled={performanceLoading}
                                >
                                    {performanceLoading ? '로딩 중...' : '새로고침'}
                                </button>
                                {performanceData.performance_stats && performanceData.performance_stats.length > 0 && (
                                    <button
                                        className={styles.clearRecordsBtn}
                                        onClick={clearPerformanceData}
                                        disabled={deletingPerformance}
                                        title="기록 초기화"
                                    >
                                        <FiTrash2 />
                                        {deletingPerformance ? '삭제 중...' : '기록 초기화'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 전체 요약 */}
                        <div className={styles.summarySection}>
                            <h4>전체 요약</h4>
                            <div className={styles.summaryGrid}>
                                <div className={styles.summaryItem}>
                                    <span className={styles.label}>
                                        총 실행 횟수
                                    </span>
                                    <span className={styles.value}>
                                        {performanceData.summary
                                            ?.total_executions || 0}
                                        회
                                    </span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.label}>
                                        평균 처리 시간
                                    </span>
                                    <span className={styles.value}>
                                        {formatTime(
                                            performanceData.summary
                                                ?.avg_total_processing_time_ms ||
                                            0,
                                        )}
                                    </span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.label}>
                                        평균 CPU 사용률
                                    </span>
                                    <span className={styles.value}>
                                        {(
                                            performanceData.summary
                                                ?.avg_total_cpu_usage_percent ||
                                            0
                                        ).toFixed(2)}
                                        %
                                    </span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.label}>
                                        평균 RAM 사용량
                                    </span>
                                    <span className={styles.value}>
                                        {formatMemory(
                                            performanceData.summary
                                                ?.avg_total_ram_usage_mb || 0,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 노드별 성능 */}
                        <div className={styles.nodePerformanceSection}>
                            <h4>노드별 성능</h4>
                            <div className={styles.nodePerformanceList}>
                                {performanceData.performance_stats.map(
                                    (node) => (
                                        <div
                                            key={node.node_id}
                                            className={
                                                styles.nodePerformanceItem
                                            }
                                        >
                                            <div className={styles.nodeHeader}>
                                                <h5>{node.node_name}</h5>
                                                <span className={styles.nodeId}>
                                                    {node.node_id}
                                                </span>
                                            </div>
                                            <div className={styles.nodeStats}>
                                                <div className={styles.stat}>
                                                    <span
                                                        className={
                                                            styles.statLabel
                                                        }
                                                    >
                                                        실행 횟수
                                                    </span>
                                                    <span
                                                        className={
                                                            styles.statValue
                                                        }
                                                    >
                                                        {node.execution_count ||
                                                            0}
                                                        회
                                                    </span>
                                                </div>
                                                <div className={styles.stat}>
                                                    <span
                                                        className={
                                                            styles.statLabel
                                                        }
                                                    >
                                                        평균 처리 시간
                                                    </span>
                                                    <span
                                                        className={
                                                            styles.statValue
                                                        }
                                                    >
                                                        {formatTime(
                                                            node.avg_processing_time_ms,
                                                        ) || 0}
                                                    </span>
                                                </div>
                                                <div className={styles.stat}>
                                                    <span
                                                        className={
                                                            styles.statLabel
                                                        }
                                                    >
                                                        평균 CPU 사용률
                                                    </span>
                                                    <span
                                                        className={
                                                            styles.statValue
                                                        }
                                                    >
                                                        {node.avg_cpu_usage_percent.toFixed(
                                                            2,
                                                        ) || 0}
                                                        %
                                                    </span>
                                                </div>
                                                <div className={styles.stat}>
                                                    <span
                                                        className={
                                                            styles.statLabel
                                                        }
                                                    >
                                                        평균 RAM 사용량
                                                    </span>
                                                    <span
                                                        className={
                                                            styles.statValue
                                                        }
                                                    >
                                                        {formatMemory(
                                                            node.avg_ram_usage_mb,
                                                        ) || 0}
                                                    </span>
                                                </div>
                                                {node.avg_gpu_usage_percent !==
                                                    null && (
                                                        <>
                                                            <div
                                                                className={
                                                                    styles.stat
                                                                }
                                                            >
                                                                <span
                                                                    className={
                                                                        styles.statLabel
                                                                    }
                                                                >
                                                                    GPU 사용률
                                                                </span>
                                                                <span
                                                                    className={
                                                                        styles.statValue
                                                                    }
                                                                >
                                                                    {node.avg_gpu_usage_percent.toFixed(
                                                                        2,
                                                                    ) || 0}
                                                                    %
                                                                </span>
                                                            </div>
                                                            <div
                                                                className={
                                                                    styles.stat
                                                                }
                                                            >
                                                                <span
                                                                    className={
                                                                        styles.statLabel
                                                                    }
                                                                >
                                                                    GPU 메모리
                                                                </span>
                                                                <span
                                                                    className={
                                                                        styles.statValue
                                                                    }
                                                                >
                                                                    {formatMemory(
                                                                        node.avg_gpu_memory_mb ||
                                                                        0,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                ) : performanceLoading ? (
                    <div className={styles.performanceLoading}>
                        <div className={styles.loadingSpinner}></div>
                        <span>성능 데이터를 불러오는 중...</span>
                    </div>
                ) : (
                    <div className={styles.error}>
                        성능 데이터를 불러올 수 없습니다.
                    </div>
                )}
            </div>
            <ChartDashboard
                isOpen={isChartDashboardOpen}
                onClose={() => setIsChartDashboardOpen(false)}
                workflow={selectedWorkflow}
            />
        </>
    );
};

export default Monitor;
