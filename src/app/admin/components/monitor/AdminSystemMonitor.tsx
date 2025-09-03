'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
    FiCpu, FiHardDrive, FiMonitor, FiServer, FiActivity,
    FiWifi, FiClock, FiThermometer, FiZap, FiAlertCircle,
    FiRefreshCw, FiPause, FiPlay
} from 'react-icons/fi';
import {
    getSystemStatus, formatBytes, formatUptime,
    getCPUStatus, getMemoryStatus, getDiskStatus, streamSystemStatus
} from '@/app/admin/api/system';
import styles from '@/app/admin/assets/AdminSystemMonitor.module.scss';
import { devLog } from '@/app/_common/utils/logger';

const Chart = dynamic(() => import('./playground/charts/Chart'), {
    ssr: false,
    loading: () => <div className={styles.chartLoader}>차트 로딩 중...</div>
});

interface SystemData {
    cpu: {
        usage_percent: number;
        core_count: number;
        frequency_current: number;
        frequency_max: number;
        load_average: number[];
    };
    memory: {
        total: number;
        available: number;
        percent: number;
        used: number;
        free: number;
    };
    gpu?: Array<{
        name: string;
        memory_total: number;
        memory_used: number;
        memory_free: number;
        memory_percent: number;
        utilization: number;
        temperature?: number;
    }> | null;
    network: Array<{
        interface: string;
        is_up: boolean;
        bytes_sent: number;
        bytes_recv: number;
        packets_sent: number;
        packets_recv: number;
    }>;
    disk: Array<{
        device: string;
        mountpoint: string;
        fstype: string;
        total: number;
        used: number;
        free: number;
        percent: number;
    }>;
    uptime: number;
}

interface HistoryData {
    timestamp: Date;
    cpu_usage: number;
    memory_usage: number;
    gpu_usage?: number;
}

const AdminSystemMonitor: React.FC = () => {
    const [systemData, setSystemData] = useState<SystemData | null>(null);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const sseCleanupRef = useRef<(() => void) | null>(null);

    const handleSSEData = (data: SystemData) => {
        devLog.log('handleSSEData called with:', data);
        setSystemData(data);
        setError(null);
        setConnectionStatus('connected');

        // Add to history for time-series charts
        const newHistoryEntry: HistoryData = {
            timestamp: new Date(),
            cpu_usage: data.cpu.usage_percent,
            memory_usage: data.memory.percent,
            gpu_usage: (data.gpu && Array.isArray(data.gpu) && data.gpu.length > 0) ? data.gpu[0].utilization : undefined
        };

        setHistoryData(prev => {
            const newHistory = [...prev, newHistoryEntry];
            // Keep only last 40 entries (1 minute of data at 1.5s intervals)
            return newHistory.slice(-40);
        });

        setIsLoading(false);
        devLog.log('System data updated via SSE:', data);
    };

    const handleSSEError = (errorMessage: string) => {
        setError(`SSE 연결 오류: ${errorMessage}`);
        setConnectionStatus('disconnected');
        devLog.error('SSE error:', errorMessage);
    };

    const startSSEConnection = async () => {
        devLog.log('Starting SSE connection...');
        if (sseCleanupRef.current) {
            sseCleanupRef.current();
        }

        setConnectionStatus('connecting');
        try {
            sseCleanupRef.current = await streamSystemStatus(handleSSEData, handleSSEError) as () => void;
            devLog.log('SSE connection started successfully');
        } catch (error) {
            devLog.error('Failed to start SSE connection:', error);
            handleSSEError('SSE 연결 시작 실패');
        }
    };

    const stopSSEConnection = () => {
        devLog.log('Stopping SSE connection...');
        if (sseCleanupRef.current) {
            sseCleanupRef.current();
            sseCleanupRef.current = null;
        }
        setConnectionStatus('disconnected');
        devLog.log('SSE connection stopped and cleaned up');
    };

    useEffect(() => {
        // SSE connection management
        if (isRealTimeEnabled) {
            startSSEConnection();
        } else {
            stopSSEConnection();
        }

        return () => {
            stopSSEConnection();
        };
    }, [isRealTimeEnabled]);

    // Component unmount cleanup
    useEffect(() => {
        return () => {
            devLog.log('AdminSystemMonitor unmounting, cleaning up SSE connection');
            if (sseCleanupRef.current) {
                sseCleanupRef.current();
                sseCleanupRef.current = null;
            }
        };
    }, []);

    // Page visibility handling - pause SSE when tab is not visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                devLog.log('Page hidden, stopping SSE connection');
                stopSSEConnection();
            } else if (isRealTimeEnabled) {
                devLog.log('Page visible, restarting SSE connection');
                startSSEConnection();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isRealTimeEnabled]);

    const toggleRealTime = () => {
        setIsRealTimeEnabled(prev => !prev);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'low': return <FiActivity className={styles.statusLow} />;
            case 'medium': return <FiActivity className={styles.statusMedium} />;
            case 'high': return <FiActivity className={styles.statusHigh} />;
            case 'critical': return <FiAlertCircle className={styles.statusCritical} />;
            default: return <FiActivity />;
        }
    };

    const prepareCPUHistoryChart = () => {
        const chartData = {
            labels: historyData.map(entry => entry.timestamp.toLocaleTimeString()),
            datasets: [{
                label: 'CPU 사용률 (%)',
                data: historyData.map(entry => entry.cpu_usage),
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };

        devLog.log('CPU Chart Data:', chartData);
        devLog.log('History Data Length:', historyData.length);
        return chartData;
    };

    const prepareMemoryHistoryChart = () => {
        const chartData = {
            labels: historyData.map(entry => entry.timestamp.toLocaleTimeString()),
            datasets: [{
                label: '메모리 사용률 (%)',
                data: historyData.map(entry => entry.memory_usage),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };

        devLog.log('Memory Chart Data:', chartData);
        return chartData;
    };

    const prepareDiskChart = () => {
        if (!systemData) return { labels: [], datasets: [] };

        return {
            labels: systemData.disk.map(disk => disk.mountpoint),
            datasets: [{
                label: '사용률 (%)',
                data: systemData.disk.map(disk => disk.percent),
                backgroundColor: systemData.disk.map(disk => {
                    const status = getDiskStatus(disk.percent);
                    switch (status) {
                        case 'low': return '#2ecc71';
                        case 'medium': return '#f39c12';
                        case 'high': return '#e67e22';
                        case 'critical': return '#e74c3c';
                        default: return '#95a5a6';
                    }
                }),
                borderWidth: 1
            }]
        };
    };

    const prepareGPUHistoryChart = () => {
        if (!systemData?.gpu || !Array.isArray(systemData.gpu) || systemData.gpu.length === 0) {
            return { labels: [], datasets: [] };
        }

        return {
            labels: historyData.map(entry => entry.timestamp.toLocaleTimeString()),
            datasets: systemData.gpu.map((gpu, index) => ({
                label: `${gpu.name} 사용률 (%)`,
                data: historyData.map(entry => entry.gpu_usage || 0),
                borderColor: index === 0 ? '#9b59b6' : '#3498db',
                backgroundColor: index === 0 ? 'rgba(155, 89, 182, 0.1)' : 'rgba(52, 152, 219, 0.1)',
                fill: true,
                tension: 0.4
            }))
        };
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loader}>
                    <FiRefreshCw className={styles.spinning} />
                    <span>시스템 데이터 로딩 중...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <FiAlertCircle />
                    <span>{error}</span>
                    <button onClick={startSSEConnection} className={styles.retryButton}>
                        다시 연결
                    </button>
                </div>
            </div>
        );
    }

    if (!systemData) return null;

    return (
        <div className={styles.container}>
            {/* Header with Controls */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2>
                        <FiMonitor />
                        시스템 모니터링
                    </h2>
                    <div className={styles.uptime}>
                        <FiClock />
                        <span>업타임: {formatUptime(systemData.uptime)}</span>
                    </div>
                    <div className={styles.connectionStatus}>
                        <div className={`${styles.statusIndicator} ${styles[connectionStatus]}`} />
                        <span>
                            {connectionStatus === 'connecting' && '연결 중...'}
                            {connectionStatus === 'connected' && 'SSE 연결됨'}
                            {connectionStatus === 'disconnected' && '연결 끊김'}
                        </span>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <button
                        onClick={toggleRealTime}
                        className={`${styles.realTimeToggle} ${isRealTimeEnabled ? styles.active : ''}`}
                    >
                        {isRealTimeEnabled ? <FiPause /> : <FiPlay />}
                        {isRealTimeEnabled ? 'SSE 연결 중지' : 'SSE 연결 시작'}
                    </button>
                </div>
            </div>

            {/* System Overview Cards */}
            <div className={styles.overviewGrid}>
                <div className={styles.overviewCard}>
                    <div className={styles.cardHeader}>
                        <FiCpu />
                        <span>CPU</span>
                        {getStatusIcon(getCPUStatus(systemData.cpu.usage_percent))}
                    </div>
                    <div className={styles.cardContent}>
                        <div className={styles.mainValue}>
                            {systemData.cpu.usage_percent.toFixed(1)}%
                        </div>
                        <div className={styles.subValues}>
                            <span>{systemData.cpu.core_count} 코어</span>
                            <span>{(systemData.cpu.frequency_current / 1000).toFixed(2)} GHz</span>
                        </div>
                    </div>
                </div>

                <div className={styles.overviewCard}>
                    <div className={styles.cardHeader}>
                        <FiHardDrive />
                        <span>메모리</span>
                        {getStatusIcon(getMemoryStatus(systemData.memory.percent))}
                    </div>
                    <div className={styles.cardContent}>
                        <div className={styles.mainValue}>
                            {systemData.memory.percent.toFixed(1)}%
                        </div>
                        <div className={styles.subValues}>
                            <span>{formatBytes(systemData.memory.used)} / {formatBytes(systemData.memory.total)}</span>
                        </div>
                    </div>
                </div>

                {systemData.gpu && Array.isArray(systemData.gpu) && systemData.gpu.length > 0 && (
                    <div className={styles.overviewCard}>
                        <div className={styles.cardHeader}>
                            <FiZap />
                            <span>GPU</span>
                            {systemData.gpu[0].temperature && (
                                <div className={styles.temperature}>
                                    <FiThermometer />
                                    {systemData.gpu[0].temperature}°C
                                </div>
                            )}
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.mainValue}>
                                {systemData.gpu[0].utilization.toFixed(1)}%
                            </div>
                            <div className={styles.subValues}>
                                <span>{systemData.gpu[0].name}</span>
                                <span>{formatBytes(systemData.gpu[0].memory_used)} / {formatBytes(systemData.gpu[0].memory_total)}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.overviewCard}>
                    <div className={styles.cardHeader}>
                        <FiWifi />
                        <span>네트워크</span>
                    </div>
                    <div className={styles.cardContent}>
                        <div className={styles.networkList}>
                            {systemData.network.filter(net => net.is_up).map((net, index) => (
                                <div key={index} className={styles.networkItem}>
                                    <span className={styles.interfaceName}>{net.interface}</span>
                                    <div className={styles.networkStats}>
                                        <span>↑ {formatBytes(net.bytes_sent)}</span>
                                        <span>↓ {formatBytes(net.bytes_recv)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                    <Chart
                        type="line"
                        data={prepareCPUHistoryChart()}
                        title="CPU 사용률 추이"
                        options={{
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    max: 100,
                                    title: { display: true, text: '사용률 (%)' }
                                }
                            }
                        }}
                    />
                </div>

                <div className={styles.chartCard}>
                    <Chart
                        type="line"
                        data={prepareMemoryHistoryChart()}
                        title="메모리 사용률 추이"
                        options={{
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    max: 100,
                                    title: { display: true, text: '사용률 (%)' }
                                }
                            }
                        }}
                    />
                </div>

                <div className={styles.chartCard}>
                    <Chart
                        type="bar"
                        data={prepareDiskChart()}
                        title="디스크 사용률"
                    />
                </div>

                {systemData.gpu && Array.isArray(systemData.gpu) && systemData.gpu.length > 0 && (
                    <div className={styles.chartCard}>
                        <Chart
                            type="line"
                            data={prepareGPUHistoryChart()}
                            title="GPU 사용률 추이"
                        />
                    </div>
                )}
            </div>

            {/* Detailed Tables */}
            <div className={styles.detailsGrid}>
                <div className={styles.detailCard}>
                    <h3>
                        <FiServer />
                        디스크 상세 정보
                    </h3>
                    <div className={styles.table}>
                        <div className={styles.tableHeader}>
                            <span>장치</span>
                            <span>마운트 포인트</span>
                            <span>파일시스템</span>
                            <span>사용률</span>
                            <span>사용량</span>
                        </div>
                        {systemData.disk.map((disk, index) => (
                            <div key={index} className={styles.tableRow}>
                                <span className={styles.device}>{disk.device}</span>
                                <span>{disk.mountpoint}</span>
                                <span>{disk.fstype}</span>
                                <span className={`${styles.percent} ${styles[getDiskStatus(disk.percent)]}`}>
                                    {disk.percent.toFixed(1)}%
                                </span>
                                <span>{formatBytes(disk.used)} / {formatBytes(disk.total)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {systemData.gpu && Array.isArray(systemData.gpu) && systemData.gpu.length > 0 && (
                    <div className={styles.detailCard}>
                        <h3>
                            <FiZap />
                            GPU 상세 정보
                        </h3>
                        <div className={styles.table}>
                            <div className={styles.tableHeader}>
                                <span>GPU</span>
                                <span>사용률</span>
                                <span>메모리 사용률</span>
                                <span>온도</span>
                            </div>
                            {systemData.gpu.map((gpu, index) => (
                                <div key={index} className={styles.tableRow}>
                                    <span className={styles.gpuName}>{gpu.name}</span>
                                    <span>{gpu.utilization.toFixed(1)}%</span>
                                    <span>{gpu.memory_percent.toFixed(1)}%</span>
                                    <span>
                                        {gpu.temperature ? `${gpu.temperature}°C` : 'N/A'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSystemMonitor;
