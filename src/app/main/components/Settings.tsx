'use client';
import React, { useState, useCallback } from 'react';
import {
    FiChevronRight,
    FiCheck,
    FiX,
    FiArrowLeft,
    FiDatabase,
} from 'react-icons/fi';
import { IoDocumentLock } from "react-icons/io5";
import { BsDatabaseUp } from 'react-icons/bs';
import { SiOpenai } from 'react-icons/si';
import { BsGear, BsGpuCard } from 'react-icons/bs';
import {
    testConnection,
    fetchAllConfigs,
} from '@/app/api/configAPI';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/main/assets/Settings.module.scss';

import LLMConfig from '@/app/main/components/config/llmConfig';
import WorkflowConfig from '@/app/main/components/config/workflowConfig';
import DatabaseConfig from '@/app/main/components/config/databaseConfig';
import VectordbConfig from '@/app/main/components/config/vectordbConfig';
import CollectionConfig from '@/app/main/components/config/collectionConfig';
import VastAiConfig from '@/app/main/components/config/vastAiConfig';
import TrainVastConfig from '@/app/main/components/config/trainVastConfig';

interface ConfigItem {
    env_name: string;
    config_path: string;
    current_value: any;
    default_value: any;
    is_saved: boolean;
}

interface ToolCategory {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    status: 'connected' | 'disconnected' | 'error';
}

interface ApiConfig {
    apiKey?: string;
    endpoint?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    organization?: string;
    // vLLM specific fields
    baseUrl?: string;
    modelName?: string;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    repetitionPenalty?: number;
    bestOf?: number;
    useBeamSearch?: boolean;
    stopSequences?: string;
    seed?: number;
    timeout?: number;
    stream?: boolean;
    logprobs?: number;
    echo?: boolean;
    // Collection specific fields
    imageTextBaseUrl?: string;
    imageTextApiKey?: string;
    imageTextModelName?: string;
}

const Settings: React.FC = () => {
    const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        null,
    );
    const [configs, setConfigs] = useState<Record<string, ApiConfig>>({});
    const [configData, setConfigData] = useState<ConfigItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load configs from localStorage and fetch from backend
    React.useEffect(() => {
        const savedConfigs = localStorage.getItem('plateerag-configs');
        if (savedConfigs) {
            try {
                setConfigs(JSON.parse(savedConfigs));
            } catch (error) {
                devLog.error('Failed to load saved configs:', error);
            }
        }

        // Fetch config data from backend
        fetchConfigData();
    }, []);

    const fetchConfigData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAllConfigs();
            devLog.info('Fetched config data:', data);

            if (
                data &&
                (data as any).persistent_summary &&
                (data as any).persistent_summary.configs
            ) {
                setConfigData((data as any).persistent_summary.configs);
            } else {
                setConfigData([]);
                devLog.warn('Unexpected data structure:', data);
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : '알 수 없는 오류';
            setError(`설정 정보를 불러오는데 실패했습니다: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // Load configs from localStorage on component mount
    React.useEffect(() => {
        const savedConfigs = localStorage.getItem('plateerag-configs');
        if (savedConfigs) {
            try {
                setConfigs(JSON.parse(savedConfigs));
            } catch (error) {
                devLog.error('Failed to load saved configs:', error);
            }
        }
    }, []);

    const toolCategories: ToolCategory[] = [
        {
            id: 'llm',
            name: 'LLM 모델',
            description: 'OpenAI, vLLM 등 언어모델 서비스 설정',
            icon: <SiOpenai />,
            color: '#10a37f',
            status: configs.openai?.apiKey || configs.vllm?.baseUrl ? 'connected' : 'disconnected',
        },
        {
            id: 'vastai',
            name: 'Vast.ai GPU',
            description: 'Vast.ai GPU 인스턴스 및 vLLM 서버 설정',
            icon: <BsGpuCard />,
            color: '#7c3aed',
            status: configs.vastai?.apiKey ? 'connected' : 'disconnected',
        },
        {
            id: 'collection',
            name: '컬렉션 관리',
            description: '이미지-텍스트 모델 및 컬렉션 처리 설정',
            icon: <IoDocumentLock />,
            color: '#7c3aed',
            status: configs.collection?.imageTextApiKey ? 'connected' : 'disconnected',
        },
        {
            id: 'workflow',
            name: '워크플로우',
            description: '워크플로우 실행 및 관리 설정',
            icon: <BsGear />,
            color: '#4f46e5',
            status: 'connected',
        },
        {
            id: 'database',
            name: '데이터베이스',
            description: 'PostgreSQL, SQLite 등 데이터베이스 연결 설정',
            icon: <FiDatabase />,
            color: '#059669',
            status: 'connected',
        },
        {
            id: 'vectordb',
            name: '벡터 데이터베이스',
            description: '벡터 데이터베이스 연결 설정',
            icon: <BsDatabaseUp />,
            color: '#023196',
            status: 'connected',
        },
        {
            id: 'train-vast',
            name: 'Trainer & Vast.ai',
            description: 'Trainer 설정 및 Vast.ai GPU 관리',
            icon: <BsGpuCard />,
            color: '#023196',
            status: 'connected',
        },
    ];

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setCurrentView('detail');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedCategory(null);
    };

    const handleTestConnection = async (categoryId: string) => {
        try {
            devLog.info(
                `Testing connection for ${categoryId}`,
                configs[categoryId],
            );
            const result = await testConnection(categoryId);
            alert(`${categoryId} 연결 테스트 성공: ${JSON.stringify(result)}`);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : '알 수 없는 오류';
            alert(`${categoryId} 연결 테스트 실패: ${errorMessage}`);
            devLog.error('Connection test failed:', error);
        }
    };

    const handleConfigUpdate = useCallback(async () => {
        console.log('📢 Settings: Received config update notification');
        await fetchConfigData();
    }, [fetchConfigData]);

    const renderWorkflowConfig = () => {
        return (
            <WorkflowConfig
                configData={configData}
                onTestConnection={handleTestConnection}
            />
        );
    };

    const renderDatabaseConfig = () => {
        return (
            <DatabaseConfig
                configData={configData}
                onTestConnection={handleTestConnection}
            />
        );
    };

    const renderVectorDBConfig = () => {
        return (
            <VectordbConfig
                configData={configData}
                onTestConnection={handleTestConnection}
            />
        );
    };

    const renderCollectionConfig = () => {
        return (
            <CollectionConfig
                configData={configData}
                onConfigUpdate={handleConfigUpdate}
            />
        );
    };

    const renderLLMconfig = () => {
        return (
            <LLMConfig
            configData={configData}
            onTestConnection={handleTestConnection}
        />
        )
    }

    const renderVastAiConfig = () => {
        return (
            <VastAiConfig
                configData={configData}
            />
        );
    };

    const renderTrainVastConfig = () => {
        return (
            <TrainVastConfig
                configData={configData}
            />
        );
    };

    const renderConfigForm = (categoryId: string) => {
        switch (categoryId) {
            case 'llm':
                return renderLLMconfig();
            case 'vastai':
                return renderVastAiConfig();
            case 'collection':
                return renderCollectionConfig();
            case 'workflow':
                return renderWorkflowConfig();
            case 'database':
                return renderDatabaseConfig();
            case 'vectordb':
                return renderVectorDBConfig();
            case 'train-vast':
                return renderTrainVastConfig();
            default:
                return <p>설정 폼을 준비 중입니다.</p>;
        }
    };

    const getCurrentCategory = () => {
        return toolCategories.find((cat) => cat.id === selectedCategory);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'connected':
                return <FiCheck className={styles.statusConnected} />;
            case 'error':
                return <FiX className={styles.statusError} />;
            default:
                return null;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'connected':
                return '연결됨';
            case 'error':
                return '오류';
            default:
                return '연결 안됨';
        }
    };

    return (
        <div className={styles.container}>
            {currentView === 'list' ? (
                // Settings List View
                <>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerContent}>
                            <h2>환경 설정</h2>
                            <p>다양한 도구들의 환경을 설정합니다.</p>
                        </div>
                    </div>

                    {/* Categories Grid */}
                    <div className={styles.categoriesGrid}>
                        {toolCategories.map((category) => (
                            <div
                                key={category.id}
                                className={styles.categoryWrapper}
                            >
                                <div
                                    className={styles.categoryCard}
                                    onClick={() =>
                                        handleCategoryClick(category.id)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleCategoryClick(category.id);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className={styles.categoryHeader}>
                                        <div
                                            className={styles.categoryIcon}
                                            style={{ color: category.color }}
                                        >
                                            {category.icon}
                                        </div>
                                        <div className={styles.categoryInfo}>
                                            <h3>{category.name}</h3>
                                            <p>{category.description}</p>
                                        </div>
                                        <div className={styles.categoryStatus}>
                                            {/* {getStatusIcon(category.status)} */}
                                            {/* <span className={styles.statusText}>
                                                {getStatusText(category.status)}
                                            </span> */}
                                            <FiChevronRight
                                                className={styles.chevron}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                // Detail Configuration View
                selectedCategory && (
                    <div className={styles.detailView}>
                        {/* Detail Header */}
                        <div className={styles.detailHeader}>
                            <div className={styles.headerTop}>
                                <button
                                    onClick={handleBackToList}
                                    className={styles.backButton}
                                >
                                    <FiArrowLeft />
                                    뒤로
                                </button>
                                <div className={styles.detailTitle}>
                                    <div
                                        className={styles.detailIcon}
                                        style={{
                                            color: getCurrentCategory()?.color,
                                        }}
                                    >
                                        {getCurrentCategory()?.icon}
                                    </div>
                                    <div>
                                        <h2>
                                            {getCurrentCategory()?.name} 설정
                                        </h2>
                                        <p>
                                            {getCurrentCategory()?.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Form */}
                        <div className={styles.configWrapper}>
                            {loading ? (
                                <div className={styles.loadingState}>
                                    <p>설정 정보를 불러오는 중...</p>
                                </div>
                            ) : error ? (
                                <div className={styles.errorState}>
                                    <p>오류: {error}</p>
                                    <button
                                        onClick={fetchConfigData}
                                        className={`${styles.button} ${styles.secondary}`}
                                    >
                                        다시 시도
                                    </button>
                                </div>
                            ) : (
                                renderConfigForm(selectedCategory)
                            )}
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

// TODO: 백엔드 API 연동 현황
// ✅ updateConfig API 연동 완료 - 개별 설정값 업데이트
// ✅ fetchAllConfigs API 연동 완료 - 모든 설정 정보 조회
// ✅ saveConfigs API 연동 완료 - 모든 설정 저장
// ✅ refreshConfigs API 연동 완료 - 설정 새로고침
// ⏳ testConnection - 임시 더미 함수로 구현 (백엔드 엔드포인트 추가 필요)
// ❌ resetConfig - 백엔드에 없는 기능, 클라이언트에서만 처리
// ❌ updateCategoryConfigs - 백엔드에 없는 기능, 개별 업데이트로 대체

// 현재 localStorage와 백엔드 API를 모두 활용하는 하이브리드 방식으로 구현
// 백엔드에서 추가로 필요한 API:
// - POST /app/config/test/{category} - 연결 테스트 (OpenAI, vLLM, Collection 포함)
// - POST /app/config/reset/{category} - 카테고리별 리셋
// - PUT /app/config/batch/{category} - 카테고리별 일괄 업데이트

export default Settings;
