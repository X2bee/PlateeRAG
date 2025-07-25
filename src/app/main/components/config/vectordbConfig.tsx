import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiAlertCircle, FiPlay, FiSettings, FiServer, FiDatabase } from 'react-icons/fi';
import { SiOpenai, SiHuggingface } from 'react-icons/si';
import { BsRobot } from 'react-icons/bs';
import toast from 'react-hot-toast';
import BaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/main/components/config/BaseConfigPanel';
import {
    getCurrentEmbeddingDimension
} from '@/app/api/retrievalAPI';
import {
    getEmbeddingProviders,
    getEmbeddingStatus,
    switchEmbeddingProvider,
    autoSwitchEmbeddingProvider,
    testEmbeddingQuery,
    reloadEmbeddingClient,
    getEmbeddingConfigStatus,
    getEmbeddingDebugInfo,
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
    color: string;
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
        color: '#10a37f',
        description: 'OpenAI의 고품질 임베딩 모델 (text-embedding-3-small/large)'
    },
    {
        name: 'huggingface',
        displayName: 'HuggingFace',
        icon: <SiHuggingface />,
        color: '#ff6b35',
        description: '오픈소스 Sentence Transformers 모델'
    },
    {
        name: 'custom_http',
        displayName: 'VLLM Server',
        icon: <BsRobot />,
        color: '#6366f1',
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
    const [optimizing, setOptimizing] = useState(false);
    const [testing, setTesting] = useState(false);
    const [reloading, setReloading] = useState(false);
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

    const handleProviderSwitch = async (providerName: string) => {
        // 현재 provider와 동일한 경우 아무 동작하지 않음
        if (currentProvider === providerName) {
            return;
        }

        // 확인 toast를 통해 사용자에게 변경 의사 확인
        const currentProviderDisplayName = EMBEDDING_PROVIDERS.find(p => p.name === currentProvider)?.displayName || currentProvider;
        const newProviderDisplayName = EMBEDDING_PROVIDERS.find(p => p.name === providerName)?.displayName || providerName;

        toast((t) => (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                <div
                    style={{
                        fontWeight: '600',
                        color: '#dc2626',
                        fontSize: '1rem',
                    }}
                >
                    임베딩 제공자 변경
                </div>
                <div
                    style={{
                        fontSize: '0.9rem',
                        color: '#374151',
                        lineHeight: '1.4',
                    }}
                >
                    현재: <strong>{currentProviderDisplayName}</strong> → 변경: <strong>{newProviderDisplayName}</strong>
                    <br />
                    변경 시 백엔드에서 재설정 작업이 수행됩니다.
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'flex-end',
                        marginTop: '4px',
                    }}
                >
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
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
                boxShadow:
                    '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                color: '#374151',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            },
        });
    };

    const confirmProviderSwitch = async (providerName: string) => {
        setSwitching(true);
        setError(null);
        try {
            const result = await switchEmbeddingProvider(providerName) as any;
            if (result.success) {
                setCurrentProvider(providerName);
                await loadEmbeddingStatus(); // 이 함수가 dimensionInfo도 업데이트함
                toast.success(`임베딩 제공자가 ${EMBEDDING_PROVIDERS.find(p => p.name === providerName)?.displayName || providerName}로 변경되었습니다.`);
            } else {
                setError(result.message || '제공자 변경에 실패했습니다.');
                toast.error(result.message || '제공자 변경에 실패했습니다.');
            }
        } catch (err) {
            setError('제공자 변경 중 오류가 발생했습니다.');
            toast.error('제공자 변경 중 오류가 발생했습니다.');
            console.error('Failed to switch provider:', err);
        } finally {
            setSwitching(false);
        }
    };

    const handleAutoSwitch = async () => {
        setOptimizing(true);
        setError(null);
        try {
            const result = await autoSwitchEmbeddingProvider() as any;
            if (result.switched) {
                setCurrentProvider(result.new_provider);
                await loadEmbeddingStatus(); // 이 함수가 dimensionInfo도 업데이트함
            }
        } catch (err) {
            setError('자동 전환 중 오류가 발생했습니다.');
            console.error('Failed to auto switch:', err);
        } finally {
            setOptimizing(false);
        }
    };

    const handleTestEmbedding = async () => {
        setTesting(true);
        setError(null);
        try {
            const result = await testEmbeddingQuery("Hello, world!") as any;
            alert(`임베딩 테스트 성공!\n차원: ${result.embedding_dimension}\n제공자: ${result.provider}`);
        } catch (err) {
            setError('임베딩 테스트에 실패했습니다.');
            console.error('Failed to test embedding:', err);
        } finally {
            setTesting(false);
        }
    };

    const handleReloadClient = async () => {
        setReloading(true);
        setError(null);
        try {
            const result = await reloadEmbeddingClient() as any;
            if (result.success) {
                await loadEmbeddingStatus(); // 이 함수가 dimensionInfo도 업데이트함
            } else {
                setError('클라이언트 재로드에 실패했습니다.');
            }
        } catch (err) {
            setError('클라이언트 재로드 중 오류가 발생했습니다.');
            console.error('Failed to reload client:', err);
        } finally {
            setReloading(false);
        }
    };

    const getProviderIcon = (providerName: string) => {
        const provider = EMBEDDING_PROVIDERS.find(p => p.name === providerName);
        return provider ? provider.icon : <FiSettings />;
    };

    const getProviderColor = (providerName: string) => {
        const provider = EMBEDDING_PROVIDERS.find(p => p.name === providerName);
        return provider ? provider.color : '#6b7280';
    };

    const getStatusIcon = (available: boolean, configured: boolean) => {
        if (available && configured) return <FiCheck className={styles.statusConnected} />;
        if (configured) return <FiAlertCircle className={styles.statusWarning} />;
        return <FiX className={styles.statusError} />;
    };

    const getStatusText = (available: boolean, configured: boolean) => {
        if (available && configured) return '사용 가능';
        if (configured) return '설정됨';
        return '설정 필요';
    };

    const renderEmbeddingTab = () => (
        <div className={styles.embeddingConfig}>
            {/* 현재 상태 */}
            <div className={styles.statusSection}>
                <div className={styles.sectionHeader}>
                    <h3>현재 임베딩 설정</h3>
                    <div className={styles.headerActions}>
                        <button
                            onClick={loadEmbeddingStatus}
                            className={`${styles.button} ${styles.secondary} ${styles.small}`}
                            disabled={loading}
                        >
                            <FiRefreshCw className={loading ? styles.spinning : ''} />
                            새로고침
                        </button>
                        <button
                            onClick={handleReloadClient}
                            className={`${styles.button} ${styles.secondary} ${styles.small}`}
                            disabled={reloading}
                        >
                            <FiSettings className={reloading ? styles.spinning : ''} />
                            {reloading ? '재로드 중...' : '클라이언트 재로드'}
                        </button>
                    </div>
                </div>

                {embeddingStatus && (
                    <div className={styles.currentStatus}>
                        <div className={styles.statusCard}>
                            <div className={styles.statusInfo}>
                                <div className={styles.providerInfo}>
                                    <span
                                        className={styles.providerIcon}
                                        style={{ color: getProviderColor(currentProvider) }}
                                    >
                                        {getProviderIcon(currentProvider)}
                                    </span>
                                    <div>
                                        <h4>
                                            {EMBEDDING_PROVIDERS.find(p => p.name === currentProvider)?.displayName || currentProvider}
                                        </h4>
                                        <p>현재 활성 제공자</p>
                                        {dimensionInfo && (
                                            <p className={styles.dimensionInfo}>
                                                모델: {dimensionInfo.model}
                                                {dimensionInfo.auto_detected && <span className={styles.autoDetected}> (자동 감지)</span>}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.statusIndicator}>
                                    {getStatusIcon(embeddingStatus.available, true)}
                                    <span>{embeddingStatus.available ? '정상 작동' : '연결 오류'}</span>
                                </div>
                            </div>

                            <div className={styles.statusActions}>
                                <button
                                    onClick={handleTestEmbedding}
                                    className={`${styles.button} ${styles.primary} ${styles.small}`}
                                    disabled={testing || !embeddingStatus.available}
                                >
                                    <FiPlay />
                                    {testing ? '테스트 중...' : '임베딩 테스트'}
                                </button>
                                <button
                                    onClick={handleAutoSwitch}
                                    className={`${styles.button} ${styles.secondary} ${styles.small}`}
                                    disabled={optimizing || switching}
                                >
                                    <FiRefreshCw className={optimizing ? styles.spinning : ''} />
                                    {optimizing ? '최적화 중...' : '자동 최적화'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 제공자 선택 */}
            <div className={styles.providersSection}>
                <h3>임베딩 제공자 선택</h3>
                <div className={styles.providersGrid}>
                    {EMBEDDING_PROVIDERS.map((provider) => {
                        const providerStatus = providersStatus.find(p => p.provider === provider.name);
                        const isActive = currentProvider === provider.name;

                        return (
                            <div
                                key={provider.name}
                                className={`${styles.providerCard} ${isActive ? styles.active : ''}`}
                                onClick={() => !switching && handleProviderSwitch(provider.name)}
                                style={{
                                    cursor: switching ? 'not-allowed' : (isActive ? 'default' : 'pointer'),
                                    opacity: switching ? 0.7 : 1
                                }}
                            >
                                <div className={styles.providerHeader}>
                                    <div
                                        className={styles.providerIcon}
                                        style={{ color: provider.color }}
                                    >
                                        {provider.icon}
                                    </div>
                                    <div className={styles.providerInfo}>
                                        <h4>{provider.displayName}</h4>
                                        <p>{provider.description}</p>
                                    </div>
                                    <div className={styles.providerStatus}>
                                        {providerStatus && getStatusIcon(providerStatus.available, providerStatus.configured)}
                                        {isActive && <span className={styles.activeBadge}>활성</span>}
                                    </div>
                                </div>

                                {providerStatus && (
                                    <div className={styles.providerDetails}>
                                        <span className={styles.statusText}>
                                            {getStatusText(providerStatus.available, providerStatus.configured)}
                                        </span>
                                        {providerStatus.error && (
                                            <span className={styles.errorText}>
                                                {providerStatus.error}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 상세 설정 */}
            <div className={styles.configSection}>
                <h3>임베딩 상세 설정</h3>
                <BaseConfigPanel
                    configData={configData}
                    fieldConfigs={EMBEDDING_CONFIG_FIELDS}
                    filterPrefix="vectordb"
                    onTestConnection={onTestConnection}
                    testConnectionLabel="임베딩 연결 테스트"
                    testConnectionCategory="embedding"
                />
            </div>
        </div>
    );

    const renderDatabaseTab = () => (
        <div className={styles.databaseConfig}>
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
        <div className={styles.vectordbContainer}>
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

            {/* 탭 콘텐츠 */}
            <div className={styles.tabContent}>
                {activeTab === 'embedding' ? renderEmbeddingTab() : renderDatabaseTab()}
            </div>
        </div>
    );
};

export default VectordbConfig;
