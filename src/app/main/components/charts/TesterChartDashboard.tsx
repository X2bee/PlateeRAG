'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { FiX, FiLoader } from 'react-icons/fi';
import styles from '@/app/main/assets/ChartDashboard.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import ChartPlaceholder from './ChartPlaceholder';

const TesterChart = dynamic(() => import('./TesterChart'), {
    ssr: false,
    loading: () => <div className={styles.chartLoader}>Loading Chart...</div>
});

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

interface Workflow {
    id: number;
    workflow_name: string;
    workflow_id: string;
    node_count: number;
    updated_at: string;
    has_startnode: boolean;
    has_endnode: boolean;
}

interface TesterChartDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    workflow: Workflow | null;
    batchGroups: BatchGroup[];
}

const TesterChartDashboard: React.FC<TesterChartDashboardProps> = ({
    isOpen,
    onClose,
    workflow,
    batchGroups
}) => {
    const [chartData, setChartData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const workflowName = useMemo(() => workflow?.workflow_name.replace('.json', ''), [workflow]);

    const getEarliestExecutionTimeRaw = (logs: LogEntry[]) => {
        if (logs.length === 0) return new Date(0);
        const sortedLogs = logs.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
        return new Date(sortedLogs[0].updated_at);
    };

    const calculateAverageScore = (logs: LogEntry[]) => {
        devLog.log('Calculating average score for logs:', logs);

        const scores = logs.map(log => {
            const score = (log as any).llm_eval_score;
            const parsedScore = (score === null || score === undefined || isNaN(score)) ? 0.0 : parseFloat(score);
            devLog.log(`Log ${log.log_id}: raw score = ${score}, parsed = ${parsedScore}`);
            return parsedScore;
        });

        const validScores = logs.filter(log => {
            const score = (log as any).llm_eval_score;
            return score !== null && score !== undefined && !isNaN(score);
        });

        devLog.log(`Valid scores count: ${validScores.length} out of ${logs.length}`);
        devLog.log('All scores:', scores);

        if (validScores.length === 0) {
            devLog.log('No valid scores found, returning 0');
            return 0;
        }

        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        devLog.log(`Average score calculated: ${average}`);
        return average;
    };

    useEffect(() => {
        if (isOpen && workflow && batchGroups.length > 0) {
            devLog.log('TesterChartDashboard received data:', {
                workflow: workflow,
                batchGroupsLength: batchGroups.length,
                batchGroups: batchGroups
            });

            setIsLoading(true);
            setError(null);

            try {
                // 시간순으로 정렬된 배치 그룹들
                const sortedBatchGroups = [...batchGroups].sort((a, b) => {
                    const timeA = getEarliestExecutionTimeRaw(a.in_out_logs).getTime();
                    const timeB = getEarliestExecutionTimeRaw(b.in_out_logs).getTime();
                    return timeA - timeB; // 오래된 순부터 최신순으로
                });

                devLog.log('Sorted batch groups:', sortedBatchGroups);

                const labels = sortedBatchGroups.map(group => {
                    const date = getEarliestExecutionTimeRaw(group.in_out_logs);
                    return date.toLocaleString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                });

                const scores = sortedBatchGroups.map(group => {
                    const avgScore = calculateAverageScore(group.in_out_logs);
                    devLog.log(`Batch ${group.interaction_batch_id} average score:`, avgScore);
                    return avgScore * 100; // 백분율로 변환하되 숫자로 유지
                });

                devLog.log('Chart labels:', labels);
                devLog.log('Chart scores:', scores);

                const data = {
                    labels,
                    datasets: [{
                        label: '평균 정답률 (%)',
                        data: scores,
                        borderColor: '#36A2EB',
                        backgroundColor: '#36A2EB80',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    }]
                };

                setChartData(data);
                devLog.log('Final chart data prepared:', data);
                devLog.log('Data types check:', {
                    labelsType: typeof labels[0],
                    scoresType: typeof scores[0],
                    firstScore: scores[0],
                    firstLabel: labels[0]
                });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error";
                setError(`Failed to prepare chart data: ${errorMessage}`);
                devLog.error('Failed to prepare tester chart data:', err);
            } finally {
                setIsLoading(false);
            }
        } else if (isOpen && batchGroups.length === 0) {
            devLog.log('No batch groups available for chart');
            setChartData(null);
            setIsLoading(false);
            setError(null);
        } else {
            devLog.log('Chart dashboard conditions not met:', { isOpen, workflow: !!workflow, batchGroupsLength: batchGroups.length });
        }
    }, [isOpen, workflow, batchGroups, workflowName]);

    if (!isOpen || !workflow) return null;

    const isDataAvailable = chartData && chartData.datasets && chartData.datasets[0].data.length > 0;

    return (
        <div className={styles.overlay}>
            <div className={styles.dashboardContainer}>
                <div className={styles.header}>
                    <h2>{workflowName} - 테스터 성능 차트</h2>
                    <button onClick={onClose} className={styles.closeButton}><FiX /></button>
                </div>

                <div className={styles.content}>
                    {isLoading ? (
                        <div className={styles.loader}><FiLoader /><span>차트 로딩 중...</span></div>
                    ) : error ? (
                        <div className={styles.error}>{error}</div>
                    ) : (
                        <div className={styles.chartGrid}>
                            <div
                                className={styles.chartCard}
                                style={{
                                    gridColumn: '1 / -1',
                                    overflow: 'auto',
                                    maxWidth: '100%'
                                }}
                            >
                                {isDataAvailable ? (
                                    <TesterChart
                                        data={chartData}
                                        title="배치별 평균 정답률 변화"
                                    />
                                ) : (
                                    <div>
                                        <ChartPlaceholder title="배치별 평균 정답률 변화" />
                                        <div style={{ padding: '1rem', fontSize: '0.8rem', color: '#666' }}>
                                            Debug: chartData = {JSON.stringify(chartData, null, 2)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TesterChartDashboard;
