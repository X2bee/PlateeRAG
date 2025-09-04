import React from 'react';
import { TbBrandGolang } from 'react-icons/tb';
import AdminBaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/admin/components/config/AdminBaseConfigPanel';
import styles from '@/app/admin/assets/settings/AdminSettings.module.scss';

interface AdminLLMSGLangConfigProps {
    configData: ConfigItem[];
    onTestConnection: (category: string) => void;
}

const SGL_CONFIG_FIELDS: Record<string, FieldConfig> = {
    SGL_API_BASE_URL: {
        label: 'API Base URL',
        type: 'text',
        placeholder: 'http://localhost:12721/v1',
        description: 'SGLang 서버의 API 엔드포인트 URL을 입력하세요. (예: http://localhost:12721/v1)',
        required: true,
    },
    SGL_API_KEY: {
        label: 'API Key (선택사항)',
        type: 'password',
        placeholder: '인증이 필요한 경우 입력',
        description: 'SGLang 서버에 인증이 필요한 경우 API 키를 입력하세요.',
        required: false,
    },
    SGL_MODEL_NAME: {
        label: '모델 이름',
        type: 'text',
        placeholder: 'Qwen/Qwen3-4B',
        description: 'SGLang에서 로드된 모델의 이름을 입력하세요. (예: Qwen/Qwen3-4B)',
        required: true,
    },
    SGL_TEMPERATURE_DEFAULT: {
        label: 'Temperature (창의성)',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.01,
        description: '0에 가까울수록 일관된 답변, 2에 가까울수록 창의적인 답변을 생성합니다. (기본값: 0.7)',
        required: false,
    },
    SGL_MAX_TOKENS_DEFAULT: {
        label: '최대 토큰 수',
        type: 'number',
        min: 1,
        max: 8192,
        description: '응답에서 생성할 최대 토큰 수입니다. (기본값: 512)',
        required: false,
    },
    SGL_TOP_P: {
        label: 'Top-p (Nucleus Sampling)',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
        description: '누적 확률이 이 값에 도달할 때까지의 토큰들만 고려합니다. (기본값: 0.9)',
        required: false,
    },
    SGL_FREQUENCY_PENALTY: {
        label: 'Frequency Penalty',
        type: 'number',
        min: -2,
        max: 2,
        step: 0.01,
        description: '반복되는 토큰에 대한 페널티를 설정합니다. (기본값: 0.0)',
        required: false,
    },
    SGL_PRESENCE_PENALTY: {
        label: 'Presence Penalty',
        type: 'number',
        min: -2,
        max: 2,
        step: 0.01,
        description: '새로운 토큰 생성을 장려하는 페널티를 설정합니다. (기본값: 0.0)',
        required: false,
    },
    SGL_STOP_SEQUENCES: {
        label: 'Stop Sequences',
        type: 'text',
        placeholder: '["</s>", "Human:", "Assistant:"]',
        description: '생성을 중단할 문자열 목록을 JSON 배열 형태로 입력하세요.',
        required: false,
    },
    SGL_SEED: {
        label: 'Random Seed',
        type: 'number',
        description: '재현 가능한 결과를 위한 시드값을 설정합니다. (-1은 랜덤 시드)',
        required: false,
    },
    SGL_REQUEST_TIMEOUT: {
        label: '요청 타임아웃 (초)',
        type: 'number',
        min: 1,
        max: 300,
        description: 'API 요청의 최대 대기 시간을 설정합니다. (기본값: 60초)',
        required: false,
    },
    SGL_STREAM: {
        label: '스트리밍 응답',
        type: 'boolean',
        description: '응답을 스트리밍 방식으로 받을지 설정합니다.',
        required: false,
    },
};

const AdminLLMSGLangConfig: React.FC<AdminLLMSGLangConfigProps> = ({
    configData,
    onTestConnection,
}) => {
    // 디버깅: SGL 관련 설정이 있는지 확인
    const sglConfigs = configData.filter(item =>
        item.env_name.startsWith('SGL_')
    );

    console.log('All configData:', configData.map(c => c.env_name));
    console.log('SGL configs found:', sglConfigs.map(c => c.env_name));

    return (
        <div className={styles.sglConfig}>
            <div className={styles.sectionHeader}>
                <h3>SGLang 설정</h3>
                <p>SGLang 서버 연결 및 모델 설정을 구성합니다.</p>
            </div>

            {/* 디버깅 정보 표시 (개발 시에만) */}
            {process.env.NODE_ENV === 'development' && (
                <div style={{
                    background: '#f3f4f6',
                    padding: '10px',
                    margin: '10px 0',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}>
                    <strong>Debug Info:</strong>
                    <br />
                    Total configs: {configData.length}
                    <br />
                    SGL configs: {sglConfigs.length}
                    <br />
                    SGL config names: {sglConfigs.map(c => c.env_name).join(', ')}
                </div>
            )}

            <AdminBaseConfigPanel
                configData={configData}
                fieldConfigs={SGL_CONFIG_FIELDS}
                filterPrefix="SGL_"  // 대문자로 변경하고 언더스코어 포함
                onTestConnection={(_category: string) => onTestConnection('sgl')}
                testConnectionLabel="SGLang 연결 테스트"
                testConnectionCategory="sgl"
            />
        </div>
    );
};

export default AdminLLMSGLangConfig;
