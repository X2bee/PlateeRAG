'use client'
import React, { useState, useEffect } from 'react';
import styles from '@/app/main/assets/TesterLogs.module.scss';
import { FiRefreshCw, FiDownload, FiEye, FiClock, FiDatabase, FiTrash2 } from 'react-icons/fi';
import { getWorkflowTesterIOLogs, deleteWorkflowTesterIOLogs } from '@/app/api/workflowAPI';
import { devLog } from '@/app/_common/utils/logger';

interface Workflow {
    id: number;
    workflow_name: string;
    workflow_id: string;
    node_count: number;
    updated_at: string;
    has_startnode: boolean;
    has_endnode: boolean;
}

interface LogEntry {
    log_id: number;
    interaction_id: string;
    workflow_name: string;
    workflow_id: string;
    input_data: any;
    output_data: any;
    expected_output: any;
    execution_time?: number;
    updated_at: string;
}

interface BatchGroup {
    workflow_name: string;
    interaction_batch_id: string;
    in_out_logs: LogEntry[];
    message: string;
}

interface TesterLogsProps {
    workflow: Workflow | null;
}

const TesterLogs: React.FC<TesterLogsProps> = ({ workflow }) => {
    const [batchGroups, setBatchGroups] = useState<BatchGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

    useEffect(() => {
        if (workflow) {
            loadBatchLogs();
        }
    }, [workflow]);

    const loadBatchLogs = async () => {
        if (!workflow) return;

        try {
            setLoading(true);
            setError(null);

            const workflowName = workflow.workflow_name.replace('.json', '');
            const result = await getWorkflowTesterIOLogs(workflowName) as any;

            setBatchGroups(result.response_data_list || []);
            devLog.log('Batch logs loaded:', result.response_data_list?.length || 0, 'batch groups');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '로그를 불러오는데 실패했습니다.';
            setError(errorMessage);
            devLog.error('Failed to load batch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR');
    };

    const formatData = (data: any) => {
        if (!data) return '-';
        if (typeof data === 'string') {
            return data.length > 100 ? `${data.substring(0, 100)}...` : data;
        }
        return JSON.stringify(data).length > 100
            ? `${JSON.stringify(data).substring(0, 100)}...`
            : JSON.stringify(data);
    };

    const getEarliestExecutionTime = (logs: LogEntry[]) => {
        if (logs.length === 0) return '-';

        const sortedLogs = logs.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
        return formatDate(sortedLogs[0].updated_at);
    };

    const toggleBatchExpansion = (batchId: string) => {
        setExpandedBatch(expandedBatch === batchId ? null : batchId);
    };

    const downloadBatchLogs = (batchGroup: BatchGroup) => {
        const csvContent = [
            'Log ID,Interaction ID,Input Data,Expected Output,Output Data,평가,Updated At',
            ...batchGroup.in_out_logs.map(log => {
                const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
                const score = (log as any).llm_eval_score !== undefined
                    ? parseFloat((log as any).llm_eval_score).toFixed(1)
                    : '0.0';
                return [
                    log.log_id,
                    escapeCsv(log.interaction_id),
                    escapeCsv(typeof log.input_data === 'string' ? log.input_data : JSON.stringify(log.input_data || {})),
                    escapeCsv(typeof log.expected_output === 'string' ? log.expected_output : JSON.stringify(log.expected_output || {})),
                    escapeCsv(typeof log.output_data === 'string' ? log.output_data : JSON.stringify(log.output_data || {})),
                    score,
                    escapeCsv(log.updated_at)
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `batch_logs_${batchGroup.interaction_batch_id.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const deleteBatchLogs = async (batchGroup: BatchGroup) => {
        if (!workflow) return;

        const confirmDelete = window.confirm(
            `배치 그룹 "${batchGroup.interaction_batch_id}"의 로그를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
        );

        if (!confirmDelete) return;

        try {
            const workflowName = workflow.workflow_name.replace('.json', '');
            const result = await deleteWorkflowTesterIOLogs(workflowName, batchGroup.interaction_batch_id) as any;

            devLog.log('Batch logs deleted successfully:', result);

            // 삭제 후 목록 새로고침
            await loadBatchLogs();

            // 성공 메시지 (선택사항)
            alert(`${result.deleted_count || 0}개의 로그가 성공적으로 삭제되었습니다.`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '로그 삭제에 실패했습니다.';
            devLog.error('Failed to delete batch logs:', err);
            alert(`삭제 실패: ${errorMessage}`);
        }
    };

    if (!workflow) {
        return (
            <div className={styles.testerLogsPanel}>
                <div className={styles.placeholder}>
                    <h3>워크플로우를 선택하세요</h3>
                    <p>
                        왼쪽 목록에서 워크플로우를 선택하면 테스터 로그를 확인할 수 있습니다.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.testerLogsPanel}>
            {/* Header */}
            <div className={styles.testerLogsHeader}>
                <h3>{workflow.workflow_name.replace('.json', '')} - 테스터 로그</h3>
                <div className={styles.headerActions}>
                    <div className={styles.recordCount}>
                        <span>총 {batchGroups.reduce((sum, group) => sum + group.in_out_logs.length, 0)}개 로그</span>
                    </div>
                    <button
                        onClick={loadBatchLogs}
                        disabled={loading}
                        className={`${styles.btn} ${styles.refresh}`}
                    >
                        {loading ? <FiRefreshCw className={styles.spinning} /> : <FiRefreshCw />}
                        새로고침
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className={styles.testerLogsLoading}>
                    <div className={styles.loadingSpinner}></div>
                    <span>테스터 로그를 불러오는 중...</span>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className={styles.errorContainer}>
                    <p>오류: {error}</p>
                    <button onClick={loadBatchLogs} className={styles.retryBtn}>
                        다시 시도
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && batchGroups.length === 0 && (
                <div className={styles.emptyState}>
                    <h4>테스터 로그가 없습니다</h4>
                    <p>이 워크플로우에 대한 테스터 실행 기록이 없습니다.</p>
                </div>
            )}

            {/* Batch Groups List */}
            {!loading && !error && batchGroups.length > 0 && (
                <div className={styles.testerLogsData}>
                    {/* Summary Section */}
                    <div className={styles.summarySection}>
                        <h4>실행 통계</h4>
                        <div className={styles.summaryGrid}>
                            <div className={styles.summaryItem}>
                                <span className={styles.label}>총 그룹</span>
                                <span className={styles.value}>{batchGroups.length}개</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.label}>총 로그 항목</span>
                                <span className={styles.value}>{batchGroups.reduce((sum, group) => sum + group.in_out_logs.length, 0)}개</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.label}>평균 그룹 크기</span>
                                <span className={styles.value}>
                                    {Math.round(batchGroups.reduce((sum, group) => sum + group.in_out_logs.length, 0) / batchGroups.length)}개
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Batch Groups Section */}
                    <div className={styles.batchGroupsContainer}>
                        <div className={styles.batchGroupsSection}>
                            <h4>배치 그룹 목록</h4>
                            <div className={styles.batchGroupsList}>
                                {batchGroups.map((batchGroup) => (
                                    <div key={batchGroup.interaction_batch_id} className={styles.batchGroup}>
                                        <div
                                            className={styles.batchHeader}
                                            onClick={() => toggleBatchExpansion(batchGroup.interaction_batch_id)}
                                        >
                                            <div className={styles.batchInfo}>
                                                <h5>ID: {batchGroup.interaction_batch_id}</h5>
                                                <div className={styles.batchId}>
                                                    {getEarliestExecutionTime(batchGroup.in_out_logs)}
                                                </div>
                                            </div>
                                            <div className={styles.batchStats}>
                                                <div className={styles.stat}>
                                                    <span className={styles.statLabel}>로그 개수</span>
                                                    <span className={styles.statValue}>{batchGroup.in_out_logs.length}개</span>
                                                </div>
                                                <div className={styles.stat}>
                                                    <span className={styles.statLabel}>상태</span>
                                                    <span className={styles.statValue}>완료</span>
                                                </div>
                                            </div>
                                            <div className={styles.batchActions}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        downloadBatchLogs(batchGroup);
                                                    }}
                                                    className={`${styles.btn} ${styles.download}`}
                                                    title="CSV로 다운로드"
                                                >
                                                    <FiDownload />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteBatchLogs(batchGroup);
                                                    }}
                                                    className={`${styles.btn} ${styles.delete}`}
                                                    title="배치 로그 삭제"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>

                                        {expandedBatch === batchGroup.interaction_batch_id && (
                                            <div className={styles.logsTable}>
                                                <div className={styles.logsHeader}>
                                                    <div>Log ID</div>
                                                    <div>입력 데이터</div>
                                                    <div>기대 답변</div>
                                                    <div>출력 데이터</div>
                                                    <div>평가</div>
                                                </div>
                                                <div className={styles.logsBody}>
                                                    {batchGroup.in_out_logs
                                                        .sort((a, b) => a.log_id - b.log_id)
                                                        .map((log) => (
                                                        <div key={log.log_id} className={styles.logRow}>
                                                            <div className={styles.logId}>{log.log_id}</div>
                                                            <div
                                                                className={styles.logData}
                                                                title={typeof log.input_data === 'string' ? log.input_data : JSON.stringify(log.input_data, null, 2)}
                                                            >
                                                                {formatData(log.input_data)}
                                                            </div>
                                                            <div
                                                                className={styles.logData}
                                                                title={typeof log.expected_output === 'string' ? log.expected_output : JSON.stringify(log.expected_output, null, 2)}
                                                            >
                                                                {formatData(log.expected_output)}
                                                            </div>
                                                            <div
                                                                className={styles.logData}
                                                                title={typeof log.output_data === 'string' ? log.output_data : JSON.stringify(log.output_data, null, 2)}
                                                            >
                                                                {formatData(log.output_data)}
                                                            </div>
                                                            <div className={styles.logScore}>
                                                                {(log as any).llm_eval_score !== undefined
                                                                    ? parseFloat((log as any).llm_eval_score).toFixed(1)
                                                                    : '0.0'
                                                                }
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TesterLogs;
