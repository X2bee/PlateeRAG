"use client";
import React, { useState, useEffect } from 'react';
import styles from '@/app/(canvas)/assets/WorkflowPanel.module.scss'; // WorkflowPanel 스타일 사용
import sideMenuStyles from '@/app/(canvas)/assets/SideMenu.module.scss'; // SideMenu 스타일 추가
import { LuArrowLeft, LuLayoutTemplate, LuDownload, LuPlay, LuCopy } from "react-icons/lu";
import TemplatePreview from '@/app/(canvas)/components/TemplatePreview';

// workflow 파일들 직접 import
import BasicChatbotTemplate from '@/app/(canvas)/constants/workflow/Basic_Chatbot.json';

const TemplatePanel = ({ onBack, onLoadWorkflow }) => {
    const [templates, setTemplates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [previewTemplate, setPreviewTemplate] = useState(null); // 미리보기 상태 추가

    // 실제 workflow 파일에서 템플릿 데이터 로드
    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const templateList = [
                    {
                        id: 'Basic_Chatbot',
                        name: 'Basic Chatbot',
                        description: 'Simple question-answer chatbot workflow using OpenAI',
                        category: 'AI',
                        nodes: BasicChatbotTemplate.nodes ? BasicChatbotTemplate.nodes.length : 0,
                        data: BasicChatbotTemplate
                    }
                    // 여기에 더 많은 템플릿을 추가할 수 있음
                ];

                setTemplates(templateList);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to load templates:', error);
                setTemplates([]);
                setIsLoading(false);
            }
        };

        loadTemplates();
    }, []);

    const handleUseTemplate = (template) => {
        console.log('Using template:', template);
        if (onLoadWorkflow && template.data) {
            // 템플릿 데이터를 워크플로우로 로드
            onLoadWorkflow(template.data, template.name);
        }
    };

    const handlePreviewTemplate = (template) => {
        console.log('Previewing template:', template);
        console.log('Setting previewTemplate state to:', template);
        setPreviewTemplate(template); // 미리보기 템플릿 설정
    };

    const handleClosePreview = () => {
        console.log('Closing preview');
        setPreviewTemplate(null); // 미리보기 닫기
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

    console.log('TemplatePanel render - previewTemplate:', previewTemplate);

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
                                    <LuCopy />
                                </button>
                                <button 
                                    className={styles.templateActionButton}
                                    onClick={() => handleUseTemplate(template)}
                                    title="Use Template"
                                >
                                    <LuPlay />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 템플릿 미리보기 팝업 */}
            {previewTemplate && (
                <TemplatePreview
                    template={previewTemplate}
                    onClose={handleClosePreview}
                    onUseTemplate={handleUseTemplate}
                />
            )}
        </div>
    );
};

export default TemplatePanel;
