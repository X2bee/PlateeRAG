// AdminGaudiResourceMonitorModal.tsx
import React, { useState, useEffect } from 'react';
import { FiMonitor, FiCpu, FiActivity, FiRefreshCw, FiBarChart2 } from 'react-icons/fi';
import { checkGaudiHealth, getAvailableHPUs } from '@/app/api/gaudiAPI';
import styles from '@/app/admin/assets/AdminGaudiModal.module.scss';

interface AdminGaudiResourceMonitorModalProps {
    healthData: any;
    instances: any[];
}

export const AdminGaudiResourceMonitorModal: React.FC<AdminGaudiResourceMonitorModalProps> = ({
    healthData,
    instances
}) => {
    const [currentHealthData, setCurrentHealthData] = useState(healthData);
    const [availableHPUs, setAvailableHPUs] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(refreshData, 5000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const refreshData = async () => {
        try {
            setRefreshing(true);
            const [healthResult, hpuResult] = await Promise.all([
                checkGaudiHealth(),
                getAvailableHPUs()
            ]);
            setCurrentHealthData(healthResult);
            setAvailableHPUs(hpuResult);
        } catch (error) {
            console.error('Failed to refresh data:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const getHPUUtilizationColor = (allocated: boolean) => {
        return allocated ? '#ef4444' : '#10b981';
    };

    const renderHPUGrid = () => {
        if (!currentHealthData?.hpu_status) return null;

        const { device_details, allocation_map } = currentHealthData.hpu_status;
        
        return (
            <div className={styles.hpuGrid}>
                {Object.entries(device_details).map(([hpuId, info]: [string, any]) => (
                    <div 
                        key={hpuId}
                        className={`${styles.hpuCard} ${info.allocated ? styles.allocated : styles.available}`}
                    >
                        <div className={styles.hpuHeader}>
                            <div className={styles.hpuId}>HPU-{hpuId}</div>
                            <div 
                                className={styles.statusDot}
                                style={{ backgroundColor: getHPUUtilizationColor(info.allocated) }}
                            />
                        </div>
                        <div className={styles.hpuInfo}>
                            <div className={styles.hpuName}>{info.name}</div>
                            {info.allocated && (
                                <div className={styles.allocation}>
                                    사용 중: {info.instance_id}
                                </div>
                            )}
                            <div className={styles.memoryInfo}>
                                <div>할당: {Math.round(info.memory?.allocated / 1024 / 1024) || 0} MB</div>
                                <div>예약: {Math.round(info.memory?.reserved / 1024 / 1024) || 0} MB</div>
                                <div>사용률: {info.memory?.utilization || 0}%</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderResourceChart = () => {
        if (!currentHealthData?.hpu_status) return null;

        const { total_count, available_count, allocated_count } = currentHealthData.hpu_status;
        const utilizationPercentage = (allocated_count / total_count) * 100;

        return (
            <div className={styles.resourceChart}>
                <div className={styles.chartHeader}>
                    <h4>HPU 사용률</h4>
                    <span className={styles.percentage}>{utilizationPercentage.toFixed(1)}%</span>
                </div>
                <div className={styles.progressBar}>
                    <div 
                        className={styles.progressFill}
                        style={{ 
                            width: `${utilizationPercentage}%`,
                            backgroundColor: utilizationPercentage > 80 ? '#ef4444' : 
                                           utilizationPercentage > 60 ? '#f59e0b' : '#10b981'
                        }}
                    />
                </div>
                <div className={styles.chartLegend}>
                    <div className={styles.legendItem}>
                        <div className={styles.legendColor} style={{ backgroundColor: '#ef4444' }} />
                        <span>사용 중: {allocated_count}개</span>
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.legendColor} style={{ backgroundColor: '#10b981' }} />
                        <span>사용 가능: {available_count}개</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderInstanceMetrics = () => {
        if (instances.length === 0) return null;

        const totalHPUs = instances.reduce((sum, inst) => sum + inst.allocated_hpus.length, 0);
        const avgUptime = instances.reduce((sum, inst) => sum + (inst.uptime || 0), 0) / instances.length;

        return (
            <div className={styles.instanceMetrics}>
                <h4>인스턴스 메트릭</h4>
                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                        <div className={styles.metricIcon}>
                            <FiActivity />
                        </div>
                        <div className={styles.metricInfo}>
                            <div className={styles.metricValue}>{instances.length}</div>
                            <div className={styles.metricLabel}>활성 인스턴스</div>
                        </div>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricIcon}>
                            <FiCpu />
                        </div>
                        <div className={styles.metricInfo}>
                            <div className={styles.metricValue}>{totalHPUs}</div>
                            <div className={styles.metricLabel}>사용 중인 HPU</div>
                        </div>
                    </div>
                    <div className={styles.metricCard}>
                        <div className={styles.metricIcon}>
                            <FiBarChart2 />
                        </div>
                        <div className={styles.metricInfo}>
                            <div className={styles.metricValue}>
                                {Math.floor(avgUptime / 60)}m
                            </div>
                            <div className={styles.metricLabel}>평균 가동시간</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.resourceMonitor}>
            {/* 컨트롤 헤더 */}
            <div className={styles.monitorHeader}>
                <div className={styles.monitorTitle}>
                    <FiMonitor />
                    <h3>HPU 리소스 모니터</h3>
                </div>
                <div className={styles.monitorControls}>
                    <label className={styles.autoRefreshToggle}>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        자동 새로고침 (5초)
                    </label>
                    <button
                        className={styles.refreshButton}
                        onClick={refreshData}
                        disabled={refreshing}
                    >
                        <FiRefreshCw className={refreshing ? styles.spinning : ''} />
                        새로고침
                    </button>
                </div>
            </div>

            {/* 전체 상태 개요 */}
            {currentHealthData && (
                <div className={styles.statusOverview}>
                    <div className={styles.overviewCard}>
                        <h4>시스템 상태</h4>
                        <div className={styles.statusItems}>
                            <div className={styles.statusItem}>
                                <span>HPU 상태:</span>
                                <span className={currentHealthData.hpu_status?.available ? styles.healthy : styles.error}>
                                    {currentHealthData.hpu_status?.available ? '정상' : '오류'}
                                </span>
                            </div>
                            <div className={styles.statusItem}>
                                <span>전체 HPU:</span>
                                <span>{currentHealthData.hpu_status?.total_count || 0}개</span>
                            </div>
                            <div className={styles.statusItem}>
                                <span>활성 인스턴스:</span>
                                <span>{currentHealthData.vllm_instances?.count || 0}개</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* 추천 사항 */}
                    {currentHealthData.resource_recommendation && (
                        <div className={styles.overviewCard}>
                            <h4>리소스 추천</h4>
                            <div className={styles.recommendations}>
                                <div>단일 HPU 인스턴스: 최대 {currentHealthData.resource_recommendation.max_new_instances_single_hpu}개</div>
                                <div>듀얼 HPU 인스턴스: 최대 {currentHealthData.resource_recommendation.max_new_instances_dual_hpu}개</div>
                                <div>권장 텐서 병렬: {currentHealthData.resource_recommendation.suggested_tensor_parallel}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 리소스 차트 */}
            {renderResourceChart()}

            {/* HPU 그리드 */}
            <div className={styles.hpuSection}>
                <h4>HPU 상태</h4>
                {renderHPUGrid()}
            </div>

            {/* 인스턴스 메트릭 */}
            {renderInstanceMetrics()}

            {/* 상세 정보 테이블 */}
            {availableHPUs && (
                <div className={styles.detailsSection}>
                    <h4>상세 정보</h4>
                    <div className={styles.detailsTable}>
                        <div className={styles.tableHeader}>
                            <div>HPU ID</div>
                            <div>이름</div>
                            <div>상태</div>
                            <div>할당된 인스턴스</div>
                            <div>메모리 사용량</div>
                        </div>
                        {availableHPUs.available_hpus?.map((hpu: any) => (
                            <div key={hpu.hpu_id} className={styles.tableRow}>
                                <div>HPU-{hpu.hpu_id}</div>
                                <div>{hpu.info?.name || 'Unknown'}</div>
                                <div>
                                    <span className={styles.available}>사용 가능</span>
                                </div>
                                <div>-</div>
                                <div>{Math.round((hpu.info?.memory?.allocated || 0) / 1024 / 1024)} MB</div>
                            </div>
                        ))}
                        {Object.entries(availableHPUs.allocated_hpus || {}).map(([hpuId, info]: [string, any]) => (
                            <div key={hpuId} className={styles.tableRow}>
                                <div>HPU-{hpuId}</div>
                                <div>{info.device_info?.name || 'Unknown'}</div>
                                <div>
                                    <span className={styles.allocated}>사용 중</span>
                                </div>
                                <div>{info.instance_id}</div>
                                <div>{Math.round((info.device_info?.memory?.allocated || 0) / 1024 / 1024)} MB</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};