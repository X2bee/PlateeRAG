"use client";
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import Canvas from '@/app/(canvas)/components/Canvas';
import Header from '@/app/(canvas)/components/Header';
import SideMenu from '@/app/(canvas)/components/SideMenu';
import ExecutionPanel from '@/app/(canvas)/components/ExecutionPanel';

import styles from '@/app/(canvas)/assets/PlateeRAG.module.scss';

import { executeWorkflow, saveWorkflow, listWorkflows } from '@/app/api/components/nodeApi';
import { getWorkflowName, getWorkflowState, saveWorkflowState, clearWorkflowState, isValidWorkflowState, ensureValidWorkflowState, saveWorkflowName } from '@/app/services/workflowStorage';

export default function Home() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [executionOutput, setExecutionOutput] = useState<any>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentWorkflowName, setCurrentWorkflowName] = useState('Workflow');

    // 컴포넌트 마운트 시 워크플로우 이름과 상태 복원
    useEffect(() => {
        // 저장된 워크플로우 이름 복원
        const savedName = getWorkflowName();
        setCurrentWorkflowName(savedName);

        // 저장된 워크플로우 상태 복원
        const restoreWorkflowState = () => {
            const savedState = getWorkflowState();
            if (savedState && canvasRef.current) {
                try {
                    const validState = ensureValidWorkflowState(savedState);
                    if (validState) {
                        (canvasRef.current as any).loadWorkflowState(validState);
                        console.log('Workflow state restored from localStorage', validState);
                    }
                } catch (error) {
                    console.warn('Failed to restore workflow state:', error);
                }
            }
        };

        // Canvas가 준비된 후 상태 복원
        const timer = setTimeout(restoreWorkflowState, 100);
        return () => clearTimeout(timer);
    }, []);

    // 워크플로우 상태 변경 시 자동 저장
    const handleCanvasStateChange = (state: any) => {
        try {
            // 상태가 있으면 저장 (view 정보도 포함)
            if (state) {
                saveWorkflowState(state);
            }
        } catch (error) {
            console.warn('Failed to auto-save workflow state:', error);
        }
    };

    // 워크플로우 이름 업데이트 헬퍼 함수
    const updateWorkflowName = (newName: string) => {
        setCurrentWorkflowName(newName);
        saveWorkflowName(newName);
    };

    // Header에서 워크플로우 이름 직접 편집 시 호출될 핸들러
    const handleWorkflowNameChange = (newName: string) => {
        setCurrentWorkflowName(newName);
        // localStorage 저장은 Header에서 이미 처리하므로 중복 저장 방지
    };

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

        try {
            // 백그라운드에서 중복 확인 (로딩 메시지 없이)
            const existingWorkflows = await listWorkflows();
            const targetFilename = `${workflowName}.json`;
            const isDuplicate = existingWorkflows.includes(targetFilename);
            
            if (isDuplicate) {
                // 중복 발견 시 사용자에게 확인 요청
                const confirmToast = toast(
                    (t) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontWeight: '600', color: '#f59e0b', fontSize: '1rem' }}>
                                Workflow Already Exists
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: '1.4' }}>
                                A workflow named "<strong>{workflowName}</strong>" already exists.
                                <br />
                                Do you want to overwrite it?
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
                                    onMouseOver={(e) => {
                                        (e.target as HTMLButtonElement).style.backgroundColor = '#f9fafb';
                                        (e.target as HTMLButtonElement).style.borderColor = '#4b5563';
                                    }}
                                    onMouseOut={(e) => {
                                        (e.target as HTMLButtonElement).style.backgroundColor = '#ffffff';
                                        (e.target as HTMLButtonElement).style.borderColor = '#6b7280';
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
                                    onMouseOver={(e) => {
                                        (e.target as HTMLButtonElement).style.backgroundColor = '#d97706';
                                        (e.target as HTMLButtonElement).style.borderColor = '#b45309';
                                    }}
                                    onMouseOut={(e) => {
                                        (e.target as HTMLButtonElement).style.backgroundColor = '#f59e0b';
                                        (e.target as HTMLButtonElement).style.borderColor = '#d97706';
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
                // 중복이 없으면 바로 저장
                await performSave(workflowName, canvasState);
            }
            
        } catch (error: any) {
            console.error("Error checking existing workflows:", error);
            // 중복 확인 실패 시에도 저장 시도 (graceful fallback)
            toast.error(`Warning: Could not check for duplicates. Proceeding with save...`);
            setTimeout(async () => {
                await performSave(workflowName, canvasState);
            }, 1000);
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

    const handleLoadWorkflow = async (workflowData: any, workflowName?: string) => {
        try {
            if (canvasRef.current) {
                const validState = ensureValidWorkflowState(workflowData);
                (canvasRef.current as any).loadCanvasState(validState);
                // 새로운 워크플로우 로드 시 로컬 스토리지 상태 업데이트
                saveWorkflowState(validState);
                
                // 워크플로우 이름이 제공된 경우 업데이트
                if (workflowName) {
                    updateWorkflowName(workflowName);
                }
                
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
                    const validState = ensureValidWorkflowState(savedState);
                    (canvasRef.current as any).loadCanvasState(validState);
                    // 파일에서 로드 시 로컬 스토리지 상태 업데이트
                    saveWorkflowState(validState);
                    
                    // 파일명에서 워크플로우 이름 추출 (.json 확장자 제거)
                    const workflowName = file.name.replace(/\.json$/i, '');
                    updateWorkflowName(workflowName);
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
                workflowName={currentWorkflowName}
                onWorkflowNameChange={handleWorkflowNameChange}
            />
            <main className={styles.mainContent}>
                <Canvas ref={canvasRef} onStateChange={handleCanvasStateChange} />
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