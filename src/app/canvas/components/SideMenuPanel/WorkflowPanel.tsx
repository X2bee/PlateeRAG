"use client";
import React, { useState, useEffect } from 'react';
import styles from '@/app/canvas/assets/WorkflowPanel.module.scss';
import sideMenuStyles from '@/app/canvas/assets/SideMenu.module.scss';
import { LuArrowLeft, LuFolderOpen, LuDownload, LuRefreshCw, LuCalendar, LuTrash2 } from "react-icons/lu";
import { listWorkflows, loadWorkflow, deleteWorkflow } from '@/app/api/workflow/workflowAPI';
import { getWorkflowState } from '@/app/_common/utils/workflowStorage';
import { devLog } from '@/app/_common/utils/logger';
import {
    showWorkflowDeleteConfirmKo,
    showDeleteSuccessToastKo,
    showDeleteErrorToastKo,
    showWarningConfirmToastKo,
    showSuccessToastKo,
    showErrorToastKo,
    showLoadingToastKo,
    dismissToastKo
} from '@/app/_common/utils/toastUtilsKo';
import type {
    WorkflowData,
    WorkflowState,
    WorkflowPanelProps
} from '@/app/canvas/types';

const WorkflowPanel: React.FC<WorkflowPanelProps> = ({ onBack, onLoad, onExport, onLoadWorkflow }) => {
    const [workflows, setWorkflows] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    const fetchWorkflows = async (): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const workflowList: string[] = await listWorkflows();
            setWorkflows(workflowList);
            setIsInitialized(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // 패널이 열릴 때만 데이터 로드 (지연 로딩)
    useEffect(() => {
        if (!isInitialized) {
            fetchWorkflows();
        }
    }, []); // 한 번만 실행

    const handleRefresh = (): void => {
        fetchWorkflows();
        showSuccessToastKo('워크플로우 새로고침 완료!');
    };

    const handleLoadWorkflow = async (filename: string): Promise<void> => {
        const currentState: WorkflowState | null = getWorkflowState();
        const hasCurrentWorkflow = currentState && ((currentState.nodes?.length || 0) > 0 || (currentState.edges?.length || 0) > 0);

        if (hasCurrentWorkflow) {
            const workflowName = getWorkflowDisplayName(filename);

            showWarningConfirmToastKo({
                title: '워크플로우 로드',
                message: `현재 저장되지 않은 변경사항이 있는 워크플로우가 있습니다.\n"${workflowName}" 로드 시 현재 작업이 대체됩니다.`,
                onConfirm: async () => {
                    await performLoadWorkflow(filename);
                },
                confirmText: '로드',
                cancelText: '취소',
            });
        } else {
            await performLoadWorkflow(filename);
        }
    };

    const performLoadWorkflow = async (filename: string): Promise<void> => {
        try {
            const workflowName = filename.replace('.json', '');
            const workflowData: WorkflowData = await loadWorkflow(workflowName, null);

            if (onLoadWorkflow) {
                // Pass workflow data along with workflow name
                onLoadWorkflow(workflowData, workflowName);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            devLog.error("Failed to load workflow:", error);
            showErrorToastKo(`워크플로우 로드 실패: ${errorMessage}`);
        }
    };

    const handleDeleteWorkflow = async (filename: string): Promise<void> => {
        const workflowName = getWorkflowDisplayName(filename);

        showWorkflowDeleteConfirmKo(
            workflowName,
            async () => {
                await performDelete(filename, workflowName);
            }
        );
    };

    const performDelete = async (filename: string, workflowName: string): Promise<void> => {
        const toastId = showLoadingToastKo(`"${workflowName}" 삭제 중...`);

        try {
            const workflowId = filename.replace('.json', '');
            await deleteWorkflow(workflowId);
            await fetchWorkflows();

            dismissToastKo(toastId);
            showDeleteSuccessToastKo({
                itemName: workflowName,
                itemType: '워크플로우',
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            devLog.error("Failed to delete workflow:", error);

            dismissToastKo(toastId);
            showDeleteErrorToastKo({
                itemName: workflowName,
                itemType: '워크플로우',
                error: errorMessage,
            });
        }
    };

    const getWorkflowDisplayName = (filename: string): string => {
        return filename.replace('.json', '');
    };

    const getFileSize = (filename: string): string => {
        return "Unknown";
    };

    return (
        <div className={styles.workflowPanel}>
            <div className={sideMenuStyles.header}>
                <button onClick={onBack} className={sideMenuStyles.backButton}>
                    <LuArrowLeft />
                </button>
                <h3>Workflow</h3>
                <button
                    onClick={handleRefresh}
                    className={`${sideMenuStyles.refreshButton} ${isLoading ? sideMenuStyles.loading : ''}`}
                    disabled={isLoading}
                    title="Refresh Workflow List"
                >
                    <LuRefreshCw />
                </button>
            </div>

            <div className={styles.actionButtons}>
                <button onClick={onLoad} className={styles.actionButton}>
                    <LuFolderOpen />
                    <span>Load from Local</span>
                </button>
                <button onClick={onExport} className={styles.actionButton}>
                    <LuDownload />
                    <span>Export to Local</span>
                </button>
            </div>

            <div className={styles.workflowList}>
                <div className={styles.listHeader}>
                    <h3>📁 Saved Workflows</h3>
                    <span className={styles.count}>{workflows.length}</span>
                </div>

                {isLoading && (
                    <div className={styles.loadingState}>
                        <LuRefreshCw className={styles.spinIcon} />
                        <span>Loading workflows...</span>
                    </div>
                )}

                {error && (
                    <div className={styles.errorState}>
                        <span>Error: {error}</span>
                        <button onClick={handleRefresh} className={styles.retryButton}>
                            Try Again
                        </button>
                    </div>
                )}

                {!isLoading && !error && workflows.length === 0 && (
                    <div className={styles.emptyState}>
                        <LuCalendar />
                        <span>No workflows found</span>
                        <p>Save a workflow to see it here</p>
                    </div>
                )}

                {!isLoading && !error && workflows.length > 0 && (
                    <div className={styles.workflowItems}>
                        {workflows.map((filename: string, index: number) => (
                            <div key={index} className={styles.workflowItem}>
                                <div className={styles.workflowInfo}>
                                    <div className={styles.workflowName}>
                                        {getWorkflowDisplayName(filename)}
                                    </div>
                                </div>
                                <div className={styles.workflowActions}>
                                    <button
                                        className={styles.loadButton}
                                        title={`Load ${getWorkflowDisplayName(filename)}`}
                                        onClick={() => handleLoadWorkflow(filename)}
                                    >
                                        Load
                                    </button>
                                    <button
                                        className={styles.deleteButton}
                                        title={`Delete ${getWorkflowDisplayName(filename)}`}
                                        onClick={() => handleDeleteWorkflow(filename)}
                                    >
                                        <LuTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkflowPanel;
