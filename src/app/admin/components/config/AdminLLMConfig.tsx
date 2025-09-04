import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiAlertCircle, FiPlay, FiServer, FiSettings } from 'react-icons/fi';
import { SiOpenai, SiGooglegemini , SiAnthropic } from 'react-icons/si';
import { BsCpu } from 'react-icons/bs';
import { TbBrandGolang } from 'react-icons/tb';
import {
    showLLMProviderChangeConfirmKo,
    showSuccessToastKo,
    showErrorToastKo
} from '@/app/_common/utils/toastUtilsKo';
import AdminBaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/admin/components/config/AdminBaseConfigPanel';
import AdminLLMOpenAIConfig from '@/app/admin/components/config/AdminLLMOpenAIConfig';
import AdminLLMvLLMConfig from '@/app/admin/components/config/AdminLLMvLLMConfig';
import AdminLLMSGLangConfig from '@/app/admin/components/config/AdminLLMSGLangConfig';
import AdminLLMGeminiConfig from '@/app/admin/components/config/AdminLLMGeminiConfig';
import AdminLLMAnthropicConfig from '@/app/admin/components/config/AdminLLMAnthropicConfig';
import styles from '@/app/admin/assets/settings/AdminSettings.module.scss';
import {
    getLLMStatus,
    switchLLMProvider,
    testConnection,
} from '@/app/api/llmAPI';

interface AdminLLMConfigProps {
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
// 기본 LLM 제공자 설정 필드
const DEFAULT_PROVIDER_CONFIG_FIELDS: Record<string, FieldConfig> = {
    DEFAULT_LLM_PROVIDER: {
        label: '기본 LLM 제공자',
        type: 'select',
        options: [
            { value: 'openai', label: 'OpenAI' },
            { value: 'gemini', label: 'Gemini' },
            { value: 'anthropic', label: 'Anthropic' },
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
        name: 'gemini',
        displayName: 'Gemini',
        icon: <SiGooglegemini  />,
        description: 'Google의 고성능 Gemini 언어 모델'
    },
    {
        name: 'anthropic',
        displayName: 'Anthropic',
        icon: <SiAnthropic />,
        description: 'Claude 등 Anthropic의 고성능 언어 모델'
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

const AdminLLMConfig: React.FC<AdminLLMConfigProps> = ({
    configData = [],
    onTestConnection,
}) => {
    const [activeTab, setActiveTab] = useState<'default' | 'openai' | 'gemini' | 'anthropic' | 'vllm' | 'sgl'>('default');
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
            } else if (providerName === 'gemini') {
                configured = !!configData.find(item => item.env_name === 'GEMINI_API_KEY')?.current_value;
            } else if (providerName === 'anthropic') {
                configured = !!configData.find(item => item.env_name === 'ANTHROPIC_API_KEY')?.current_value;
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

        if (currentProvider === providerName) {
            return;
        }

        const currentProviderDisplayName = LLM_PROVIDERS.find(p => p.name === currentProvider)?.displayName || currentProvider;
        const newProviderDisplayName = LLM_PROVIDERS.find(p => p.name === providerName)?.displayName || providerName;

        showLLMProviderChangeConfirmKo(
            currentProviderDisplayName,
            newProviderDisplayName,
            () => confirmProviderSwitch(providerName),
            () => {} // onCancel 콜백 - 필요시 추가 로직
        );
    };

    const confirmProviderSwitch = async (providerName: string) => {
        setSwitching(true);
        setError(null);
        try {
            const result = await switchLLMProvider(providerName);
            await loadLLMStatus(); // 상태 새로고침
            showSuccessToastKo(`LLM 제공자가 ${LLM_PROVIDERS.find(p => p.name === providerName)?.displayName || providerName}로 변경되었습니다.`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '제공자 변경에 실패했습니다.';
            setError(errorMessage);
            showErrorToastKo(errorMessage);
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
                result = await testConnection('openai');
            } else if (providerName === 'gemini') {
                result = await testConnection('gemini');
            } else if (providerName === 'anthropic') {
                result = await testConnection('anthropic');
            } else if (providerName === 'vllm') {
                result = await testConnection('vllm');
            } else if (providerName === 'sgl') {
                result = await testConnection('sgl');
            } else {
                // Fallback to original onTestConnection
                if (onTestConnection) {
                    await onTestConnection(providerName);
                    showSuccessToastKo(`${LLM_PROVIDERS.find(p => p.name === providerName)?.displayName} 연결 테스트 성공!`);
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
                showSuccessToastKo(`${LLM_PROVIDERS.find(p => p.name === providerName)?.displayName} 연결 테스트 성공!`);
            } else {
                showErrorToastKo(`${LLM_PROVIDERS.find(p => p.name === providerName)?.displayName} 연결 테스트 실패`);
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
            showErrorToastKo(errorMessage);
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

                <AdminBaseConfigPanel
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
                                                        setActiveTab(provider.name as 'openai' | 'gemini' | 'anthropic' | 'vllm' | 'sgl');
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
        <AdminLLMOpenAIConfig
            configData={configData}
            onTestConnection={handleTestConnection}
        />
    );

    const renderGeminiTab = () => (
        <AdminLLMGeminiConfig
            configData={configData}
            onTestConnection={handleTestConnection}
        />
    );

    const renderAnthropicTab = () => (
        <AdminLLMAnthropicConfig
            configData={configData}
            onTestConnection={handleTestConnection}
        />
    );

    const renderVLLMTab = () => (
        <AdminLLMvLLMConfig
            configData={configData}
            onTestConnection={handleTestConnection}
        />
    );

    const renderSGLTab = () => (
        <AdminLLMSGLangConfig
            configData={configData}
            onTestConnection={handleTestConnection}
        />
    );

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
                    className={`${styles.tabButton} ${activeTab === 'gemini' ? styles.active : ''}`}
                    onClick={() => setActiveTab('gemini')}
                >
                    <SiGooglegemini  />
                    Gemini
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'anthropic' ? styles.active : ''}`}
                    onClick={() => setActiveTab('anthropic')}
                >
                    <SiAnthropic />
                    Anthropic
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
                {activeTab === 'gemini' && renderGeminiTab()}
                {activeTab === 'anthropic' && renderAnthropicTab()}
                {activeTab === 'vllm' && renderVLLMTab()}
                {activeTab === 'sgl' && renderSGLTab()}
            </div>
        </div>
    );
};

export default AdminLLMConfig;
