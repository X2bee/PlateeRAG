import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiPlay, FiSquare, FiCopy, FiExternalLink, FiChevronDown, FiChevronUp, FiServer, FiSettings, FiTrash2 } from 'react-icons/fi';
import { BsGpuCard } from 'react-icons/bs';
import toast from 'react-hot-toast';
import BaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/main/components/config/baseConfigPanel';
import VastAiConfigModal from '@/app/main/components/config/vastAiConfigModal';
import { checkVastHealth, searchVastOffers, createVastInstance, listVastInstances, destroyVastInstance } from '@/app/api/vastAPI';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/main/assets/Settings.module.scss';
import { GpuOfferSearchModal } from '@/app/main/components/config/vastAiModal/GpuOfferSearchModal';
import { InstanceManagementModal } from '@/app/main/components/config/vastAiModal/InstanceManagementModal';
interface VastAiConfigProps {
    configData?: ConfigItem[];
    onTestConnection?: (category: string) => void;
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

interface VastHealthResponse {
    status: string;
    service: string;
    message: string;
}

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
                    <GpuOfferSearchModal />
                </>
            )}
            {activeCategory === 'instance' && (
                <InstanceManagementModal />
            )}
        </div>
    );
};

export default VastAiConfig;
