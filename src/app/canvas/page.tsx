'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Canvas from '@/app/canvas/components/Canvas';
import Header from '@/app/canvas/components/Header';
import SideMenu from '@/app/canvas/components/SideMenu';
import ExecutionPanel from '@/app/canvas/components/ExecutionPanel';
import AuthGuard from '@/app/_common/components/AuthGuard';
import { DeploymentModal } from '@/app/chat/components/DeploymentModal';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { useNodes } from '@/app/_common/utils/nodeHook';
import styles from '@/app/canvas/assets/PlateeRAG.module.scss';
import {
    executeWorkflow,
    saveWorkflow,
    listWorkflows,
    loadWorkflow,
} from '@/app/api/workflowAPI';
import {
    getWorkflowName,
    getWorkflowState,
    saveWorkflowState,
    ensureValidWorkflowState,
    saveWorkflowName,
    startNewWorkflow,
} from '@/app/_common/utils/workflowStorage';
import { devLog } from '@/app/_common/utils/logger';
import { generateWorkflowHash } from '@/app/_common/utils/generateSha1Hash';

function CanvasPageContent() {
    // CookieProvider의 useAuth 훅 사용
    const { user, isAuthenticated } = useAuth();

    // URL 파라미터 처리
    const searchParams = useSearchParams();

    // 페이지 레벨에서 노드 초기화 관리 (중복 호출 방지)
    const { nodes: nodeSpecs, isLoading: nodesLoading, error: nodesError, exportAndRefreshNodes, isInitialized: nodesInitialized } = useNodes();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLElement | null>(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [workflowId, setWorkflowId] = useState('None')
    const [hasError, setHasError] = useState(false);
    const [executionOutput, setExecutionOutput] = useState<any>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [currentWorkflowName, setCurrentWorkflowName] = useState('Workflow');
    const [workflow, setWorkflow] = useState({
                id: 'None',
                name: 'None',
                filename: 'None',
                author: 'Unknown',
                nodeCount: 0,
                status: 'active' as const,
            });
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const [showDeploymentModal, setShowDeploymentModal] = useState(false);
    const [isDeploy, setIsDeploy] = useState(false);

    useEffect(() => {
        const handleError = (error: any) => {
            devLog.error('Global error caught:', error);
            setHasError(true);
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleError);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleError);
        };
    }, []);

    if (hasError) {
        return (
            <div style={{ padding: '20px', color: 'red' }}>
                <h2>Something went wrong!</h2>
                <button onClick={() => setHasError(false)}>Reset</button>
            </div>
        );
    }

    // 컴포넌트 마운트 시 워크플로우 이름과 상태 복원
    useEffect(() => {
        devLog.log('=== Page useEffect: Restoring workflow state ===');

        // URL 파라미터에서 load할 워크플로우 이름 확인
        const loadWorkflowName = searchParams.get('load');

        if (loadWorkflowName) {
            // URL 파라미터로 워크플로우 이름이 전달된 경우
            devLog.log('Loading workflow from URL parameter:', loadWorkflowName);
            const decodedWorkflowName = decodeURIComponent(loadWorkflowName);
            setCurrentWorkflowName(decodedWorkflowName);

            // 해당 워크플로우를 자동으로 로드
            const loadFromServer = async () => {
                try {
                    const workflowData = await loadWorkflow(decodedWorkflowName);
                    if (canvasRef.current && workflowData) {
                        await handleLoadWorkflow(workflowData, decodedWorkflowName);
                    }
                } catch (error) {
                    devLog.error('Failed to load workflow from URL parameter:', error);
                    toast.error(`Failed to load workflow: ${decodedWorkflowName}`);
                }
            };

            // Canvas가 준비될 때까지 대기
            setTimeout(loadFromServer, 1000);
        } else {
            // 저장된 워크플로우 이름 복원
            const savedName = getWorkflowName();
            devLog.log('Restored workflow name:', savedName);
            setCurrentWorkflowName(savedName);
        }

        setIsCanvasReady(true);
    }, [searchParams]);

    useEffect(() => {
        setWorkflow({
            id: workflowId,
            name: currentWorkflowName,
            filename: currentWorkflowName,
            author: 'Unknown',
            nodeCount: 0,
            status: 'active' as const,
        });
        setIsDeploy(false)
    }, [workflowId, currentWorkflowName])

    // Canvas가 준비되고 노드가 초기화된 후 상태 복원을 위한 useEffect
    useEffect(() => {
        if (!isCanvasReady || !canvasRef.current || !nodesInitialized) {
            devLog.log('Canvas state restoration delayed:', {
                isCanvasReady,
                hasCanvasRef: !!canvasRef.current,
                nodesInitialized
            });
            return;
        }

        const restoreWorkflowState = () => {
            devLog.log(
                'restoreWorkflowState called, canvasRef.current:',
                !!canvasRef.current,
            );
            const savedState = getWorkflowState();

            if (savedState && canvasRef.current) {
                try {
                    const validState = ensureValidWorkflowState(savedState);
                    if (validState) {
                        devLog.log(
                            'Loading workflow state to Canvas:',
                            validState,
                        );
                        (canvasRef.current as any).loadWorkflowState(
                            validState,
                        );
                        devLog.log(
                            'Workflow state restored from localStorage successfully',
                        );
                    } else {
                        devLog.log('No valid state to restore');
                    }
                } catch (error) {
                    devLog.warn('Failed to restore workflow state:', error);
                }
            } else {
                devLog.log('No saved state found or Canvas not ready:', {
                    hasSavedState: !!savedState,
                    hasCanvasRef: !!canvasRef.current,
                });
            }
        };

        // Canvas가 준비되고 노드가 초기화된 후 상태 복원
        const timer = setTimeout(restoreWorkflowState, 200);
        return () => clearTimeout(timer);
    }, [isCanvasReady, nodesInitialized]); // 노드 초기화 상태도 의존성에 추가

    // 워크플로우 상태 변경 시 자동 저장
    const handleCanvasStateChange = (state: any) => {
        devLog.log('handleCanvasStateChange called with:', {
            hasState: !!state,
            nodesCount: state?.nodes?.length || 0,
            edgesCount: state?.edges?.length || 0,
            view: state?.view,
        });

        try {
            // 상태가 있고 비어있지 않으면 저장 (빈 상태로 덮어쓰기 방지)
            if (state && (state.nodes?.length > 0 || state.edges?.length > 0)) {
                devLog.log('Saving non-empty state to localStorage');
                saveWorkflowState(state);
                devLog.log('Workflow state saved to localStorage');
            } else {
                devLog.log(
                    'Skipping save of empty state to preserve existing localStorage data',
                );
            }
        } catch (error) {
            devLog.warn('Failed to auto-save workflow state:', error);
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

    // 새로운 워크플로우 시작 핸들러
    const handleNewWorkflow = () => {
        // 현재 작업이 있는지 확인
        const hasCurrentWork =
            canvasRef.current &&
            ((canvasRef.current as any).getCanvasState?.()?.nodes?.length > 0 ||
                (canvasRef.current as any).getCanvasState?.()?.edges?.length >
                0);

        if (hasCurrentWork) {
            // 확인 토스트 표시
            const confirmToast = toast(
                (t) => (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}
                    >
                        <div
                            style={{
                                fontWeight: '600',
                                color: '#dc2626',
                                fontSize: '1rem',
                            }}
                        >
                            Start New Workflow?
                        </div>
                        <div
                            style={{
                                fontSize: '0.9rem',
                                color: '#374151',
                                lineHeight: '1.4',
                            }}
                        >
                            This will clear all current nodes and edges.
                            <br />
                            Make sure to save your current work if needed.
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                gap: '8px',
                                justifyContent: 'flex-end',
                                marginTop: '4px',
                            }}
                        >
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
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                }}
                                onMouseOver={(e) => {
                                    (
                                        e.target as HTMLButtonElement
                                    ).style.backgroundColor = '#f9fafb';
                                    (
                                        e.target as HTMLButtonElement
                                    ).style.borderColor = '#4b5563';
                                }}
                                onMouseOut={(e) => {
                                    (
                                        e.target as HTMLButtonElement
                                    ).style.backgroundColor = '#ffffff';
                                    (
                                        e.target as HTMLButtonElement
                                    ).style.borderColor = '#6b7280';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    performNewWorkflow();
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    border: '2px solid #b91c1c',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                }}
                                onMouseOver={(e) => {
                                    (
                                        e.target as HTMLButtonElement
                                    ).style.backgroundColor = '#b91c1c';
                                    (
                                        e.target as HTMLButtonElement
                                    ).style.borderColor = '#991b1b';
                                }}
                                onMouseOut={(e) => {
                                    (
                                        e.target as HTMLButtonElement
                                    ).style.backgroundColor = '#dc2626';
                                    (
                                        e.target as HTMLButtonElement
                                    ).style.borderColor = '#b91c1c';
                                }}
                            >
                                Start New
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
                        boxShadow:
                            '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                        color: '#374151',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                    },
                },
            );
        } else {
            // 작업이 없으면 바로 시작
            performNewWorkflow();
        }
    };

    // 실제 새로운 워크플로우 시작 로직
    const performNewWorkflow = () => {
        try {
            devLog.log('Starting new workflow...');

            // localStorage 데이터 초기화
            startNewWorkflow();

            // Canvas 상태 초기화 (기존 Canvas 초기화 로직과 동일하게)
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const centeredView = (canvas as any).getCenteredView();

                // 먼저 기본 상태로 초기화
                const initialState = {
                    nodes: [],
                    edges: [],
                    view: centeredView,
                };
                (canvas as any).loadWorkflowState(initialState);
                devLog.log('Canvas state reset to initial values');
            }

            // 현재 워크플로우 이름을 기본값으로 재설정
            setCurrentWorkflowName('Workflow');

            devLog.log('New workflow started successfully');
            toast.success('New workflow started');
        } catch (error: any) {
            devLog.error('Failed to start new workflow:', error);
            toast.error(`Failed to start new workflow: ${error.message}`);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // TemplatePreview 오버레이 클릭인지 확인 (CSS 클래스로)
            const target = event.target as HTMLElement;
            if (target.closest('[data-template-preview]')) {
                return; // TemplatePreview 내부 클릭 시 메뉴 닫지 않음
            }

            if (
                menuRef.current &&
                !(menuRef.current as any).contains(event.target)
            ) {
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
            toast.error('Canvas is not ready.');
            return;
        }

        let canvasState = (canvasRef.current as any).getCanvasState();
        const workflowName = getWorkflowName();

        const workflowId = `workflow_${generateWorkflowHash(canvasState)}`;
        setWorkflowId(workflowId)
        canvasState = { ...canvasState, workflow_id: workflowId };
        canvasState = { ...canvasState, workflow_name: workflowName };

        devLog.log('Canvas state before save:', canvasState);
        devLog.log('Workflow ID set:', workflowId);
        devLog.log('Canvas state id field:', canvasState.id);

        if (!canvasState.nodes || canvasState.nodes.length === 0) {
            toast.error('Cannot save an empty workflow. Please add nodes.');
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
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: '600',
                                    color: '#f59e0b',
                                    fontSize: '1rem',
                                }}
                            >
                                Workflow Already Exists
                            </div>
                            <div
                                style={{
                                    fontSize: '0.9rem',
                                    color: '#374151',
                                    lineHeight: '1.4',
                                }}
                            >
                                A workflow named &quot;
                                <strong>{workflowName}</strong>&quot; already exists.
                                <br />
                                Do you want to overwrite it?
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '8px',
                                    justifyContent: 'flex-end',
                                    marginTop: '4px',
                                }}
                            >
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
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    }}
                                    onMouseOver={(e) => {
                                        (
                                            e.target as HTMLButtonElement
                                        ).style.backgroundColor = '#f9fafb';
                                        (
                                            e.target as HTMLButtonElement
                                        ).style.borderColor = '#4b5563';
                                    }}
                                    onMouseOut={(e) => {
                                        (
                                            e.target as HTMLButtonElement
                                        ).style.backgroundColor = '#ffffff';
                                        (
                                            e.target as HTMLButtonElement
                                        ).style.borderColor = '#6b7280';
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        toast.dismiss(t.id);
                                        await performSave(
                                            workflowName,
                                            canvasState,
                                        );
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
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    }}
                                    onMouseOver={(e) => {
                                        (
                                            e.target as HTMLButtonElement
                                        ).style.backgroundColor = '#d97706';
                                        (
                                            e.target as HTMLButtonElement
                                        ).style.borderColor = '#b45309';
                                    }}
                                    onMouseOut={(e) => {
                                        (
                                            e.target as HTMLButtonElement
                                        ).style.backgroundColor = '#f59e0b';
                                        (
                                            e.target as HTMLButtonElement
                                        ).style.borderColor = '#d97706';
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
                            boxShadow:
                                '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                            color: '#374151',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                        },
                    },
                );
            } else {
                // 중복이 없으면 바로 저장
                await performSave(workflowName, canvasState);
            }
        } catch (error: any) {
            devLog.error('Error checking existing workflows:', error);
            // 중복 확인 실패 시에도 저장 시도 (graceful fallback)
            toast.error(
                `Warning: Could not check for duplicates. Proceeding with save...`,
            );
            setTimeout(async () => {
                await performSave(workflowName, canvasState);
            }, 1000);
        }
    };

    const performSave = async (workflowName: string, canvasState: any) => {
        const toastId = toast.loading('Saving workflow...');

        try {
            const result = await saveWorkflow(workflowName, canvasState);
            toast.success(`Workflow '${workflowName}' saved successfully!`, {
                id: toastId,
            });
        } catch (error: any) {
            devLog.error('Save failed:', error);
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

    const handleLoadWorkflow = async (
        workflowData: any,
        workflowName?: string,
    ) => {
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
            devLog.error('Error loading workflow:', error);
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
                devLog.error('Error parsing JSON file:', error);
                alert('유효하지 않은 파일 형식입니다.');
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
            const nodeData = JSON.parse(
                e.dataTransfer.getData('application/json'),
            );
            if (nodeData) {
                (canvasRef.current as any).addNode(
                    nodeData,
                    e.clientX,
                    e.clientY,
                );
            }
        }
    };

    const handleExecute = async () => {
        if (!canvasRef.current) {
            toast.error('Canvas is not ready.');
            return;
        }

        const validationResult = (
            canvasRef.current as any
        ).validateAndPrepareExecution();
        if (validationResult.error) {
            toast.error(validationResult.error);
            return;
        }

        setIsExecuting(true);
        setExecutionOutput(null);
        const toastId = toast.loading('Executing workflow...');

        try {
            let workflowData = (canvasRef.current as any).getCanvasState();
            const workflowName = getWorkflowName();

            if (!workflowData.nodes || workflowData.nodes.length === 0) {
                throw new Error(
                    'Cannot execute an empty workflow. Please add nodes.',
                );
            }

            const workflowId = `workflow_${generateWorkflowHash(workflowData)}`;
            workflowData = { ...workflowData, workflow_id: workflowId };
            workflowData = { ...workflowData, workflow_name: workflowName };

            const result = await executeWorkflow(workflowData);
            setExecutionOutput(result);
            setWorkflow({
                id: workflowData.workflow_id,
                name: workflowData.workflow_name,
                filename: workflowData.workflow_name,
                author: 'Unknown',
                nodeCount: 0,
                status: 'active' as const,
            });
            setIsDeploy(true)
            toast.success('Workflow executed successfully!', { id: toastId });
        } catch (error: any) {
            devLog.error('Execution failed:', error);
            setExecutionOutput({ error: error.message });
            toast.error(`Execution failed: ${error.message}`, { id: toastId });
        } finally {
            setIsExecuting(false);
        }
    };

    const handleClearOutput = () => {
        setExecutionOutput(null);
    };

    // 브라우저 뒤로가기 방지
    useEffect(() => {
        const preventBackspace = (e: KeyboardEvent) => {
            // 입력 필드가 아닌 곳에서 백스페이스 키를 눌렀을 때 뒤로가기 방지
            if (
                e.key === 'Backspace' &&
                e.target instanceof HTMLElement &&
                e.target.tagName !== 'INPUT' &&
                e.target.tagName !== 'SELECT' &&
                e.target.tagName !== 'TEXTAREA' &&
                !e.target.isContentEditable
            ) {
                e.preventDefault();
            }
        };

        window.addEventListener('keydown', preventBackspace);
        return () => window.removeEventListener('keydown', preventBackspace);
    }, []);

    return (
        <div
            className={styles.pageContainer}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <Header
                onMenuClick={() => setIsMenuOpen((prev) => !prev)}
                onSave={handleSave}
                onLoad={handleLoadClick}
                onExport={handleExport}
                workflowName={currentWorkflowName}
                onWorkflowNameChange={handleWorkflowNameChange}
                onNewWorkflow={handleNewWorkflow}
                onDeploy={workflow.id==='None' ? () => setShowDeploymentModal(false) : () => setShowDeploymentModal(true)}
                isDeploy={isDeploy}
            />
            <main className={styles.mainContent}>
                <Canvas
                    ref={canvasRef}
                    onStateChange={handleCanvasStateChange}
                    nodesInitialized={nodesInitialized}
                    {...({} as any)}
                />
                {isMenuOpen && (
                    <SideMenu
                        menuRef={menuRef}
                        onLoad={handleLoadClick}
                        onExport={handleExport}
                        onLoadWorkflow={handleLoadWorkflow}
                        nodeSpecs={nodeSpecs}
                        nodesLoading={nodesLoading}
                        nodesError={nodesError}
                        onRefreshNodes={exportAndRefreshNodes}
                    />
                )}
                <ExecutionPanel
                    onExecute={handleExecute}
                    onClear={handleClearOutput}
                    output={executionOutput}
                    isLoading={isExecuting}
                />
            </main>
            <DeploymentModal
                isOpen={showDeploymentModal}
                onClose={() => setShowDeploymentModal(false)}
                workflow={workflow}
            />
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

const LoadingFallback = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: '#f8fafc'
    }}>
        <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{
            color: '#64748b',
            fontSize: '0.875rem',
            margin: 0
        }}>
            Canvas를 불러오는 중...
        </p>
        <style jsx>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

export default function CanvasPage() {
    return (
        <AuthGuard fallback={<LoadingFallback />}>
            <CanvasPageContent />
        </AuthGuard>
    );
}
