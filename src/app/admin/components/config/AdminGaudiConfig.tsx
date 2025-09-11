import React, { useState, useEffect } from 'react';
import { FiCpu, FiPlay, FiMonitor, FiSettings, FiActivity, FiServer } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminBaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/admin/components/config/AdminBaseConfigPanel';
import { AdminGaudiVLLMModal } from '@/app/admin/components/config/AdminGaudiModal/AdminGaudiVLLMModal';
import { AdminGaudiInstanceManagementModal } from '@/app/admin/components/config/AdminGaudiModal/AdminGaudiInstanceManagementModal';
import { AdminGaudiResourceMonitorModal } from '@/app/admin/components/config/AdminGaudiModal/AdminGaudiResourceMonitorModal';
import { 
    checkGaudiHealth, 
    getAvailableHPUs, 
    listVLLMInstances,
    createInstanceMonitor
} from '@/app/admin/api/gaudiAPI';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/admin/assets/settings/AdminSettings.module.scss';

interface AdminGaudiConfigProps {
    configData?: ConfigItem[];
    onTestConnection?: (category: string) => void;
}

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

interface GaudiHealthResponse {
    hpu_status: {
        available: boolean;
        total_count: number;
        available_count: number;
        allocated_count: number;
        device_details: Record<number, any>;
        allocation_map: Record<number, string>;
    };
    vllm_instances: {
        count: number;
        instances: Record<string, any>;
    };
    resource_recommendation: {
        max_new_instances_single_hpu: number;
        max_new_instances_dual_hpu: number;
        suggested_tensor_parallel: number;
    };
}

const GAUDI_CONFIG_FIELDS: Record<string, FieldConfig> = {
    GAUDI_VLLM_HOST_IP: {
        label: 'VLLM Host IP',
        type: 'text',
        placeholder: '0.0.0.0',
        description: 'VLLM 서비스 호스트 IP 주소',
        required: true,
    },
    GAUDI_VLLM_PORT: {
        label: 'VLLM Port',
        type: 'number',
        placeholder: '12434',
        description: 'VLLM 서비스 포트 번호',
        required: true,
    },
    GAUDI_VLLM_SERVE_MODEL_NAME: {
        label: 'Default Model Name',
        type: 'text',
        placeholder: 'x2bee/Polar-14B',
        description: '기본 사용할 모델명',
        required: true,
    },
    GAUDI_VLLM_MAX_MODEL_LEN: {
        label: 'Max Model Length',
        type: 'number',
        placeholder: '2048',
        description: '최대 모델 길이',
        required: true,
    },
    GAUDI_VLLM_DTYPE: {
        label: 'Data Type',
        type: 'select',
        options: [
            { value: 'bfloat16', label: 'bfloat16 (권장)' },
            { value: 'float16', label: 'float16' },
            { value: 'auto', label: 'auto' }
        ],
        description: 'VLLM에서 사용할 데이터 타입',
        required: true,
    },
    GAUDI_VLLM_TENSOR_PARALLEL_SIZE: {
        label: 'Tensor Parallel Size',
        type: 'number',
        placeholder: '1',
        description: '텐서 병렬 처리 크기 (사용할 HPU 개수)',
        required: true,
    },
    GAUDI_VLLM_TOOL_CALL_PARSER: {
        label: 'Tool Call Parser',
        type: 'select',
        options: [
            { value: 'hermes', label: 'hermes' },
            { value: 'mistral', label: 'mistral' },
            { value: 'none', label: 'none' }
        ],
        description: '도구 호출 파서 종류',
        required: false,
    },
};

const AdminGaudiConfig: React.FC<AdminGaudiConfigProps> = ({
    configData = [],
}) => {
    const [activeCategory, setActiveCategory] = useState<'config' | 'vllm' | 'instance' | 'monitor'>('config');
    const [healthData, setHealthData] = useState<GaudiHealthResponse | null>(null);
    const [instances, setInstances] = useState<VLLMInstanceData[]>([]);
    const [loading, setLoading] = useState(false);

    // 상태 모니터링
    useEffect(() => {
        let monitor: any = null;

        const startMonitoring = () => {
            if (instances.length > 0) {
                const instanceIds = instances.map(inst => inst.instance_id);
                monitor = createInstanceMonitor(instanceIds, {
                    onStatusChange: (instanceId: string, status: string) => {
                        setInstances(prev => prev.map(inst => 
                            inst.instance_id === instanceId 
                                ? { ...inst, status }
                                : inst
                        ));
                    },
                    onError: (error: Error) => {
                        devLog.error('인스턴스 모니터링 에러:', error);
                    }
                });
                monitor.start();
            }
        };

        startMonitoring();

        return () => {
            if (monitor) {
                monitor.stop();
            }
        };
    }, [instances.length]);

    const handleTestConnection = async () => {
        try {
            setLoading(true);
            devLog.info('Testing Gaudi HPU connection...');

            const result = await checkGaudiHealth() as GaudiHealthResponse;

            if (result && result.hpu_status?.available) {
                const { hpu_status, resource_recommendation } = result;
                setHealthData(result);

                toast.success(`연결 성공: ${hpu_status.total_count}개 HPU 감지, ${hpu_status.available_count}개 사용 가능`);
                devLog.info('Gaudi connection test successful:', result);
            } else {
                throw new Error('HPU가 사용 불가능하거나 드라이버 문제가 있습니다');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`연결 실패: ${errorMessage}`);
            devLog.error('Gaudi connection test failed:', error);
            setHealthData(null);
        } finally {
            setLoading(false);
        }
    };

    const loadInstances = async () => {
        try {
            setLoading(true);
            const result = await listVLLMInstances();
            setInstances(Array.isArray(result) ? result : []);
        } catch (error) {
            devLog.error('Failed to load instances:', error);
            toast.error('인스턴스 목록을 불러올 수 없습니다');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeCategory === 'instance' || activeCategory === 'monitor') {
            loadInstances();
        }
    }, [activeCategory]);

    const renderHealthStatus = () => {
        if (!healthData) return null;

        const { hpu_status, vllm_instances, resource_recommendation } = healthData;

        return (
            <div className={styles.healthStatus}>
                <div className={styles.statusCard}>
                    <div className={styles.statusHeader}>
                        <FiCpu className={styles.statusIcon} />
                        <h4>HPU 상태</h4>
                    </div>
                    <div className={styles.statusGrid}>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>전체 HPU</span>
                            <span className={styles.statusValue}>{hpu_status.total_count}개</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>사용 가능</span>
                            <span className={styles.statusValue} style={{color: '#10b981'}}>
                                {hpu_status.available_count}개
                            </span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>사용 중</span>
                            <span className={styles.statusValue} style={{color: '#f59e0b'}}>
                                {hpu_status.allocated_count}개
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.statusCard}>
                    <div className={styles.statusHeader}>
                        <FiActivity className={styles.statusIcon} />
                        <h4>VLLM 인스턴스</h4>
                    </div>
                    <div className={styles.statusGrid}>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>실행 중</span>
                            <span className={styles.statusValue}>{vllm_instances.count}개</span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>권장 단일 HPU</span>
                            <span className={styles.statusValue}>
                                최대 {resource_recommendation.max_new_instances_single_hpu}개
                            </span>
                        </div>
                        <div className={styles.statusItem}>
                            <span className={styles.statusLabel}>권장 듀얼 HPU</span>
                            <span className={styles.statusValue}>
                                최대 {resource_recommendation.max_new_instances_dual_hpu}개
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderInstancesOverview = () => {
        if (instances.length === 0) {
            return (
                <div className={styles.emptyState}>
                    <FiServer className={styles.emptyIcon} />
                    <p>실행 중인 VLLM 인스턴스가 없습니다</p>
                </div>
            );
        }

        return (
            <div className={styles.instancesOverview}>
                {instances.map(instance => (
                    <div key={instance.instance_id} className={styles.instanceCard}>
                        <div className={styles.instanceHeader}>
                            <h4 className={styles.instanceId}>
                                {instance.instance_id.split('_').slice(-2).join('_')}
                            </h4>
                            <span className={`${styles.statusBadge} ${styles[instance.status]}`}>
                                {instance.status}
                            </span>
                        </div>
                        <div className={styles.instanceDetails}>
                            <div className={styles.instanceDetail}>
                                <span className={styles.detailLabel}>모델:</span>
                                <span className={styles.detailValue}>{instance.model_name}</span>
                            </div>
                            <div className={styles.instanceDetail}>
                                <span className={styles.detailLabel}>HPU:</span>
                                <span className={styles.detailValue}>
                                    {instance.allocated_hpus.join(', ')} ({instance.tensor_parallel_size}개)
                                </span>
                            </div>
                            <div className={styles.instanceDetail}>
                                <span className={styles.detailLabel}>포트:</span>
                                <span className={styles.detailValue}>{instance.port}</span>
                            </div>
                            {instance.uptime && (
                                <div className={styles.instanceDetail}>
                                    <span className={styles.detailLabel}>가동시간:</span>
                                    <span className={styles.detailValue}>
                                        {Math.floor(instance.uptime / 60)}분
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={styles.configPanel}>
            <div className={styles.tabNavigation}>
                <button
                    className={`${styles.tabButton} ${activeCategory === 'config' ? styles.active : ''}`}
                    onClick={() => setActiveCategory('config')}
                >
                    <FiSettings className={styles.tabIcon} />
                    설정
                </button>
                <button
                    className={`${styles.tabButton} ${activeCategory === 'vllm' ? styles.active : ''}`}
                    onClick={() => setActiveCategory('vllm')}
                >
                    <FiPlay className={styles.tabIcon} />
                    VLLM 시작
                </button>
                <button
                    className={`${styles.tabButton} ${activeCategory === 'instance' ? styles.active : ''}`}
                    onClick={() => setActiveCategory('instance')}
                >
                    <FiCpu className={styles.tabIcon} />
                    인스턴스 관리
                </button>
                <button
                    className={`${styles.tabButton} ${activeCategory === 'monitor' ? styles.active : ''}`}
                    onClick={() => setActiveCategory('monitor')}
                >
                    <FiMonitor className={styles.tabIcon} />
                    리소스 모니터
                </button>
            </div>

            {activeCategory === 'config' && (
                <div>
                    <AdminBaseConfigPanel
                        configData={configData}
                        fieldConfigs={GAUDI_CONFIG_FIELDS}
                        filterPrefix="gaudi"
                        onTestConnection={handleTestConnection}
                        testConnectionLabel="Gaudi HPU 연결 테스트"
                        testConnectionCategory="gaudi"
                    />
                    {renderHealthStatus()}
                    {healthData && renderInstancesOverview()}
                </div>
            )}

            {activeCategory === 'vllm' && (
                <AdminGaudiVLLMModal 
                    healthData={healthData}
                    onInstanceCreated={loadInstances}
                />
            )}

            {activeCategory === 'instance' && (
                <AdminGaudiInstanceManagementModal 
                    instances={instances}
                    onInstancesChanged={loadInstances}
                    loading={loading}
                />
            )}

            {activeCategory === 'monitor' && (
                <AdminGaudiResourceMonitorModal 
                    healthData={healthData}
                    instances={instances}
                />
            )}
        </div>
    );
};

export default AdminGaudiConfig;