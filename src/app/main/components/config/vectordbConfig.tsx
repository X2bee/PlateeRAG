import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiAlertCircle, FiPlay, FiSettings, FiServer, FiDatabase } from 'react-icons/fi';
import { SiOpenai, SiHuggingface } from 'react-icons/si';
import { BsRobot } from 'react-icons/bs';
import toast from 'react-hot-toast';
import BaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/main/components/config/baseConfigPanel';
import {
    getCurrentEmbeddingDimension,
    refreshRetrievalConfig
} from '@/app/api/retrievalAPI';
import {
    getEmbeddingStatus,
    switchEmbeddingProvider,
    autoSwitchEmbeddingProvider,
    testEmbeddingQuery,
    reloadEmbeddingClient,
    getEmbeddingConfigStatus,
} from '@/app/api/embeddingAPI';
import styles from '@/app/main/assets/Settings.module.scss';

interface VectordbConfigProps {
    configData?: ConfigItem[];
    onTestConnection?: (category: string) => void;
}

interface EmbeddingProvider {
    name: string;
    displayName: string;
    icon: React.ReactNode;
    description: string;
}

interface EmbeddingStatus {
    status: string;
    provider_info?: any;
    available: boolean;
}

interface ProviderConfig {
    provider: string;
    available: boolean;
    configured: boolean;
    status: string;
    error?: string;
}

// Qdrant 벡터 데이터베이스 관련 설정 필드
const VECTORDATABASE_CONFIG_FIELDS: Record<string, FieldConfig> = {
    QDRANT_HOST: {
        label: 'Qdrant 호스트',
        type: 'text',
        placeholder: 'localhost',
        description: 'Qdrant 서버의 호스트 주소를 입력하세요.',
        required: true,
    },
    QDRANT_PORT: {
        label: 'Qdrant 포트',
        type: 'number',
        min: 1,
        max: 65535,
        placeholder: '6333',
        description: 'Qdrant 서버의 포트 번호를 입력하세요. (기본값: 6333)',
        required: true,
    },
    QDRANT_API_KEY: {
        label: 'Qdrant API 키',
        type: 'password',
        placeholder: '선택사항 - 로컬 환경에서는 비워두세요',
        description: 'Qdrant 클라우드 서비스 사용 시 API 키를 입력하세요.',
        required: false,
    },
    QDRANT_USE_GRPC: {
        label: 'gRPC 사용',
        type: 'boolean',
        description: 'Qdrant와의 통신에 gRPC 프로토콜을 사용할지 설정합니다.',
        required: false,
    },
    QDRANT_GRPC_PORT: {
        label: 'gRPC 포트',
        type: 'number',
        min: 1,
        max: 65535,
        placeholder: '6334',
        description: 'gRPC 통신을 위한 포트 번호를 입력하세요. (기본값: 6334)',
        required: false,
    },
};

// 임베딩 관련 설정 필드
const EMBEDDING_CONFIG_FIELDS: Record<string, FieldConfig> = {
    EMBEDDING_PROVIDER: {
        label: '임베딩 제공자',
        type: 'select',
        options: [
            { value: 'openai', label: 'OpenAI' },
            { value: 'huggingface', label: 'HuggingFace' },
            { value: 'custom_http', label: 'VLLM Server' }
        ],
        description: '사용할 임베딩 제공자를 선택하세요.',
        required: true,
    },
    OPENAI_API_KEY: {
        label: 'OpenAI API 키',
        type: 'password',
        placeholder: 'sk-...',
        description: 'OpenAI API 키를 입력하세요.',
        required: false,
    },
    OPENAI_EMBEDDING_MODEL: {
        label: 'OpenAI 임베딩 모델',
        type: 'select',
        options: [
            { value: 'text-embedding-3-small', label: 'text-embedding-3-small' },
            { value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
            { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002' }
        ],
        description: '사용할 OpenAI 임베딩 모델을 선택하세요. 벡터 차원은 자동으로 설정됩니다.',
        required: false,
    },
    HUGGINGFACE_MODEL_NAME: {
        label: 'HuggingFace 모델명',
        type: 'text',
        placeholder: 'sentence-transformers/all-MiniLM-L6-v2',
        description: 'HuggingFace 모델명을 입력하세요.',
        required: false,
    },
    HUGGINGFACE_API_KEY: {
        label: 'HuggingFace API 키',
        type: 'password',
        placeholder: '선택사항',
        description: 'HuggingFace Hub API 키 (선택사항)',
        required: false,
    },
    CUSTOM_EMBEDDING_URL: {
        label: 'VLLM 서버 URL',
        type: 'text',
        placeholder: 'http://localhost:8000/v1',
        description: 'VLLM 서버의 API 엔드포인트를 입력하세요.',
        required: false,
    },
    CUSTOM_EMBEDDING_API_KEY: {
        label: 'VLLM API 키',
        type: 'password',
        placeholder: '선택사항',
        description: 'VLLM 서버 API 키 (선택사항)',
        required: false,
    },
    CUSTOM_EMBEDDING_MODEL: {
        label: 'VLLM 모델명',
        type: 'text',
        placeholder: 'text-embedding-ada-002',
        description: 'VLLM 서버에서 사용하는 모델명을 입력하세요.',
        required: false,
    },
};

const EMBEDDING_PROVIDERS: EmbeddingProvider[] = [
    {
        name: 'openai',
        displayName: 'OpenAI',
        icon: <SiOpenai />,
        description: 'OpenAI의 고품질 임베딩 모델 (text-embedding-3-small/large)'
    },
    {
        name: 'huggingface',
        displayName: 'HuggingFace',
        icon: <SiHuggingface />,
        description: '오픈소스 Sentence Transformers 모델'
    },
    {
        name: 'custom_http',
        displayName: 'VLLM Server',
        icon: <BsRobot />,
        description: '커스텀 VLLM 서버 (self-hosted)'
    }
];

const VectordbConfig: React.FC<VectordbConfigProps> = ({
    configData = [],
    onTestConnection,
}) => {
    const [activeTab, setActiveTab] = useState<'embedding' | 'database'>('embedding');
    const [embeddingStatus, setEmbeddingStatus] = useState<EmbeddingStatus | null>(null);
    const [currentProvider, setCurrentProvider] = useState<string>('');
    const [providersStatus, setProvidersStatus] = useState<ProviderConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [switching, setSwitching] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dimensionInfo, setDimensionInfo] = useState<any>(null);

    // 초기 데이터 로드
    useEffect(() => {
        loadEmbeddingStatus();
    }, []);

    const loadEmbeddingStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const [status, configStatus] = await Promise.all([
                getEmbeddingStatus(),
                getEmbeddingConfigStatus(),
            ]);
            const provider = (status as any).provider_info?.provider || 'openai';
            const model = (status as any).provider_info?.model || 'text-embedding-3-small';
            const dimensionData = await getCurrentEmbeddingDimension(provider, model);

            setEmbeddingStatus(status as EmbeddingStatus);
            setCurrentProvider((configStatus as any).current_provider || '');
            setDimensionInfo(dimensionData);

            const providerStatuses = EMBEDDING_PROVIDERS.map(provider => ({
                provider: provider.name,
                available: (configStatus as any)[provider.name]?.available || false,
                configured: (configStatus as any)[provider.name]?.configured || false,
                status: (configStatus as any)[provider.name]?.status || 'unknown',
                error: (configStatus as any)[provider.name]?.error
            }));

            setProvidersStatus(providerStatuses);
        } catch (err) {
            setError('임베딩 상태를 불러오는데 실패했습니다.');
            console.error('Failed to load embedding status:', err);
        } finally {
            setLoading(false);
        }
    };

    // 현재 기본 제공자 가져오기
    const getCurrentDefaultProvider = (): string => {
        return currentProvider || 'openai';
    };

    // 제공자별 연결 상태 확인
    const getProviderStatus = (providerName: string): {
        configured: boolean;
        connected: boolean | null;
        warnings?: string[];
        tested: boolean;
    } => {
        const providerStatus = providersStatus.find(p => p.provider === providerName);
        const configured = providerStatus?.configured || false;
        const connected = providerStatus?.available || null;
        const tested = true; // 상태를 불러왔으므로 테스트됨으로 간주

        return { configured, connected, warnings: [], tested };
    };

    const getProviderIcon = (providerName: string) => {
        const provider = EMBEDDING_PROVIDERS.find(p => p.name === providerName);
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

    const handleProviderSwitch = async (providerName: string) => {
        // 현재 provider와 동일한 경우 아무 동작하지 않음
        if (currentProvider === providerName) {
            return;
        }

        // 확인 toast를 통해 사용자에게 변경 의사 확인
        const currentProviderDisplayName = EMBEDDING_PROVIDERS.find(p => p.name === currentProvider)?.displayName || currentProvider;
        const newProviderDisplayName = EMBEDDING_PROVIDERS.find(p => p.name === providerName)?.displayName || providerName;

        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontWeight: '600', color: '#dc2626', fontSize: '1rem' }}>
                    임베딩 제공자 변경
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
            const result = await switchEmbeddingProvider(providerName);
            setCurrentProvider(providerName);
            await loadEmbeddingStatus(); // 상태 새로고침
            toast.success(`임베딩 제공자가 ${EMBEDDING_PROVIDERS.find(p => p.name === providerName)?.displayName || providerName}로 변경되었습니다.`);
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
            if (providerName === 'embedding') {
                result = await testEmbeddingQuery("Hello, world!");
            } else {
                // Fallback to original onTestConnection
                if (onTestConnection) {
                    await onTestConnection(providerName);
                    toast.success(`연결 테스트 성공!`);
                    return;
                }
            }

            if (result) {
                toast.success(`임베딩 테스트 성공!\n차원: ${(result as any).embedding_dimension}\n제공자: ${(result as any).provider}`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `${providerName} 연결 테스트에 실패했습니다.`;
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Failed to test connection:', err);
        } finally {
            setTesting(false);
        }
    };

    const handleRefreshConfig = async () => {
        setLoading(true);
        setError(null);
        try {
            await refreshRetrievalConfig();
            await loadEmbeddingStatus(); // 상태 새로고침
            toast.success('Retrieval 설정이 성공적으로 새로고침되었습니다.');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Retrieval 설정 새로고침에 실패했습니다.';
            setError(errorMessage);
            toast.error(errorMessage);
            console.error('Failed to refresh retrieval config:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderEmbeddingTab = () => {
        const currentDefaultProvider = getCurrentDefaultProvider();

        return (
            <div className={styles.defaultProviderConfig}>
                <div className={styles.sectionHeader}>
                    <h3>기본 임베딩 제공자 설정</h3>
                    <p>워크플로우에서 기본적으로 사용할 임베딩 제공자를 선택하세요.</p>
                </div>

                {/* 현재 제공자 상태 - 최상단으로 이동 */}
                <div className={styles.currentProviderSection}>
                    <div className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4>현재 활성 제공자</h4>
                        <button
                            onClick={handleRefreshConfig}
                            className={`${styles.button} ${styles.secondary} ${styles.refreshButton}`}
                            disabled={loading}
                            title="Retrieval 설정 새로고침"
                        >
                            <FiRefreshCw className={loading ? styles.spinning : ''} />
                            설정 초기화
                        </button>
                    </div>

                    {embeddingStatus && (
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
                                        {EMBEDDING_PROVIDERS.find(p => p.name === currentDefaultProvider)?.displayName || currentDefaultProvider}
                                    </h3>
                                    <p className={styles.providerDescription}>
                                        {EMBEDDING_PROVIDERS.find(p => p.name === currentDefaultProvider)?.description || '설명 없음'}
                                    </p>
                                    <div className={styles.providerMetadata}>
                                        <span className={styles.metadataItem}>
                                            <FiServer className={styles.metadataIcon} />
                                            기본 제공자
                                        </span>
                                        {dimensionInfo && (
                                            <span className={styles.metadataItem}>
                                                <FiSettings className={styles.metadataIcon} />
                                                모델: {dimensionInfo.model}
                                                {dimensionInfo.auto_detected && <span className={styles.autoDetected}> (자동 감지)</span>}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.statusSection}>
                                {(() => {
                                    const configured = true; // 항상 설정됨으로 간주
                                    const connected = embeddingStatus.available;
                                    const tested = true; // 상태를 불러왔으므로 테스트됨으로 간주

                                    const statusClass = configured && connected
                                        ? styles.statusSuccess
                                        : configured && !connected
                                            ? styles.statusError
                                            : configured
                                                ? styles.statusWarning
                                                : styles.statusError;

                                    return (
                                        <div className={`${styles.statusIndicatorLarge} ${statusClass}`}>
                                            <div className={styles.statusIconWrapper}>
                                                {getStatusIcon(configured, connected, tested)}
                                            </div>
                                            <div className={styles.statusText}>
                                                <span className={styles.statusLabel}>
                                                    {getStatusText(configured, connected, tested)}
                                                </span>
                                                <span className={styles.statusSubtext}>
                                                    {connected
                                                        ? '모든 기능을 사용할 수 있습니다'
                                                        : '연결을 확인해 주세요'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className={styles.statusActions}>
                                    <button
                                        onClick={() => handleTestConnection('embedding')}
                                        className={`${styles.button} ${styles.primary} ${styles.testButton}`}
                                        disabled={testing}
                                    >
                                        <FiPlay />
                                        {testing ? '테스트 중...' : '연결 테스트'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* 제공자 선택 카드 */}
                <div className={styles.providersSection}>
                    <div className={styles.sectionTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h4>사용 가능한 임베딩 제공자</h4>
                            <span className={styles.sectionSubtitle}>
                                제공자를 클릭하여 기본 제공자로 변경하세요
                            </span>
                        </div>
                    </div>

                    <div className={styles.providersGrid}>
                        {EMBEDDING_PROVIDERS.map((provider) => {
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
                                                        // 여기서는 상세 설정으로 스크롤하거나 다른 동작 수행
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
                <BaseConfigPanel
                    configData={configData}
                    fieldConfigs={EMBEDDING_CONFIG_FIELDS}
                    filterPrefix="vectordb"
                />
            </div>
        );
    };

    const renderDatabaseTab = () => (
        <div className={styles.openaiConfig}>
            <div className={styles.sectionHeader}>
                <h3>벡터 데이터베이스 설정</h3>
                <p>Qdrant 벡터 데이터베이스 연결을 설정합니다.</p>
            </div>

            <BaseConfigPanel
                configData={configData}
                fieldConfigs={VECTORDATABASE_CONFIG_FIELDS}
                filterPrefix="vectordb"
                onTestConnection={onTestConnection}
                testConnectionLabel="벡터 데이터베이스 연결 테스트"
                testConnectionCategory="vectordb"
            />
        </div>
    );

    return (
        <div className={styles.llmContainer}>
            {/* 탭 네비게이션 */}
            <div className={styles.tabNavigation}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'embedding' ? styles.active : ''}`}
                    onClick={() => setActiveTab('embedding')}
                >
                    <FiServer />
                    임베딩 모델
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'database' ? styles.active : ''}`}
                    onClick={() => setActiveTab('database')}
                >
                    <FiDatabase />
                    벡터 데이터베이스
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
                    <p>임베딩 상태를 불러오는 중...</p>
                </div>
            )}

            {/* 탭 콘텐츠 */}
            <div className={styles.tabContent}>
                {activeTab === 'embedding' && renderEmbeddingTab()}
                {activeTab === 'database' && renderDatabaseTab()}
            </div>
        </div>
    );
};

export default VectordbConfig;
