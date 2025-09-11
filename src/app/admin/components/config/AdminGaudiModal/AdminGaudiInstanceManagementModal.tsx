import React, { useState, useEffect } from 'react';
import { FiSquare, FiPlay, FiTrash2, FiRefreshCw, FiActivity, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { 
    stopVLLMInstance, 
    stopAllVLLMInstances,
    vllmInstanceHealthCheck,
} from '@/app/admin/api/gaudiAPI';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/admin/assets/AdminGaudiModal.module.scss';

interface VLLMInstanceData {
    instance_id: string;
    status: string;
    model_name: string;
    port: number;
    allocated_hpus: number[];
    tensor_parallel_size: number;
    pid: number | null;
    uptime: number | null;
    api_url: string;
    memory_usage?: any;
}

interface AdminGaudiInstanceManagementModalProps {
    instances: VLLMInstanceData[];
    onInstancesChanged: () => void;
    loading: boolean;
}

// 타입 정의 추가
interface HealthCheckResult {
    success: boolean;
    status: string;
    message: string;
    instance_id: string;
}

interface StopAllResult {
    success: boolean;
    message: string;
    stopped_instances: string[];
    failed_instances: string[];
    total_deallocated_hpus: number;
}

interface ResourceStats {
    totalInstances: number;
    totalAllocatedHPUs: number;
    averageUptime: number;
    modelDistribution: Record<string, number>;
    hpuUtilization: Record<number, any>;
}

export const AdminGaudiInstanceManagementModal: React.FC<AdminGaudiInstanceManagementModalProps> = ({
    instances,
    onInstancesChanged,
    loading
}) => {
    const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
    const [healthStatuses, setHealthStatuses] = useState<Record<string, HealthCheckResult>>({});
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    // 리소스 통계 계산 함수 (getHPUResourceStats 대신 직접 구현)
    const getResourceStats = (instances: VLLMInstanceData[]): ResourceStats => {
        const stats: ResourceStats = {
            totalInstances: instances.length,
            totalAllocatedHPUs: 0,
            hpuUtilization: {},
            modelDistribution: {},
            averageUptime: 0
        };

        let totalUptime = 0;

        instances.forEach(instance => {
            // HPU 할당 수 집계
            stats.totalAllocatedHPUs += instance.allocated_hpus.length;

            // HPU별 사용률 기록
            instance.allocated_hpus.forEach(hpuId => {
                stats.hpuUtilization[hpuId] = {
                    instance_id: instance.instance_id,
                    model_name: instance.model_name,
                    uptime: instance.uptime
                };
            });

            // 모델별 사용 통계
            if (stats.modelDistribution[instance.model_name]) {
                stats.modelDistribution[instance.model_name]++;
            } else {
                stats.modelDistribution[instance.model_name] = 1;
            }

            // 평균 가동 시간 계산
            totalUptime += instance.uptime || 0;
        });

        if (instances.length > 0) {
            stats.averageUptime = totalUptime / instances.length;
        }

        return stats;
    };

    const resourceStats = getResourceStats(instances);

    const formatUptime = (seconds: number | null) => {
        if (!seconds) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const formatMemoryUsage = (memoryInfo: any) => {
        if (!memoryInfo) return 'N/A';
        const rss = memoryInfo.memory_info?.rss || 0;
        return `${Math.round(rss / 1024 / 1024)} MB`;
    };

    const handleInstanceAction = async (instanceId: string, action: 'stop' | 'health') => {
        setActionLoading(prev => ({ ...prev, [instanceId]: true }));

        try {
            if (action === 'stop') {
                await stopVLLMInstance(instanceId);
                toast.success(`인스턴스 ${instanceId} 중지됨`);
                onInstancesChanged();
            } else if (action === 'health') {
                const result = await vllmInstanceHealthCheck(instanceId) as HealthCheckResult;
                setHealthStatuses(prev => ({ ...prev, [instanceId]: result }));

                if (result.success) {
                    toast.success(`인스턴스 ${instanceId} 헬스체크 성공`);
                } else {
                    toast.error(`인스턴스 ${instanceId} 헬스체크 실패: ${result.message || '알 수 없는 오류'}`);
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`작업 실패: ${errorMessage}`);
            devLog.error(`Instance ${instanceId} action ${action} failed:`, error);
        } finally {
            setActionLoading(prev => ({ ...prev, [instanceId]: false }));
        }
    };

    const handleStopAll = async () => {
        if (instances.length === 0) {
            toast.error('중지할 인스턴스가 없습니다');
            return;
        }

        if (!confirm(`모든 ${instances.length}개 인스턴스를 중지하시겠습니까?`)) {
            return;
        }

        try {
            setActionLoading(prev => ({ ...prev, 'all': true }));
            const result = await stopAllVLLMInstances() as StopAllResult;

            if (result.success) {
                toast.success(`${result.stopped_instances?.length || 0}개 인스턴스 중지 완료`);
                if (result.failed_instances && result.failed_instances.length > 0) {
                    toast(`${result.failed_instances.length}개 인스턴스 중지 실패`, {
                        icon: '⚠️',
                        style: {
                            borderRadius: '10px',
                            background: '#FEF3C7',
                            color: '#92400E',
                            border: '1px solid #F59E0B'
                        },
                    });
                }
            } else {
                toast.error(`일괄 중지 실패: ${result.message || '알 수 없는 오류'}`);
            }

            onInstancesChanged();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`일괄 중지 실패: ${errorMessage}`);
        } finally {
            setActionLoading(prev => ({ ...prev, 'all': false }));
        }
    };

    const handleSelectInstance = (instanceId: string, checked: boolean) => {
        if (checked) {
            setSelectedInstances(prev => [...prev, instanceId]);
        } else {
            setSelectedInstances(prev => prev.filter(id => id !== instanceId));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedInstances(instances.map(inst => inst.instance_id));
        } else {
            setSelectedInstances([]);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <FiRefreshCw className={styles.spinner} />
                <p>인스턴스 목록을 불러오는 중...</p>
            </div>
        );
    }

    if (instances.length === 0) {
        return (
            <div className={styles.emptyState}>
                <FiPlay className={styles.emptyIcon} />
                <h3>실행 중인 VLLM 인스턴스가 없습니다</h3>
                <p>VLLM 시작 탭에서 새 인스턴스를 생성해보세요.</p>
            </div>
        );
    }

    return (
        <div className={styles.instanceManagement}>
            {/* 리소스 통계 */}
            <div className={styles.statsSection}>
                <h3>리소스 통계</h3>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>실행 중인 인스턴스</div>
                        <div className={styles.statValue}>{resourceStats.totalInstances}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>사용 중인 HPU</div>
                        <div className={styles.statValue}>{resourceStats.totalAllocatedHPUs}</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statLabel}>평균 가동시간</div>
                        <div className={styles.statValue}>{formatUptime(resourceStats.averageUptime)}</div>
                    </div>
                </div>
            </div>

            {/* 액션 버튼 */}
            <div className={styles.actionBar}>
                <div className={styles.selectionInfo}>
                    <label className={styles.selectAll}>
                        <input
                            type="checkbox"
                            checked={selectedInstances.length === instances.length && instances.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                        전체 선택 ({selectedInstances.length}/{instances.length})
                    </label>
                </div>
                <div className={styles.actionButtons}>
                    <button
                        className={styles.refreshButton}
                        onClick={onInstancesChanged}
                        disabled={loading}
                    >
                        <FiRefreshCw />
                        새로고침
                    </button>
                    <button
                        className={styles.stopAllButton}
                        onClick={handleStopAll}
                        disabled={actionLoading['all'] || instances.length === 0}
                    >
                        <FiSquare />
                        {actionLoading['all'] ? '중지 중...' : '모두 중지'}
                    </button>
                </div>
            </div>

            {/* 인스턴스 테이블 */}
            <div className={styles.instanceTable}>
                <div className={styles.tableHeader}>
                    <div className={styles.headerCell}>선택</div>
                    <div className={styles.headerCell}>인스턴스 ID</div>
                    <div className={styles.headerCell}>모델</div>
                    <div className={styles.headerCell}>상태</div>
                    <div className={styles.headerCell}>HPU</div>
                    <div className={styles.headerCell}>포트</div>
                    <div className={styles.headerCell}>가동시간</div>
                    <div className={styles.headerCell}>메모리</div>
                    <div className={styles.headerCell}>작업</div>
                </div>

                {instances.map(instance => {
                    const healthStatus = healthStatuses[instance.instance_id];
                    const isLoading = actionLoading[instance.instance_id];

                    return (
                        <div key={instance.instance_id} className={styles.tableRow}>
                            <div className={styles.cell}>
                                <input
                                    type="checkbox"
                                    checked={selectedInstances.includes(instance.instance_id)}
                                    onChange={(e) => handleSelectInstance(instance.instance_id, e.target.checked)}
                                />
                            </div>
                            <div className={styles.cell}>
                                <div className={styles.instanceIdCell}>
                                    <span className={styles.shortId}>
                                        {instance.instance_id.split('_').slice(-2).join('_')}
                                    </span>
                                    {instance.pid && (
                                        <small className={styles.pid}>PID: {instance.pid}</small>
                                    )}
                                </div>
                            </div>
                            <div className={styles.cell}>
                                <span className={styles.modelName}>{instance.model_name}</span>
                            </div>
                            <div className={styles.cell}>
                                <span className={`${styles.statusBadge} ${styles[instance.status]}`}>
                                    {instance.status}
                                </span>
                                {healthStatus && (
                                    <div className={styles.healthStatus}>
                                        {healthStatus.success ? (
                                            <FiActivity className={styles.healthGood} title="API 정상" />
                                        ) : (
                                            <FiAlertCircle className={styles.healthBad} title="API 오류" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className={styles.cell}>
                                <div className={styles.hpuInfo}>
                                    <span className={styles.hpuList}>
                                        {instance.allocated_hpus.join(', ')}
                                    </span>
                                    <small className={styles.parallelSize}>
                                        ({instance.tensor_parallel_size}개)
                                    </small>
                                </div>
                            </div>
                            <div className={styles.cell}>
                                <span className={styles.port}>{instance.port}</span>
                            </div>
                            <div className={styles.cell}>
                                <span className={styles.uptime}>
                                    {formatUptime(instance.uptime)}
                                </span>
                            </div>
                            <div className={styles.cell}>
                                <span className={styles.memory}>
                                    {formatMemoryUsage(instance.memory_usage)}
                                </span>
                            </div>
                            <div className={styles.cell}>
                                <div className={styles.actionButtons}>
                                    <button
                                        className={styles.healthButton}
                                        onClick={() => handleInstanceAction(instance.instance_id, 'health')}
                                        disabled={isLoading}
                                        title="헬스 체크"
                                    >
                                        <FiActivity />
                                    </button>
                                    <button
                                        className={styles.stopButton}
                                        onClick={() => handleInstanceAction(instance.instance_id, 'stop')}
                                        disabled={isLoading}
                                        title="인스턴스 중지"
                                    >
                                        {isLoading ? <FiRefreshCw className={styles.spinner} /> : <FiSquare />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 모델별 분포 */}
            {Object.keys(resourceStats.modelDistribution).length > 0 && (
                <div className={styles.modelDistribution}>
                    <h4>모델별 분포</h4>
                    <div className={styles.distributionList}>
                        {Object.entries(resourceStats.modelDistribution).map(([model, count]) => (
                            <div key={model} className={styles.distributionItem}>
                                <span className={styles.modelName}>{model}</span>
                                <span className={styles.count}>{count}개</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
