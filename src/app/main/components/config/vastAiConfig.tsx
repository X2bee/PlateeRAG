import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiPlay, FiSquare, FiCopy, FiExternalLink, FiChevronDown, FiChevronUp, FiServer, FiSettings, FiTrash2 } from 'react-icons/fi';
import { BsGpuCard } from 'react-icons/bs';
import toast from 'react-hot-toast';
import BaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/main/components/config/baseConfigPanel';
import VastAiConfigModal from '@/app/main/components/config/vastAiConfigModal';
import { checkVastHealth, searchVastOffers, createVastInstance, listVastInstances, destroyVastInstance } from '@/app/api/vastAPI';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/main/assets/Settings.module.scss';

interface VastAiConfigProps {
    configData?: ConfigItem[];
    onTestConnection?: (category: string) => void;
}

interface VastOffer {
    id: string;
    gpu_name: string;
    num_gpus: number;
    gpu_ram: number;
    dph_total: number;
    rentable: boolean;
    cpu_cores?: number;
    cpu_name?: string;
    ram?: number;
    cuda_max_good?: number;
    public_ipaddr?: string;
}

interface OfferInfo {
    gpu_name: string | null;
    num_gpus: number | null;
    gpu_ram: number | null;
    dph_total: number | null;
    cpu_cores: number | null;
    cpu_name: string | null;
    ram: number | null;
    cuda_max_good: number | null;
}

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

interface VastOfferSearchResponse {
    offers: VastOffer[];
    total: number;
    filtered_count: number;
    search_query?: string;
    sort_info: {
        sort_by: string;
        order: string;
    };
}

interface SearchParams {
    gpu_name?: string;
    max_price?: number;
    min_gpu_ram?: number;
    num_gpus?: number;
    rentable?: boolean;
    sort_by?: string;
    limit?: number;
}

interface VastInstance {
    id: string;
    public_ipaddr: string;
    gpu_name: string;
    dph_total: number;
    cpu_cores: number;
    cpu_ram: number;
    gpu_ram: number;
    disk_space: number;
    inet_down: number;
    inet_up: number;
    cuda_max_good: number;
    reliability: number;
    verified: boolean;
    geolocation: string;
    status: 'ready' | 'loading' | 'error';
}

interface VastHealthResponse {
    status: string;
    service: string;
    message: string;
}

interface VLLMConfig {
    script_directory: string;
    hf_hub_token: string;
    main_script: string;
    log_file: string;
    install_requirements: boolean;
    vllm_config: {
        vllm_model_name: string;
        vllm_max_model_len: number;
        vllm_host_ip: string;
        vllm_port: number;
        vllm_controller_port: number;
        vllm_gpu_memory_utilization: number;
        vllm_pipeline_parallel_size: number;
        vllm_tensor_parallel_size: number;
        vllm_dtype: string;
        vllm_tool_call_parser: string;
        vllm_trust_remote_code: boolean;
        vllm_enforce_eager: boolean;
        vllm_max_num_seqs: number;
        vllm_block_size: number;
        vllm_swap_space: number;
        vllm_disable_log_stats: boolean;
    };
    additional_env_vars: Record<string, string>;
}

interface VLLMCreateInstanceConfig {
    offer_id: string;
    offer_info?: OfferInfo;
    hf_hub_token?: string;
    template_name?: string;
    auto_destroy: boolean;
    vllm_config: {
        vllm_model_name: string;
        vllm_max_model_len: number;
        vllm_host_ip: string;
        vllm_port: number;
        vllm_controller_port: number;
        vllm_gpu_memory_utilization: number;
        vllm_pipeline_parallel_size: number;
        vllm_tensor_parallel_size: number;
        vllm_dtype: string;
        vllm_tool_call_parser: string;
        vllm_trust_remote_code: boolean;
        vllm_enforce_eager: boolean;
        vllm_max_num_seqs: number;
        vllm_block_size: number;
        vllm_swap_space: number;
        vllm_disable_log_stats: boolean;
    };
}

// Vast.ai 관련 설정 필드
const VAST_AI_CONFIG_FIELDS: Record<string, FieldConfig> = {
    VAST_API_KEY: {
        label: 'vast.ai API Key',
        type: 'text',
        placeholder: 'Enter your vast.ai API key',
        description: 'vast.ai 콘솔의 API 키를 입력하세요.',
        required: true,
    },
};

const VastAiConfig: React.FC<VastAiConfigProps> = ({
    configData = [],
}) => {
    const [activeCategory, setActiveCategory] = useState<'vllm' | 'instance'>('vllm');
    const [instanceFilter, setInstanceFilter] = useState<'active' | 'inactive' | 'all'>('active');
    const [instances, setInstances] = useState<VastInstanceData[]>([]);
    const [isLoadingInstances, setIsLoadingInstances] = useState(false);
    const [searchParams, setSearchParams] = useState<SearchParams>({
        gpu_name: '',
        max_price: 2,
        min_gpu_ram: 16,
        num_gpus: 1,
        rentable: true,
        sort_by: 'price',
        limit: 20
    });
    const [searchResults, setSearchResults] = useState<VastOfferSearchResponse | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedOfferId, setSelectedOfferId] = useState<string>('');
    const [selectedOfferInfo, setSelectedOfferInfo] = useState<OfferInfo | null>(null);
    const [vllmConfig, setVllmConfig] = useState<VLLMConfig>({
        script_directory: '/vllm/vllm-script',
        hf_hub_token: '',
        main_script: 'main.py',
        log_file: '/tmp/vllm.log',
        install_requirements: true,
        vllm_config: {
            vllm_model_name: 'Qwen/Qwen3-1.7B',
            vllm_max_model_len: 4096,
            vllm_host_ip: '0.0.0.0',
            vllm_port: 12434,
            vllm_controller_port: 12435,
            vllm_gpu_memory_utilization: 0.9,
            vllm_pipeline_parallel_size: 1,
            vllm_tensor_parallel_size: 1,
            vllm_dtype: 'bfloat16',
            vllm_tool_call_parser: 'hermes',
            vllm_trust_remote_code: true,
            vllm_enforce_eager: false,
            vllm_max_num_seqs: 1,
            vllm_block_size: 16,
            vllm_swap_space: 4,
            vllm_disable_log_stats: false,
        },
        additional_env_vars: {}
    });
    const [isSettingUpVLLM, setIsSettingUpVLLM] = useState(false);
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

    const handleTestConnection = async () => {
        try {
            devLog.info('Testing vast.ai connection...');
            const result = await checkVastHealth() as VastHealthResponse;

            if (result && result.status === 'healthy' && result.service === 'vast') {
                toast.success(`연결 성공: ${result.message || 'VastAI 서비스가 정상적으로 작동 중입니다'}`);
                devLog.info('Vast connection test successful:', result);
            } else {
                throw new Error('Invalid response format or service not healthy');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`연결 실패: ${errorMessage}`);
            devLog.error('Vast connection test failed:', error);
        }
    };

    const handleSearchOffers = async () => {
        if (!searchParams.gpu_name?.trim()) {
            toast.error('GPU 이름을 입력해주세요.');
            return;
        }

        setIsSearching(true);
        try {
            devLog.info('Searching vast offers with params:', searchParams);

            // 빈 값들을 제거한 검색 파라미터 생성
            const cleanParams: SearchParams = {};
            if (searchParams.gpu_name?.trim()) cleanParams.gpu_name = searchParams.gpu_name.trim();
            if (searchParams.max_price) cleanParams.max_price = searchParams.max_price;
            if (searchParams.min_gpu_ram) cleanParams.min_gpu_ram = searchParams.min_gpu_ram;
            if (searchParams.num_gpus) cleanParams.num_gpus = searchParams.num_gpus;
            if (searchParams.rentable !== undefined) cleanParams.rentable = searchParams.rentable;
            if (searchParams.sort_by) cleanParams.sort_by = searchParams.sort_by;
            if (searchParams.limit) cleanParams.limit = searchParams.limit;

            const result = await searchVastOffers(cleanParams) as VastOfferSearchResponse;
            setSearchResults(result);

            toast.success(`${result.filtered_count}개의 오퍼를 찾았습니다.`);
            devLog.info('Search results:', result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`검색 실패: ${errorMessage}`);
            devLog.error('Failed to search offers:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleParamChange = (field: keyof SearchParams, value: any) => {
        setSearchParams(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleVLLMConfigChange = (field: keyof VLLMConfig, value: any) => {
        setVllmConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleVLLMVllmConfigChange = (field: keyof VLLMConfig['vllm_config'], value: any) => {
        setVllmConfig(prev => ({
            ...prev,
            vllm_config: {
                ...prev.vllm_config,
                [field]: value
            }
        }));
    };

    const handleSelectOffer = (offer: VastOffer) => {
        setSelectedOfferId(offer.id);

        const offerInfo: OfferInfo = {
            gpu_name: offer.gpu_name || null,
            num_gpus: offer.num_gpus || null,
            gpu_ram: offer.gpu_ram || null,
            dph_total: offer.dph_total || null,
            cpu_cores: offer.cpu_cores || null,
            cpu_name: offer.cpu_name || null,
            ram: offer.ram || null,
            cuda_max_good: offer.cuda_max_good || null,
        };

        setSelectedOfferInfo(offerInfo);
        toast.success('오퍼가 선택되었습니다. VLLM 설정을 진행해주세요.');
    };

    const handleCreateInstance = async () => {
        if (!selectedOfferId.trim()) {
            toast.error('먼저 GPU 오퍼를 선택해주세요.');
            return;
        }

        if (!vllmConfig.vllm_config.vllm_model_name.trim()) {
            toast.error('모델명을 입력해주세요.');
            return;
        }

        if (!vllmConfig.vllm_config.vllm_max_model_len || vllmConfig.vllm_config.vllm_max_model_len <= 0) {
            toast.error('최대 모델 길이를 입력해주세요.');
            return;
        }

        if (!vllmConfig.vllm_config.vllm_gpu_memory_utilization || vllmConfig.vllm_config.vllm_gpu_memory_utilization <= 0 || vllmConfig.vllm_config.vllm_gpu_memory_utilization > 1) {
            toast.error('GPU 메모리 사용률을 올바르게 입력해주세요 (0.1 ~ 1.0).');
            return;
        }

        setIsSettingUpVLLM(true);
        try {
            const createInstanceConfig: VLLMCreateInstanceConfig = {
                offer_id: selectedOfferId,
                offer_info: selectedOfferInfo || undefined,
                hf_hub_token: vllmConfig.hf_hub_token,
                auto_destroy: false,
                vllm_config: vllmConfig.vllm_config
            };

            devLog.info('Creating VLLM instance with config:', createInstanceConfig);

            const result = await createVastInstance(createInstanceConfig);

            toast.success('VLLM 인스턴스가 생성되었습니다!');
            devLog.info('VLLM instance creation result:', result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`VLLM 인스턴스 생성 실패: ${errorMessage}`);
            devLog.error('Failed to create VLLM instance:', error);
        } finally {
            setIsSettingUpVLLM(false);
        }
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

    // 포트 매핑에서 특정 포트의 external 정보 추출
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
        <div className={styles.configPanel}>
            <div className={styles.tabNavigation}>
                <button
                    className={`${styles.tabButton} ${activeCategory === 'vllm' ? styles.active : ''}`}
                    onClick={() => setActiveCategory('vllm')}
                >
                    <FiSettings className={styles.tabIcon} />
                    vLLM 관리
                </button>
                <button
                    className={`${styles.tabButton} ${activeCategory === 'instance' ? styles.active : ''}`}
                    onClick={() => {
                        setActiveCategory('instance');
                        if (activeCategory !== 'instance') {
                            handleLoadInstances();
                        }
                    }}
                >
                    <FiServer className={styles.tabIcon} />
                    Instance 관리
                </button>
            </div>

            {activeCategory === 'vllm' && (
                <>
                    <BaseConfigPanel
                        configData={configData}
                        fieldConfigs={VAST_AI_CONFIG_FIELDS}
                        filterPrefix="vast"
                        onTestConnection={handleTestConnection}
                        testConnectionLabel="Vast.ai 연결 테스트"
                        testConnectionCategory="vast"
                    />
                    {/* GPU 오퍼 검색 패널 */}
                    <div className={styles.configSection}>
                        <h3 className={styles.sectionTitle}>
                            <BsGpuCard className={styles.sectionIcon} />
                            GPU 오퍼 검색
                        </h3>

                        <div className={styles.searchLayout}>
                            <div className={styles.searchPanel}>
                                <div className={styles.searchItem}>
                                    <label className={styles.searchLabel}>GPU 모델명</label>
                                    <div className={styles.inputGroup}>
                                        <select
                                            className={styles.select}
                                            value={searchParams.gpu_name || ''}
                                            onChange={(e) => handleParamChange('gpu_name', e.target.value)}
                                        >
                                            <option value="">GPU 모델을 선택하세요</option>
                                            <option value="RTX_4090">RTX 4090</option>
                                            <option value="RTX_5090">RTX 5090</option>
                                        </select>
                                        <button
                                            className={`${styles.button} ${styles.primary}`}
                                            onClick={handleSearchOffers}
                                            disabled={isSearching || !searchParams.gpu_name?.trim()}
                                        >
                                            {isSearching ? (
                                                <>
                                                    <FiRefreshCw className={`${styles.icon} ${styles.spinning}`} />
                                                    검색
                                                </>
                                            ) : (
                                                <>
                                                    <FiPlay className={styles.icon} />
                                                    검색
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* 고급 설정들을 컴팩트하게 배치 */}
                                <div className={styles.compactRow}>
                                    <div className={styles.advancedFormGroup}>
                                        <label className={styles.label}>최대 가격 ($/시간)</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            placeholder="2.0"
                                            step="0.1"
                                            min="0"
                                            value={searchParams.max_price || ''}
                                            onChange={(e) => handleParamChange('max_price', parseFloat(e.target.value) || undefined)}
                                        />
                                    </div>
                                    <div className={styles.advancedFormGroup}>
                                        <label className={styles.label}>최소 GPU RAM (GB)</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            placeholder="16"
                                            min="1"
                                            value={searchParams.min_gpu_ram || ''}
                                            onChange={(e) => handleParamChange('min_gpu_ram', parseInt(e.target.value) || undefined)}
                                        />
                                    </div>
                                </div>

                                <div className={styles.compactRow}>
                                    <div className={styles.advancedFormGroup}>
                                        <label className={styles.label}>GPU 개수</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            placeholder="1"
                                            min="1"
                                            value={searchParams.num_gpus || ''}
                                            onChange={(e) => handleParamChange('num_gpus', parseInt(e.target.value) || undefined)}
                                        />
                                    </div>
                                    <div className={styles.advancedFormGroup}>
                                        <label className={styles.label}>정렬 기준</label>
                                        <select
                                            className={styles.select}
                                            value={searchParams.sort_by || 'price'}
                                            onChange={(e) => handleParamChange('sort_by', e.target.value)}
                                        >
                                            <option value="price">가격순</option>
                                            <option value="gpu_ram">GPU RAM순</option>
                                            <option value="num_gpus">GPU 개수순</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.compactRow}>
                                    <div className={styles.advancedFormGroup}>
                                        <label className={styles.label}>결과 제한</label>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            placeholder="20"
                                            min="1"
                                            max="100"
                                            value={searchParams.limit || ''}
                                            onChange={(e) => handleParamChange('limit', parseInt(e.target.value) || undefined)}
                                        />
                                    </div>
                                    <div className={styles.advancedFormGroup}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={searchParams.rentable ?? true}
                                                onChange={(e) => handleParamChange('rentable', e.target.checked)}
                                            />
                                            렌트 가능한 것만
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* 우측 결과 패널 */}
                            <div className={styles.resultsPanel}>
                                {searchResults ? (
                                    <div className={styles.resultsSection}>
                                        <div className={styles.resultsHeader}>
                                            <h4>검색 결과</h4>
                                            <span className={styles.resultCount}>
                                                총 {searchResults.total}개 중 {searchResults.filtered_count}개 표시
                                            </span>
                                        </div>

                                        {searchResults.offers.length === 0 ? (
                                            <div className={styles.noResults}>
                                                <FiX className={styles.icon} />
                                                검색 조건에 맞는 오퍼가 없습니다.
                                            </div>
                                        ) : (
                                            <div className={styles.offersList}>
                                                {searchResults.offers.map((offer) => (
                                                    <div key={offer.id} className={styles.offerCard}>
                                                        <div className={styles.offerHeader}>
                                                            <div className={styles.gpuInfo}>
                                                                <BsGpuCard className={styles.gpuIcon} />
                                                                <span className={styles.gpuName}>{offer.gpu_name} <em>{(offer.gpu_ram / 1024).toFixed(1)}GB</em></span>
                                                                {offer.num_gpus >= 1 && (
                                                                    <span className={styles.gpuDetail}>x{offer.num_gpus}</span>
                                                                )}
                                                                {offer.cuda_max_good && (
                                                                    <span className={styles.gpuCuda}>Max Cuda: {offer.cuda_max_good}</span>
                                                                )}
                                                            </div>
                                                            <div className={styles.price}>
                                                                ${offer.dph_total.toFixed(3)}/시간
                                                            </div>
                                                        </div>

                                                        <div className={styles.offerDetails}>
                                                            <div className={styles.detailRows}>
                                                                <div className={styles.detailRow}>
                                                                    <div className={styles.detail}>
                                                                        <span className={styles.detailLabel}>CPU:</span>
                                                                        <span className={styles.detailValue}>
                                                                            {offer.cpu_name ? (
                                                                                <>
                                                                                    <span className={styles.cpuName}>{offer.cpu_name}</span>
                                                                                    {offer.cpu_cores && <span className={styles.cpuCores}>({offer.cpu_cores}코어)</span>}
                                                                                </>
                                                                            ) : '정보 없음'}
                                                                        </span>
                                                                    </div>
                                                                    {offer.ram && (
                                                                        <div className={styles.detail}>
                                                                            <span className={styles.detailLabel}>System Memory:</span>
                                                                            <span className={styles.detailValue}>{(offer.ram / 1024).toFixed(1)}GB</span>
                                                                        </div>
                                                                    )}

                                                                </div>

                                                                <div className={styles.detailRow}>
                                                                    {offer.public_ipaddr && (
                                                                        <div className={styles.detail}>
                                                                            <span className={styles.detailLabel}>IP:</span>
                                                                            <span className={styles.detailValue}>{offer.public_ipaddr}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className={styles.detail}>
                                                                        <span className={styles.detailLabel}>상태:</span>
                                                                        <span className={`${styles.status} ${offer.rentable ? styles.available : styles.unavailable}`}>
                                                                            {offer.rentable ? (
                                                                                <>
                                                                                    <FiCheck className={styles.statusIcon} />
                                                                                    렌트 가능
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <FiX className={styles.statusIcon} />
                                                                                    렌트 불가
                                                                                </>
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className={styles.offerActions}>
                                                            <button
                                                                className={`${styles.selectButton} ${selectedOfferId === offer.id ? styles.selected : ''}`}
                                                                onClick={() => handleSelectOffer(offer)}
                                                                disabled={!offer.rentable}
                                                            >
                                                                {selectedOfferId === offer.id ? (
                                                                    <>
                                                                        <FiCheck className={styles.icon} />
                                                                        선택됨
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FiServer className={styles.icon} />
                                                                        선택
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                className={styles.copyButton}
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(offer.id);
                                                                    toast.success('오퍼 ID가 복사되었습니다.');
                                                                }}
                                                            >
                                                                <FiCopy className={styles.icon} />
                                                                ID 복사
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className={styles.noResults}>
                                        <BsGpuCard className={styles.icon} />
                                        GPU 모델명을 입력하고 검색해주세요.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* VLLM 설정 섹션 */}
                    <div className={styles.configSection}>
                        <h3 className={styles.sectionTitle}>
                            <FiSettings className={styles.sectionIcon} />
                            VLLM 인스턴스 설정
                        </h3>

                        {selectedOfferId ? (
                            <div className={styles.vllmSetupLayout}>
                                <div className={styles.vllmSetupPanel}>
                                    <div className={styles.selectedOfferInfo}>
                                        <h4>선택된 오퍼 정보</h4>
                                        <div className={styles.offerInfoGrid}>
                                            <div className={styles.offerInfoItem}>
                                                <span className={styles.offerInfoLabel}>오퍼 ID:</span>
                                                <span className={styles.offerId}>{selectedOfferId}</span>
                                            </div>
                                            {selectedOfferInfo && (
                                                <>
                                                    {selectedOfferInfo.gpu_name && (
                                                        <div className={styles.offerInfoItem}>
                                                            <span className={styles.offerInfoLabel}>GPU:</span>
                                                            <span className={styles.offerInfoValue}>
                                                                {selectedOfferInfo.gpu_name}
                                                                {selectedOfferInfo.num_gpus && selectedOfferInfo.num_gpus > 1 && ` x${selectedOfferInfo.num_gpus}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {selectedOfferInfo.gpu_ram && (
                                                        <div className={styles.offerInfoItem}>
                                                            <span className={styles.offerInfoLabel}>GPU RAM:</span>
                                                            <span className={styles.offerInfoValue}>{(selectedOfferInfo.gpu_ram/1024).toFixed(1)}GB</span>
                                                        </div>
                                                    )}
                                                    {selectedOfferInfo.cpu_name && (
                                                        <div className={styles.offerInfoItem}>
                                                            <span className={styles.offerInfoLabel}>CPU:</span>
                                                            <span className={styles.offerInfoValue}>
                                                                {selectedOfferInfo.cpu_name}
                                                                {selectedOfferInfo.cpu_cores && ` (${selectedOfferInfo.cpu_cores}코어)`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {selectedOfferInfo.ram && (
                                                        <div className={styles.offerInfoItem}>
                                                            <span className={styles.offerInfoLabel}>시스템 RAM:</span>
                                                            <span className={styles.offerInfoValue}>{(selectedOfferInfo.ram/1024).toFixed(1)}GB</span>
                                                        </div>
                                                    )}
                                                    {selectedOfferInfo.dph_total && (
                                                        <div className={styles.offerInfoItem}>
                                                            <span className={styles.offerInfoLabel}>시간당 가격:</span>
                                                            <span className={styles.offerInfoValue}>${selectedOfferInfo.dph_total.toFixed(3)}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.vllmSection}>
                                        <h5 className={styles.vllmSectionTitle}>기본 설정</h5>

                                        <div className={styles.compactRow}>
                                            <div className={styles.advancedFormGroup}>
                                                <label className={styles.label}>HuggingFace 토큰</label>
                                                <input
                                                    type="password"
                                                    className={styles.input}
                                                    placeholder="선택사항: HuggingFace 토큰을 입력하세요"
                                                    value={vllmConfig.hf_hub_token}
                                                    onChange={(e) => handleVLLMConfigChange('hf_hub_token', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className={styles.checkboxRow}>
                                            <label className={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={vllmConfig.install_requirements}
                                                    onChange={(e) => handleVLLMConfigChange('install_requirements', e.target.checked)}
                                                />
                                                requirements.txt 설치
                                            </label>
                                        </div>
                                    </div>

                                    {/* VLLM 모델 설정 */}
                                    <div className={styles.vllmSection}>
                                        <h5 className={styles.vllmSectionTitle}>VLLM 모델 설정</h5>
                                        <div className={styles.compactRow}>
                                            <div className={styles.advancedFormGroup}>
                                                <label className={styles.label}>모델명 *</label>
                                                <input
                                                    type="text"
                                                    className={styles.input}
                                                    value={vllmConfig.vllm_config.vllm_model_name}
                                                    onChange={(e) => handleVLLMVllmConfigChange('vllm_model_name', e.target.value)}
                                                />
                                            </div>
                                            <div className={styles.advancedFormGroup}>
                                                <label className={styles.label}>최대 모델 길이 *</label>
                                                <input
                                                    type="number"
                                                    className={styles.input}
                                                    value={vllmConfig.vllm_config.vllm_max_model_len}
                                                    onChange={(e) => handleVLLMVllmConfigChange('vllm_max_model_len', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className={styles.compactRow}>
                                            <div className={styles.advancedFormGroup}>
                                                <label className={styles.label}>GPU 메모리 사용률 *</label>
                                                <input
                                                    type="number"
                                                    className={styles.input}
                                                    step="0.1"
                                                    min="0.1"
                                                    max="1.0"
                                                    value={vllmConfig.vllm_config.vllm_gpu_memory_utilization}
                                                    onChange={(e) => handleVLLMVllmConfigChange('vllm_gpu_memory_utilization', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div className={styles.advancedFormGroup}>
                                                <label className={styles.label}>Tensor Parallel Size</label>
                                                <input
                                                    type="number"
                                                    className={styles.input}
                                                    min="1"
                                                    value={vllmConfig.vllm_config.vllm_tensor_parallel_size}
                                                    onChange={(e) => handleVLLMVllmConfigChange('vllm_tensor_parallel_size', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className={styles.compactRow}>
                                            <div className={styles.advancedFormGroup}>
                                                <label className={styles.label}>Tool Call Parser</label>
                                                <select
                                                    className={styles.select}
                                                    value={vllmConfig.vllm_config.vllm_tool_call_parser}
                                                    onChange={(e) => handleVLLMVllmConfigChange('vllm_tool_call_parser', e.target.value)}
                                                >
                                                    <option value="none">None</option>
                                                    <option value="hermes">Hermes</option>
                                                    <option value="mistral">Mistral</option>
                                                    <option value="llama3_json">Llama3 JSON</option>
                                                    <option value="internlm">InternLM</option>
                                                    <option value="jamba">Jamba</option>
                                                    <option value="xlam">XLAM</option>
                                                    <option value="minimax_m1">Minimax M1</option>
                                                    <option value="deepseek_v3">DeepSeek V3</option>
                                                    <option value="kimi_k2">Kimi K2</option>
                                                    <option value="pythonic">Pythonic</option>
                                                </select>
                                            </div>
                                            <div className={styles.advancedFormGroup}>
                                                <label className={styles.label}>데이터 타입</label>
                                                <select
                                                    className={styles.select}
                                                    value={vllmConfig.vllm_config.vllm_dtype}
                                                    onChange={(e) => handleVLLMVllmConfigChange('vllm_dtype', e.target.value)}
                                                >
                                                    <option value="auto">Auto</option>
                                                    <option value="float16">Float16</option>
                                                    <option value="bfloat16">BFloat16</option>
                                                    <option value="float32">Float32</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 실행 버튼 */}
                                    <div className={styles.vllmActions}>
                                        <button
                                            className={`${styles.button} ${styles.primary} ${styles.large}`}
                                            onClick={handleCreateInstance}
                                            disabled={isSettingUpVLLM ||
                                                !vllmConfig.vllm_config.vllm_model_name.trim() ||
                                                !vllmConfig.vllm_config.vllm_max_model_len ||
                                                vllmConfig.vllm_config.vllm_max_model_len <= 0 ||
                                                !vllmConfig.vllm_config.vllm_gpu_memory_utilization ||
                                                vllmConfig.vllm_config.vllm_gpu_memory_utilization <= 0 ||
                                                vllmConfig.vllm_config.vllm_gpu_memory_utilization > 1}
                                        >
                                            {isSettingUpVLLM ? (
                                                <>
                                                    <FiRefreshCw className={`${styles.icon} ${styles.spinning}`} />
                                                    VLLM 설정 중...
                                                </>
                                            ) : (
                                                <>
                                                    <FiPlay className={styles.icon} />
                                                    VLLM 인스턴스 생성
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.noSelection}>
                                <FiServer className={styles.icon} />
                                GPU 오퍼를 먼저 선택해주세요.
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Instance 관리 패널 */}
            {activeCategory === 'instance' && (
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
                                                                <span className={styles.gpuRam}> - {(gpuInfo.gpu_ram/1024).toFixed(1)}GB</span>
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
                                                    <span className={styles.detailValue}>{(instance.ram/1024).toFixed(1)}GB</span>
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
            )}

            {/* 포트 매핑 모달 */}
            <VastAiConfigModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                instanceId={selectedInstanceId}
                portMappings={selectedPortMappings}
            />
        </div>
    );
};

export default VastAiConfig;
