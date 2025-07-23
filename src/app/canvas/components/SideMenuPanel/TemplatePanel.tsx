"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from '@/app/canvas/assets/WorkflowPanel.module.scss';
import sideMenuStyles from '@/app/canvas/assets/SideMenu.module.scss';
import { LuArrowLeft, LuLayoutTemplate, LuPlay, LuCopy } from "react-icons/lu";
import TemplatePreview from '@/app/canvas/components/SideMenuPanel/TemplatePreview';
import { getWorkflowState } from '@/app/_common/utils/workflowStorage';
import { devLog } from '@/app/_common/utils/logger';

import Basic_Chatbot from '@/app/canvas/constants/workflow/Basic_Chatbot.json';
import Data_Processing from '@/app/canvas/constants/workflow/Data_Processing.json';
import type {
    Position,
    Port,
    Parameter,
    NodeData,
    CanvasNode,
    EdgeConnection,
    CanvasEdge,
    WorkflowData,
    RawTemplate,
    Template,
    WorkflowState,
    TemplatePanelProps
} from '@/app/canvas/types';


const templateList: RawTemplate[] = [Basic_Chatbot, Data_Processing];

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
            const confirmToast = toast(
                (t) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontWeight: '600', color: '#f59e0b', fontSize: '1rem' }}>
                            Use Template
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.4' }}>
                            You have an existing workflow with unsaved changes.
                            <br />
                            Using &quot;<strong>{template.name}</strong>&quot; template will replace your current work.
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <button
                                onClick={() => {
                                    toast.dismiss(t.id);
                                }}
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
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    performUseTemplate(template);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#f59e0b',
                                    color: 'white',
                                    border: '2px solid #d97706',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}
                            >
                                Use Template
                            </button>
                        </div>
                    </div>
                ),
                {
                    duration: Infinity,
                    style: {
                        maxWidth: '420px',
                        padding: '20px',
                        backgroundColor: '#f9fafb',
                        border: '2px solid #374151',
                        borderRadius: '12px',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                        color: '#374151',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }
                }
            );
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
            toast.success(`Template "${template.name}" loaded successfully!`);
        } else {
            devLog.error('Cannot call onLoadWorkflow:', {
                hasOnLoadWorkflow: !!onLoadWorkflow,
                hasTemplateData: !!template?.data
            });
            toast.error('Failed to load template');
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
