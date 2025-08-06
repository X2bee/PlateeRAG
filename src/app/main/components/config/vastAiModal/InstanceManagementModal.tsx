import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiCopy, FiExternalLink, FiServer, FiSettings, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import VastAiConfigModal from '@/app/main/components/config/vastAiConfigModal';
import { listVastInstances, destroyVastInstance, updateVllmConnectionConfig, vllmDown, vllmServe, vllmHealthCheck } from '@/app/api/vastAPI';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/main/assets/Settings.module.scss';

interface VastInstanceData {
    id: number;
    created_at: string;
    updated_at: string;
    instance_id: string;
    offer_id: string;
    image_name: string;
    status: string;
    public_ip: string | null;
    ssh_port: number | null;
    port_mappings: string | null;
    start_command: string | null;
    gpu_info: string;
    auto_destroy: boolean;
    template_name: string | null;
    destroyed_at: string | null;
    model_name: string;
    max_model_length: number;
    dph_total: string;
    cpu_name: string;
    cpu_cores: number;
    ram: number;
    cuda_max_good: string;
}

interface VastInstancesResponse {
    instances: VastInstanceData[];
}

export const InstanceManagementModal = () => {
    const [instanceFilter, setInstanceFilter] = useState<'active' | 'inactive' | 'all'>('active');
    const [instances, setInstances] = useState<VastInstanceData[]>([]);
    const [isLoadingInstances, setIsLoadingInstances] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
    const [selectedPortMappings, setSelectedPortMappings] = useState<string | null>(null);
    const [showVllmConfigFor, setShowVllmConfigFor] = useState<string | null>(null);
    const [vllmHealthStatus, setVllmHealthStatus] = useState<{ [key: string]: 'checking' | 'success' | 'failed' | null }>({});
    const [vllmServeLoading, setVllmServeLoading] = useState<{ [key: string]: boolean }>({});
    const [destroyLoading, setDestroyLoading] = useState<{ [key: string]: boolean }>({});
    const [vllmConfig, setVllmConfig] = useState<{ [key: string]: any }>({
        model_name: '',
        max_model_len: 0,
        gpu_memory_utilization: 0.95,
        dtype: 'bfloat16'
    });

    const handleLoadInstances = async () => {
        setIsLoadingInstances(true);
        try {
            devLog.info('Loading vast instances...');
            const result = await listVastInstances() as VastInstancesResponse;
            setInstances(result.instances);
            setVllmHealthStatus({}); // 헬스 체크 상태 초기화
            devLog.info('Vast instances loaded:', result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`인스턴스 목록 로드 실패: ${errorMessage}`);
            devLog.error('Failed to load instances:', error);
        } finally {
            setIsLoadingInstances(false);
        }
    };

    const handleAutoHealthCheck = async (instances: VastInstanceData[]) => {
        // 로드 성공 시 모든 running_vllm 인스턴스의 헬스 체크 자동 실행
        const vllmInstances = instances.filter(instance =>
            instance.status === 'running_vllm' &&
            getExternalPortInfo(instance.port_mappings, '12434')
        );

        if (vllmInstances.length > 0) {
            devLog.info(`Starting automatic health check for ${vllmInstances.length} VLLM instances`);

            // 모든 VLLM 인스턴스의 헬스 체크를 병렬로 실행
            const healthCheckPromises = vllmInstances.map(async (instance) => {
                const vllmEndpoint = getExternalPortInfo(instance.port_mappings, '12434');
                if (vllmEndpoint) {
                    try {
                        await handleVllmHealthCheck(vllmEndpoint, instance.instance_id);
                    } catch (error) {
                        devLog.error(`Auto health check failed for instance ${instance.instance_id}:`, error);
                    }
                }
            });

            // 모든 헬스 체크 완료 대기 (에러가 발생해도 계속 진행)
            await Promise.allSettled(healthCheckPromises);
            devLog.info('Automatic health check completed for all VLLM instances');
        }
    };

    useEffect(() => {
        handleLoadInstances();
    }, []);

    // 인스턴스 목록이 업데이트된 후 자동 헬스 체크 실행
    useEffect(() => {
        if (instances.length > 0 && !isLoadingInstances) {
            // 짧은 지연 후 헬스 체크 실행 (UI 렌더링 완료 대기)
            const timer = setTimeout(() => {
                handleAutoHealthCheck(instances);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [instances, isLoadingInstances]);

    const getFilteredInstances = () => {
        switch (instanceFilter) {
            case 'active':
                return instances.filter(instance => instance.status !== 'deleted');
            case 'inactive':
                return instances.filter(instance => instance.status === 'deleted');
            case 'all':
            default:
                return instances;
        }
    };

    const getInstanceCount = () => {
        const activeCount = instances.filter(instance => instance.status !== 'deleted').length;
        const inactiveCount = instances.filter(instance => instance.status === 'deleted').length;
        return { active: activeCount, inactive: inactiveCount, total: instances.length };
    };

    const handleDestroyInstance = async (instanceId: string) => {
        const confirmed = window.confirm('정말로 이 인스턴스를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.');

        if (!confirmed) {
            return;
        }

        setDestroyLoading(prev => ({ ...prev, [instanceId]: true }));

        try {
            devLog.info('Destroying instance:', instanceId);
            await destroyVastInstance(instanceId);

            toast.success('인스턴스가 삭제되었습니다.');

            // 인스턴스 목록 새로고침
            await handleLoadInstances();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`인스턴스 삭제 실패: ${errorMessage}`);
            devLog.error('Failed to destroy instance:', error);
        } finally {
            // 로딩 상태 해제
            setDestroyLoading(prev => ({ ...prev, [instanceId]: false }));
        }
    };

    const handleSetVllmConfig = async (instance: VastInstanceData) => {
        const vllmEndpoint = getExternalPortInfo(instance.port_mappings, '12434');

        if (!vllmEndpoint) {
            toast.error('VLLM 엔드포인트가 준비되지 않았습니다.');
            return;
        }

        const vllmUrl = `http://${vllmEndpoint.ip}:${vllmEndpoint.port}/v1`;

        try {
            devLog.info('Setting VLLM config:', { api_base_url: vllmUrl, model_name: instance.model_name });

            await updateVllmConnectionConfig({
                api_base_url: vllmUrl,
                model_name: instance.model_name
            });

            toast.success('VLLM 설정이 업데이트되었습니다.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`VLLM 설정 업데이트 실패: ${errorMessage}`);
            devLog.error('Failed to set VLLM config:', error);
        }
    };

    const handleVllmDown = async (instance: VastInstanceData) => {
        try {
            devLog.info('Stopping VLLM model for instance:', instance.instance_id);

            await vllmDown(instance.instance_id);

            toast.success('VLLM 모델이 종료되었습니다.');
            handleLoadInstances();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`VLLM 모델 종료 실패: ${errorMessage}`);
            devLog.error('Failed to stop VLLM model:', error);
        }
    };

    const handleVllmServe = async (instance: VastInstanceData) => {
        setVllmServeLoading(prev => ({ ...prev, [instance.instance_id]: true }));

        const config = {
            model_id: vllmConfig.model_name,
            max_model_len: vllmConfig.max_model_len,
            host: "0.0.0.0",
            port: 12434,
            gpu_memory_utilization: vllmConfig.gpu_memory_utilization,
            pipeline_parallel_size: 1,
            tensor_parallel_size: 1,
            dtype: vllmConfig.dtype,
            kv_cache_dtype: "auto",
            tool_call_parser: "hermes",
        };

        try {
            devLog.info('Starting VLLM model for instance:', { instance_id: instance.instance_id, config: config });

            await vllmServe(instance.instance_id, config);

            toast.success('VLLM 모델이 시작되었습니다.');
            setShowVllmConfigFor(null);
            handleLoadInstances();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`VLLM 모델 시작 실패: ${errorMessage}`);
            devLog.error('Failed to start VLLM model:', error);
        } finally {
            // 로딩 상태 해제
            setVllmServeLoading(prev => ({ ...prev, [instance.instance_id]: false }));
        }
    };

    const getExternalPortInfo = (portMappings: string | null, targetPort: string) => {
        if (!portMappings) return null;

        try {
            const mappings = JSON.parse(portMappings);
            const portInfo = mappings[targetPort];

            if (portInfo && portInfo.external_ip && portInfo.external_port) {
                return {
                    ip: portInfo.external_ip,
                    port: portInfo.external_port
                };
            }
        } catch (error) {
            devLog.error('Failed to parse port mappings:', error);
        }

        return null;
    };

    const handleOpenPortMappingsModal = (instanceId: string, portMappings: string | null) => {
        setSelectedInstanceId(instanceId);
        setSelectedPortMappings(portMappings);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedInstanceId('');
        setSelectedPortMappings(null);
    };

    const handleOpenVllmConfigModal = (instance: VastInstanceData) => {
        setVllmConfig({
            model_name: 'Qwen/Qwen3-4B',
            max_model_len: '8192',
            gpu_memory_utilization: 0.90,
            dtype: 'bfloat16'
        });
        setShowVllmConfigFor(instance.instance_id);
    };

    const handleVllmHealthCheck = async (vllmEndpoint: { ip: string, port: string }, instanceId: string) => {
        setVllmHealthStatus(prev => ({ ...prev, [instanceId]: 'checking' }));

        try {
            const healthRequest = {
                ip: vllmEndpoint.ip,
                port: parseInt(vllmEndpoint.port)
            };

            const result = await vllmHealthCheck(healthRequest) as any;

            if (result.success) {
                toast.success(result.message);
                devLog.info('VLLM health check successful:', result);
                setVllmHealthStatus(prev => ({ ...prev, [instanceId]: 'success' }));
                return true;
            } else {
                toast.error(result.message);
                devLog.error('VLLM health check failed:', result);
                setVllmHealthStatus(prev => ({ ...prev, [instanceId]: 'failed' }));
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`VLLM 헬스 체크 실패: ${errorMessage}`);
            devLog.error('Failed to check VLLM health:', error);
            setVllmHealthStatus(prev => ({ ...prev, [instanceId]: 'failed' }));
            return false;
        }
    };

    return (
        <>
            <div className={styles.configSection}>
                <h3 className={styles.sectionTitle}>
                    <FiServer className={styles.sectionIcon} />
                    Instance 관리
                </h3>

                {/* 인스턴스 필터 및 로드 버튼 */}
                <div className={styles.instanceManagementHeader}>
                    <div className={styles.instanceFilters}>
                        <button
                            className={`${styles.filterButton} ${instanceFilter === 'active' ? styles.active : ''}`}
                            onClick={() => setInstanceFilter('active')}
                        >
                            활성 ({getInstanceCount().active})
                        </button>
                        <button
                            className={`${styles.filterButton} ${instanceFilter === 'inactive' ? styles.active : ''}`}
                            onClick={() => setInstanceFilter('inactive')}
                        >
                            비활성 ({getInstanceCount().inactive})
                        </button>
                        <button
                            className={`${styles.filterButton} ${instanceFilter === 'all' ? styles.active : ''}`}
                            onClick={() => setInstanceFilter('all')}
                        >
                            전체 ({getInstanceCount().total})
                        </button>
                    </div>
                    <button
                        className={`${styles.button} ${styles.primary}`}
                        onClick={handleLoadInstances}
                        disabled={isLoadingInstances}
                    >
                        {isLoadingInstances ? (
                            <>
                                <FiRefreshCw className={`${styles.icon} ${styles.spinning}`} />
                                로딩 중...
                            </>
                        ) : (
                            <>
                                <FiRefreshCw className={styles.icon} />
                                새로고침
                            </>
                        )}
                    </button>
                </div>

                {/* 인스턴스 목록 */}
                <div className={styles.instancesList}>
                    {isLoadingInstances ? (
                        <div className={styles.noResults}>
                            <FiRefreshCw className={`${styles.icon} ${styles.spinning}`} />
                            인스턴스 목록을 불러오는 중...
                        </div>
                    ) : getFilteredInstances().length === 0 ? (
                        <div className={styles.noResults}>
                            <FiServer className={styles.icon} />
                            {instanceFilter === 'active' && '활성 인스턴스가 없습니다.'}
                            {instanceFilter === 'inactive' && '비활성 인스턴스가 없습니다.'}
                            {instanceFilter === 'all' && '인스턴스가 없습니다.'}
                        </div>
                    ) : (
                        getFilteredInstances().map((instance) => {
                            const gpuInfo = JSON.parse(instance.gpu_info || '{}');
                            const isActive = instance.status !== 'deleted';
                            const vllmEndpoint = getExternalPortInfo(instance.port_mappings, '12434');

                            return (
                                <div key={instance.id} className={`${styles.instanceCard} ${!isActive ? styles.inactive : ''}`}>
                                    <div className={styles.instanceHeader}>
                                        <div className={styles.instanceInfo}>
                                            <div className={styles.instanceTitle}>
                                                <span className={styles.instanceId}>#{instance.instance_id}</span>
                                                <span className={`${styles.instanceStatus} ${isActive ? styles.active : styles.inactive}`}>
                                                    {isActive ? (
                                                        <FiCheck className={styles.statusIcon} />
                                                    ) : (
                                                        <FiX className={styles.statusIcon} />
                                                    )}
                                                    {instance.status}
                                                </span>
                                                {instance.status === 'running_vllm' && vllmEndpoint && (
                                                    <button
                                                        className={`${styles.instanceStatus} ${vllmHealthStatus[instance.instance_id] === 'success' ? styles.active :
                                                                vllmHealthStatus[instance.instance_id] === 'failed' ? styles.inactive :
                                                                    styles.active
                                                            }`}
                                                        onClick={() => handleVllmHealthCheck(vllmEndpoint, instance.instance_id)}
                                                        disabled={vllmHealthStatus[instance.instance_id] === 'checking'}
                                                        style={{
                                                            cursor: vllmHealthStatus[instance.instance_id] === 'checking' ? 'not-allowed' : 'pointer',
                                                            opacity: vllmHealthStatus[instance.instance_id] === 'checking' ? 0.6 : 1
                                                        }}
                                                    >
                                                        {vllmHealthStatus[instance.instance_id] === 'checking' ? (
                                                            <FiRefreshCw className={`${styles.statusIcon} ${styles.spinning}`} />
                                                        ) : vllmHealthStatus[instance.instance_id] === 'failed' ? (
                                                            <FiX className={styles.statusIcon} />
                                                        ) : (
                                                            <FiCheck className={styles.statusIcon} />
                                                        )}
                                                        {vllmHealthStatus[instance.instance_id] === 'checking' ? '확인 중...' : '헬스 체크'}
                                                    </button>
                                                )}
                                            </div>
                                            <div className={styles.instanceMeta}>
                                                <span>생성: {new Date(instance.created_at).toLocaleString('ko-KR')}</span>
                                                {vllmEndpoint ? (
                                                    <span>VLLM:   {vllmEndpoint.ip}:{vllmEndpoint.port}/v1</span>
                                                ) : (
                                                    <span className={styles.pendingConnection}>VLLM 엔드포인트 대기 중</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.instanceCost}>
                                            ${parseFloat(instance.dph_total).toFixed(4)}/시간
                                        </div>
                                    </div>

                                    <div className={styles.instanceDetails}>
                                        <div className={styles.instanceDetailRow}>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>GPU:</span>
                                                <span className={styles.detailValue}>
                                                    {gpuInfo.gpu_name && (
                                                        <>
                                                            <span className={styles.cpuName}>{gpuInfo.gpu_name}</span>
                                                            {gpuInfo.num_gpus > 1 && <span className={styles.cpuCores}>(x{gpuInfo.num_gpus})</span>}
                                                            <span className={styles.gpuRam}> - {(gpuInfo.gpu_ram / 1024).toFixed(1)}GB</span>
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>CPU:</span>
                                                <span className={styles.detailValue}>
                                                    <span className={styles.cpuName}>{instance.cpu_name}</span>
                                                    <span className={styles.cpuCores}> ({instance.cpu_cores}코어)</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className={styles.instanceDetailRow}>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>시스템 RAM:</span>
                                                <span className={styles.detailValue}>{(instance.ram / 1024).toFixed(1)}GB</span>
                                            </div>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>CUDA:</span>
                                                <span className={styles.detailValue}>{parseFloat(instance.cuda_max_good).toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div className={styles.instanceDetailRow}>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>모델:</span>
                                                <span className={styles.detailValue}>
                                                    <span className={styles.modelName}>{instance.model_name}</span>
                                                    <span className={styles.modelLength}> (길이: {instance.max_model_length})</span>
                                                </span>
                                            </div>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>이미지:</span>
                                                <span className={styles.detailValue}>{instance.image_name}</span>
                                            </div>
                                        </div>
                                        <div className={styles.instanceDetailRow}>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>Offer ID:</span>
                                                <span className={styles.detailValue}>{instance.offer_id}</span>
                                            </div>
                                            <div className={styles.detail}>
                                                <span className={styles.detailLabel}>자동 삭제:</span>
                                                <span className={styles.detailValue}>{instance.auto_destroy ? '예' : '아니오'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {isActive && (
                                        <div className={styles.instanceActions} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {/* VLLM 관련 버튼들 (왼쪽) */}
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {instance.status === 'running' && (
                                                    <button
                                                        className={`${styles.button} ${styles.small} ${styles.primary}`}
                                                        onClick={() => handleOpenVllmConfigModal(instance)}
                                                    >
                                                        <FiCheck className={styles.icon} />
                                                        VLLM 시작
                                                    </button>
                                                )}
                                                {instance.status === 'running_vllm' && (
                                                    <button
                                                        className={`${styles.button} ${styles.small} ${styles.danger}`}
                                                        onClick={() => handleVllmDown(instance)}
                                                    >
                                                        <FiX className={styles.icon} />
                                                        VLLM 종료
                                                    </button>
                                                )}
                                            </div>

                                            {/* 기타 관리 버튼들 (오른쪽) */}
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className={`${styles.button} ${styles.small} ${styles.secondary}`}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(instance.instance_id);
                                                        toast.success('인스턴스 ID가 복사되었습니다.');
                                                    }}
                                                >
                                                    <FiCopy className={styles.icon} />
                                                    ID 복사
                                                </button>
                                                {instance.public_ip && instance.ssh_port && (
                                                    <button
                                                        className={`${styles.button} ${styles.small} ${styles.secondary}`}
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`ssh root@${instance.public_ip} -p ${instance.ssh_port}`);
                                                            toast.success('SSH 명령어가 복사되었습니다.');
                                                        }}
                                                    >
                                                        <FiExternalLink className={styles.icon} />
                                                        SSH 복사
                                                    </button>
                                                )}
                                                {vllmEndpoint && instance.model_name !== "None" && (
                                                    <button
                                                        className={`${styles.button} ${styles.small} ${styles.secondary}`}
                                                        onClick={() => {
                                                            const vllmUrl = `http://${vllmEndpoint.ip}:${vllmEndpoint.port}/v1`;
                                                            navigator.clipboard.writeText(vllmUrl);
                                                            toast.success('VLLM URL이 복사되었습니다.');
                                                        }}
                                                    >
                                                        <FiExternalLink className={styles.icon} />
                                                        VLLM URL
                                                    </button>
                                                )}
                                                <button
                                                    className={`${styles.button} ${styles.small} ${styles.secondary}`}
                                                    onClick={() => handleOpenPortMappingsModal(instance.instance_id, instance.port_mappings)}
                                                >
                                                    <FiSettings className={styles.icon} />
                                                    관리
                                                </button>
                                                {vllmEndpoint && instance.model_name !== "None" && (
                                                    <button
                                                        className={`${styles.button} ${styles.small} ${styles.primary}`}
                                                        style={{ background: 'green' }}
                                                        onClick={() => handleSetVllmConfig(instance)}
                                                    >
                                                        <FiCheck className={styles.icon} />
                                                        VLLM 설정
                                                    </button>
                                                )}
                                                <button
                                                    className={`${styles.button} ${styles.small} ${styles.danger}`}
                                                    onClick={() => handleDestroyInstance(instance.instance_id)}
                                                    disabled={destroyLoading[instance.instance_id]}
                                                    style={{
                                                        cursor: destroyLoading[instance.instance_id] ? 'not-allowed' : 'pointer',
                                                        opacity: destroyLoading[instance.instance_id] ? 0.6 : 1
                                                    }}
                                                >
                                                    {destroyLoading[instance.instance_id] ? (
                                                        <>
                                                            <FiRefreshCw className={`${styles.icon} ${styles.spinning}`} />
                                                            삭제 중...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiTrash2 className={styles.icon} />
                                                            삭제
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* VLLM 설정 폼 */}
                                    {showVllmConfigFor === instance.instance_id && (
                                        <div className={styles.vllmConfigForm}>
                                            <h4 className={styles.vllmConfigHeader}>VLLM 설정</h4>

                                            <div className={styles.vllmConfigGrid}>
                                                <div className={styles.vllmConfigField}>
                                                    <label className={styles.vllmConfigLabel}>
                                                        모델명
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={vllmConfig.model_name}
                                                        onChange={(e) => setVllmConfig({ ...vllmConfig, model_name: e.target.value })}
                                                        className={styles.vllmConfigInput}
                                                    />
                                                </div>
                                                <div className={styles.vllmConfigField}>
                                                    <label className={styles.vllmConfigLabel}>
                                                        최대 모델 길이
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={vllmConfig.max_model_len}
                                                        onChange={(e) => setVllmConfig({ ...vllmConfig, max_model_len: parseInt(e.target.value) })}
                                                        className={styles.vllmConfigInput}
                                                    />
                                                </div>
                                                <div className={styles.vllmConfigField}>
                                                    <label className={styles.vllmConfigLabel}>
                                                        GPU 메모리 사용률
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={vllmConfig.gpu_memory_utilization}
                                                        onChange={(e) => setVllmConfig({ ...vllmConfig, gpu_memory_utilization: parseFloat(e.target.value) })}
                                                        step={0.05}
                                                        min={0.1}
                                                        max={1.0}
                                                        className={styles.vllmConfigInput}
                                                    />
                                                </div>
                                                <div className={styles.vllmConfigField}>
                                                    <label className={styles.vllmConfigLabel}>
                                                        데이터 타입
                                                    </label>
                                                    <select
                                                        value={vllmConfig.dtype}
                                                        onChange={(e) => setVllmConfig({ ...vllmConfig, dtype: e.target.value })}
                                                        className={styles.vllmConfigSelect}
                                                    >
                                                        <option value="auto">auto</option>
                                                        <option value="float16">float16</option>
                                                        <option value="bfloat16">bfloat16</option>
                                                        <option value="float32">float32</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className={styles.vllmConfigActions}>
                                                <button
                                                    className={`${styles.vllmConfigButton} ${styles.cancel}`}
                                                    onClick={() => setShowVllmConfigFor(null)}
                                                    disabled={vllmServeLoading[instance.instance_id]}
                                                >
                                                    취소
                                                </button>
                                                <button
                                                    className={`${styles.vllmConfigButton} ${styles.start}`}
                                                    onClick={() => handleVllmServe(instance)}
                                                    disabled={vllmServeLoading[instance.instance_id]}
                                                    style={{
                                                        cursor: vllmServeLoading[instance.instance_id] ? 'not-allowed' : 'pointer',
                                                        opacity: vllmServeLoading[instance.instance_id] ? 0.6 : 1
                                                    }}
                                                >
                                                    {vllmServeLoading[instance.instance_id] ? (
                                                        <>
                                                            <FiRefreshCw className={`${styles.icon} ${styles.spinning}`} />
                                                            시작 중...
                                                        </>
                                                    ) : (
                                                        '시작'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            <VastAiConfigModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                instanceId={selectedInstanceId}
                portMappings={selectedPortMappings}
            />
        </>
    )
};
