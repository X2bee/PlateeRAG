"use client";
import React, { useState, useEffect } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { getWorkflowList, getWorkflowPerformance } from "@/app/api/workflowAPI";
import { devLog } from "@/app/utils/logger";
import styles from "@/app/main/assets/Monitoring.module.scss";

interface WorkflowInfo {
    filename: string;
    workflow_id: string;
    node_count: number;
    last_modified: string;
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
    summary: {
        total_executions: number;
        avg_total_processing_time_ms: number;
        avg_total_cpu_usage_percent: number;
        avg_total_ram_usage_mb: number;
        gpu_stats: any;
    };
    performance_stats: PerformanceStats[];
}

const Monitoring: React.FC = () => {
    const [workflows, setWorkflows] = useState<WorkflowInfo[]>([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInfo | null>(null);
    const [performanceData, setPerformanceData] = useState<WorkflowPerformance | null>(null);
    const [workflowListLoading, setWorkflowListLoading] = useState(false);
    const [performanceLoading, setPerformanceLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadWorkflowList();
    }, []);

    const loadWorkflowList = async () => {
        try {
            setWorkflowListLoading(true);
            setError(null);
            const data = await getWorkflowList() as { workflows: WorkflowInfo[] };
            setWorkflows(data.workflows || []);
        } catch (err) {
            setError("워크플로우 목록을 불러오는데 실패했습니다.");
            devLog.error("Failed to load workflow list:", err);
        } finally {
            setWorkflowListLoading(false);
        }
    };

    // 선택된 워크플로우의 성능 데이터 로드
    const loadPerformanceData = async (workflow: WorkflowInfo) => {
        try {
            setPerformanceLoading(true);
            setError(null);
            const workflowName = workflow.filename.replace('.json', '');
            const data = await getWorkflowPerformance(workflowName, workflow.workflow_id) as WorkflowPerformance;
            setPerformanceData(data);
            setSelectedWorkflow(workflow);
        } catch (err) {
            setError("성능 데이터를 불러오는데 실패했습니다.");
            devLog.error("Failed to load performance data:", err);
        } finally {
            setPerformanceLoading(false);
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

    return (
        <div className={styles.monitoringContainer}>        <div className={styles.workflowList}>
            <div className={styles.workflowListHeader}>
                <h3>워크플로우 목록</h3>
                <button 
                    onClick={loadWorkflowList}
                    className={styles.workflowRefreshButton}
                    disabled={workflowListLoading}
                    title="목록 새로고침"
                >
                    <FiRefreshCw className={workflowListLoading ? styles.spinning : ''} />
                </button>
            </div>
            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.workflowItems}>
                {workflowListLoading ? (
                    <div className={styles.workflowLoading}>
                        <div className={styles.loadingSpinner}></div>
                        <span>워크플로우 목록을 불러오는 중...</span>
                    </div>
                ) : workflows.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span>저장된 워크플로우가 없습니다</span>
                    </div>
                ) : (
                    workflows.map((workflow) => (
                        <div
                            key={workflow.workflow_id}
                            className={`${styles.workflowItem} ${
                                selectedWorkflow?.workflow_id === workflow.workflow_id ? styles.selected : ''
                            }`}
                            onClick={() => loadPerformanceData(workflow)}
                        >
                            <div className={styles.workflowName}>
                                {workflow.filename.replace('.json', '')}
                            </div>
                            <div className={styles.workflowInfo}>
                                <span>노드: {workflow.node_count}개</span>
                                <span>수정: {new Date(workflow.last_modified).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

            <div className={styles.performancePanel}>
                {!selectedWorkflow ? (
                    <div className={styles.placeholder}>
                        <h3>워크플로우를 선택하세요</h3>
                        <p>왼쪽 목록에서 워크플로우를 선택하면 성능 모니터링 정보를 확인할 수 있습니다.</p>
                    </div>
                ) : performanceData ? (
                    <div className={styles.performanceData}>
                        <div className={styles.performanceHeader}>
                            <h3>{performanceData.workflow_name} 성능 모니터링</h3>
                            <button 
                                onClick={() => loadPerformanceData(selectedWorkflow)}
                                className={styles.refreshButton}
                                disabled={performanceLoading}
                            >
                                {performanceLoading ? "로딩 중..." : "새로고침"}
                            </button>
                        </div>

                        {/* 전체 요약 */}
                        <div className={styles.summarySection}>
                            <h4>전체 요약</h4>
                            <div className={styles.summaryGrid}>
                                <div className={styles.summaryItem}>
                                    <span className={styles.label}>총 실행 횟수</span>
                                    <span className={styles.value}>{performanceData.summary.total_executions}회</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.label}>평균 처리 시간</span>
                                    <span className={styles.value}>
                                        {formatTime(performanceData.summary.avg_total_processing_time_ms)}
                                    </span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.label}>평균 CPU 사용률</span>
                                    <span className={styles.value}>
                                        {performanceData.summary.avg_total_cpu_usage_percent.toFixed(2)}%
                                    </span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.label}>평균 RAM 사용량</span>
                                    <span className={styles.value}>
                                        {formatMemory(performanceData.summary.avg_total_ram_usage_mb)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 노드별 성능 */}
                        <div className={styles.nodePerformanceSection}>
                            <h4>노드별 성능</h4>
                            <div className={styles.nodePerformanceList}>
                                {performanceData.performance_stats.map((node) => (
                                    <div key={node.node_id} className={styles.nodePerformanceItem}>
                                        <div className={styles.nodeHeader}>
                                            <h5>{node.node_name}</h5>
                                            <span className={styles.nodeId}>{node.node_id}</span>
                                        </div>
                                        <div className={styles.nodeStats}>
                                            <div className={styles.stat}>
                                                <span className={styles.statLabel}>실행 횟수</span>
                                                <span className={styles.statValue}>{node.execution_count}회</span>
                                            </div>
                                            <div className={styles.stat}>
                                                <span className={styles.statLabel}>평균 처리 시간</span>
                                                <span className={styles.statValue}>
                                                    {formatTime(node.avg_processing_time_ms)}
                                                </span>
                                            </div>
                                            <div className={styles.stat}>
                                                <span className={styles.statLabel}>평균 CPU 사용률</span>
                                                <span className={styles.statValue}>
                                                    {node.avg_cpu_usage_percent.toFixed(2)}%
                                                </span>
                                            </div>
                                            <div className={styles.stat}>
                                                <span className={styles.statLabel}>평균 RAM 사용량</span>
                                                <span className={styles.statValue}>
                                                    {formatMemory(node.avg_ram_usage_mb)}
                                                </span>
                                            </div>
                                            {node.avg_gpu_usage_percent !== null && (
                                                <>
                                                    <div className={styles.stat}>
                                                        <span className={styles.statLabel}>GPU 사용률</span>
                                                        <span className={styles.statValue}>
                                                            {node.avg_gpu_usage_percent.toFixed(2)}%
                                                        </span>
                                                    </div>
                                                    <div className={styles.stat}>
                                                        <span className={styles.statLabel}>GPU 메모리</span>
                                                        <span className={styles.statValue}>
                                                            {formatMemory(node.avg_gpu_memory_mb || 0)}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : performanceLoading ? (
                    <div className={styles.performanceLoading}>
                        <div className={styles.loadingSpinner}></div>
                        <span>성능 데이터를 불러오는 중...</span>
                    </div>
                ) : (
                    <div className={styles.error}>성능 데이터를 불러올 수 없습니다.</div>
                )}
            </div>
        </div>
    );
};

export default Monitoring;
