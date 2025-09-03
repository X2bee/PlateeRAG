import React from 'react';
import { BsCpu } from 'react-icons/bs';
import AdminBaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/admin/components/config/AdminBaseConfigPanel';
import styles from '@/app/admin/assets/settings/AdminSettings.module.scss';

interface AdminLLMvLLMConfigProps {
    configData: ConfigItem[];
    onTestConnection: (category: string) => void;
}

const VLLM_CONFIG_FIELDS: Record<string, FieldConfig> = {
    VLLM_API_BASE_URL: {
        label: 'API Base URL',
        type: 'text',
        placeholder: 'http://0.0.0.0:12721/v1',
        description: 'vLLM 서버의 API 엔드포인트 URL을 입력하세요. (예: http://0.0.0.0:12721/v1)',
        required: true,
    },
    VLLM_API_KEY: {
        label: 'API Key (선택사항)',
        type: 'password',
        placeholder: '인증이 필요한 경우 입력',
        description: 'vLLM 서버에 인증이 필요한 경우 API 키를 입력하세요.',
        required: false,
    },
    VLLM_MODEL_NAME: {
        label: '모델 이름',
        type: 'text',
        placeholder: 'meta-llama/Llama-2-7b-chat-hf',
        description: 'vLLM에서 로드된 모델의 이름을 입력하세요. (예: meta-llama/Llama-2-7b-chat-hf)',
        required: true,
    },
    VLLM_TEMPERATURE_DEFAULT: {
        label: 'Temperature (창의성)',
        type: 'number',
        min: 0,
        max: 2,
        step: 0.01,
        description: '0에 가까울수록 일관된 답변, 2에 가까울수록 창의적인 답변을 생성합니다. (기본값: 0.7)',
        required: false,
    },
    VLLM_MAX_TOKENS_DEFAULT: {
        label: '최대 토큰 수',
        type: 'number',
        min: 1,
        max: 8192,
        description: '응답에서 생성할 최대 토큰 수입니다. (기본값: 512)',
        required: false,
    },
    VLLM_TOP_P: {
        label: 'Top-p (Nucleus Sampling)',
        type: 'number',
        min: 0,
        max: 1,
        step: 0.01,
        description: '누적 확률이 이 값에 도달할 때까지의 토큰들만 고려합니다. (기본값: 0.9)',
        required: false,
    },
    VLLM_TOP_K: {
        label: 'Top-k',
        type: 'number',
        min: 1,
        max: 100,
        description: '상위 k개의 토큰만 고려합니다. -1은 비활성화를 의미합니다.',
        required: false,
    },
    VLLM_FREQUENCY_PENALTY: {
        label: 'Frequency Penalty',
        type: 'number',
        min: -2,
        max: 2,
        step: 0.01,
        description: '반복되는 토큰에 대한 페널티를 설정합니다. (기본값: 0)',
        required: false,
    },
    VLLM_PRESENCE_PENALTY: {
        label: 'Presence Penalty',
        type: 'number',
        min: -2,
        max: 2,
        step: 0.01,
        description: '새로운 토큰 생성을 장려하는 페널티를 설정합니다. (기본값: 0)',
        required: false,
    },
    VLLM_REPETITION_PENALTY: {
        label: 'Repetition Penalty',
        type: 'number',
        min: 0.1,
        max: 2,
        step: 0.01,
        description: '반복을 줄이기 위한 페널티를 설정합니다. (기본값: 1.0)',
        required: false,
    },
    VLLM_BEST_OF: {
        label: 'Best of',
        type: 'number',
        min: 1,
        max: 20,
        description: '여러 생성 결과 중 최고를 선택합니다. beam search에서 사용됩니다.',
        required: false,
    },
    VLLM_USE_BEAM_SEARCH: {
        label: 'Beam Search 사용',
        type: 'boolean',
        description: 'Beam Search를 사용하여 더 일관성 있는 결과를 생성합니다.',
        required: false,
    },
    VLLM_STOP_SEQUENCES: {
        label: 'Stop Sequences',
        type: 'text',
        placeholder: '["</s>", "Human:", "Assistant:"]',
        description: '생성을 중단할 문자열 목록을 JSON 배열 형태로 입력하세요.',
        required: false,
    },
    VLLM_SEED: {
        label: 'Random Seed',
        type: 'number',
        description: '재현 가능한 결과를 위한 시드값을 설정합니다. (선택사항)',
        required: false,
    },
    VLLM_TIMEOUT: {
        label: '요청 타임아웃 (초)',
        type: 'number',
        min: 1,
        max: 300,
        description: 'API 요청의 최대 대기 시간을 설정합니다. (기본값: 60초)',
        required: false,
    },
    VLLM_STREAM: {
        label: '스트리밍 응답',
        type: 'boolean',
        description: '응답을 스트리밍 방식으로 받을지 설정합니다.',
        required: false,
    },
    VLLM_LOGPROBS: {
        label: 'Log Probabilities',
        type: 'number',
        min: 0,
        max: 20,
        description: '각 토큰의 로그 확률을 반환할 상위 토큰 개수입니다.',
        required: false,
    },
    VLLM_ECHO: {
        label: 'Echo Input',
        type: 'boolean',
        description: '입력 프롬프트를 출력에 포함할지 설정합니다.',
        required: false,
    },
};

const AdminLLMvLLMConfig: React.FC<AdminLLMvLLMConfigProps> = ({
    configData,
    onTestConnection,
}) => {
    return (
        <div className={styles.vllmConfig}>
            <div className={styles.sectionHeader}>
                <h3>vLLM 설정</h3>
                <p>vLLM 서버 연결 및 모델 설정을 구성합니다.</p>
            </div>

            <AdminBaseConfigPanel
                configData={configData}
                fieldConfigs={VLLM_CONFIG_FIELDS}
                filterPrefix="vllm"
                onTestConnection={(_category: string) => onTestConnection('vllm')}
                testConnectionLabel="vLLM 연결 테스트"
                testConnectionCategory="vllm"
            />
        </div>
    );
};

export default AdminLLMvLLMConfig;
