'use client'
import React, { useState, useEffect, useRef } from 'react';
import styles from '@/app/main/assets/TesterLogs.module.scss';
import { FiRefreshCw, FiDownload, FiEye, FiClock, FiDatabase, FiTrash2, FiBarChart, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { getWorkflowTesterIOLogs, deleteWorkflowTesterIOLogs } from '@/app/api/workflowAPI';
import { devLog } from '@/app/_common/utils/logger';
import toast from 'react-hot-toast';
import TesterChartDashboard from './charts/TesterChartDashboard';
import { usePagesLayout } from '@/app/_common/components/PagesLayoutContent';

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
    const layoutContext = usePagesLayout();
    const sidebarWasOpenRef = useRef<boolean | null>(null);
    const [batchGroups, setBatchGroups] = useState<BatchGroup[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // 기본값을 desc(최신순)로 설정
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

    const formatData = (data: any, isOutputData: boolean = false) => {
        if (!data) return '-';
        if (typeof data === 'string') {
            const processedData = isOutputData ? parseActualOutput(data) : data;
            return processedData.length > 100 ? `${processedData.substring(0, 100)}...` : processedData;
        }
        return JSON.stringify(data).length > 100
            ? `${JSON.stringify(data).substring(0, 100)}...`
            : JSON.stringify(data);
    };

    const parseActualOutput = (output: string | null | undefined): string => {
        if (!output) return '';

        let cleanedOutput = output;

        cleanedOutput = cleanedOutput.replace(/<think>[\s\S]*?<\/think>/gi, '');

        if (cleanedOutput.includes('<TOOLUSELOG>') && cleanedOutput.includes('</TOOLUSELOG>')) {
            cleanedOutput = cleanedOutput.replace(/<TOOLUSELOG>[\s\S]*?<\/TOOLUSELOG>/g, '');
        }

        if (cleanedOutput.includes('<TOOLOUTPUTLOG>') && cleanedOutput.includes('</TOOLOUTPUTLOG>')) {
            cleanedOutput = cleanedOutput.replace(/<TOOLOUTPUTLOG>[\s\S]*?<\/TOOLOUTPUTLOG>/g, '');
        }

        if (cleanedOutput.includes('[Cite.') && cleanedOutput.includes('}]')) {
            cleanedOutput = cleanedOutput.replace(/\[Cite\.\s*\{[\s\S]*?\}\]/g, '');
        }

        return cleanedOutput.trim();
    };

    const getEarliestExecutionTime = (logs: LogEntry[]) => {
        if (logs.length === 0) return '-';

        const sortedLogs = logs.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
        return formatDate(sortedLogs[0].updated_at);
    };

    const getEarliestExecutionTimeRaw = (logs: LogEntry[]) => {
        if (logs.length === 0) return new Date(0);

        const sortedLogs = logs.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
        return new Date(sortedLogs[0].updated_at);
    };

    const getSortedBatchGroups = () => {
        return [...batchGroups].sort((a, b) => {
            const timeA = getEarliestExecutionTimeRaw(a.in_out_logs).getTime();
            const timeB = getEarliestExecutionTimeRaw(b.in_out_logs).getTime();

            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });
    };

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    };

    const toggleBatchExpansion = (batchId: string) => {
        setExpandedBatch(expandedBatch === batchId ? null : batchId);
    };

    const downloadBatchLogs = (batchGroup: BatchGroup) => {
        const csvContent = [
            'Log ID,Interaction ID,Input Data,Expected Output,Output Data,평가,Updated At',
            ...batchGroup.in_out_logs.map(log => {
                const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
                const score = (() => {
                    const scoreValue = (log as any).llm_eval_score;
                    if (scoreValue !== null && scoreValue !== undefined && !isNaN(scoreValue)) {
                        return parseFloat(scoreValue).toFixed(1);
                    }
                    return '0.0';
                })();
                return [
                    log.log_id,
                    escapeCsv(log.interaction_id),
                    escapeCsv(typeof log.input_data === 'string' ? log.input_data : JSON.stringify(log.input_data || {})),
                    escapeCsv(typeof log.expected_output === 'string' ? log.expected_output : JSON.stringify(log.expected_output || {})),
                    escapeCsv(typeof log.output_data === 'string' ? parseActualOutput(log.output_data) : JSON.stringify(log.output_data || {})),
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

        // Toast를 사용한 확인 메시지
        const confirmToast = new Promise<boolean>((resolve) => {
            toast((t) => (
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
                        배치 그룹 삭제
                    </div>
                    <div
                        style={{
                            fontSize: '0.9rem',
                            color: '#374151',
                            lineHeight: '1.4',
                        }}
                    >
                        정말로 &quot;<strong>{batchGroup.interaction_batch_id}</strong>&quot;를 삭제하시겠습니까?
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
                                resolve(false);
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
                            onClick={() => {
                                toast.dismiss(t.id);
                                resolve(true);
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
            ), {
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
            });
        });

        const confirmed = await confirmToast;
        if (!confirmed) return;

        try {
            const workflowName = workflow.workflow_name.replace('.json', '');
            const result = await deleteWorkflowTesterIOLogs(workflowName, batchGroup.interaction_batch_id) as any;

            devLog.log('Batch logs deleted successfully:', result);

            // 삭제 후 목록 새로고침
            await loadBatchLogs();

            // 성공 토스트 메시지
            toast.success(`${result.deleted_count || 0}개의 로그가 성공적으로 삭제되었습니다.`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '로그 삭제에 실패했습니다.';
            devLog.error('Failed to delete batch logs:', err);
            toast.error(`삭제 실패: ${errorMessage}`);
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
                        onClick={() => setIsChartDashboardOpen(true)}
                        disabled={loading || batchGroups.length === 0}
                        className={`${styles.btn} ${styles.chart}`}
                        title="차트 보기"
                    >
                        <FiBarChart />
                        차트보기
                    </button>
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h4>배치 그룹 목록</h4>
                                <button
                                    onClick={toggleSortOrder}
                                    className={`${styles.btn} ${styles.sortBtn}`}
                                    title={sortOrder === 'desc' ? '오래된 순으로 정렬' : '최신 순으로 정렬'}
                                >
                                    {sortOrder === 'desc' ? '최신순 ↓' : '오래된순 ↑'}
                                </button>
                            </div>
                            <div className={styles.batchGroupsList}>
                                {getSortedBatchGroups().map((batchGroup) => (
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
                                                    <span className={styles.statLabel}>정답률</span>
                                                    <div className={styles.statWithTooltip}>
                                                        <span className={styles.statValue}>
                                                            {(() => {
                                                                const validScores = batchGroup.in_out_logs.filter(log => {
                                                                    const score = (log as any).llm_eval_score;
                                                                    return score !== null && score !== undefined && !isNaN(score);
                                                                });

                                                                if (validScores.length === 0) {
                                                                    return "점수 없음";
                                                                }

                                                                const correctCount = batchGroup.in_out_logs.filter(log => {
                                                                    const score = (log as any).llm_eval_score;
                                                                    return score !== null && score !== undefined && !isNaN(score) && parseFloat(score) >= 0.5;
                                                                }).length;

                                                                const correctRate = (correctCount / validScores.length) * 100;
                                                                return `${correctRate.toFixed(1)}%`;
                                                            })()}
                                                        </span>
                                                        <div className={styles.tooltip}>
                                                            <div className={styles.tooltipContent}>
                                                                <div className={styles.tooltipTitle}>세부 점수</div>
                                                                <div className={styles.tooltipScore}>
                                                                    {(() => {
                                                                        const scores = batchGroup.in_out_logs.map(log => {
                                                                            const score = (log as any).llm_eval_score;
                                                                            return (score === null || score === undefined || isNaN(score)) ? 0.0 : parseFloat(score);
                                                                        });
                                                                        const validScores = batchGroup.in_out_logs.filter(log => {
                                                                            const score = (log as any).llm_eval_score;
                                                                            return score !== null && score !== undefined && !isNaN(score);
                                                                        });

                                                                        if (validScores.length === 0) {
                                                                            return "점수 없음";
                                                                        }

                                                                        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                                                                        const scorePercent = (avgScore * 100).toFixed(1);
                                                                        return `${scorePercent}%`;
                                                                    })()}
                                                                </div>
                                                                <div className={styles.tooltipDetails}>
                                                                    {(() => {
                                                                        const validScores = batchGroup.in_out_logs.filter(log => {
                                                                            const score = (log as any).llm_eval_score;
                                                                            return score !== null && score !== undefined && !isNaN(score);
                                                                        });

                                                                        if (validScores.length === 0) {
                                                                            return "평가 데이터가 없습니다";
                                                                        }

                                                                        const correctCount = batchGroup.in_out_logs.filter(log => {
                                                                            const score = (log as any).llm_eval_score;
                                                                            return score !== null && score !== undefined && !isNaN(score) && parseFloat(score) >= 0.5;
                                                                        }).length;

                                                                        return `정답: ${correctCount}개 / 전체: ${validScores.length}개`;
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
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
                                                    <div>정답여부</div>
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
                                                                title={typeof log.output_data === 'string' ? parseActualOutput(log.output_data) : JSON.stringify(log.output_data, null, 2)}
                                                            >
                                                                {formatData(log.output_data, true)}
                                                            </div>
                                                            <div className={styles.logCorrect}>
                                                                {(log as any).llm_eval_score !== undefined && !isNaN((log as any).llm_eval_score) ? (
                                                                    parseFloat((log as any).llm_eval_score) >= 0.5 ? (
                                                                        <FiCheckCircle style={{ color: 'green' }} />
                                                                    ) : (
                                                                        <FiXCircle style={{ color: 'red' }} />
                                                                    )
                                                                ) : '-'}
                                                            </div>
                                                            <div className={styles.logScore}>
                                                                {isNaN((log as any).llm_eval_score) ? 'NaN' : parseFloat((log as any).llm_eval_score).toFixed(2)}
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
            <TesterChartDashboard
                isOpen={isChartDashboardOpen}
                onClose={() => setIsChartDashboardOpen(false)}
                workflow={workflow}
                batchGroups={batchGroups}
            />
        </div>
    );
};

export default TesterLogs;
