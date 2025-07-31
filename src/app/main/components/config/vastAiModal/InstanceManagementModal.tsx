import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiCopy, FiExternalLink, FiServer, FiSettings, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import VastAiConfigModal from '@/app/main/components/config/vastAiConfigModal';
import { listVastInstances, destroyVastInstance, setVllmConfig } from '@/app/api/vastAPI';
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

    const handleLoadInstances = async () => {
        setIsLoadingInstances(true);
        try {
            devLog.info('Loading vast instances...');
            const result = await listVastInstances() as VastInstancesResponse;
            setInstances(result.instances);
            devLog.info('Vast instances loaded:', result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`인스턴스 목록 로드 실패: ${errorMessage}`);
            devLog.error('Failed to load instances:', error);
        } finally {
            setIsLoadingInstances(false);
        }
    };

    useEffect(() => {
        handleLoadInstances();
    }, []);

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

            await setVllmConfig({
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
        const vllmControllerEndpoint = getExternalPortInfo(instance.port_mappings, '12435');

        if (!vllmControllerEndpoint) {
            toast.error('VLLM 컨트롤러 엔드포인트가 준비되지 않았습니다.');
            return;
        }

        const vllmControllerUrl = `http://${vllmControllerEndpoint.ip}:${vllmControllerEndpoint.port}`;

        try {
            devLog.info('Stopping VLLM model:', vllmControllerUrl);

            const response = await fetch(`${vllmControllerUrl}/api/vllm/down`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast.success('VLLM 모델이 종료되었습니다.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`VLLM 모델 종료 실패: ${errorMessage}`);
            devLog.error('Failed to stop VLLM model:', error);
        }
    };

    const handleVllmServe = async (instance: VastInstanceData, serveConfig?: any) => {
        const vllmControllerEndpoint = getExternalPortInfo(instance.port_mappings, '12435');

        if (!vllmControllerEndpoint) {
            toast.error('VLLM 컨트롤러 엔드포인트가 준비되지 않았습니다.');
            return;
        }

        const vllmControllerUrl = `http://${vllmControllerEndpoint.ip}:${vllmControllerEndpoint.port}`;

        const defaultServeConfig = {
            model_id: instance.model_name,
            tokenizer: instance.model_name,
            download_dir: "/models/huggingface",
            host: "0.0.0.0",
            port: 12434,
            max_model_len: instance.max_model_length,
            pipeline_parallel_size: 1,
            tensor_parallel_size: 1,
            gpu_memory_utilization: 0.95,
            dtype: "bfloat16",
            kv_cache_dtype: "auto",
            load_local: false,
            tool_call_parser: "hermes"
        };

        const finalServeConfig = serveConfig || defaultServeConfig;

        try {
            devLog.info('Starting VLLM model:', { url: vllmControllerUrl, config: finalServeConfig });

            const response = await fetch(`${vllmControllerUrl}/api/vllm/serve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(finalServeConfig),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast.success('VLLM 모델이 시작되었습니다.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`VLLM 모델 시작 실패: ${errorMessage}`);
            devLog.error('Failed to start VLLM model:', error);
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
                                        <div className={styles.instanceActions}>
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
                                            {vllmEndpoint && (
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
                                            {vllmEndpoint && (
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
                                            >
                                                <FiTrash2 className={styles.icon} />
                                                삭제
                                            </button>
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
