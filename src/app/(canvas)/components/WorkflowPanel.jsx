"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from '@/app/(canvas)/assets/WorkflowPanel.module.scss';
import { LuArrowLeft, LuFolderOpen, LuDownload, LuRefreshCw, LuCalendar, LuTrash2 } from "react-icons/lu";
import { listWorkflows, loadWorkflow, deleteWorkflow } from '@/app/api/components/nodeApi';

const WorkflowPanel = ({ onBack, onLoad, onExport, onLoadWorkflow }) => {
    const [workflows, setWorkflows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchWorkflows = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const workflowList = await listWorkflows();
            setWorkflows(workflowList);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const handleRefresh = () => {
        fetchWorkflows();
        toast.success('워크플로우 새로고침 완료!');
    };

    const handleLoadWorkflow = async (filename) => {
        try {
            const workflowId = filename.replace('.json', '');
            const workflowData = await loadWorkflow(workflowId);
            
            if (onLoadWorkflow) {
                // 워크플로우 데이터와 함께 워크플로우 이름도 전달
                onLoadWorkflow(workflowData, workflowId);
            }
        } catch (error) {
            console.error("Failed to load workflow:", error);
            throw error;
        }
    };

    const handleDeleteWorkflow = async (filename) => {
        const workflowName = getWorkflowDisplayName(filename);
        
        const confirmToast = toast(
            (t) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontWeight: '600', color: '#dc3545', fontSize: '1rem' }}>
                        Delete Workflow
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.4' }}>
                        Are you sure you want to delete "<strong>{workflowName}</strong>"?
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

    const performDelete = async (filename, workflowName) => {
        const toastId = toast.loading(`Deleting "${workflowName}"...`);
        
        try {
            const workflowId = filename.replace('.json', '');
            await deleteWorkflow(workflowId);
            
            await fetchWorkflows();
            
            toast.success(`Workflow "${workflowName}" deleted successfully!`, { id: toastId });
        } catch (error) {
            console.error("Failed to delete workflow:", error);
            toast.error(`Failed to delete workflow: ${error.message}`, { id: toastId });
        }
    };

    const getWorkflowDisplayName = (filename) => {
        return filename.replace('.json', '');
    };

    const getFileSize = (filename) => {
        return "Unknown";
    };

    return (
        <div className={styles.workflowPanel}>
            <div className={styles.header}>
                <button onClick={onBack} className={styles.backButton}>
                    <LuArrowLeft />
                </button>
                <h2>Workflow</h2>
                <button 
                    onClick={handleRefresh} 
                    className={`${styles.refreshButton} ${isLoading ? styles.loading : ''}`}
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
                    <h3>Saved Workflows</h3>
                    <span className={styles.count}>({workflows.length})</span>
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
                        {workflows.map((filename, index) => (
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
