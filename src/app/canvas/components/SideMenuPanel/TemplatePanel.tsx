"use client";
import React, { useState, useEffect } from 'react';
import styles from '@/app/canvas/assets/WorkflowPanel.module.scss';
import sideMenuStyles from '@/app/canvas/assets/SideMenu.module.scss';
import { LuArrowLeft, LuLayoutTemplate, LuPlay, LuCopy } from "react-icons/lu";
import TemplatePreview from '@/app/canvas/components/SideMenuPanel/TemplatePreview';
import { getWorkflowState } from '@/app/_common/utils/workflowStorage';
import { devLog } from '@/app/_common/utils/logger';
import {
    showWarningConfirmToastKo,
    showSuccessToastKo,
    showErrorToastKo
} from '@/app/_common/utils/toastUtilsKo';

import generate_marketing_API from '@/app/canvas/constants/workflow/generate_marketing_API.json'
import openai_test from '@/app/canvas/constants/workflow/openai_test.json'
import type {
    RawTemplate,
    Template,
    WorkflowState,
    TemplatePanelProps
} from '@/app/canvas/types';


const templateList: RawTemplate[] = [generate_marketing_API, openai_test];

const TemplatePanel: React.FC<TemplatePanelProps> = ({ onBack, onLoadWorkflow }) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

    useEffect(() => {
        const loadTemplates = async (): Promise<void> => {
            try {
                setIsLoading(true);

                devLog.log('templateList:', templateList);

                const formattedTemplates: Template[] = templateList.map((template: RawTemplate) => ({
                    id: template.workflow_id,
                    name: template.workflow_name,
                    description: template.description || 'No description available',
                    tags: template.tags || [],
                    nodes: template.contents?.nodes?.length || 0,
                    data: template.contents
                }));

                setTemplates(formattedTemplates);
                setIsLoading(false);
            } catch (error) {
                devLog.error('Failed to load templates:', error);
                setTemplates([]);
                setIsLoading(false);
            }
        };

        loadTemplates();
    }, []);

    const handleUseTemplate = (template: Template | null): void => {
        if (!template) return;

        const currentState: WorkflowState | null = getWorkflowState();
        const hasCurrentWorkflow = currentState && ((currentState.nodes?.length || 0) > 0 || (currentState.edges?.length || 0) > 0);

        if (hasCurrentWorkflow) {
            showWarningConfirmToastKo({
                title: '템플릿 사용',
                message: `현재 저장되지 않은 변경사항이 있는 워크플로우가 있습니다.\n"${template.name}" 템플릿 사용 시 현재 작업이 대체됩니다.`,
                onConfirm: () => {
                    performUseTemplate(template);
                },
                confirmText: '템플릿 사용',
                cancelText: '취소',
            });
        } else {
            performUseTemplate(template);
        }
    };

    const performUseTemplate = (template: Template): void => {
        devLog.log('=== TemplatePanel performUseTemplate called ===');
        devLog.log('Template:', template);
        devLog.log('onLoadWorkflow exists:', !!onLoadWorkflow);
        devLog.log('Template data exists:', !!template?.data);

        if (onLoadWorkflow && template.data) {
            devLog.log('Calling onLoadWorkflow with:', template.data, template.name);
            onLoadWorkflow(template.data, template.name);
            devLog.log('onLoadWorkflow call completed');
            showSuccessToastKo(`템플릿 "${template.name}"이(가) 성공적으로 로드되었습니다!`);
        } else {
            devLog.error('Cannot call onLoadWorkflow:', {
                hasOnLoadWorkflow: !!onLoadWorkflow,
                hasTemplateData: !!template?.data
            });
            showErrorToastKo('템플릿 로드에 실패했습니다');
        }
    };

    const handlePreviewTemplate = (template: Template): void => {
        devLog.log('Previewing template:', template);
        devLog.log('Setting previewTemplate state to:', template);
        setPreviewTemplate(template);
    };

    const handleClosePreview = (): void => {
        devLog.log('Closing preview');
        setPreviewTemplate(null);
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

    devLog.log('TemplatePanel render - previewTemplate:', previewTemplate);

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
                    {templates.map((template: Template) => (
                        <div key={template.id} className={styles.templateItem}>
                            <div className={styles.templateHeader}>
                                <div className={styles.templateIcon}>
                                    <LuLayoutTemplate />
                                </div>
                                <div className={styles.templateInfo}>
                                    <h4 className={styles.templateName}>{template.name}</h4>
                                    <p className={styles.templateDescription}>
                                        {template.description && template.description.length > 20
                                            ? `${template.description.substring(0, 20)}...`
                                            : template.description
                                        }
                                    </p>
                                    <div className={styles.templateMeta}>
                                        <div className={styles.templateTags}>
                                            {template.tags && template.tags.slice(0, 2).map((tag: string) => (
                                                <span key={tag} className={styles.templateCategory}>
                                                    {tag}
                                                </span>
                                            ))}
                                            {template.tags && template.tags.length > 2 && (
                                                <span className={styles.templateCategory}>
                                                    +{template.tags.length - 2}
                                                </span>
                                            )}
                                        </div>
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

            {/* Template preview popup */}
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
