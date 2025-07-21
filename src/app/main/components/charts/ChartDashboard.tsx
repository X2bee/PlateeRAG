// /src/app/main/components/charts/ChartDashboard.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiLoader } from 'react-icons/fi';
import { 
    getWorkflowNodeCounts, 
    getPieChartData, 
    getBarChartData, 
    getLineChartData 
} from '@/app/api/workflowAPI';
import Chart from './Chart';
import styles from '@/app/main/assets/ChartDashboard.module.scss';
import { devLog } from '@/app/utils/logger';

interface Workflow {
    filename: string;
    workflow_id: string;
}

interface ChartDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    workflow: Workflow | null;
}

const ChartDashboard: React.FC<ChartDashboardProps> = ({ isOpen, onClose, workflow }) => {
    const [logLimit, setLogLimit] = useState(10);
    const [maxLogLimit, setMaxLogLimit] = useState(100);
    const [chartData, setChartData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const workflowName = useMemo(() => workflow?.filename.replace('.json', ''), [workflow]);

    useEffect(() => {
        if (isOpen && workflow) {
            // Fetch max log count when dashboard opens
            const fetchMaxCount = async () => {
                try {
                    const counts = await getWorkflowNodeCounts(workflowName!, workflow.workflow_id);
                    // Find the maximum count among all nodes to set the slider limit
                    const maxCount = Math.max(...Object.values(counts.data || {})) || 100;
                    setMaxLogLimit(maxCount);
                    devLog.log(`Max log count set to: ${maxCount}`);
                } catch (err) {
                    devLog.error("Failed to fetch node counts", err);
                    setMaxLogLimit(100); // fallback
                }
            };
            fetchMaxCount();
        }
    }, [isOpen, workflow, workflowName]);

    useEffect(() => {
        if (isOpen && workflow) {
            // Fetch chart data whenever the limit changes
            const fetchChartData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const [pieData, barData, lineData] = await Promise.all([
                        getPieChartData(workflowName!, workflow.workflow_id, logLimit),
                        getBarChartData(workflowName!, workflow.workflow_id, logLimit),
                        getLineChartData(workflowName!, workflow.workflow_id, logLimit)
                    ]);
                    setChartData({ pie: pieData.data, bar: barData.data, line: lineData.data });
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : "Unknown error";
                    setError(`Failed to load chart data: ${errorMessage}`);
                    setChartData(null);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchChartData();
        }
    }, [isOpen, workflow, workflowName, logLimit]);

    if (!isOpen || !workflow) return null;

    const chartColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    const prepareChartJsData = (data: any, type: 'pie' | 'bar' | 'line') => {
        if (!data) return { labels: [], datasets: [] };
        
        const datasets = data.datasets.map((ds: any, index: number) => ({
            ...ds,
            backgroundColor: type === 'pie' ? chartColors : chartColors[index % chartColors.length],
            borderColor: type === 'pie' ? '#fff' : chartColors[index % chartColors.length],
            borderWidth: type === 'pie' ? 2 : 1,
            fill: type === 'line' ? false : undefined,
            tension: type === 'line' ? 0.1 : undefined,
        }));

        return { labels: data.labels, datasets };
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.dashboardContainer}>
                <div className={styles.header}>
                    <h2>{workflowName} - Performance Charts</h2>
                    <button onClick={onClose} className={styles.closeButton}><FiX /></button>
                </div>
                
                <div className={styles.controls}>
                    <label htmlFor="logLimit">최근 실행 로그 <strong>{logLimit}</strong>개 기준</label>
                    <input
                        type="range"
                        id="logLimit"
                        min="1"
                        max={maxLogLimit}
                        value={logLimit}
                        onChange={(e) => setLogLimit(Number(e.target.value))}
                        className={styles.slider}
                    />
                </div>

                <div className={styles.content}>
                    {isLoading ? (
                        <div className={styles.loader}><FiLoader /><span>Loading Charts...</span></div>
                    ) : error ? (
                        <div className={styles.error}>{error}</div>
                    ) : chartData && (
                        <div className={styles.chartGrid}>
                            <div className={styles.chartCard}>
                                {chartData.pie && <Chart type="pie" data={prepareChartJsData(chartData.pie, 'pie')} title={chartData.pie.title} />}
                            </div>
                            <div className={styles.chartCard}>
                                {chartData.bar?.processingTime && <Chart type="bar" data={prepareChartJsData(chartData.bar.processingTime, 'bar')} title={chartData.bar.processingTime.title} />}
                            </div>
                             <div className={styles.chartCard}>
                                {chartData.bar?.cpuUsage && <Chart type="bar" data={prepareChartJsData(chartData.bar.cpuUsage, 'bar')} title={chartData.bar.cpuUsage.title} />}
                            </div>
                             <div className={styles.chartCard}>
                                {chartData.line?.cpuOverTime && <Chart type="line" data={prepareChartJsData(chartData.line.cpuOverTime, 'line')} title={chartData.line.cpuOverTime.title} />}
                            </div>
                            <div className={styles.chartCard}>
                                {chartData.line?.processingTimeOverTime && <Chart type="line" data={prepareChartJsData(chartData.line.processingTimeOverTime, 'line')} title={chartData.line.processingTimeOverTime.title} />}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChartDashboard;