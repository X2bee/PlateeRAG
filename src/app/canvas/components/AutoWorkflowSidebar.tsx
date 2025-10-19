'use client';
import React, { useState, useEffect, useRef } from 'react';
import { showSuccessToastKo, showErrorToastKo, showLoadingToastKo, dismissToastKo } from '@/app/_common/utils/toastUtilsKo';
import { devLog } from '@/app/_common/utils/logger';
import { getAvailableAgentNodes, getAgentNodeInfo, generateWorkflowWithAI } from '@/app/_common/api/workflow/autoWorkflowAPI';
import { API_BASE_URL } from '@/app/config';
import styles from './AutoWorkflowSidebar.module.scss';

interface AgentNode {
    id: string;
    nodeName: string;
    description: string;
    tags: string[];
    inputs: Array<{
        id: string;
        name: string;
        type: string;
    }>;
    outputs: Array<{
        id: string;
        name: string;
        type: string;
    }>;
    parameters?: Array<{
        id: string;
        name: string;
        type: string;
        value: any;
        required?: boolean;
        options?: Array<{
            value: string;
            label: string;
        }>;
    }>;
}

interface AutoWorkflowSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadWorkflow: (workflowData: any) => void;
    getCanvasState?: () => any; // 현재 캔버스 상태를 가져오는 함수
}

const AutoWorkflowSidebar: React.FC<AutoWorkflowSidebarProps> = ({
    isOpen,
    onClose,
    onLoadWorkflow,
    getCanvasState
}) => {
    const [agentNodes, setAgentNodes] = useState<AgentNode[]>([]);
    const [selectedAgentNode, setSelectedAgentNode] = useState<AgentNode | null>(null);
    const [userRequirements, setUserRequirements] = useState('');
    const [workflowName, setWorkflowName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [compatibleNodesCount, setCompatibleNodesCount] = useState(0);
    const [agentModelInfo, setAgentModelInfo] = useState<any>(null);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [availableModels, setAvailableModels] = useState<Array<{value: string, label: string}>>([]);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // ESC 키로 사이드바 닫기
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    // Agent 노드 목록 조회
    const fetchAgentNodes = async () => {
        try {
            setIsLoading(true);
            devLog.log('Agent 노드 조회 시작...');
            const agentNodesList = await getAvailableAgentNodes();
            devLog.log('Agent 노드 조회 완료:', agentNodesList.length, '개');
            devLog.log('Agent 노드 목록:', agentNodesList);
            setAgentNodes(agentNodesList);
            
            if (agentNodesList.length === 0) {
                devLog.warn('Agent 노드가 0개입니다. 필터링 로직을 확인해주세요.');
            }
        } catch (error) {
            devLog.error('Agent 노드 조회 실패:', error);
            showErrorToastKo('Agent 노드 조회에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // Agent 노드의 모델 정보 조회
    const fetchAgentModelInfo = async (agentNodeId: string) => {
        try {
            devLog.log('Agent 노드 모델 정보 조회 시작:', agentNodeId);
            
            // Agent 노드 타입 감지
            const isOpenAIAgent = agentNodeId.toLowerCase().includes('openai');
            
            if (isOpenAIAgent) {
                devLog.log('OpenAI Agent 선택됨 - 백엔드에서 OpenAI 모델을 사용합니다');
                // OpenAI Agent의 경우 프론트엔드에서 별도 모델 정보 조회 불필요
                // 백엔드에서 자동으로 OpenAI 설정을 사용함
                return;
            }
            
            // VLLM Agent인 경우에만 기존 로직 사용
            devLog.log('VLLM Agent 감지, VLLM 설정 조회');
            const safeNodeId = agentNodeId.replace('/', '_').toLowerCase();
            
            const modelResponse = await fetch(`${API_BASE_URL}/api/editor/${safeNodeId}/vllm_model_name`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            
            const baseUrlResponse = await fetch(`${API_BASE_URL}/api/editor/${safeNodeId}/vllm_api_base_url`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (modelResponse.ok && baseUrlResponse.ok) {
                const modelData = await modelResponse.json();
                const baseUrlData = await baseUrlResponse.json();
                
                const modelInfo = {
                    model: modelData.value || 'x2bee/Polar-14B',
                    base_url: baseUrlData.value || 'http://129.213.18.198:3156/v1',
                    temperature: 0,
                    max_tokens: 8192
                };
                
                setAgentModelInfo(modelInfo);
                devLog.log('Agent 노드 모델 정보 조회 성공:', modelInfo);
            } else {
                devLog.warn('Agent 노드 모델 정보 조회 실패, 기본값 사용');
                setAgentModelInfo({
                    model: 'x2bee/Polar-14B',
                    base_url: 'http://129.213.18.198:3156/v1',
                    temperature: 0,
                    max_tokens: 8192
                });
            }
            
            // 호환 가능한 노드 수도 설정
            setCompatibleNodesCount(5);
        } catch (error) {
            devLog.error('Agent 노드 모델 정보 조회 실패:', error);
            setAgentModelInfo({
                model: 'x2bee/Polar-14B',
                base_url: 'http://129.213.18.198:3156/v1',
                temperature: 0,
                max_tokens: 8192
            });
            setCompatibleNodesCount(5);
        }
    };

    // Agent 노드 선택 핸들러
    const handleAgentNodeSelect = async (agentNode: AgentNode) => {
        setSelectedAgentNode(agentNode);
        fetchAgentModelInfo(agentNode.id);
        
        // Agent 노드 타입에 따른 모델 옵션 설정
        const isOpenAIAgent = agentNode.id.toLowerCase().includes('openai');
        
        if (isOpenAIAgent) {
            // OpenAI Agent의 경우 하드코딩된 모델 옵션 사용
            const openaiModels = [
                { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
                { value: "gpt-4", label: "GPT-4" },
                { value: "gpt-4o", label: "GPT-4o" },
                { value: "o4-mini", label: "o4 mini" },
                { value: "gpt-4.1", label: "GPT-4.1" },
                { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
                { value: "gpt-5", label: "GPT-5" },
                { value: "gpt-5-mini", label: "GPT-5 Mini" },
                { value: "gpt-5-nano", label: "GPT-5 Nano" }
            ];
            
            setAvailableModels(openaiModels);
            setSelectedModel("gpt-5-mini"); // 기본값으로 GPT-5 Mini 설정
            // OpenAI Agent는 프론트에서 모델 정보를 표시하지 않으므로 이전 VLLM 정보 제거
            setAgentModelInfo(null);
            devLog.log('OpenAI Agent 모델 옵션 설정:', openaiModels);
            devLog.log('기본 선택 모델: gpt-5-mini');
            console.log('OpenAI Agent 모델 옵션 설정:', openaiModels);
            console.log('기본 선택 모델: gpt-5-mini');
        } else {
            // VLLM Agent의 경우 기존 로직 사용 (fetchAgentModelInfo에서 처리)
            devLog.log('VLLM Agent 선택됨 - 기존 모델 정보 조회 로직 사용');
            // VLLM Agent는 fetchAgentModelInfo에서 모델 정보를 가져오므로 여기서는 별도 처리 불필요
        }
        
        // 기본 워크플로우 이름 생성
        if (!workflowName) {
            // 사용자가 입력하지 않으면 기본 이름을 단순히 'workflow'로 설정
            setWorkflowName('workflow');
        }
    };

    // 워크플로우 자동생성
    const handleGenerateWorkflow = async () => {
        if (!selectedAgentNode) {
            showErrorToastKo('Agent 노드를 선택해주세요.');
            return;
        }
        
        if (!userRequirements.trim()) {
            showErrorToastKo('사용자 요구사항을 입력해주세요.');
            return;
        }
        
        // 워크플로우 이름이 비어있으면 기본값 'workflow'를 사용
        let finalWorkflowName = workflowName && workflowName.trim() ? workflowName.trim() : 'workflow';
        if (finalWorkflowName !== workflowName) {
            setWorkflowName(finalWorkflowName);
        }

        const toastId = showLoadingToastKo('워크플로우를 생성하고 있습니다...');
        setIsGenerating(true);

        try {
            // 현재 캔버스 상태 가져오기
            let canvasContext: any = {
                purpose: '자동생성 워크플로우',
                complexity: 'auto'
            };
            
            if (getCanvasState) {
                try {
                    const currentCanvasState = getCanvasState();
                    if (currentCanvasState) {
                        // 현재 뷰포트의 중심 좌표 계산
                        const view = currentCanvasState.view || { x: 0, y: 0, scale: 1 };
                        const containerWidth = window.innerWidth;
                        const containerHeight = window.innerHeight;
                        
                        // 뷰포트 중심의 월드 좌표 계산
                        const viewportCenterX = (containerWidth / 2 - view.x) / view.scale;
                        const viewportCenterY = (containerHeight / 2 - view.y) / view.scale;
                        
                        devLog.log('뷰포트 중심 좌표 계산:', {
                            containerSize: { width: containerWidth, height: containerHeight },
                            view: view,
                            viewportCenter: { x: viewportCenterX, y: viewportCenterY }
                        });
                        
                        canvasContext = {
                            ...canvasContext,
                            current_view: view,
                            viewport_center: { x: viewportCenterX, y: viewportCenterY },
                            existing_nodes: currentCanvasState.nodes || [],
                            existing_edges: currentCanvasState.edges || []
                        };
                        devLog.log('현재 캔버스 상태를 컨텍스트에 포함:', {
                            view: canvasContext.current_view,
                            viewport_center: canvasContext.viewport_center,
                            nodes_count: canvasContext.existing_nodes.length,
                            edges_count: canvasContext.existing_edges.length
                        });
                        
                        // 기존 노드들의 위치 정보도 로깅
                        if (canvasContext.existing_nodes.length > 0) {
                            const nodePositions = canvasContext.existing_nodes.map((node: any) => ({
                                id: node.id,
                                name: node.data?.nodeName || 'Unknown',
                                position: node.position
                            }));
                            devLog.log('기존 노드 위치 정보:', nodePositions);
                        }
                    }
                } catch (error) {
                    devLog.warn('캔버스 상태 가져오기 실패:', error);
                }
            }

            const requestData: any = {
                agent_node_id: selectedAgentNode.id,
                user_requirements: userRequirements,
                workflow_name: finalWorkflowName,
                context: canvasContext
            };

            // OpenAI Agent인 경우에만 선택된 모델 추가
            console.log('모델 선택 체크:', {
                selectedModel,
                agentNodeId: selectedAgentNode.id,
                isOpenAI: selectedAgentNode.id.toLowerCase().includes('openai')
            });
            
            if (selectedModel && selectedAgentNode.id.toLowerCase().includes('openai')) {
                requestData.selected_model = selectedModel;
                console.log('선택된 모델을 요청에 추가:', selectedModel);
            } else {
                console.log('모델이 요청에 추가되지 않음:', {
                    hasSelectedModel: !!selectedModel,
                    isOpenAI: selectedAgentNode.id.toLowerCase().includes('openai')
                });
            }

            console.log('백엔드로 전송할 요청 데이터:', requestData);

            const data = await generateWorkflowWithAI(requestData);
            
            if ((data as any).success && (data as any).workflow_data) {
                // Canvas에 워크플로우 로드
                onLoadWorkflow((data as any).workflow_data);
                
                showSuccessToastKo(`워크플로우 '${(data as any).workflow_name}'이 성공적으로 생성되었습니다!`);
                
                // 폼 초기화
                setUserRequirements('');
                setWorkflowName('');
                setSelectedAgentNode(null);
                setCompatibleNodesCount(0);
                
                // 사이드바 닫기
                onClose();
            } else {
                throw new Error((data as any).message || '워크플로우 생성에 실패했습니다.');
            }

        } catch (error) {
            devLog.error('워크플로우 생성 실패:', error);
            showErrorToastKo(`워크플로우 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            dismissToastKo(toastId);
            setIsGenerating(false);
        }
    };

    // 컴포넌트 마운트 시 Agent 노드 조회
    useEffect(() => {
        if (isOpen) {
            fetchAgentNodes();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div ref={sidebarRef} className={styles.sidebar}>
                <div className={styles.header}>
                    <h2>자동 워크플로우 생성</h2>
                    <button 
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="사이드바 닫기"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.content}>
                    {/* 1단계: Agent 노드 선택 */}
                    <div className={styles.section}>
                        <h3>Agent 노드 선택</h3>
                        <p className={styles.description}>
                            워크플로우의 핵심이 될 Agent 노드를 선택하세요.
                        </p>
                        
                        {isLoading ? (
                            <div className={styles.loading}>Agent 노드를 불러오는 중...</div>
                        ) : (
                            <div className={styles.agentNodeList}>
                                {agentNodes.map((node) => (
                                    <div
                                        key={node.id}
                                        className={`${styles.agentNodeItem} ${
                                            selectedAgentNode?.id === node.id ? styles.selected : ''
                                        }`}
                                        onClick={() => handleAgentNodeSelect(node)}
                                    >
                                        <div className={styles.nodeHeader}>
                                            <h4>{node.nodeName}</h4>
                                            <span className={styles.nodeId}>{node.id}</span>
                                        </div>
                                        <p className={styles.nodeDescription}>
                                            {node.description}
                                        </p>
                                        <div className={styles.nodeTags}>
                                            {node.tags.slice(0, 3).map((tag) => (
                                                <span key={tag} className={styles.tag}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                
                                {agentNodes.length === 0 && (
                                    <div className={styles.emptyState}>
                                        사용 가능한 Agent 노드가 없습니다.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 모델 선택 (OpenAI Agent가 선택된 경우에만 표시) */}
                    {selectedAgentNode && availableModels.length > 0 && selectedAgentNode.id.toLowerCase().includes('openai') && (
                        <div className={styles.section}>
                            <h3>모델 선택</h3>
                            <p className={styles.description}>
                                사용할 AI 모델을 선택하세요.
                            </p>
                            
                            <select
                                className={styles.modelSelect}
                                value={selectedModel}
                                onChange={(e) => {
                                    console.log('모델 선택 변경:', e.target.value);
                                    setSelectedModel(e.target.value);
                                }}
                            >
                                {availableModels.map((model) => (
                                    <option key={model.value} value={model.value}>
                                        {model.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* 2단계: 사용자 요구사항 입력 */}
                    <div className={styles.section}>
                        <h3>요구사항 입력</h3>
                        <p className={styles.description}>
                            원하는 워크플로우의 기능을 자세히 설명해주세요.
                        </p>
                        
                        <textarea
                            className={styles.requirementsInput}
                            placeholder="예: 간단한 채팅 봇을 만들어주세요. 사용자 입력을 받아서 AI가 응답하는 워크플로우를 구성해주세요."
                            value={userRequirements}
                            onChange={(e) => setUserRequirements(e.target.value)}
                            rows={4}
                        />
                    </div>

                    {/* 3단계: 워크플로우 이름 설정 */}
                    <div className={styles.section}>
                        <h3>워크플로우 이름</h3>
                        <input
                            type="text"
                            className={styles.workflowNameInput}
                            placeholder="워크플로우 이름을 입력하세요"
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
                        />
                    </div>

                    {/* 선택된 Agent 노드 정보 */}
                    {selectedAgentNode && (
                        <div className={styles.section}>
                        <h3>선택된 Agent 정보</h3>
                            <div className={styles.selectedAgentInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>노드명:</span>
                                    <span className={styles.value}>{selectedAgentNode.nodeName}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>ID:</span>
                                    <span className={styles.value}>{selectedAgentNode.id}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.label}>호환 노드:</span>
                                    <span className={styles.value}>{compatibleNodesCount}개</span>
                                </div>
                                {agentModelInfo && (
                                    <>
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>모델:</span>
                                            <span className={styles.value}>{agentModelInfo.model}</span>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>API URL:</span>
                                            <span className={styles.value}>{agentModelInfo.base_url}</span>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>Temperature:</span>
                                            <span className={styles.value}>{agentModelInfo.temperature}</span>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.label}>Max Tokens:</span>
                                            <span className={styles.value}>{agentModelInfo.max_tokens}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 생성 버튼 */}
                    <div className={styles.section}>
                        <button
                            className={styles.generateButton}
                            onClick={handleGenerateWorkflow}
                            disabled={!selectedAgentNode || !userRequirements.trim() || isGenerating}
                        >
                            {isGenerating ? '생성 중...' : '워크플로우 생성'}
                        </button>
                        
                        {selectedAgentNode && (
                            <p className={styles.generateHint}>
                                {compatibleNodesCount}개의 호환 가능한 노드로 워크플로우를 구성합니다.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutoWorkflowSidebar;
