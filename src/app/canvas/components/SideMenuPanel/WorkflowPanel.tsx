"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from '@/app/canvas/assets/WorkflowPanel.module.scss';
import sideMenuStyles from '@/app/canvas/assets/SideMenu.module.scss';
import { LuArrowLeft, LuFolderOpen, LuDownload, LuRefreshCw, LuCalendar, LuTrash2 } from "react-icons/lu";
import { listWorkflows, loadWorkflow, deleteWorkflow } from '@/app/api/workflowAPI';
import { getWorkflowState } from '@/app/_common/utils/workflowStorage';
import { devLog } from '@/app/_common/utils/logger';
import type {
    WorkflowData,
    WorkflowState,
    WorkflowPanelProps
} from '@/app/canvas/types';

const WorkflowPanel: React.FC<WorkflowPanelProps> = ({ onBack, onLoad, onExport, onLoadWorkflow }) => {
    const [workflows, setWorkflows] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false); // 초기값을 false로 변경
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
        toast.success('워크플로우 새로고침 완료!');
    };

    const handleLoadWorkflow = async (filename: string): Promise<void> => {
        const currentState: WorkflowState | null = getWorkflowState();
        const hasCurrentWorkflow = currentState && ((currentState.nodes?.length || 0) > 0 || (currentState.edges?.length || 0) > 0);

        if (hasCurrentWorkflow) {
            const workflowName = getWorkflowDisplayName(filename);

            const confirmToast = toast(
                (t) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontWeight: '600', color: '#f59e0b', fontSize: '1rem' }}>
                            Load Workflow
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.4' }}>
                            You have an existing workflow with unsaved changes.
                            <br />
                            Loading &quot;<strong>{workflowName}</strong>&quot; will replace your current work.
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
                                onClick={async () => {
                                    toast.dismiss(t.id);
                                    await performLoadWorkflow(filename);
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
                                Load Anyway
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
            await performLoadWorkflow(filename);
        }
    };

    const performLoadWorkflow = async (filename: string): Promise<void> => {
        try {
            const workflowId = filename.replace('.json', '');
            const workflowData: WorkflowData = await loadWorkflow(workflowId);

            if (onLoadWorkflow) {
                // Pass workflow data along with workflow name
                onLoadWorkflow(workflowData, workflowId);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            devLog.error("Failed to load workflow:", error);
            toast.error(`Failed to load workflow: ${errorMessage}`);
        }
    };

    const handleDeleteWorkflow = async (filename: string): Promise<void> => {
        const workflowName = getWorkflowDisplayName(filename);

        const confirmToast = toast(
            (t) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontWeight: '600', color: '#dc3545', fontSize: '1rem' }}>
                        Delete Workflow
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.4' }}>
                        Are you sure you want to delete &quot;<strong>{workflowName}</strong>&quot;?
                        <br />
                        This action cannot be undone.
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
                            onClick={async () => {
                                toast.dismiss(t.id);
                                await performDelete(filename, workflowName);
                            }}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: '2px solid #b02a37',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                        >
                            Delete
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
    };

    const performDelete = async (filename: string, workflowName: string): Promise<void> => {
        const toastId = toast.loading(`Deleting "${workflowName}"...`);

        try {
            const workflowId = filename.replace('.json', '');
            await deleteWorkflow(workflowId);

            await fetchWorkflows();

            toast.success(`Workflow "${workflowName}" deleted successfully!`, { id: toastId });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            devLog.error("Failed to delete workflow:", error);
            toast.error(`Failed to delete workflow: ${errorMessage}`, { id: toastId });
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
