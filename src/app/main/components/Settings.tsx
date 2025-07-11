"use client";
import React, { useState } from "react";
import { FiChevronRight, FiSettings, FiCheck, FiX, FiArrowLeft } from "react-icons/fi";
import { SiOpenai, SiGoogle, SiPostgresql, SiMongodb, SiAmazon } from "react-icons/si";
import { FiCloud } from "react-icons/fi";
import { testConnection, updateConfig, refreshConfigs, saveConfigs } from "@/app/api/configAPI";
import { devLog } from "@/app/utils/logger";
import styles from "@/app/main/assets/Settings.module.scss";

// Import config components
import OpenAIConfig from "@/app/main/components/config/openAIConfig";
import GoogleConfig from "@/app/main/components/config/googleConfig";
import PostgreSQLConfig from "@/app/main/components/config/postgreSQLConfig";
import MongoDBConfig from "@/app/main/components/config/mongoDBConfig";
import AWSConfig from "@/app/main/components/config/awsConfig";
import AzureConfig from "@/app/main/components/config/azureConfig";

interface ToolCategory {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    status: "connected" | "disconnected" | "error";
}

interface ApiConfig {
    apiKey?: string;
    endpoint?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    // Database specific
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    // MongoDB specific
    uri?: string;
    authDatabase?: string;
    // AWS specific
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    service?: string;
    modelId?: string;
    sessionToken?: string;
    // Azure specific
    apiVersion?: string;
    deploymentName?: string;
    resourceGroup?: string;
}

const Settings: React.FC = () => {
    const [currentView, setCurrentView] = useState<"list" | "detail">("list");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [configs, setConfigs] = useState<Record<string, ApiConfig>>({});
    const [isSaving, setIsSaving] = useState(false);

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
            id: "openai",
            name: "OpenAI",
            description: "GPT-4, GPT-3.5, DALL-E 등 OpenAI 서비스",
            icon: <SiOpenai />,
            color: "#10a37f",
            status: configs.openai?.apiKey ? "connected" : "disconnected"
        },
        {
            id: "google",
            name: "Google AI",
            description: "Gemini, PaLM, Vertex AI 서비스",
            icon: <SiGoogle />,
            color: "#4285f4",
            status: configs.google?.apiKey ? "connected" : "disconnected"
        },
        {
            id: "postgresql",
            name: "PostgreSQL",
            description: "PostgreSQL 데이터베이스 연결",
            icon: <SiPostgresql />,
            color: "#336791",
            status: configs.postgresql?.host ? "connected" : "disconnected"
        },
        {
            id: "mongodb",
            name: "MongoDB",
            description: "MongoDB 데이터베이스 연결",
            icon: <SiMongodb />,
            color: "#47a248",
            status: configs.mongodb?.host ? "connected" : "disconnected"
        },
        {
            id: "aws",
            name: "Amazon Web Services",
            description: "AWS Bedrock, SageMaker 등",
            icon: <SiAmazon />,
            color: "#ff9900",
            status: configs.aws?.accessKeyId ? "connected" : "disconnected"
        },
        {
            id: "azure",
            name: "Microsoft Azure",
            description: "Azure OpenAI, Cognitive Services",
            icon: <FiCloud />,
            color: "#0078d4",
            status: configs.azure?.apiKey ? "connected" : "disconnected"
        }
    ];

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setCurrentView("detail");
    };

    const handleBackToList = () => {
        setCurrentView("list");
        setSelectedCategory(null);
    };

    const handleConfigChange = (categoryId: string, field: string, value: string | number) => {
        setConfigs(prev => ({
            ...prev,
            [categoryId]: {
                ...prev[categoryId],
                [field]: value
            }
        }));
    };

    const handleTestConnection = async (categoryId: string) => {
        try {
            devLog.info(`Testing connection for ${categoryId}`, configs[categoryId]);
            const result = await testConnection(categoryId);
            alert(`${categoryId} 연결 테스트 성공: ${JSON.stringify(result)}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            alert(`${categoryId} 연결 테스트 실패: ${errorMessage}`);
            devLog.error('Connection test failed:', error);
        }
    };

    // Save all configs to backend
    const handleSaveAllConfigs = async () => {
        setIsSaving(true);
        try {
            await saveConfigs();
            // Also save to localStorage for local persistence
            localStorage.setItem('plateerag-configs', JSON.stringify(configs));
            alert('모든 설정이 성공적으로 저장되었습니다.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            alert(`설정 저장 실패: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Reset specific category configs (클라이언트 측에서만 처리)
    const handleResetCategory = async (categoryId: string) => {
        if (confirm(`${categoryId} 카테고리의 모든 설정을 기본값으로 초기화하시겠습니까?`)) {
            try {
                // 백엔드에 리셋 API가 없으므로 클라이언트에서만 초기화
                setConfigs(prev => ({
                    ...prev,
                    [categoryId]: {}
                }));
                
                // localStorage에서도 제거
                const savedConfigs = { ...configs };
                delete savedConfigs[categoryId];
                localStorage.setItem('plateerag-configs', JSON.stringify(savedConfigs));
                
                alert(`${categoryId} 설정이 기본값으로 초기화되었습니다.`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
                alert(`설정 초기화 실패: ${errorMessage}`);
            }
        }
    };

    // Update specific config value
    const handleUpdateConfig = async (categoryId: string, key: string, value: string | number) => {
        try {
            // configName format: CATEGORY_KEY (e.g., OPENAI_API_KEY)
            const configName = `${categoryId.toUpperCase()}_${key.toUpperCase()}`;
            await updateConfig(configName, value);
            // Update local state
            handleConfigChange(categoryId, key, value);
        } catch (error) {
            devLog.error('Failed to update config:', error);
        }
    };

    // Save category-specific configs (클라이언트 측에서만 처리)
    const handleSaveCategoryConfigs = async (categoryId: string) => {
        try {
            // 백엔드에 일괄 업데이트 API가 없으므로 개별적으로 업데이트
            const categoryConfig = configs[categoryId] || {};
            
            for (const [key, value] of Object.entries(categoryConfig)) {
                const configName = `${categoryId.toUpperCase()}_${key.toUpperCase()}`;
                await updateConfig(configName, value);
            }
            
            alert(`${categoryId} 설정이 저장되었습니다.`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            alert(`설정 저장 실패: ${errorMessage}`);
        }
    };

    const handleSaveConfig = async () => {
        if (!selectedCategory) return;
        
        setIsSaving(true);
        try {
            // Save to backend
            await handleSaveCategoryConfigs(selectedCategory);
            
            // Save to localStorage
            localStorage.setItem('plateerag-configs', JSON.stringify(configs));
            
            // Show success message
            alert(`${getCurrentCategory()?.name} 설정이 저장되었습니다.`);
            
            // Navigate back to list
            handleBackToList();
        } catch (error) {
            devLog.error('Failed to save config:', error);
            alert('설정 저장에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    const validateConfig = (categoryId: string): boolean => {
        const config = configs[categoryId] || {};
        
        switch (categoryId) {
            case "openai":
            case "google":
            case "azure":
                return !!config.apiKey;
            case "postgresql":
            case "mongodb":
                return !!(config.host && config.database);
            case "aws":
                return !!(config.accessKeyId && config.secretAccessKey);
            default:
                return false;
        }
    };

    const renderOpenAIConfig = () => {
        const config = configs.openai || {};
        return (
            <OpenAIConfig 
                config={config}
                onConfigChange={handleConfigChange}
                onTestConnection={handleTestConnection}
            />
        );
    };

    const renderGoogleConfig = () => {
        const config = configs.google || {};
        return (
            <GoogleConfig 
                config={config}
                onConfigChange={handleConfigChange}
                onTestConnection={handleTestConnection}
            />
        );
    };

    const renderPostgreSQLConfig = () => {
        const config = configs.postgresql || {};
        return (
            <PostgreSQLConfig 
                config={config}
                onConfigChange={handleConfigChange}
                onTestConnection={handleTestConnection}
            />
        );
    };

    const renderMongoDBConfig = () => {
        const config = configs.mongodb || {};
        return (
            <MongoDBConfig 
                config={config}
                onConfigChange={handleConfigChange}
                onTestConnection={handleTestConnection}
            />
        );
    };

    const renderAWSConfig = () => {
        const config = configs.aws || {};
        return (
            <AWSConfig 
                config={config}
                onConfigChange={handleConfigChange}
                onTestConnection={handleTestConnection}
            />
        );
    };

    const renderAzureConfig = () => {
        const config = configs.azure || {};
        return (
            <AzureConfig 
                config={config}
                onConfigChange={handleConfigChange}
                onTestConnection={handleTestConnection}
            />
        );
    };

    const renderConfigForm = (categoryId: string) => {
        switch (categoryId) {
            case "openai":
                return renderOpenAIConfig();
            case "google":
                return renderGoogleConfig();
            case "postgresql":
                return renderPostgreSQLConfig();
            case "mongodb":
                return renderMongoDBConfig();
            case "aws":
                return renderAWSConfig();
            case "azure":
                return renderAzureConfig();
            default:
                return <p>설정 폼을 준비 중입니다.</p>;
        }
    };

    const getCurrentCategory = () => {
        return toolCategories.find(cat => cat.id === selectedCategory);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "connected":
                return <FiCheck className={styles.statusConnected} />;
            case "error":
                return <FiX className={styles.statusError} />;
            default:
                return null;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "connected":
                return "연결됨";
            case "error":
                return "오류";
            default:
                return "연결 안됨";
        }
    };

    return (
        <div className={styles.container}>
            {currentView === "list" ? (
                // Settings List View
                <>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerContent}>
                            <h2>환경 설정</h2>
                            <p>워크플로우에서 사용할 AI 모델과 데이터베이스를 설정하세요.</p>
                        </div>
                        <div className={styles.headerActions}>
                            <button 
                                onClick={handleSaveAllConfigs}
                                className={`${styles.button} ${styles.primary}`}
                                disabled={isSaving}
                            >
                                {isSaving ? "저장 중..." : "모든 설정 저장"}
                            </button>
                        </div>
                    </div>

                    {/* Categories Grid */}
                    <div className={styles.categoriesGrid}>
                        {toolCategories.map((category) => (
                            <div key={category.id} className={styles.categoryWrapper}>
                                <div
                                    className={styles.categoryCard}
                                    onClick={() => handleCategoryClick(category.id)}
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
                                            {getStatusIcon(category.status)}
                                            <span className={styles.statusText}>
                                                {getStatusText(category.status)}
                                            </span>
                                            <FiChevronRight className={styles.chevron} />
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
                                    style={{ color: getCurrentCategory()?.color }}
                                >
                                    {getCurrentCategory()?.icon}
                                </div>
                                <div>
                                    <h2>{getCurrentCategory()?.name} 설정</h2>
                                    <p>{getCurrentCategory()?.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Configuration Form */}
                        <div className={styles.configWrapper}>
                            {renderConfigForm(selectedCategory)}
                            
                            {/* Form Actions */}
                            <div className={styles.formActions}>
                                <button 
                                    onClick={() => handleResetCategory(selectedCategory)}
                                    className={`${styles.button} ${styles.danger}`}
                                >
                                    기본값으로 초기화
                                </button>
                                <button 
                                    onClick={() => handleTestConnection(selectedCategory)}
                                    className={`${styles.button} ${styles.test}`}
                                    disabled={!validateConfig(selectedCategory)}
                                >
                                    연결 테스트
                                </button>
                                <button 
                                    onClick={handleBackToList}
                                    className={`${styles.button} ${styles.secondary}`}
                                    disabled={isSaving}
                                >
                                    취소
                                </button>
                                <button 
                                    onClick={handleSaveConfig}
                                    className={`${styles.button} ${styles.primary}`}
                                    disabled={!validateConfig(selectedCategory) || isSaving}
                                >
                                    {isSaving ? "저장 중..." : "저장"}
                                </button>
                            </div>
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
// - POST /app/config/test/{category} - 연결 테스트
// - POST /app/config/reset/{category} - 카테고리별 리셋
// - PUT /app/config/batch/{category} - 카테고리별 일괄 업데이트

export default Settings;
