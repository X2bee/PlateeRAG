'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { showSuccessToastKo, showErrorToastKo, showLoadingToastKo, dismissToastKo } from '@/app/_common/utils/toastUtilsKo';
import Canvas from '@/app/canvas/components/Canvas';
import Header from '@/app/canvas/components/Header';
import SideMenu from '@/app/canvas/components/SideMenu';
import ExecutionPanel from '@/app/canvas/components/ExecutionPanel';
import NodeModal from '@/app/canvas/components/NodeModal';
import AuthGuard from '@/app/_common/components/authGuard/AuthGuard';
import { DeploymentModal } from '@/app/chat/components/DeploymentModal';
import { HistoryPanel } from '@/app/canvas/components/HistoryPanel';
import { useNodes } from '@/app/_common/utils/nodeHook';
import { useHistoryManagement, createHistoryHelpers } from '@/app/canvas/components/Canvas/hooks/useHistoryManagement';
import styles from '@/app/canvas/assets/PlateeRAG.module.scss';
import {
    saveWorkflow,
    listWorkflows,
    loadWorkflow,
    executeWorkflowByIdStream,
    executeWorkflowById,
} from '@/app/api/workflow/workflowAPI';
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
import { isStreamingWorkflowFromWorkflow } from '../_common/utils/isStreamingWorkflow';
import {
    showNewWorkflowConfirmKo,
    showWorkflowOverwriteConfirmKo,
    showWarningToastKo
} from '@/app/_common/utils/toastUtilsKo';

function CanvasPageContent() {
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
    const [workflowDetailData, setWorkflowDetailData] = useState<any>(null);
    const [loadingCanvas, setLoadingCanvas] = useState(true);

    // History 관리 상태
    const historyManagement = useHistoryManagement();
    const {
        history,
        currentHistoryIndex,
        addHistoryEntry,
        clearHistory,
        canUndo,
        canRedo,
        undo,
        redo,
        jumpToHistoryIndex
    } = historyManagement;

    // historyHelpers를 useMemo로 메모이제이션하여 무한 루프 방지
    const historyHelpers = useMemo(() => createHistoryHelpers(
        addHistoryEntry,
        historyManagement,
        () => canvasRef.current ? (canvasRef.current as any).getCanvasState() : null
    ), [addHistoryEntry, historyManagement]); // 의존성 최소화

    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

    // NodeModal 관련 상태
    const [nodeModalState, setNodeModalState] = useState<{
        isOpen: boolean;
        nodeId: string;
        paramId: string;
        paramName: string;
        currentValue: string;
    }>({
        isOpen: false,
        nodeId: '',
        paramId: '',
        paramName: '',
        currentValue: ''
    });

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

    useEffect(() => {
        setLoadingCanvas(true);
        devLog.log('=== Page useEffect: Restoring workflow state ===');
        devLog.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
        devLog.log('Search params object:', searchParams);
        let loadWorkflowName = searchParams.get('load');
        devLog.log('searchParams.get("load"):', loadWorkflowName);
        if (!loadWorkflowName && typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            loadWorkflowName = urlParams.get('load');
            devLog.log('window.location fallback - load parameter:', loadWorkflowName);
            devLog.log('window.location.search:', window.location.search);
        }

        if (loadWorkflowName) {
            const decodedWorkflowName = decodeURIComponent(loadWorkflowName);
            setCurrentWorkflowName(decodedWorkflowName);

            const loadFromServer = async () => {
                try {
                    const workflowData = await loadWorkflow(decodedWorkflowName, null);

                    if (canvasRef.current && workflowData) {
                        await handleLoadWorkflow(workflowData, decodedWorkflowName);
                    } else {
                        const errorMsg = !canvasRef.current ? 'Canvas not ready' : 'Workflow data is empty';
                        throw new Error(errorMsg);
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    showErrorToastKo(`워크플로우 로드 실패: ${errorMessage}`);
                }
            };

            loadFromServer();
            setLoadingCanvas(false);
        } else {
            const savedName = getWorkflowName();
            setCurrentWorkflowName(savedName);
        }

        setIsCanvasReady(true);
    }, [searchParams]);

    useEffect(() => {
        const loadWorkflowName = searchParams.get('load');
        if (!loadWorkflowName) {
            setLoadingCanvas(false);
        }
    }, []);

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

    // 노드 사양들이 로드된 후 Canvas에 전달
    useEffect(() => {
        if (nodesInitialized && nodeSpecs && canvasRef.current) {
            devLog.log('Setting available node specs to Canvas:', nodeSpecs.length);

            // nodeSpecs를 NodeData 형식으로 변환
            const nodeDataList = nodeSpecs.flatMap(category =>
                category.functions?.flatMap(func => func.nodes || []) || []
            );

            (canvasRef.current as any).setAvailableNodeSpecs(nodeDataList);
        }
    }, [nodesInitialized, nodeSpecs]);

    // Canvas 상태 복원자 설정
    useEffect(() => {
        // Canvas가 마운트된 후에 상태 복원자 설정
        const setupRestorer = () => {
            if (canvasRef.current) {
                console.log('🔧 Setting up canvas state restorer');
                historyManagement.setCanvasStateRestorer((canvasState: any) => {
                    console.log('🔄 Restoring canvas state:', canvasState);
                    if (canvasRef.current) {
                        (canvasRef.current as any).loadCanvasState(canvasState);
                    }
                });
                return true;
            }
            return false;
        };

        // 즉시 시도하고, 실패하면 약간의 지연 후 재시도
        if (!setupRestorer()) {
            const timer = setTimeout(setupRestorer, 100);
            return () => clearTimeout(timer);
        }
    }, []); // 빈 의존성 배열

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
    };    // 워크플로우 이름 업데이트 헬퍼 함수
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
            // 새로운 유틸리티 사용
            showNewWorkflowConfirmKo(
                () => {
                    performNewWorkflow();
                }
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
            showSuccessToastKo('새 워크플로우가 시작되었습니다');
        } catch (error: any) {
            devLog.error('Failed to start new workflow:', error);
            showErrorToastKo(`새 워크플로우 시작 실패: ${error.message}`);
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
            showErrorToastKo('캔버스가 준비되지 않았습니다');
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
            showErrorToastKo('빈 워크플로우는 저장할 수 없습니다. 노드를 추가해주세요');
            return;
        }

        try {
            // 백그라운드에서 중복 확인 (로딩 메시지 없이)
            const existingWorkflows = await listWorkflows();
            const targetFilename = `${workflowName}.json`;
            const isDuplicate = existingWorkflows.includes(targetFilename);

            if (isDuplicate) {
                // 중복 발견 시 사용자에게 확인 요청 (새로운 유틸리티 사용)
                showWorkflowOverwriteConfirmKo(
                    workflowName,
                    async () => {
                        await performSave(workflowName, canvasState);
                    }
                );
            } else {
                // 중복이 없으면 바로 저장
                await performSave(workflowName, canvasState);
            }
        } catch (error: any) {
            devLog.error('Error checking existing workflows:', error);
            // 중복 확인 실패 시에도 저장 시도 (graceful fallback)
            showWarningToastKo({
                message: '경고: 중복 확인을 할 수 없습니다. 저장을 진행합니다...',
            });
            setTimeout(async () => {
                await performSave(workflowName, canvasState);
            }, 1000);
        }
    };

    const performSave = async (workflowName: string, canvasState: any) => {
        const toastId = showLoadingToastKo('워크플로우 저장 중...');

        try {
            const result = await saveWorkflow(workflowName, canvasState);
            showSuccessToastKo(`워크플로우 '${workflowName}'이(가) 성공적으로 저장되었습니다!`);
        } catch (error: any) {
            devLog.error('Save failed:', error);
            showErrorToastKo(`저장 실패: ${error.message}`);
        } finally {
            dismissToastKo(toastId);
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
                saveWorkflowState(validState);

                if (workflowName) {
                    updateWorkflowName(workflowName);
                }

                showSuccessToastKo('워크플로우가 성공적으로 로드되었습니다!');
            }
        } catch (error: any) {
            devLog.error('Error loading workflow:', error);
            showErrorToastKo(`워크플로우 로드 실패: ${error.message}`);
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
                    saveWorkflowState(validState);

                    // 파일명에서 워크플로우 이름 추출 (.json 확장자 제거)
                    const workflowName = file.name.replace(/\.json$/i, '');
                    updateWorkflowName(workflowName);
                }
            } catch (error) {
                devLog.error('Error parsing JSON file:', error);
                showErrorToastKo('유효하지 않은 파일 형식입니다.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();

        const hasValidData = e.dataTransfer.types.includes('application/json');
        const hasOnlyText = e.dataTransfer.types.includes('text/plain') &&
            !e.dataTransfer.types.includes('application/json');

        if (hasValidData) {
            // 유효한 JSON 데이터 타입인 경우 드롭을 허용
            e.dataTransfer.dropEffect = 'copy';
        } else if (hasOnlyText) {
            // 텍스트만 있는 경우 드롭을 거부 (브라우저/외부 앱에서 드래그)
            e.dataTransfer.dropEffect = 'none';
        } else {
            // 기타 경우는 기본적으로 허용 (이전 동작 유지)
            e.dataTransfer.dropEffect = 'copy';
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (canvasRef.current) {
            try {
                // 먼저 application/json 데이터를 시도
                let nodeData = null;
                const jsonData = e.dataTransfer.getData('application/json');

                if (jsonData && jsonData.trim() !== '') {
                    // JSON 데이터가 있는 경우 파싱 시도
                    try {
                        nodeData = JSON.parse(jsonData);
                    } catch (parseError) {
                        return; // JSON 파싱 실패 시 무시
                    }
                } else {
                    // JSON 데이터가 없는 경우 text/plain 시도 (노드 패널 호환성)
                    const textData = e.dataTransfer.getData('text/plain');

                    if (textData && textData.trim() !== '') {
                        try {
                            nodeData = JSON.parse(textData);
                        } catch (parseError) {
                            // text/plain이 JSON이 아닌 경우 (브라우저 텍스트 드래그 등)
                            return;
                        }
                    } else {
                        return;
                    }
                }

                // nodeData 유효성 검증
                if (nodeData &&
                    typeof nodeData === 'object' &&
                    nodeData.id &&
                    typeof nodeData.id === 'string') {

                    (canvasRef.current as any).addNode(
                        nodeData,
                        e.clientX,
                        e.clientY,
                    );
                }
            } catch (error) {
                // 전체 과정에서 에러 발생 시 무시
            }
        }
    };

    const handleExecute = async () => {
        if (!canvasRef.current) {
            showErrorToastKo('캔버스가 준비되지 않았습니다');
            return;
        }

        const validationResult = (
            canvasRef.current as any
        ).validateAndPrepareExecution();
        if (validationResult.error) {
            showErrorToastKo(validationResult.error);
            return;
        }

        setIsExecuting(true);
        setExecutionOutput(null);
        const toastId = showLoadingToastKo('워크플로우 실행 중...');

        try {
            let workflowData = (canvasRef.current as any).getCanvasState();
            const workflowName = getWorkflowName();

            if (!workflowData.nodes || workflowData.nodes.length === 0) {
                throw new Error(
                    'Cannot execute an empty workflow. Please add nodes.',
                );
            }

            const workflowId = `workflow_${generateWorkflowHash(workflowName)}`;
            workflowData = { ...workflowData, workflow_id: workflowId };
            workflowData = { ...workflowData, workflow_name: workflowName };
            await saveWorkflow(workflowName, workflowData);
            const isStreaming = await isStreamingWorkflowFromWorkflow(workflowData);

            if (isStreaming) {
                dismissToastKo(toastId);
                const streamToastId = showLoadingToastKo('스트리밍 워크플로우 실행 중...');
                setExecutionOutput({ stream: '' });

                // await executeWorkflowStream({
                //     workflowData,
                //     onData: (chunk) => {
                //         setExecutionOutput((prev: { stream: any; }) => ({ ...prev, stream: (prev.stream || '') + chunk }));
                //     },
                //     onEnd: () => {
                //         toast.success('Streaming finished!', { id: toastId });
                //     },
                //     onError: (err) => {
                //         throw err;
                //     }
                // });
                await executeWorkflowByIdStream({
                    workflowName,
                    workflowId,
                    inputData: '',
                    interactionId: 'default',
                    selectedCollections: null,
                    user_id: null,
                    onData: (chunk) => {
                        setExecutionOutput((prev: { stream: any; }) => ({ ...prev, stream: (prev.stream || '') + chunk }));
                    },
                    onEnd: () => {
                        dismissToastKo(streamToastId);
                        showSuccessToastKo('스트리밍이 완료되었습니다!');
                    },
                    onError: (err) => { throw err; },
                });


            } else {
                // const result = await executeWorkflow(workflowData);
                const result = await executeWorkflowById(workflowName, workflowId, '', 'default', null, null, null);
                setExecutionOutput(result);
                dismissToastKo(toastId);
                showSuccessToastKo('워크플로우가 성공적으로 실행되었습니다!');
            }
            setWorkflow({
                id: workflowData.workflow_id,
                name: workflowData.workflow_name,
                filename: workflowData.workflow_name,
                author: 'Unknown',
                nodeCount: 0,
                status: 'active' as const,
            });
            setIsDeploy(true)
        } catch (error: any) {
            devLog.error('Execution failed:', error);
            setExecutionOutput({ error: error.message });
            dismissToastKo(toastId);
            showErrorToastKo(`실행 실패: ${error.message}`);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleClearOutput = () => {
        setExecutionOutput(null);
    };

    const handleOpenNodeModal = (nodeId: string, paramId: string, paramName: string, currentValue: string) => {
        setNodeModalState({
            isOpen: true,
            nodeId,
            paramId,
            paramName,
            currentValue
        });
    };

    const handleCloseNodeModal = () => {
        setNodeModalState({
            isOpen: false,
            nodeId: '',
            paramId: '',
            paramName: '',
            currentValue: ''
        });
    };

    const handleSaveNodeModal = (value: string) => {
        if (canvasRef.current && nodeModalState.nodeId && nodeModalState.paramId) {
            // Canvas에서 파라미터 값 업데이트하는 함수 호출
            (canvasRef.current as any).updateNodeParameter?.(
                nodeModalState.nodeId,
                nodeModalState.paramId,
                value
            );
        }
        handleCloseNodeModal();
    };



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

    // DeploymentModal이 열릴 때 워크플로우 데이터 업데이트
    useEffect(() => {
        if (showDeploymentModal && canvasRef.current) {
            const updateWorkflowData = async () => {
                try {
                    const workflowData = (canvasRef.current as any).getCanvasState();
                    setWorkflowDetailData(workflowData);
                } catch (error) {
                    devLog.error('Failed to get workflow data:', error);
                    setWorkflowDetailData(null);
                }
            };
            updateWorkflowData();
        }
    }, [showDeploymentModal]);

    if (loadingCanvas) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#f8fafc',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                gap: '1.5rem',
                zIndex: 9999
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid #e2e8f0',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <div style={{
                    textAlign: 'center',
                    color: '#64748b'
                }}>
                    <p style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        margin: '0 0 0.5rem 0'
                    }}>
                        Canvas를 불러오는 중...
                    </p>
                    <p style={{
                        fontSize: '0.875rem',
                        margin: 0,
                        opacity: 0.7
                    }}>
                        잠시만 기다려주세요
                    </p>
                </div>
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

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
                onDeploy={workflow.id === 'None' ? () => setShowDeploymentModal(false) : () => setShowDeploymentModal(true)}
                isDeploy={isDeploy}
                handleExecute={handleExecute}
                isLoading={isExecuting}
                onHistoryClick={() => setIsHistoryPanelOpen(true)}
                historyCount={history.length}
            />
            <main className={styles.mainContent}>
                <Canvas
                    ref={canvasRef}
                    onStateChange={handleCanvasStateChange}
                    nodesInitialized={nodesInitialized}
                    onOpenNodeModal={handleOpenNodeModal}
                    historyHelpers={historyHelpers}
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
                workflowDetail={workflowDetailData}
            />
            <NodeModal
                isOpen={nodeModalState.isOpen}
                onClose={handleCloseNodeModal}
                onSave={handleSaveNodeModal}
                parameterName={nodeModalState.paramName}
                initialValue={nodeModalState.currentValue}
            />
            <HistoryPanel
                history={history}
                currentHistoryIndex={currentHistoryIndex}
                isOpen={isHistoryPanelOpen}
                onClose={() => setIsHistoryPanelOpen(false)}
                onClearHistory={clearHistory}
                onJumpToHistoryIndex={jumpToHistoryIndex}
                canUndo={canUndo}
                canRedo={canRedo}
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
        <AuthGuard
            fallback={<LoadingFallback />}
            requiredSection="canvas"
            sectionRedirectTo="/chat"
        >
            <CanvasPageContent />
        </AuthGuard>
    );
}
