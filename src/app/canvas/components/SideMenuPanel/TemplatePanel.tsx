"use client";
import React, { useState, useEffect } from 'react';
import styles from '@/app/canvas/assets/WorkflowPanel.module.scss';
import sideMenuStyles from '@/app/canvas/assets/SideMenu.module.scss';
import { LuArrowLeft, LuLayoutTemplate, LuPlay, LuCopy } from "react-icons/lu";
import WorkflowStoreDetailModal from '@/app/main/workflowSection/components/workflows/WorkflowStoreDetailModal';
import { getWorkflowState } from '@/app/_common/utils/workflowStorage';
import { devLog } from '@/app/_common/utils/logger';
import {
    showWarningConfirmToastKo,
    showSuccessToastKo,
    showErrorToastKo
} from '@/app/_common/utils/toastUtilsKo';
import { listWorkflowStore } from '@/app/_common/api/workflow/workflowStoreAPI';
import type {
    WorkflowState,
    TemplatePanelProps
} from '@/app/canvas/types';

interface Workflow {
    id: number;
    created_at: string;
    updated_at: string;
    current_version: number;
    description: string;
    edge_count: number;
    full_name?: string;
    has_endnode: boolean;
    has_startnode: boolean;
    is_completed: boolean;
    is_template: boolean;
    latest_version: number;
    metadata?: any;
    workflow_data?: any;
    node_count: number;
    tags?: string[] | null;
    user_id?: number;
    username?: string;
    workflow_id: string;
    workflow_name: string;
    workflow_upload_name: string;
}


const TemplatePanel: React.FC<TemplatePanelProps> = ({ onBack, onLoadWorkflow }) => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const loadTemplates = async (): Promise<void> => {
            try {
                setIsLoading(true);

                devLog.log('Loading template workflows from store');

                // listWorkflowStore API 호출하여 is_template=true인 워크플로우만 필터링
                const workflowList = await listWorkflowStore();
                const templates = (workflowList as Workflow[]).filter((workflow) => workflow.is_template === true);

                setWorkflows(templates);
                setIsLoading(false);

                devLog.log(`Loaded ${templates.length} template workflows`);
            } catch (error) {
                devLog.error('Failed to load templates:', error);
                setWorkflows([]);
                setIsLoading(false);
            }
        };

        loadTemplates();
    }, []);

    const handleWorkflowClick = (e: React.MouseEvent, workflow: Workflow): void => {
        // Canvas로 이벤트 전파 차단
        e.stopPropagation();
        e.preventDefault();

        devLog.log('Opening template detail modal:', workflow);
        setSelectedWorkflow(workflow);
        setIsModalOpen(true);
    };

    const handleCloseModal = (): void => {
        devLog.log('Closing template modal');
        setIsModalOpen(false);
        setSelectedWorkflow(null);
    };

    const handleCopyWorkflowFromModal = (workflow: Workflow): void => {
        devLog.log('=== TemplatePanel handleCopyWorkflowFromModal called ===');
        devLog.log('Workflow:', workflow);
        devLog.log('onLoadWorkflow exists:', !!onLoadWorkflow);
        devLog.log('Workflow data exists:', !!workflow?.workflow_data);

        // 모달 먼저 닫기 (확인 다이얼로그 전에)
        handleCloseModal();

        const currentState: WorkflowState | null = getWorkflowState();
        const hasCurrentWorkflow = currentState && ((currentState.nodes?.length || 0) > 0 || (currentState.edges?.length || 0) > 0);

        if (hasCurrentWorkflow) {
            showWarningConfirmToastKo({
                title: '템플릿 사용',
                message: `현재 저장되지 않은 변경사항이 있는 워크플로우가 있습니다.\n"${workflow.workflow_upload_name}" 템플릿 사용 시 현재 작업이 대체됩니다.`,
                onConfirm: () => {
                    performLoadTemplate(workflow);
                },
                confirmText: '템플릿 사용',
                cancelText: '취소',
            });
        } else {
            performLoadTemplate(workflow);
        }
    };

    const performLoadTemplate = (workflow: Workflow): void => {
        try {
            if (onLoadWorkflow && workflow.workflow_data) {
                // workflow_data가 문자열인 경우 파싱
                let workflowData = workflow.workflow_data;
                if (typeof workflowData === 'string') {
                    try {
                        workflowData = JSON.parse(workflowData);
                        devLog.log('Parsed workflow_data from string');
                    } catch (e) {
                        devLog.error('Failed to parse workflow_data:', e);
                        showErrorToastKo('워크플로우 데이터 파싱에 실패했습니다');
                        return;
                    }
                }

                devLog.log('Calling onLoadWorkflow with:', workflowData, workflow.workflow_upload_name);
                devLog.log('View data:', workflowData.view);

                // 약간의 딜레이 후 워크플로우 로드
                setTimeout(() => {
                    onLoadWorkflow(workflowData, workflow.workflow_upload_name);
                    devLog.log('onLoadWorkflow call completed');
                    showSuccessToastKo(`템플릿 "${workflow.workflow_upload_name}"이(가) 성공적으로 로드되었습니다!`);

                    // 사이드 패널도 닫기
                    onBack();
                }, 100);
            } else {
                devLog.error('Cannot call onLoadWorkflow:', {
                    hasOnLoadWorkflow: !!onLoadWorkflow,
                    hasWorkflowData: !!workflow?.workflow_data
                });
                showErrorToastKo('템플릿 로드에 실패했습니다');
            }
        } catch (error) {
            devLog.error('Error loading template:', error);
            showErrorToastKo('템플릿 로드 중 오류가 발생했습니다');
        }
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
                    <span className={styles.count}>{workflows.length}</span>
                </div>

                <div className={styles.templateList}>
                    {workflows.map((workflow: Workflow) => (
                        <div key={workflow.id} className={styles.templateItem}>
                            <div className={styles.templateHeader}>
                                <div className={styles.templateIcon}>
                                    <LuLayoutTemplate />
                                </div>
                                <div className={styles.templateInfo}>
                                    <h4 className={styles.templateName}>{workflow.workflow_upload_name}</h4>
                                    <p className={styles.templateDescription}>
                                        {workflow.description && workflow.description.length > 20
                                            ? `${workflow.description.substring(0, 20)}...`
                                            : workflow.description
                                        }
                                    </p>
                                    <div className={styles.templateMeta}>
                                        <div className={styles.templateTags}>
                                            {workflow.tags && workflow.tags.slice(0, 2).map((tag: string) => (
                                                <span key={tag} className={styles.templateCategory}>
                                                    {tag}
                                                </span>
                                            ))}
                                            {workflow.tags && workflow.tags.length > 2 && (
                                                <span className={styles.templateCategory}>
                                                    +{workflow.tags.length - 2}
                                                </span>
                                            )}
                                        </div>
                                        <span className={styles.templateNodes}>{workflow.node_count} nodes</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.templateActions}>
                                <button
                                    className={styles.templateActionButton}
                                    onClick={(e) => handleWorkflowClick(e, workflow)}
                                    title="Preview Template"
                                >
                                    <LuCopy />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Template detail modal */}
            {selectedWorkflow && (
                <WorkflowStoreDetailModal
                    workflow={selectedWorkflow}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onCopy={handleCopyWorkflowFromModal}
                />
            )}
        </div>
    );
};

export default TemplatePanel;
