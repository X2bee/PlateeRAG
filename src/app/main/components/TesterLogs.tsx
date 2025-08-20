'use client'
import React, { useState, useEffect } from 'react';
import styles from '@/app/main/assets/TesterLogs.module.scss';
import { FiRefreshCw, FiDownload, FiEye, FiClock, FiDatabase } from 'react-icons/fi';
import { getWorkflowTesterIOLogs } from '@/app/api/workflowAPI';
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

    const toggleBatchExpansion = (batchId: string) => {
        setExpandedBatch(expandedBatch === batchId ? null : batchId);
    };

    const downloadBatchLogs = (batchGroup: BatchGroup) => {
        const csvContent = [
            'Log ID,Interaction ID,Input Data,Output Data,Updated At',
            ...batchGroup.in_out_logs.map(log => {
                const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
                return [
                    log.log_id,
                    escapeCsv(log.interaction_id),
                    escapeCsv(typeof log.input_data === 'string' ? log.input_data : JSON.stringify(log.input_data || {})),
                    escapeCsv(typeof log.output_data === 'string' ? log.output_data : JSON.stringify(log.output_data || {})),
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

    if (!workflow) {
        return (
            <div className={styles.testerLogsPanel}>
                <div className={styles.placeholder}>
                    <h3>워크플로우를 선택하세요</h3>
                    <p>
                        왼쪽 목록에서 워크플로우를 선택하면 배치 테스트 로그를 확인할 수 있습니다.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.testerLogsPanel}>
            {/* Header */}
            <div className={styles.testerLogsHeader}>
                <h3>{workflow.workflow_name.replace('.json', '')} - 배치 테스트 로그</h3>
                <div className={styles.headerActions}>
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
                <div className={styles.loadingContainer}>
                    <FiRefreshCw className={styles.spinning} />
                    <span>배치 로그를 불러오는 중...</span>
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
                    <FiDatabase />
                    <h4>배치 테스트 로그가 없습니다</h4>
                    <p>이 워크플로우에 대한 배치 테스트 실행 기록이 없습니다.</p>
                </div>
            )}

            {/* Batch Groups List */}
            {!loading && !error && batchGroups.length > 0 && (
                <div className={styles.batchGroupsContainer}>
                    <div className={styles.summaryInfo}>
                        <span>총 {batchGroups.length}개의 배치 그룹</span>
                        <span>총 {batchGroups.reduce((sum, group) => sum + group.in_out_logs.length, 0)}개의 로그 항목</span>
                    </div>

                    {batchGroups.map((batchGroup) => (
                        <div key={batchGroup.interaction_batch_id} className={styles.batchGroup}>
                            <div className={styles.batchHeader}>
                                <div className={styles.batchInfo}>
                                    <h4>배치 ID: {batchGroup.interaction_batch_id}</h4>
                                    <span className={styles.logCount}>
                                        <FiEye /> {batchGroup.in_out_logs.length}개 로그
                                    </span>
                                </div>
                                <div className={styles.batchActions}>
                                    <button
                                        onClick={() => downloadBatchLogs(batchGroup)}
                                        className={`${styles.btn} ${styles.download}`}
                                        title="CSV로 다운로드"
                                    >
                                        <FiDownload />
                                    </button>
                                    <button
                                        onClick={() => toggleBatchExpansion(batchGroup.interaction_batch_id)}
                                        className={`${styles.btn} ${styles.expand}`}
                                    >
                                        {expandedBatch === batchGroup.interaction_batch_id ? '접기' : '펼치기'}
                                    </button>
                                </div>
                            </div>

                            {expandedBatch === batchGroup.interaction_batch_id && (
                                <div className={styles.logsTable}>
                                    <div className={styles.logsHeader}>
                                        <div>Log ID</div>
                                        <div>입력 데이터</div>
                                        <div>출력 데이터</div>
                                        <div>실행 시간</div>
                                    </div>
                                    <div className={styles.logsBody}>
                                        {batchGroup.in_out_logs.map((log) => (
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
                                                    title={typeof log.output_data === 'string' ? log.output_data : JSON.stringify(log.output_data, null, 2)}
                                                >
                                                    {formatData(log.output_data)}
                                                </div>
                                                <div className={styles.logTime}>
                                                    <FiClock />
                                                    {formatDate(log.updated_at)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TesterLogs;
