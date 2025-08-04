// /src/app/main/components/charts/ChartDashboard.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { FiX, FiLoader } from 'react-icons/fi';
import {
    getWorkflowNodeCounts,
    getPieChartData,
    getBarChartData,
    getLineChartData
} from '@/app/api/workflowAPI';
import styles from '@/app/main/assets/ChartDashboard.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import ChartPlaceholder from './ChartPlaceholder';

interface NodeCount {
  node_name: string;
  count: number;
}
interface NodeCountsData {
  workflow_name: string;
  workflow_id: string;
  node_counts: NodeCount[];
  message?: string;
}
interface NodeCountsResponse {
  success: boolean;
  data: NodeCountsData;
}

interface ChartDataSet {
    label: string;
    data: any[];
}
interface ChartData {
    title: string;
    labels?: string[];
    datasets: ChartDataSet[];
}

interface PieChartResponse {
    success: boolean;
    data: ChartData;
}

interface BarChartResponse {
    success: boolean;
    data: {
        processingTime: ChartData;
        cpuUsage: ChartData;
    };
}

interface LineChartResponse {
    success: boolean;
    data: {
        cpuOverTime: ChartData;
        processingTimeOverTime: ChartData;
    };
}

const Chart = dynamic(() => import('./Chart'), {
    ssr: false,
    loading: () => <div className={styles.chartLoader}>Loading Chart...</div>
});

interface Workflow {
    workflow_name: string;
    workflow_id: string;
    node_count: number;
}

interface ChartDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    workflow: Workflow | null;
}

const isDataAvailable = (data: any): boolean => {
  return !!(data?.datasets && data.datasets.some((ds: any) => ds.data && ds.data.length > 0));
};


const ChartDashboard: React.FC<ChartDashboardProps> = ({ isOpen, onClose, workflow }) => {
    const [sliderValue, setSliderValue] = useState(0);
    const [logLimit, setLogLimit] = useState(0);
    const [maxLogLimit, setMaxLogLimit] = useState(0);
    const [chartData, setChartData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const workflowName = useMemo(() => workflow?.workflow_name.replace('.json', ''), [workflow]);

    useEffect(() => {
        if (isOpen && workflow) {
            // Fetch max log count when dashboard opens
            const fetchMaxCount = async () => {
                try {
                    const countsResponse = await getWorkflowNodeCounts(workflowName!, workflow.workflow_id) as NodeCountsResponse;

                    let maxCount = 0;
                    const nodeCounts = countsResponse.data?.node_counts;

                    if (nodeCounts && nodeCounts.length > 0) {
                        const inputStringNode = nodeCounts.find(
                            (item) => item.node_name === "Input String"
                        );

                        if (inputStringNode) {
                            maxCount = inputStringNode.count;
                        }
                    }

                    setMaxLogLimit(maxCount);
                    const initialLimit = Math.min(logLimit > 0 ? logLimit : 10, maxCount > 0 ? maxCount : 10);
                    setLogLimit(initialLimit);
                    setSliderValue(initialLimit);
                    devLog.log(`Max log count set to: ${maxCount}`);
                } catch (err) {
                    devLog.error("Failed to fetch node counts", err);
                    setMaxLogLimit(0); // fallback
                }
            };
            fetchMaxCount();
        }
    }, [isOpen, workflow, workflowName]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setLogLimit(sliderValue);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [sliderValue]);

    useEffect(() => {
        if (isOpen && workflow) {
            // Fetch chart data whenever the limit changes
            const fetchChartData = async () => {
                setIsLoading(true);
                setError(null);
                const apiLimit = logLimit * (workflow.node_count || 1);
                try {
                    const [pieResponse, barResponse, lineResponse] = await Promise.all([
                        getPieChartData(workflowName!, workflow.workflow_id, apiLimit) as Promise<PieChartResponse>,
                        getBarChartData(workflowName!, workflow.workflow_id, apiLimit) as Promise<BarChartResponse>,
                        getLineChartData(workflowName!, workflow.workflow_id, apiLimit) as Promise<LineChartResponse>
                    ]);
                    setChartData({
                        pie: pieResponse.data,
                        bar: barResponse.data,
                        line: lineResponse.data
                    });
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
        if (!data?.datasets) return { labels: [], datasets: [] };

        const datasets = data.datasets.map((ds: any, index: number) => ({
            ...ds,
            backgroundColor: type === 'pie' ? chartColors : (chartColors[index % chartColors.length] + '80'),
            borderColor: type === 'pie' ? '#fff' : chartColors[index % chartColors.length],
            borderWidth: type === 'pie' ? 2 : 1.5,
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
                    <label htmlFor="logLimit">최근 실행 로그 <strong>{sliderValue}</strong>개 기준</label>
                    <input
                        type="range"
                        id="logLimit"
                        min="0"
                        max={maxLogLimit}
                        value={sliderValue}
                        onChange={(e) => setSliderValue(Number(e.target.value))}
                        className={styles.slider}
                    />
                </div>

                <div className={styles.content}>
                    {isLoading ? (
                        <div className={styles.loader}><FiLoader /><span>Loading Charts...</span></div>
                    ) : error ? (
                        <div className={styles.error}>{error}</div>
                    ) : (
                        <div className={styles.chartGrid}>
                            {/* 각 차트마다 isDataAvailable 함수로 확인 후 조건부 렌더링 */}
                            <div className={styles.chartCard}>
                                {isDataAvailable(chartData?.pie) ? (
                                    <Chart type="pie" data={prepareChartJsData(chartData.pie, 'pie')} title={chartData.pie.title} />
                                ) : (
                                    <ChartPlaceholder title={chartData?.pie?.title || 'Node Average Processing Time'} />
                                )}
                            </div>
                            <div className={styles.chartCard}>
                                {isDataAvailable(chartData?.bar?.processingTime) ? (
                                    <Chart type="bar" data={prepareChartJsData(chartData.bar.processingTime, 'bar')} title={chartData.bar.processingTime.title} />
                                ) : (
                                    <ChartPlaceholder title={chartData?.bar?.processingTime?.title || 'Average Processing Time'} />
                                )}
                            </div>
                            <div className={styles.chartCard}>
                                {isDataAvailable(chartData?.bar?.cpuUsage) ? (
                                    <Chart type="bar" data={prepareChartJsData(chartData.bar.cpuUsage, 'bar')} title={chartData.bar.cpuUsage.title} />
                                ) : (
                                    <ChartPlaceholder title={chartData?.bar?.cpuUsage?.title || 'Average CPU Usage'} />
                                )}
                            </div>
                            <div className={styles.chartCard}>
                                {isDataAvailable(chartData?.line?.cpuOverTime) ? (
                                    <Chart type="line" data={prepareChartJsData(chartData.line.cpuOverTime, 'line')} title={chartData.line.cpuOverTime.title} />
                                ) : (
                                    <ChartPlaceholder title={chartData?.line?.cpuOverTime?.title || 'CPU Usage Over Time'} />
                                )}
                            </div>
                            <div className={styles.chartCard}>
                                {isDataAvailable(chartData?.line?.processingTimeOverTime) ? (
                                    <Chart type="line" data={prepareChartJsData(chartData.line.processingTimeOverTime, 'line')} title={chartData.line.processingTimeOverTime.title} />
                                ) : (
                                    <ChartPlaceholder title={chartData?.line?.processingTimeOverTime?.title || 'Processing Time Over Time'} />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChartDashboard;
