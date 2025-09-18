import React, { useState } from 'react';
import { FiServer, FiSettings } from 'react-icons/fi';
import { showConnectionSuccessToastKo, showConnectionErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import AdminBaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/admin/components/config/AdminBaseConfigPanel';
import { AdminGpuOfferSearchModal } from '@/app/admin/components/config/AdminVastModal/AdminGpuOfferSearchModal';
import { AdminInstanceManagementModal } from '@/app/admin/components/config/AdminVastModal/AdminInstanceManagementModal';
import { checkVastHealth } from '@/app/_common/api/vastAPI';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/admin/assets/settings/AdminSettings.module.scss';

interface AdminVastAiConfigProps {
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

const AdminVastAiConfig: React.FC<AdminVastAiConfigProps> = ({
    configData = [],
}) => {
    const [activeCategory, setActiveCategory] = useState<'vllm' | 'instance'>('vllm');

    const handleTestConnection = async () => {
        try {
            devLog.info('Testing vast.ai connection...');
            const result = await checkVastHealth() as VastHealthResponse;

            if (result && result.status === 'healthy' && result.service === 'vast') {
                showConnectionSuccessToastKo('VastAI', result.message || 'VastAI 서비스가 정상적으로 작동 중입니다');
                devLog.info('Vast connection test successful:', result);
            } else {
                throw new Error('Invalid response format or service not healthy');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            showConnectionErrorToastKo('VastAI', errorMessage);
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
                    <AdminBaseConfigPanel
                        configData={configData}
                        fieldConfigs={VAST_AI_CONFIG_FIELDS}
                        filterPrefix="vast"
                        onTestConnection={handleTestConnection}
                        testConnectionLabel="Vast.ai 연결 테스트"
                        testConnectionCategory="vast"
                    />
                    <AdminGpuOfferSearchModal />
                </>
            )}
            {activeCategory === 'instance' && (
                <AdminInstanceManagementModal />
            )}
        </div>
    );
};

export default AdminVastAiConfig;
