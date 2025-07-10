"use client";
import React, { useState } from "react";
import { FiChevronRight, FiSettings, FiCheck, FiX, FiArrowLeft } from "react-icons/fi";
import { SiOpenai, SiGoogle, SiPostgresql, SiMongodb, SiAmazon } from "react-icons/si";
import { FiCloud } from "react-icons/fi";
import styles from "@/app/main/assets/Settings.module.scss";

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
}

const Settings: React.FC = () => {
    const [currentView, setCurrentView] = useState<"list" | "detail">("list");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [configs, setConfigs] = useState<Record<string, ApiConfig>>({});

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
            status: configs.aws?.apiKey ? "connected" : "disconnected"
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

    const handleTestConnection = (categoryId: string) => {
        // 실제 구현에서는 API 연결 테스트를 수행
        console.log(`Testing connection for ${categoryId}`, configs[categoryId]);
        // 임시로 상태 업데이트
        alert(`${categoryId} 연결 테스트 (실제 구현 예정)`);
    };

    const renderOpenAIConfig = () => {
        const config = configs.openai || {};
        return (
            <div className={styles.configForm}>
                <div className={styles.formGroup}>
                    <label>API Key</label>
                    <input
                        type="password"
                        value={config.apiKey || ""}
                        onChange={(e) => handleConfigChange("openai", "apiKey", e.target.value)}
                        placeholder="sk-..."
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>모델</label>
                    <select
                        value={config.model || "gpt-4"}
                        onChange={(e) => handleConfigChange("openai", "model", e.target.value)}
                    >
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <label>Temperature (0-2)</label>
                    <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={config.temperature || 0.7}
                        onChange={(e) => handleConfigChange("openai", "temperature", parseFloat(e.target.value))}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>Max Tokens</label>
                    <input
                        type="number"
                        value={config.maxTokens || 4096}
                        onChange={(e) => handleConfigChange("openai", "maxTokens", parseInt(e.target.value))}
                    />
                </div>
            </div>
        );
    };

    const renderGoogleConfig = () => {
        const config = configs.google || {};
        return (
            <div className={styles.configForm}>
                <div className={styles.formGroup}>
                    <label>API Key</label>
                    <input
                        type="password"
                        value={config.apiKey || ""}
                        onChange={(e) => handleConfigChange("google", "apiKey", e.target.value)}
                        placeholder="Google AI API Key"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>모델</label>
                    <select
                        value={config.model || "gemini-pro"}
                        onChange={(e) => handleConfigChange("google", "model", e.target.value)}
                    >
                        <option value="gemini-pro">Gemini Pro</option>
                        <option value="gemini-pro-vision">Gemini Pro Vision</option>
                        <option value="text-bison">PaLM Text Bison</option>
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <label>Endpoint (선택사항)</label>
                    <input
                        type="url"
                        value={config.endpoint || ""}
                        onChange={(e) => handleConfigChange("google", "endpoint", e.target.value)}
                        placeholder="https://generativelanguage.googleapis.com"
                    />
                </div>
            </div>
        );
    };

    const renderDatabaseConfig = (categoryId: string) => {
        const config = configs[categoryId] || {};
        return (
            <div className={styles.configForm}>
                <div className={styles.formGroup}>
                    <label>호스트</label>
                    <input
                        type="text"
                        value={config.host || ""}
                        onChange={(e) => handleConfigChange(categoryId, "host", e.target.value)}
                        placeholder="localhost"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>포트</label>
                    <input
                        type="number"
                        value={config.port || (categoryId === "postgresql" ? 5432 : 27017)}
                        onChange={(e) => handleConfigChange(categoryId, "port", parseInt(e.target.value))}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>데이터베이스 이름</label>
                    <input
                        type="text"
                        value={config.database || ""}
                        onChange={(e) => handleConfigChange(categoryId, "database", e.target.value)}
                        placeholder="database_name"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>사용자명</label>
                    <input
                        type="text"
                        value={config.username || ""}
                        onChange={(e) => handleConfigChange(categoryId, "username", e.target.value)}
                        placeholder="username"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>비밀번호</label>
                    <input
                        type="password"
                        value={config.password || ""}
                        onChange={(e) => handleConfigChange(categoryId, "password", e.target.value)}
                        placeholder="password"
                    />
                </div>
            </div>
        );
    };

    const renderCloudConfig = (categoryId: string) => {
        const config = configs[categoryId] || {};
        return (
            <div className={styles.configForm}>
                <div className={styles.formGroup}>
                    <label>액세스 키</label>
                    <input
                        type="password"
                        value={config.apiKey || ""}
                        onChange={(e) => handleConfigChange(categoryId, "apiKey", e.target.value)}
                        placeholder="액세스 키"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>엔드포인트</label>
                    <input
                        type="url"
                        value={config.endpoint || ""}
                        onChange={(e) => handleConfigChange(categoryId, "endpoint", e.target.value)}
                        placeholder="서비스 엔드포인트"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>리전 (선택사항)</label>
                    <input
                        type="text"
                        value={config.model || ""}
                        onChange={(e) => handleConfigChange(categoryId, "model", e.target.value)}
                        placeholder="us-east-1"
                    />
                </div>
            </div>
        );
    };

    const renderConfigForm = (categoryId: string) => {
        switch (categoryId) {
            case "openai":
                return renderOpenAIConfig();
            case "google":
                return renderGoogleConfig();
            case "postgresql":
            case "mongodb":
                return renderDatabaseConfig(categoryId);
            case "aws":
            case "azure":
                return renderCloudConfig(categoryId);
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
                        <h2>환경 설정</h2>
                        <p>워크플로우에서 사용할 AI 모델과 데이터베이스를 설정하세요.</p>
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
                                    onClick={() => handleTestConnection(selectedCategory)}
                                    className={`${styles.button} ${styles.test}`}
                                >
                                    연결 테스트
                                </button>
                                <button 
                                    onClick={handleBackToList}
                                    className={`${styles.button} ${styles.secondary}`}
                                >
                                    취소
                                </button>
                                <button 
                                    className={`${styles.button} ${styles.primary}`}
                                >
                                    저장
                                </button>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default Settings;
