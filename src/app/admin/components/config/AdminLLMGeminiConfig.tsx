import React from 'react';
import { SiGoogle } from 'react-icons/si';
import AdminBaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/admin/components/config/AdminBaseConfigPanel';
import styles from '@/app/admin/assets/settings/AdminSettings.module.scss';

interface AdminLLMGeminiConfigProps {
    configData: ConfigItem[];
    onTestConnection: (category: string) => void;
}

const GEMINI_CONFIG_FIELDS: Record<string, FieldConfig> = {
    GEMINI_API_KEY: {
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-...',
        description: 'GEMINI API 키를 입력하세요. API 키는 안전하게 암호화되어 저장됩니다.',
        required: true,
    },
    GEMINI_API_BASE_URL: {
        label: 'API Base URL',
        type: 'text',
        placeholder: 'https://api.GEMINI.com/v1',
        description: 'GEMINI API의 기본 URL입니다. 프록시나 대체 엔드포인트를 사용하는 경우 변경하세요.',
        required: false,
    },
    GEMINI_MODEL_DEFAULT: {
        label: '기본 모델',
        type: 'select',
        options: [
            { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
            { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
            { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
            { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
            { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' }
        ],
        description: '워크플로우에서 사용할 기본 GEMINI 모델을 선택하세요.',
        required: false,
    },
    GEMINI_TEMPERATURE_DEFAULT: {
        label: 'Temperature (창의성)',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.01,
        description: '0에 가까울수록 일관된 답변, 2에 가까울수록 창의적인 답변을 생성합니다. (기본값: 0.7)',
        required: false,
    },
    GEMINI_MAX_TOKENS_DEFAULT: {
        label: '최대 토큰 수',
        type: 'number',
        min: 1,
        max: 32000,
        description: '응답에서 생성할 최대 토큰 수입니다. (1 토큰 ≈ 4글자, 기본값: 1000)',
        required: false,
    },
};

const AdminLLMGeminiConfig: React.FC<AdminLLMGeminiConfigProps> = ({
    configData,
    onTestConnection,
}) => {
    return (
        <div className={styles.geminiConfig}>
            <div className={styles.sectionHeader}>
                <h3>Gemini 설정</h3>
                <p>Google Gemini API 키와 모델 설정을 구성합니다.</p>
            </div>

            <AdminBaseConfigPanel
                configData={configData}
                fieldConfigs={GEMINI_CONFIG_FIELDS}
                filterPrefix="gemini"
                onTestConnection={(_category: string) => onTestConnection('gemini')}
                testConnectionLabel="Gemini 연결 테스트"
                testConnectionCategory="gemini"
            />
        </div>
    );
};

export default AdminLLMGeminiConfig;
