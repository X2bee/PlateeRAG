import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiAlertCircle, FiPlay, FiServer, FiSettings } from 'react-icons/fi';
import { SiOpenai } from 'react-icons/si';
import { BsCpu } from 'react-icons/bs';
import { TbBrandGolang } from 'react-icons/tb';
import toast from 'react-hot-toast';
import BaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/main/components/config/baseConfigPanel';
import styles from '@/app/main/assets/Settings.module.scss';
import {
    getLLMStatus,
    switchLLMProvider,
    testOpenAIConnection,
    testVLLMConnection,
    testSGLConnection,
} from '@/app/api/llmAPI';

interface LLMConfigProps {
    configData?: ConfigItem[];
    onTestConnection?: (category: string) => void;
}

interface LLMProvider {
    name: string;
    displayName: string;
    icon: React.ReactNode;
    description: string;
}

interface LLMStatus {
    current_provider: string;
    available_providers: string[];
    providers: {
        [key: string]: {
            configured: boolean;
            available: boolean;
            error?: string;
            warnings?: string[];
        };
    };
}

// OpenAI 관련 설정 필드
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
    OPENAI_ORGANIZATION_ID: {
        label: 'Organization ID (선택사항)',
        type: 'text',
        placeholder: 'org-...',
        description: 'OpenAI Organization에 속해 있는 경우 Organization ID를 입력하세요.',
        required: false,
    },
};

// vLLM 관련 설정 필드
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

// SGL 관련 설정 필드
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

// 기본 LLM 제공자 설정 필드
const DEFAULT_PROVIDER_CONFIG_FIELDS: Record<string, FieldConfig> = {
    DEFAULT_LLM_PROVIDER: {
        label: '기본 LLM 제공자',
        type: 'select',
        options: [
            { value: 'openai', label: 'OpenAI' },
            { value: 'vllm', label: 'vLLM' },
            { value: 'sgl', label: 'SGLang' }
        ],
        description: '워크플로우에서 기본적으로 사용할 LLM 제공자를 선택하세요.',
        required: true,
    },
};

const LLM_PROVIDERS: LLMProvider[] = [
    {
        name: 'openai',
        displayName: 'OpenAI',
        icon: <SiOpenai />,
        description: 'GPT-4, GPT-3.5 등 OpenAI의 고성능 언어 모델'
    },
    {
        name: 'vllm',
        displayName: 'vLLM',
        icon: <BsCpu />,
        description: '고성능 LLM 추론을 위한 vLLM 서버 (self-hosted)'
    },
    {
        name: 'sgl',
        displayName: 'SGLang',
        icon: <TbBrandGolang />,
        description: 'SGLang 고성능 추론 엔진 (self-hosted)'
    }
];

const LLMConfig: React.FC<LLMConfigProps> = ({
    configData = [],
    onTestConnection,
}) => {
    const [activeTab, setActiveTab] = useState<'default' | 'openai' | 'vllm' | 'sgl'>('default');
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [switching, setSwitching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [llmStatus, setLLMStatus] = useState<LLMStatus | null>(null);
    const [providerAvailability, setProviderAvailability] = useState<{ [key: string]: boolean | null }>({});
    const [connectionTested, setConnectionTested] = useState<{ [key: string]: boolean }>({});

    // 초기 데이터 로드
    useEffect(() => {
        loadLLMStatus();
    }, []);

    // 자동 연결 테스트 제거 - 사용자가 직접 테스트 버튼을 클릭할 때만 실행

    const loadLLMStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const status = (await getLLMStatus()) as LLMStatus;
            setLLMStatus(status);
        } catch (err) {
            setError('LLM 상태를 불러오는데 실패했습니다.');
            console.error('Failed to load LLM status:', err);
        } finally {
            setLoading(false);
        }
    };

    // 현재 기본 제공자 가져오기 (API 또는 fallback)
    const getCurrentDefaultProvider = (): string => {
        if (llmStatus) {
            return llmStatus.current_provider;
        }
        // Fallback: configData에서 가져오기
        const defaultProviderConfig = configData.find(
            item => item.env_name === 'DEFAULT_LLM_PROVIDER'
        );
        return defaultProviderConfig?.current_value || 'openai';
    };

    // 제공자별 연결 상태 확인 (수정된 버전)
    const getProviderStatus = (providerName: string): {
        configured: boolean;
        connected: boolean | null;
        warnings?: string[];
        tested: boolean;
    } => {
        let configured = false;
        let connected: boolean | null = null;
        let warnings: string[] | undefined = undefined;

        if (llmStatus && llmStatus.providers[providerName]) {
            const providerStatus = llmStatus.providers[providerName];
            configured = providerStatus.configured;
            warnings = providerStatus.warnings;
        } else {
            // Fallback: configData에서 가져오기
            if (providerName === 'openai') {
                configured = !!configData.find(item => item.env_name === 'OPENAI_API_KEY')?.current_value;
            } else if (providerName === 'vllm') {
                configured = !!configData.find(item => item.env_name === 'VLLM_API_BASE_URL')?.current_value;
            } else if (providerName === 'sgl') {
                const hasUrl = !!configData.find(item => item.env_name === 'SGL_API_BASE_URL')?.current_value;
                const hasModel = !!configData.find(item => item.env_name === 'SGL_MODEL_NAME')?.current_value;
                configured = hasUrl && hasModel;
            }
        }

        // 연결 테스트 결과
        const tested = connectionTested[providerName] || false;
        if (tested) {
            connected = providerAvailability[providerName] || false;
        }

        return { configured, connected, warnings, tested };
    };

    const handleProviderSwitch = async (providerName: string) => {
        const currentProvider = getCurrentDefaultProvider();

        // 현재 provider와 동일한 경우 아무 동작하지 않음
        if (currentProvider === providerName) {
            return;
        }

        // 확인 toast를 통해 사용자에게 변경 의사 확인
        const currentProviderDisplayName = LLM_PROVIDERS.find(p => p.name === currentProvider)?.displayName || currentProvider;
        const newProviderDisplayName = LLM_PROVIDERS.find(p => p.name === providerName)?.displayName || providerName;

        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontWeight: '600', color: '#dc2626', fontSize: '1rem' }}>
                    LLM 제공자 변경
                </div>
                <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.4' }}>
                    현재: <strong>{currentProviderDisplayName}</strong> → 변경: <strong>{newProviderDisplayName}</strong>
                    <br />
                    변경 시 백엔드에서 재설정 작업이 수행됩니다.
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#ffffff',
                            border: '2px solid #6b7280',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            color: '#374151',
                        }}
                    >
                        취소
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            confirmProviderSwitch(providerName);
                        }}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: '2px solid #b91c1c',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                        }}
                    >
                        변경
                    </button>
                </div>
            </div>
        ), {
            duration: Infinity,
            style: {
                maxWidth: '420px',
                padding: '20px',
                backgroundColor: '#f9fafb',
                border: '2px solid #374151',
                borderRadius: '12px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                color: '#374151',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            },
        });
    };

    const confirmProviderSwitch = async (providerName: string) => {
        setSwitching(true);
        setError(null);
        try {
            const result = await switchLLMProvider(providerName);
            await loadLLMStatus(); // 상태 새로고침
            toast.success(`LLM 제공자가 ${LLM_PROVIDERS.find(p => p.name === providerName)?.displayName || providerName}로 변경되었습니다.`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '제공자 변경에 실패했습니다.';
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Failed to switch provider:', err);
        } finally {
            setSwitching(false);
        }
    };

    const handleTestConnection = async (providerName: string) => {
        setTesting(true);
        setError(null);
        try {
            let result;
            if (providerName === 'openai') {
                result = await testOpenAIConnection();
            } else if (providerName === 'vllm') {
                result = await testVLLMConnection();
            } else if (providerName === 'sgl') {
                result = await testSGLConnection();
            } else {
                // Fallback to original onTestConnection
                if (onTestConnection) {
                    await onTestConnection(providerName);
                    toast.success(`${LLM_PROVIDERS.find(p => p.name === providerName)?.displayName} 연결 테스트 성공!`);
                    return;
                }
            }

            const isSuccess = (result as any)?.status === 'success';

            // 테스트 결과 업데이트
            setProviderAvailability(prev => ({
                ...prev,
                [providerName]: isSuccess
            }));
            setConnectionTested(prev => ({
                ...prev,
                [providerName]: true
            }));

            if (isSuccess) {
                toast.success(`${LLM_PROVIDERS.find(p => p.name === providerName)?.displayName} 연결 테스트 성공!`);
            } else {
                toast.error(`${LLM_PROVIDERS.find(p => p.name === providerName)?.displayName} 연결 테스트 실패`);
            }
        } catch (err) {
            // 테스트 실패 결과 업데이트
            setProviderAvailability(prev => ({
                ...prev,
                [providerName]: false
            }));
            setConnectionTested(prev => ({
                ...prev,
                [providerName]: true
            }));

            const errorMessage = err instanceof Error ? err.message : `${providerName} 연결 테스트에 실패했습니다.`;
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Failed to test connection:', err);
        } finally {
            setTesting(false);
        }
    };

    const getProviderIcon = (providerName: string) => {
        const provider = LLM_PROVIDERS.find(p => p.name === providerName);
        return provider ? provider.icon : <FiServer />;
    };

    const getStatusIcon = (configured: boolean, connected: boolean | null, tested: boolean) => {
        if (!configured) return <FiX className={styles.statusError} />;
        if (!tested) return <FiSettings className={styles.statusWarning} />;
        if (connected === true) return <FiCheck className={styles.statusConnected} />;
        if (connected === false) return <FiX className={styles.statusError} />;
        return <FiAlertCircle className={styles.statusWarning} />;
    };

    const getStatusText = (configured: boolean, connected: boolean | null, tested: boolean) => {
        if (!configured) return '설정 필요';
        if (!tested) return '테스트 전';
        if (connected === true) return '사용 가능';
        if (connected === false) return '연결 실패';
        return '상태 확인 중';
    };

    const renderDefaultProviderTab = () => {
        const currentDefaultProvider = getCurrentDefaultProvider();

        return (
            <div className={styles.defaultProviderConfig}>
                <div className={styles.sectionHeader}>
                    <h3>기본 LLM 제공자 설정</h3>
                    <p>워크플로우에서 기본적으로 사용할 LLM 제공자를 선택하세요.</p>
                </div>

                <BaseConfigPanel
                    configData={configData}
                    fieldConfigs={DEFAULT_PROVIDER_CONFIG_FIELDS}
                    filterPrefix="llm"
                />

                {/* 현재 제공자 상태 - ACTIVE 바 제거 */}
                <div className={styles.currentProviderSection}>
                    <div className={styles.sectionTitle}>
                        <h4>현재 활성 제공자</h4>
                        {/* activeBadgeGlow span 제거됨 */}
                    </div>

                    <div className={`${styles.currentProviderCard} ${styles.activeProviderCard}`}>
                        <div className={styles.providerMainInfo}>
                            <div className={styles.providerIconLarge}>
                                <span
                                    className={styles.iconWrapper}
                                    style={{
                                        color: '#059669',  // 항상 초록색
                                        background: '#05966925',  // 초록색 배경
                                        border: '2px solid #059669'  // 초록색 테두리
                                    }}
                                >
                                    {getProviderIcon(currentDefaultProvider)}
                                </span>
                            </div>
                            <div className={styles.providerDetails}>
                                <h3 style={{ color: '#059669' }}>  {/* 항상 초록색 */}
                                    {LLM_PROVIDERS.find(p => p.name === currentDefaultProvider)?.displayName || currentDefaultProvider}
                                </h3>
                                <p className={styles.providerDescription}>
                                    {LLM_PROVIDERS.find(p => p.name === currentDefaultProvider)?.description || '설명 없음'}
                                </p>
                                <div className={styles.providerMetadata}>
                                    <span className={styles.metadataItem}>
                                        <FiServer className={styles.metadataIcon} />
                                        기본 제공자
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.statusSection}>
                            {(() => {
                                const status = getProviderStatus(currentDefaultProvider);
                                const statusClass = status.configured && status.connected === true
                                    ? styles.statusSuccess
                                    : status.configured && status.connected === false
                                        ? styles.statusError
                                        : status.configured
                                            ? styles.statusWarning
                                            : styles.statusError;

                                return (
                                    <div className={`${styles.statusIndicatorLarge} ${statusClass}`}>
                                        <div className={styles.statusIconWrapper}>
                                            {getStatusIcon(status.configured, status.connected, status.tested)}
                                        </div>
                                        <div className={styles.statusText}>
                                            <span className={styles.statusLabel}>
                                                {getStatusText(status.configured, status.connected, status.tested)}
                                            </span>
                                            <span className={styles.statusSubtext}>
                                                {status.configured && status.connected === true
                                                    ? '모든 기능을 사용할 수 있습니다'
                                                    : status.configured && status.connected === false
                                                        ? '연결을 확인해 주세요'
                                                        : status.configured
                                                            ? '연결 테스트 버튼을 클릭하여 확인하세요'
                                                            : '설정이 필요합니다'}
                                            </span>
                                            {/* SGL 경고 메시지 표시 */}
                                            {status.warnings && status.warnings.length > 0 && (
                                                <div className={styles.warningMessages}>
                                                    {status.warnings.map((warning, index) => (
                                                        <span key={index} className={styles.warningText}>
                                                            <FiAlertCircle />
                                                            {warning}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className={styles.statusActions}>
                                <button
                                    onClick={() => handleTestConnection(currentDefaultProvider)}
                                    className={`${styles.button} ${styles.primary} ${styles.testButton}`}
                                    disabled={testing}
                                >
                                    <FiPlay />
                                    {testing ? '테스트 중...' : '연결 테스트'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 제공자 선택 카드 */}
                <div className={styles.providersSection}>
                    <div className={styles.sectionTitle}>
                        <h4>사용 가능한 LLM 제공자</h4>
                        <span className={styles.sectionSubtitle}>
                            제공자를 클릭하여 기본 제공자로 변경하거나 상세 설정으로 이동하세요
                        </span>
                    </div>

                    <div className={styles.providersGrid}>
                        {LLM_PROVIDERS.map((provider) => {
                            const status = getProviderStatus(provider.name);
                            const isDefault = currentDefaultProvider === provider.name;

                            return (
                                <div
                                    key={provider.name}
                                    className={`${styles.providerCard} ${isDefault ? styles.activeProvider : ''} ${status.configured ? styles.configuredProvider : styles.unconfiguredProvider}`}
                                    onClick={() => !switching && handleProviderSwitch(provider.name)}
                                    style={{
                                        cursor: switching ? 'not-allowed' : (isDefault ? 'default' : 'pointer'),
                                        opacity: isDefault ? 1 : (switching ? 0.7 : 0.8),  // 활성화된 것은 완전 불투명, 비활성은 약간 투명
                                        borderColor: isDefault ? '#059669' : '#e5e7eb',
                                        backgroundColor: isDefault ? '#05966908' : undefined,
                                        boxShadow: isDefault ? '0 4px 12px rgba(5, 150, 105, 0.15)' : undefined  // 활성화된 것에 그림자 추가
                                    }}
                                >
                                    {/* 카드 헤더 */}
                                    <div className={styles.cardHeader}>
                                        <div className={styles.providerIconMedium}>
                                            <span
                                                className={styles.iconWrapper}
                                                style={{
                                                    color: isDefault ? '#059669' : '#6b7280',  // 선택시 초록색, 미선택시 회색
                                                    background: isDefault ? '#05966915' : '#6b728015',  // 연한 배경
                                                    border: `2px solid ${isDefault ? '#059669' : '#6b7280'}`  // 테두리 색상
                                                }}
                                            >
                                                {provider.icon}
                                            </span>
                                        </div>

                                        <div className={styles.cardBadges}>
                                            {isDefault && (
                                                <span
                                                    className={styles.defaultBadge}
                                                    style={{ backgroundColor: '#059669' }}
                                                >
                                                    <FiCheck />
                                                    기본
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 카드 내용 */}
                                    <div className={styles.cardContent}>
                                        <h4
                                            className={styles.cardTitle}
                                            style={{
                                                color: isDefault ? '#059669' : '#374151',  // 선택시 초록색, 미선택시 진한 회색
                                                fontWeight: isDefault ? '700' : '600'  // 선택시 더 굵게
                                            }}
                                        >
                                            {provider.displayName}
                                        </h4>
                                        <p
                                            className={styles.cardDescription}
                                            style={{
                                                color: isDefault ? '#4b5563' : '#9ca3af',  // 선택시 진한 회색, 미선택시 연한 회색
                                                fontWeight: isDefault ? '500' : '400'  // 선택시 약간 굵게
                                            }}
                                        >
                                            {provider.description}
                                        </p>

                                        {/* SGL 경고 메시지 표시 */}
                                        {provider.name === 'sgl' && status.warnings && status.warnings.length > 0 && (
                                            <div className={styles.cardWarnings}>
                                                {status.warnings.slice(0, 1).map((warning, index) => (
                                                    <span key={index} className={styles.cardWarningText}>
                                                        <FiAlertCircle />
                                                        {warning}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className={styles.cardFooter}>
                                            <span
                                                className={styles.statusLabel}
                                                style={{
                                                    color: isDefault ? '#374151' : '#9ca3af',  // 선택시 진한 색상
                                                    fontWeight: isDefault ? '600' : '500'  // 선택시 굵게
                                                }}
                                            >
                                                {getStatusText(status.configured, status.connected, status.tested)}
                                            </span>

                                            <div className={styles.cardActions}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveTab(provider.name as 'openai' | 'vllm' | 'sgl');
                                                    }}
                                                    className={`${styles.button} ${styles.small} ${styles.secondary}`}
                                                    title="설정으로 이동"
                                                >
                                                    <FiSettings />
                                                    설정
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 호버 효과를 위한 오버레이 */}
                                    <div className={styles.cardOverlay}></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderOpenAITab = () => (
        <div className={styles.openaiConfig}>
            <div className={styles.sectionHeader}>
                <h3>OpenAI 설정</h3>
                <p>OpenAI API 키와 모델 설정을 구성합니다.</p>
            </div>

            <BaseConfigPanel
                configData={configData}
                fieldConfigs={OPENAI_CONFIG_FIELDS}
                filterPrefix="openai"
                onTestConnection={(category) => handleTestConnection('openai')}
                testConnectionLabel="OpenAI 연결 테스트"
                testConnectionCategory="openai"
            />
        </div>
    );

    const renderVLLMTab = () => (
        <div className={styles.vllmConfig}>
            <div className={styles.sectionHeader}>
                <h3>vLLM 설정</h3>
                <p>vLLM 서버 연결 및 모델 설정을 구성합니다.</p>
            </div>

            <BaseConfigPanel
                configData={configData}
                fieldConfigs={VLLM_CONFIG_FIELDS}
                filterPrefix="vllm"
                onTestConnection={(category) => handleTestConnection('vllm')}
                testConnectionLabel="vLLM 연결 테스트"
                testConnectionCategory="vllm"
            />
        </div>
    );

    const renderSGLTab = () => {
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

                <BaseConfigPanel
                    configData={configData}
                    fieldConfigs={SGL_CONFIG_FIELDS}
                    filterPrefix="SGL_"  // 대문자로 변경하고 언더스코어 포함
                    onTestConnection={(category) => handleTestConnection('sgl')}
                    testConnectionLabel="SGLang 연결 테스트"
                    testConnectionCategory="sgl"
                />
            </div>
        );
    };

    return (
        <div className={styles.llmContainer}>
            {/* 탭 네비게이션 */}
            <div className={styles.tabNavigation}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'default' ? styles.active : ''}`}
                    onClick={() => setActiveTab('default')}
                >
                    <FiServer />
                    기본 설정
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'openai' ? styles.active : ''}`}
                    onClick={() => setActiveTab('openai')}
                >
                    <SiOpenai />
                    OpenAI
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'vllm' ? styles.active : ''}`}
                    onClick={() => setActiveTab('vllm')}
                >
                    <BsCpu />
                    vLLM
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'sgl' ? styles.active : ''}`}
                    onClick={() => setActiveTab('sgl')}
                >
                    <TbBrandGolang />
                    SGLang
                </button>
            </div>

            {/* 에러 표시 */}
            {error && (
                <div className={styles.errorBanner}>
                    <FiAlertCircle />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>
                        <FiX />
                    </button>
                </div>
            )}

            {/* 로딩 상태 */}
            {loading && (
                <div className={styles.loadingState}>
                    <FiRefreshCw className={styles.spinning} />
                    <p>LLM 상태를 불러오는 중...</p>
                </div>
            )}

            {/* 탭 콘텐츠 */}
            <div className={styles.tabContent}>
                {activeTab === 'default' && renderDefaultProviderTab()}
                {activeTab === 'openai' && renderOpenAITab()}
                {activeTab === 'vllm' && renderVLLMTab()}
                {activeTab === 'sgl' && renderSGLTab()}
            </div>
        </div>
    );
};

export default LLMConfig;
