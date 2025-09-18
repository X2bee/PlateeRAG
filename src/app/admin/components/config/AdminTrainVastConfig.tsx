import React, { useState } from 'react';
import { FiRefreshCw, FiSettings, FiServer } from 'react-icons/fi';
import { showConnectionSuccessToastKo, showConnectionErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import AdminBaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/admin/components/config/AdminBaseConfigPanel';
import { checkVastHealth } from '@/app/_common/api/vastAPI';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/admin/assets/settings/AdminSettings.module.scss';

interface TrainVastAiConfigProps {
    configData?: ConfigItem[];
    onTestConnection?: (category: string) => void;
}

interface VastHealthResponse {
    status: string;
    service: string;
    message: string;
}

const TRAIN_VAST_CONFIG_FIELDS: Record<string, FieldConfig> = {
    VAST_API_KEY: {
        label: 'vast.ai API Key',
        type: 'text',
        placeholder: 'Enter your vast.ai API key',
        description: 'vast.ai 콘솔의 API 키를 입력하세요.',
        required: true,
    },
    TRAINER_HOST: {
        label: 'trainer.host',
        type: 'text',
        placeholder: 'Enter your trainer host',
        description: 'trainer.host 값을 입력하세요.',
        required: true,
    },
    TRAINER_PORT: {
        label: 'trainer.port',
        type: 'text',
        placeholder: 'Enter your trainer port',
        description: 'trainer.port 값을 입력하세요.',
        required: true,
    },
};

const AdminTrainVastConfig: React.FC<TrainVastAiConfigProps> = ({
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
                <div className={styles.configSection}>
                    <AdminBaseConfigPanel
                        configData={configData}
                        fieldConfigs={TRAIN_VAST_CONFIG_FIELDS}
                        filterPrefix="vast"
                        onTestConnection={handleTestConnection}
                        testConnectionLabel="Vast.ai 연결 테스트"
                        testConnectionCategory="vast"
                    />
                    <AdminBaseConfigPanel
                        configData={configData}
                        fieldConfigs={TRAIN_VAST_CONFIG_FIELDS}
                        filterPrefix="trainer"
                        onTestConnection={handleTestConnection}
                        testConnectionLabel="Trainer 연결 테스트"
                        testConnectionCategory="trainer"
                    />
                </div>
            )}
            {activeCategory === 'instance' && (
                <div className={styles.configSection}>
                    <div className={styles.noticeMessage}>
                        <p>Instance 관리는 Admin 환경에서 지원되지 않습니다.</p>
                        <p>Instance 관리는 메인 애플리케이션에서 사용해주세요.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTrainVastConfig;
