"use client";
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import Canvas from '@/app/(canvas)/components/Canvas';
import Header from '@/app/(canvas)/components/Header';
import SideMenu from '@/app/(canvas)/components/SideMenu';
import ExecutionPanel from '@/app/(canvas)/components/ExecutionPanel';

import styles from '@/app/(canvas)/assets/PlateeRAG.module.scss';

import { executeWorkflow, saveWorkflow, listWorkflows } from '@/app/api/components/nodeApi';
import { getWorkflowName } from '@/app/services/workflowStorage';

export default function Home() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [executionOutput, setExecutionOutput] = useState<any>(null);
    const [isExecuting, setIsExecuting] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !(menuRef.current as any).contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    const handleSave = async () => {
        if (!canvasRef.current) {
            toast.error("Canvas is not ready.");
            return;
        }

        const canvasState = (canvasRef.current as any).getCanvasState();
        const workflowName = getWorkflowName();
        
        if (!canvasState.nodes || canvasState.nodes.length === 0) {
            toast.error("Cannot save an empty workflow. Please add nodes.");
            return;
        }

        // 중복 확인을 위해 기존 워크플로우 목록 조회
        const checkToastId = toast.loading('Checking for existing workflows...');
        
        try {
            const existingWorkflows = await listWorkflows();
            const targetFilename = `${workflowName}.json`;
            const isDuplicate = existingWorkflows.includes(targetFilename);
            
            toast.dismiss(checkToastId);
            
            if (isDuplicate) {
                // 중복 발견 시 사용자에게 확인 요청
                const confirmToast = toast(
                    (t) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontWeight: '600', color: '#f59e0b' }}>
                                Workflow Already Exists
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                A workflow named "<strong>{workflowName}</strong>" already exists.
                                <br />
                                Do you want to overwrite it?
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => {
                                        toast.dismiss(t.id);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#f3f4f6',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        toast.dismiss(t.id);
                                        await performSave(workflowName, canvasState);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#f59e0b',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    Overwrite
                                </button>
                            </div>
                        </div>
                    ),
                    {
                        duration: Infinity,
                        style: {
                            maxWidth: '400px',
                            padding: '16px',
                        }
                    }
                );
            } else {
                // 중복이 없으면 바로 저장
                await performSave(workflowName, canvasState);
            }
            
        } catch (error: any) {
            toast.dismiss(checkToastId);
            console.error("Error checking existing workflows:", error);
            toast.error(`Failed to check existing workflows: ${error.message}`);
        }
    };

    const performSave = async (workflowName: string, canvasState: any) => {
        const toastId = toast.loading('Saving workflow...');

        try {
            const result = await saveWorkflow(workflowName, canvasState);
            toast.success(`Workflow '${workflowName}' saved successfully!`, { id: toastId });
        } catch (error: any) {
            console.error("Save failed:", error);
            toast.error(`Save failed: ${error.message}`, { id: toastId });
        }
    };

    const handleExport = () => {
        if (canvasRef.current) {
            const canvasState = (canvasRef.current as any).getCanvasState();
            const workflowName = getWorkflowName();
            const jsonString = JSON.stringify(canvasState, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${workflowName}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };

    const handleLoadWorkflow = async (workflowData: any) => {
        try {
            if (canvasRef.current) {
                (canvasRef.current as any).loadCanvasState(workflowData);
                toast.success('Workflow loaded successfully!');
            }
        } catch (error: any) {
            console.error("Error loading workflow:", error);
            toast.error(`Failed to load workflow: ${error.message}`);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const savedState = JSON.parse(json);
                if (canvasRef.current) {
                    (canvasRef.current as any).loadCanvasState(savedState);
                }
            } catch (error) {
                console.error("Error parsing JSON file:", error);
                alert("유효하지 않은 파일 형식입니다.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (canvasRef.current) {
            const nodeData = JSON.parse(e.dataTransfer.getData('application/json'));
            if (nodeData) {
                (canvasRef.current as any).addNode(nodeData, e.clientX, e.clientY);
            }
        }
    };

    const handleExecute = async () => {
        if (!canvasRef.current) {
            toast.error("Canvas is not ready.");
            return;
        }

        const validationResult = (canvasRef.current as any).validateAndPrepareExecution();
        if (validationResult.error) {
            toast.error(validationResult.error);
            return;
        }

        setIsExecuting(true);
        setExecutionOutput(null);
        const toastId = toast.loading('Executing workflow...');

        try {
            const workflowData = (canvasRef.current as any).getCanvasState();
            
            if (!workflowData.nodes || workflowData.nodes.length === 0) {
                throw new Error("Cannot execute an empty workflow. Please add nodes.");
            }
            
            const result = await executeWorkflow(workflowData);
            setExecutionOutput(result);
            toast.success('Workflow executed successfully!', { id: toastId });

        } catch (error: any) {
            console.error("Execution failed:", error);
            setExecutionOutput({ error: error.message });
            toast.error(`Execution failed: ${error.message}`, { id: toastId });
        } finally {
            setIsExecuting(false);
        }
    };

    const handleClearOutput = () => {
        setExecutionOutput(null);
    };

    return (
        <div
            className={styles.pageContainer}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <Header
                onMenuClick={() => setIsMenuOpen(prev => !prev)}
                onSave={handleSave}
                onLoad={handleLoadClick}
                onExport={handleExport}
            />
            <main className={styles.mainContent}>
                <Canvas ref={canvasRef} />
                {isMenuOpen && <SideMenu menuRef={menuRef} onLoad={handleLoadClick} onExport={handleExport} onLoadWorkflow={handleLoadWorkflow} />}
                <ExecutionPanel
                    onExecute={handleExecute}
                    onClear={handleClearOutput}
                    output={executionOutput}
                    isLoading={isExecuting}
                />
            </main>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleFileChange}
            />
        </div>
    );
}