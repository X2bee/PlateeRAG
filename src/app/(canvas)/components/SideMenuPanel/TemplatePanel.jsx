"use client";
import React, { useState, useEffect } from 'react';
import styles from '@/app/(canvas)/assets/WorkflowPanel.module.scss'; // WorkflowPanel 스타일 사용
import sideMenuStyles from '@/app/(canvas)/assets/SideMenu.module.scss'; // SideMenu 스타일 추가
import { LuArrowLeft, LuLayoutTemplate, LuDownload, LuPlay, LuCopy } from "react-icons/lu";

const TemplatePanel = ({ onBack }) => {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 모의 템플릿 데이터 (실제로는 API에서 가져올 수 있음)
    useEffect(() => {
        const mockTemplates = [
            {
                id: 'basic-chat',
                name: 'Basic Chatbot',
                description: 'Simple question-answer chatbot workflow',
                category: 'AI',
                nodes: 3
            },
            {
                id: 'data-processing',
                name: 'Data Processing Pipeline',
                description: 'Process and transform data through multiple stages',
                category: 'Data',
                nodes: 5
            },
            {
                id: 'image-analysis',
                name: 'Image Analysis',
                description: 'Analyze and classify images using AI models',
                category: 'Vision',
                nodes: 4
            },
            {
                id: 'text-summarization',
                name: 'Text Summarization',
                description: 'Summarize long text documents automatically',
                category: 'NLP',
                nodes: 3
            }
        ];

        // 로딩 시뮬레이션
        setTimeout(() => {
            setTemplates(mockTemplates);
            setIsLoading(false);
        }, 500);
    }, []);

    const handleUseTemplate = (template) => {
        console.log('Using template:', template);
        // TODO: 템플릿을 캔버스에 로드하는 로직 구현
    };

    const handlePreviewTemplate = (template) => {
        console.log('Previewing template:', template);
        // TODO: 템플릿 미리보기 기능 구현
    };

    if (isLoading) {
        return (
            <div className={styles.workflowPanel}>
                <div className={sideMenuStyles.header}>
                    <button onClick={onBack} className={sideMenuStyles.backButton}>
                        <LuArrowLeft />
                    </button>
                    <h3>Templates</h3>
                </div>
                <div className={styles.loadingState}>
                    <LuLayoutTemplate className={styles.spinIcon} />
                    <span>Loading templates...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.workflowPanel}>
            <div className={sideMenuStyles.header}>
                <button onClick={onBack} className={sideMenuStyles.backButton}>
                    <LuArrowLeft />
                </button>
                <h3>Templates</h3>
            </div>

            <div className={styles.workflowList}>
                <div className={styles.listHeader}>
                    <h3>📁 Available Templates</h3>
                    <span className={styles.count}>{templates.length}</span>
                </div>

                <div className={styles.templateList}>
                    {templates.map(template => (
                        <div key={template.id} className={styles.templateItem}>
                            <div className={styles.templateHeader}>
                                <div className={styles.templateIcon}>
                                    <LuLayoutTemplate />
                                </div>
                                <div className={styles.templateInfo}>
                                    <h4 className={styles.templateName}>{template.name}</h4>
                                    <p className={styles.templateDescription}>{template.description}</p>
                                    <div className={styles.templateMeta}>
                                        <span className={styles.templateCategory}>{template.category}</span>
                                        <span className={styles.templateNodes}>{template.nodes} nodes</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.templateActions}>
                                <button 
                                    className={styles.templateActionButton}
                                    onClick={() => handlePreviewTemplate(template)}
                                    title="Preview Template"
                                >
                                    <LuPlay />
                                </button>
                                <button 
                                    className={styles.templateActionButton}
                                    onClick={() => handleUseTemplate(template)}
                                    title="Use Template"
                                >
                                    <LuCopy />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TemplatePanel;
