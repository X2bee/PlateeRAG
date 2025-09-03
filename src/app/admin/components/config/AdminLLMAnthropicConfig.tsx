import React from 'react';
import { SiAnthropic } from 'react-icons/si';
import AdminBaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/admin/components/config/AdminBaseConfigPanel';
import styles from '@/app/admin/assets/settings/AdminSettings.module.scss';

interface AdminLLMAnthropicConfigProps {
    configData: ConfigItem[];
    onTestConnection: (category: string) => void;
}

const ANTHROPIC_CONFIG_FIELDS: Record<string, FieldConfig> = {
    ANTHROPIC_API_KEY: {
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-...',
        description: 'ANTHROPIC API 키를 입력하세요. API 키는 안전하게 암호화되어 저장됩니다.',
        required: true,
    },
    ANTHROPIC_API_BASE_URL: {
        label: 'API Base URL',
        type: 'text',
        placeholder: 'https://api.ANTHROPIC.com/v1',
        description: 'ANTHROPIC API의 기본 URL입니다. 프록시나 대체 엔드포인트를 사용하는 경우 변경하세요.',
        required: false,
    },
    ANTHROPIC_MODEL_DEFAULT: {
        label: '기본 모델',
        type: 'select',
        options: [
            { value: 'claude-opus-4-1-20250805', label: 'Claude Opus 4.1' },
            { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
            { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
            { value: 'claude-3-7-sonnet-20250219', label: 'Claude Sonnet 3.7' },
            { value: 'claude-3-5-haiku-20241022', label: 'Claude Haiku 3.5' },
            { value: 'claude-3-haiku-20240307', label: 'Claude Haiku 3' },
        ],
        description: '워크플로우에서 사용할 기본 ANTHROPIC 모델을 선택하세요.',
        required: false,
    },
    ANTHROPIC_TEMPERATURE_DEFAULT: {
        label: 'Temperature (창의성)',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.01,
        description: '0에 가까울수록 일관된 답변, 2에 가까울수록 창의적인 답변을 생성합니다. (기본값: 0.7)',
        required: false,
    },
    ANTHROPIC_MAX_TOKENS_DEFAULT: {
        label: '최대 토큰 수',
        type: 'number',
        min: 1,
        max: 32000,
        description: '응답에서 생성할 최대 토큰 수입니다. (1 토큰 ≈ 4글자, 기본값: 1000)',
        required: false,
    },
};

const AdminLLMAnthropicConfig: React.FC<AdminLLMAnthropicConfigProps> = ({
    configData,
    onTestConnection,
}) => {
    return (
        <div className={styles.anthropicConfig}>
            <div className={styles.sectionHeader}>
                <h3>Anthropic 설정</h3>
                <p>Anthropic Claude API 키와 모델 설정을 구성합니다.</p>
            </div>

            <AdminBaseConfigPanel
                configData={configData}
                fieldConfigs={ANTHROPIC_CONFIG_FIELDS}
                filterPrefix="anthropic"
                onTestConnection={(_category: string) => onTestConnection('anthropic')}
                testConnectionLabel="Anthropic 연결 테스트"
                testConnectionCategory="anthropic"
            />
        </div>
    );
};

export default AdminLLMAnthropicConfig;
