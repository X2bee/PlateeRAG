import React from 'react';
import { SiOpenai } from 'react-icons/si';
import AdminBaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/admin/components/config/AdminBaseConfigPanel';
import styles from '@/app/admin/assets/settings/AdminSettings.module.scss';

interface AdminLLMOpenAIConfigProps {
    configData: ConfigItem[];
    onTestConnection: (category: string) => void;
}

const OPENAI_CONFIG_FIELDS: Record<string, FieldConfig> = {
    OPENAI_API_KEY: {
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-...',
        description: 'OpenAI API 키를 입력하세요. API 키는 안전하게 암호화되어 저장됩니다.',
        required: true,
    },
    OPENAI_API_BASE_URL: {
        label: 'API Base URL',
        type: 'text',
        placeholder: 'https://api.openai.com/v1',
        description: 'OpenAI API의 기본 URL입니다. 프록시나 대체 엔드포인트를 사용하는 경우 변경하세요.',
        required: false,
    },
    OPENAI_MODEL_DEFAULT: {
        label: '기본 모델',
        type: 'select',
        options: [
            { value: 'gpt-4o-mini-2024-07-18', label: 'gpt-4o-mini-2024-07-18' },
            { value: 'gpt-4o-2024-11-20', label: 'gpt-4o-2024-11-20' },
            { value: 'gpt-4.1-mini-2025-04-14', label: 'gpt-4.1-mini-2025-04-14' },
            { value: 'gpt-4.1-2025-04-14', label: 'gpt-4.1-2025-04-14' },
        ],
        description: '워크플로우에서 사용할 기본 OpenAI 모델을 선택하세요.',
        required: false,
    },
    OPENAI_TEMPERATURE_DEFAULT: {
        label: 'Temperature (창의성)',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.01,
        description: '0에 가까울수록 일관된 답변, 2에 가까울수록 창의적인 답변을 생성합니다. (기본값: 0.7)',
        required: false,
    },
    OPENAI_MAX_TOKENS_DEFAULT: {
        label: '최대 토큰 수',
        type: 'number',
        min: 1,
        max: 32000,
        description: '응답에서 생성할 최대 토큰 수입니다. (1 토큰 ≈ 4글자, 기본값: 1000)',
        required: false,
    },
};

const AdminLLMOpenAIConfig: React.FC<AdminLLMOpenAIConfigProps> = ({
    configData,
    onTestConnection,
}) => {
    return (
        <div className={styles.openaiConfig}>
            <div className={styles.sectionHeader}>
                <h3>OpenAI 설정</h3>
                <p>OpenAI API 키와 모델 설정을 구성합니다.</p>
            </div>

            <AdminBaseConfigPanel
                configData={configData}
                fieldConfigs={OPENAI_CONFIG_FIELDS}
                filterPrefix="openai"
                onTestConnection={(_category: string) => onTestConnection('openai')}
                testConnectionLabel="OpenAI 연결 테스트"
                testConnectionCategory="openai"
            />
        </div>
    );
};

export default AdminLLMOpenAIConfig;
