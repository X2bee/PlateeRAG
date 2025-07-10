"use client";
import React, { useState } from "react";
import { FiChevronRight, FiSettings, FiCheck, FiX } from "react-icons/fi";
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
        setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
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
                            className={`${styles.categoryCard} ${selectedCategory === category.id ? styles.active : ""}`}
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
                                    <FiChevronRight className={`${styles.chevron} ${selectedCategory === category.id ? styles.expanded : ""}`} />
                                </div>
                            </div>
                        </div>

                        {/* Configuration Panel */}
                        {selectedCategory === category.id && (
                            <div className={styles.configPanel}>
                                {/* 여기에 각 카테고리별 설정 폼이 들어갑니다 */}
                                <div className={styles.configContent}>
                                    <h4>{category.name} 설정</h4>
                                    <p>설정 폼이 여기에 표시됩니다 (다음 단계에서 구현)</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Settings;
