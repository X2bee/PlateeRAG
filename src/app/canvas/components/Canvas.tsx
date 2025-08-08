"use client";

import React, {
    useRef,
    useEffect,
    useState,
    forwardRef,
    useImperativeHandle,
    useCallback,
    memo,
    useLayoutEffect
} from 'react';
import styles from '@/app/canvas/assets/Canvas.module.scss';
import Node from '@/app/canvas/components/Node';
import Edge from '@/app/canvas/components/Edge';
import { devLog } from '@/app/_common/utils/logger';
import type {
    Position,
    View,
    Port,
    NodeData,
    CanvasNode,
    CanvasEdge,
    EdgePreview,
    DragState,
    CanvasState,
    ValidationResult,
    PortMouseEventData,
    ExecutionValidationResult,
    DeletedItem,
    CanvasProps,
    CanvasRef,
    PredictedNode
} from '@/app/canvas/types';

// Constants
const MIN_SCALE = 0.6;
const MAX_SCALE = 20;
const ZOOM_SENSITIVITY = 0.05;
const SNAP_DISTANCE = 40;

const areTypesCompatible = (sourceType?: string, targetType?: string): boolean => {
    if (!sourceType || !targetType) return true;
    if (sourceType === targetType) return true;
    if (targetType === 'ANY') return true;
    if (sourceType === 'INT' && targetType === 'FLOAT') return true;
    return false;
};

const validateRequiredInputs = (nodes: CanvasNode[], edges: CanvasEdge[]): ValidationResult => {
    for (const node of nodes) {
        if (!node.data.inputs || node.data.inputs.length === 0) continue;
        for (const input of node.data.inputs) {
            if (input.required) {
                const hasConnection = edges.some(edge =>
                    edge.target.nodeId === node.id &&
                    edge.target.portId === input.id
                );

                if (!hasConnection) {
                    return {
                        isValid: false,
                        nodeId: node.id,
                        nodeName: node.data.nodeName,
                        inputName: input.name
                    };
                }
            }
        }
    }
    return { isValid: true };
};

const Canvas = forwardRef<CanvasRef, CanvasProps>(({ onStateChange, nodesInitialized = false }, ref) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 });
    const [nodes, setNodes] = useState<CanvasNode[]>([]);
    const [edges, setEdges] = useState<CanvasEdge[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [dragState, setDragState] = useState<DragState>({ type: 'none', startX: 0, startY: 0 });
    const [edgePreview, setEdgePreview] = useState<EdgePreview | null>(null);
    const [portPositions, setPortPositions] = useState<Record<string, Position>>({});
    const [snappedPortKey, setSnappedPortKey] = useState<string | null>(null);
    const [isSnapTargetValid, setIsSnapTargetValid] = useState<boolean>(true);
    const [copiedNode, setCopiedNode] = useState<CanvasNode | null>(null);
    const [lastDeleted, setLastDeleted] = useState<DeletedItem | null>(null);
    
    // 예측 노드 시스템
    const [predictedNodes, setPredictedNodes] = useState<PredictedNode[]>([]);
    const [availableNodeSpecs, setAvailableNodeSpecs] = useState<NodeData[]>([]);
    const [isDraggingOutput, setIsDraggingOutput] = useState<boolean>(false);
    const [currentOutputType, setCurrentOutputType] = useState<string | null>(null);

    const nodesRef = useRef<CanvasNode[]>(nodes);
    const edgePreviewRef = useRef<EdgePreview | null>(edgePreview);
    const portRefs = useRef<Map<string, HTMLElement>>(new Map());
    const snappedPortKeyRef = useRef<string | null>(snappedPortKey);
    const isSnapTargetValidRef = useRef<boolean>(isSnapTargetValid);

    useLayoutEffect(() => {
        const newPortPositions: Record<string, Position> = {};
        const contentEl = contentRef.current;
        if (!contentEl) return;

        const contentRect = contentEl.getBoundingClientRect();

        portRefs.current.forEach((portEl, key) => {
            if (portEl) {
                const portRect = portEl.getBoundingClientRect();
                const x = (portRect.left + portRect.width / 2 - contentRect.left) / view.scale;
                const y = (portRect.top + portRect.height / 2 - contentRect.top) / view.scale;
                newPortPositions[key] = { x, y };
            }
        });
        setPortPositions(newPortPositions);
    }, [nodes, view.scale]);

    useEffect(() => {
        if (onStateChange) {
            const currentState: CanvasState = { view, nodes, edges };
            if (nodes.length > 0 || edges.length > 0) {
                devLog.log('Canvas state changed, calling onStateChange:', {
                    nodesCount: nodes.length,
                    edgesCount: edges.length,
                    view: view
                });
                onStateChange(currentState);
            } else {
                devLog.log('Canvas state is empty, skipping onStateChange to preserve localStorage');
            }
        } else {
            devLog.warn('onStateChange callback is not provided to Canvas');
        }
    }, [nodes, edges, view, onStateChange]);

    useEffect(() => {
        // 페이지 레벨에서 노드 초기화를 관리하므로 Canvas에서는 상태만 확인
        if (!nodesInitialized) {
            devLog.log('Canvas mounted, waiting for nodes initialization...');
        } else {
            devLog.log('Canvas mounted, nodes already initialized');
        }
    }, [nodesInitialized]); // nodesInitialized 의존성으로 변경

    const registerPortRef = useCallback((nodeId: string, portId: string, portType: string, el: HTMLElement | null) => {
        const key = `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;
        if (el) {
            portRefs.current.set(key, el);
        } else {
            portRefs.current.delete(key);
        }
    }, []);

    const getCenteredView = useCallback((): View => {
        const container = containerRef.current;
        const content = contentRef.current;

        if (container && content) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const contentWidth = content.offsetWidth;
            const contentHeight = content.offsetHeight;

            if (containerWidth <= 0 || containerHeight <= 0) {
                devLog.log('Container not ready for centered view calculation, using default');
                return { x: 0, y: 0, scale: 1 };
            }

            const centeredView: View = {
                x: (containerWidth - contentWidth) / 2,
                y: (containerHeight - contentHeight) / 2,
                scale: 1
            };

            devLog.log('Calculated centered view:', centeredView, 'container:', { containerWidth, containerHeight }, 'content:', { contentWidth, contentHeight });
            return centeredView;
        }

        devLog.log('Container or content not ready for centered view calculation');
        return { x: 0, y: 0, scale: 1 };
    }, []);

    useImperativeHandle(ref, () => ({
        getCanvasState: (): CanvasState => ({ view, nodes, edges }),
        addNode: (nodeData: NodeData, clientX: number, clientY: number): void => {
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const worldX = (clientX - rect.left - view.x) / view.scale;
            const worldY = (clientY - rect.top - view.y) / view.scale;

            const newNode: CanvasNode = {
                id: `${nodeData.id}-${Date.now()}`,
                data: nodeData,
                position: { x: worldX, y: worldY },
            };
            setNodes(prev => [...prev, newNode]);
        },
        loadCanvasState: (state: Partial<CanvasState>): void => {
            if (state.nodes) setNodes(state.nodes);
            if (state.edges) setEdges(state.edges);
            if (state.view) setView(state.view);
        },
        loadWorkflowState: (state: Partial<CanvasState>): void => {
            devLog.log('Canvas loadWorkflowState called with:', {
                hasNodes: !!state.nodes,
                nodesCount: state.nodes?.length || 0,
                hasEdges: !!state.edges,
                edgesCount: state.edges?.length || 0,
                hasView: !!state.view,
                view: state.view
            });

            if (state.nodes) {
                devLog.log('Setting nodes:', state.nodes.length);
                setNodes(state.nodes);
            }
            if (state.edges) {
                devLog.log('Setting edges:', state.edges.length);
                setEdges(state.edges);
            }
            if (state.view) {
                devLog.log('Setting view:', state.view);
                setView(state.view);
            }

            devLog.log('Canvas loadWorkflowState completed');
        },
        getCenteredView,
        clearSelectedNode: (): void => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
        },
        validateAndPrepareExecution: (): ExecutionValidationResult => {
            const validationResult = validateRequiredInputs(nodes, edges);
            if (!validationResult.isValid) {
                setSelectedNodeId(validationResult.nodeId || null);
                setSelectedEdgeId(null);
                return {
                    error: `Required input "${validationResult.inputName}" is missing in node "${validationResult.nodeName}"`,
                    nodeId: validationResult.nodeId
                };
            }
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
            return { success: true };
        },
        setAvailableNodeSpecs: (nodeSpecs: NodeData[]): void => {
            setAvailableNodeSpecs(nodeSpecs);
            devLog.log('Available node specs updated:', nodeSpecs.length);
        }
    }));

    const calculateDistance = (pos1?: Position, pos2?: Position): number => {
        if (!pos1 || !pos2) return Infinity;
        return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
    };

    const copySelectedNode = (): void => {
        if (selectedNodeId) {
            const nodeToCopy = nodes.find(node => node.id === selectedNodeId);
            if (nodeToCopy) {
                setCopiedNode(nodeToCopy);
                devLog.log('Node copied:', nodeToCopy.data.nodeName);
            }
        }
    };

    const pasteNode = (): void => {
        if (copiedNode) {
            const newNode: CanvasNode = {
                ...copiedNode,
                id: `${copiedNode.data.id}-${Date.now()}`,
                position: {
                    x: copiedNode.position.x + 50,
                    y: copiedNode.position.y + 50
                }
            };

            setNodes(prev => [...prev, newNode]);
            setSelectedNodeId(newNode.id);
            devLog.log('Node pasted:', newNode.data.nodeName);
        }
    };

    const handleParameterChange = useCallback((nodeId: string, paramId: string, value: string | number): void => {
        devLog.log('=== Canvas Parameter Change ===');
        devLog.log('Received:', { nodeId, paramId, value });

        setNodes(prevNodes => {
            devLog.log('Previous nodes count:', prevNodes.length);

            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) {
                devLog.warn('Target node not found:', nodeId);
                return prevNodes;
            }

            const targetNode = prevNodes[targetNodeIndex];
            devLog.log('Found target node:', targetNode.data.nodeName);

            if (!targetNode.data.parameters || !Array.isArray(targetNode.data.parameters)) {
                devLog.warn('No parameters found in target node');
                return prevNodes;
            }

            const targetParamIndex = targetNode.data.parameters.findIndex(param => param.id === paramId);
            if (targetParamIndex === -1) {
                devLog.warn('Target parameter not found:', paramId);
                return prevNodes;
            }

            const targetParam = targetNode.data.parameters[targetParamIndex];
            const newValue = typeof targetParam.value === 'number' ? Number(value) : value;

            if (targetParam.value === newValue) {
                devLog.log('Parameter value unchanged, skipping update');
                return prevNodes;
            }

            devLog.log('Updating parameter:', {
                paramName: targetParam.name,
                paramId,
                oldValue: targetParam.value,
                newValue
            });

            const newNodes = [...prevNodes];
            newNodes[targetNodeIndex] = {
                ...targetNode,
                data: {
                    ...targetNode.data,
                    parameters: [
                        ...targetNode.data.parameters.slice(0, targetParamIndex),
                        { ...targetParam, value: newValue },
                        ...targetNode.data.parameters.slice(targetParamIndex + 1)
                    ]
                }
            };

            devLog.log('Parameter update completed successfully');
            devLog.log('=== End Canvas Parameter Change ===');
            return newNodes;
        });
    }, []);

    const handleNodeNameChange = useCallback((nodeId: string, newName: string): void => {
        devLog.log('=== Canvas Node Name Change ===');
        devLog.log('Received:', { nodeId, newName });

        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) {
                devLog.warn('Target node not found:', nodeId);
                return prevNodes;
            }

            const targetNode = prevNodes[targetNodeIndex];
            if (targetNode.data.nodeName === newName) {
                devLog.log('Node name unchanged, skipping update');
                return prevNodes;
            }

            devLog.log('Updating node name:', {
                nodeId,
                oldName: targetNode.data.nodeName,
                newName
            });

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        nodeName: newName
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            devLog.log('Node name update completed successfully');
            devLog.log('=== End Canvas Node Name Change ===');
            return newNodes;
        });
    }, []);

    const findPortData = (nodeId: string, portId: string, portType: string): Port | null => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return null;
        const portList = portType === 'input' ? node.data.inputs : node.data.outputs;
        return portList?.find(p => p.id === portId) || null;
    };

    // 타입 호환성을 검사하는 함수 (출력 타입과 입력 타입이 연결 가능한지 확인)
    const canConnectTypes = (outputType: string, inputType: string): boolean => {
        return areTypesCompatible(outputType, inputType);
    };

    // 주어진 출력 타입과 연결 가능한 노드들을 찾는 함수
    const findCompatibleNodes = (outputType: string): NodeData[] => {
        return availableNodeSpecs.filter(nodeSpec => {
            if (!nodeSpec.inputs) return false;
            return nodeSpec.inputs.some(input => canConnectTypes(outputType, input.type));
        });
    };

    // 캔버스 경계 내에서 유효한 위치인지 확인
    const isPositionValid = (position: Position, nodeWidth: number = 450, nodeHeight: number = 200): boolean => {
        const container = containerRef.current;
        if (!container) return true;
        
        // 캔버스의 현재 뷰포트 고려
        const viewportMargin = 100; // 뷰포트 가장자리에서의 여백
        const minX = -view.x / view.scale + viewportMargin;
        const minY = -view.y / view.scale + viewportMargin;
        const maxX = (-view.x + container.clientWidth) / view.scale - nodeWidth - viewportMargin;
        const maxY = (-view.y + container.clientHeight) / view.scale - nodeHeight - viewportMargin;
        
        return position.x >= minX && position.x <= maxX && position.y >= minY && position.y <= maxY;
    };

    // 기존 노드들과 겹치지 않는 위치를 찾는 함수
    const findNonOverlappingPosition = (
        basePosition: Position, 
        existingPredictedNodes: PredictedNode[] = [],
        nodeWidth: number = 450, 
        nodeHeight: number = 200
    ): Position => {
        const MARGIN = 30; // 노드 간 최소 간격
        const MAX_ATTEMPTS = 50; // 최대 시도 횟수
        
        let testPosition = { ...basePosition };
        
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            let overlapping = false;
            
            // 캔버스 경계 확인
            if (!isPositionValid(testPosition, nodeWidth, nodeHeight)) {
                overlapping = true;
            }
            
            // 기존 노드들과 겹치는지 검사
            if (!overlapping) {
                for (const existingNode of nodes) {
                    const dx = Math.abs(testPosition.x - existingNode.position.x);
                    const dy = Math.abs(testPosition.y - existingNode.position.y);
                    
                    if (dx < (nodeWidth + MARGIN) && dy < (nodeHeight + MARGIN)) {
                        overlapping = true;
                        break;
                    }
                }
            }
            
            // 이미 배치된 예측 노드들과 겹치는지 검사
            if (!overlapping) {
                for (const predictedNode of existingPredictedNodes) {
                    const dx = Math.abs(testPosition.x - predictedNode.position.x);
                    const dy = Math.abs(testPosition.y - predictedNode.position.y);
                    
                    if (dx < (nodeWidth + MARGIN) && dy < (nodeHeight + MARGIN)) {
                        overlapping = true;
                        break;
                    }
                }
            }
            
            if (!overlapping) {
                return testPosition;
            }
            
            // 겹치면 위치 조정 (나선형으로 확장)
            const angle = attempt * 0.8;
            const radius = 80 + (attempt * 40);
            testPosition = {
                x: basePosition.x + Math.cos(angle) * radius,
                y: basePosition.y + Math.sin(angle) * radius
            };
        }
        
        return testPosition; // 최대 시도 후에도 겹치면 마지막 위치 반환
    };

    // 예측 노드들을 생성하는 함수 (개선된 레이아웃)
    const generatePredictedNodes = (outputType: string, sourcePos: Position): PredictedNode[] => {
        const compatibleNodes = findCompatibleNodes(outputType);
        const predicted: PredictedNode[] = [];
        
        // 노드 배치를 위한 기본 설정
        const NODE_WIDTH = 450;
        const NODE_HEIGHT = 200;
        const BASE_DISTANCE = 280; // 소스에서의 기본 거리
        const VERTICAL_SPACING = 240; // 수직 간격
        const HORIZONTAL_SPACING = 500; // 수평 간격
        
        if (compatibleNodes.length === 0) return predicted;
        
        // 노드 개수에 따른 배치 전략
        if (compatibleNodes.length === 1) {
            // 단일 노드는 오른쪽에 배치
            const position = findNonOverlappingPosition({
                x: sourcePos.x + BASE_DISTANCE,
                y: sourcePos.y
            }, [], NODE_WIDTH, NODE_HEIGHT);
            
            predicted.push({
                id: `predicted-${compatibleNodes[0].id}-${Date.now()}-0`,
                nodeData: compatibleNodes[0],
                position,
                isHovered: false
            });
        } else if (compatibleNodes.length <= 4) {
            // 2-4개 노드는 수직 배치
            const totalHeight = (compatibleNodes.length - 1) * VERTICAL_SPACING;
            const startY = sourcePos.y - totalHeight / 2;
            
            compatibleNodes.forEach((nodeData, index) => {
                const basePos = {
                    x: sourcePos.x + BASE_DISTANCE,
                    y: startY + (index * VERTICAL_SPACING)
                };
                
                const position = findNonOverlappingPosition(basePos, predicted, NODE_WIDTH, NODE_HEIGHT);
                
                predicted.push({
                    id: `predicted-${nodeData.id}-${Date.now()}-${index}`,
                    nodeData,
                    position,
                    isHovered: false
                });
            });
        } else {
            // 5개 이상은 격자 형태로 배치
            const cols = Math.min(3, Math.ceil(Math.sqrt(compatibleNodes.length))); // 최대 3열
            const rows = Math.ceil(compatibleNodes.length / cols);
            
            compatibleNodes.forEach((nodeData, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                
                const basePos = {
                    x: sourcePos.x + BASE_DISTANCE + (col * HORIZONTAL_SPACING),
                    y: sourcePos.y - ((rows - 1) * VERTICAL_SPACING) / 2 + (row * VERTICAL_SPACING)
                };
                
                const position = findNonOverlappingPosition(basePos, predicted, NODE_WIDTH, NODE_HEIGHT);
                
                predicted.push({
                    id: `predicted-${nodeData.id}-${Date.now()}-${index}`,
                    nodeData,
                    position,
                    isHovered: false
                });
            });
        }
        
        return predicted;
    };

    // 예측 노드의 hover 상태를 업데이트하는 함수
    const handlePredictedNodeHover = useCallback((nodeId: string, isHovered: boolean): void => {
        setPredictedNodes(prev => prev.map(node => 
            node.id === nodeId ? { ...node, isHovered } : node
        ));
    }, []);

    // 예측 노드를 실제 노드로 변환하는 함수
    const handlePredictedNodeClick = useCallback((nodeData: NodeData, position: Position): void => {
        const newNode: CanvasNode = {
            id: `${nodeData.id}-${Date.now()}`,
            data: nodeData,
            position: position
        };
        
        setNodes(prev => [...prev, newNode]);
        setPredictedNodes([]); // 예측 노드들 제거
        setIsDraggingOutput(false);
        setCurrentOutputType(null);
    }, []);

    // 노드 ID가 예측 노드인지 확인하는 함수
    const isPredictedNodeId = useCallback((nodeId: string): boolean => {
        return nodeId.startsWith('predicted-');
    }, []);

    // 예측 노드를 실제 노드로 변환하면서 연결까지 처리하는 함수
    const convertPredictedNodeAndConnect = useCallback((
        predictedNodeId: string,
        targetPortId: string,
        targetPortType: 'input' | 'output',
        sourceConnection: { nodeId: string, portId: string, portType: string, type: string }
    ): CanvasNode | null => {
        const predictedNode = predictedNodes.find(pNode => pNode.id === predictedNodeId);
        if (!predictedNode) return null;

        // 예측 노드를 실제 노드로 변환
        const newNode: CanvasNode = {
            id: `${predictedNode.nodeData.id}-${Date.now()}`,
            data: predictedNode.nodeData,
            position: predictedNode.position
        };

        // 노드 추가
        setNodes(prev => [...prev, newNode]);

        // 에지 연결 생성
        const newEdgeSignature = `${sourceConnection.nodeId}:${sourceConnection.portId}-${newNode.id}:${targetPortId}`;
        const newEdge: CanvasEdge = {
            id: `edge-${newEdgeSignature}-${Date.now()}`,
            source: {
                nodeId: sourceConnection.nodeId,
                portId: sourceConnection.portId,
                portType: sourceConnection.portType as 'input' | 'output'
            },
            target: {
                nodeId: newNode.id,
                portId: targetPortId,
                portType: targetPortType
            }
        };

        setEdges(prev => [...prev, newEdge]);
        
        // 예측 노드들 정리
        setPredictedNodes([]);
        setIsDraggingOutput(false);
        setCurrentOutputType(null);

        devLog.log('Predicted node converted and connected:', {
            newNodeId: newNode.id,
            edgeId: newEdge.id,
            source: newEdge.source,
            target: newEdge.target
        });

        return newNode;
    }, [predictedNodes]);

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
        const target = e.target as HTMLElement;
        const isParameterInput = target.matches('input, select, option') ||
                                target.classList.contains('paramInput') ||
                                target.classList.contains('paramSelect') ||
                                target.closest('.param') ||
                                target.closest('[class*="param"]');

        if (isParameterInput) {
            devLog.log('Canvas mousedown blocked for parameter input:', target);
            return;
        }

        if (e.button !== 0) return;
        
        // 캔버스 클릭 시 예측 노드들 제거
        if (isDraggingOutput) {
            devLog.log('Canvas clicked, removing predicted nodes');
            setPredictedNodes([]);
            setIsDraggingOutput(false);
            setCurrentOutputType(null);
        }
        
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setDragState({ type: 'canvas', startX: e.clientX - view.x, startY: e.clientY - view.y });
    };

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
        if (dragState.type === 'none') return;

        if (dragState.type === 'canvas') {
            setView(prev => ({ ...prev, x: e.clientX - (dragState.startX || 0), y: e.clientY - (dragState.startY || 0) }));
        } else if (dragState.type === 'node') {
            const newX = (e.clientX / view.scale) - (dragState.offsetX || 0);
            const newY = (e.clientY / view.scale) - (dragState.offsetY || 0);
            setNodes(prevNodes =>
                prevNodes.map(node =>
                    node.id === dragState.nodeId ? { ...node, position: { x: newX, y: newY } } : node
                )
            );
        } else if (dragState.type === 'edge') {
            const container = containerRef.current;
            if (!container || !edgePreviewRef.current) return;

            const rect = container.getBoundingClientRect();
            const mousePos: Position = {
                x: (e.clientX - rect.left - view.x) / view.scale,
                y: (e.clientY - rect.top - view.y) / view.scale,
            };

            setEdgePreview(prev => prev ? { ...prev, targetPos: mousePos } : null);

            let closestPortKey: string | null = null;
            let minSnapDistance = SNAP_DISTANCE;
            const edgeSource = edgePreviewRef.current.source;

            if (edgeSource) {
                // 기존 노드들의 포트 검사
                portRefs.current.forEach((_, key) => {
                    const parts = key.split('__PORTKEYDELIM__');
                    if (parts.length !== 3) return;
                    const [targetNodeId, , targetPortType] = parts;
                    if (targetPortType === 'input' && edgeSource.nodeId !== targetNodeId) {
                        const targetPortWorldPos = portPositions[key];
                        if (targetPortWorldPos) {
                            const distance = calculateDistance(mousePos, targetPortWorldPos);
                            if (distance < minSnapDistance) {
                                minSnapDistance = distance;
                                closestPortKey = key;
                            }
                        }
                    }
                });

                // 예측 노드들의 포트도 검사
                predictedNodes.forEach(predictedNode => {
                    if (predictedNode.nodeData.inputs) {
                        predictedNode.nodeData.inputs.forEach(inputPort => {
                            // 예측 노드의 input 포트에 대한 가상 포지션 계산
                            const virtualPortPos = {
                                x: predictedNode.position.x - 20, // 노드 왼쪽에 포트가 있다고 가정
                                y: predictedNode.position.y + 50 // 적절한 오프셋
                            };
                            
                            const distance = calculateDistance(mousePos, virtualPortPos);
                            if (distance < minSnapDistance && areTypesCompatible(edgeSource.type, inputPort.type)) {
                                minSnapDistance = distance;
                                closestPortKey = `${predictedNode.id}__PORTKEYDELIM__${inputPort.id}__PORTKEYDELIM__input`;
                            }
                        });
                    }
                });

                if (closestPortKey && typeof closestPortKey === 'string') {
                    // TypeScript sometimes infers never, so force string
                    const keyStr: string = closestPortKey as string;
                    const parts = keyStr.split('__PORTKEYDELIM__');
                    
                    // 예측 노드인지 확인
                    if (isPredictedNodeId(parts[0])) {
                        const predictedNode = predictedNodes.find(pNode => pNode.id === parts[0]);
                        if (predictedNode && predictedNode.nodeData.inputs) {
                            const targetPort = predictedNode.nodeData.inputs.find(port => port.id === parts[1]);
                            const isValid = targetPort ? areTypesCompatible(edgeSource.type, targetPort.type) : false;
                            setIsSnapTargetValid(isValid);
                        }
                    } else {
                        const targetPort = findPortData(parts[0], parts[1], parts[2]);
                        const isValid = targetPort ? areTypesCompatible(edgeSource.type, targetPort.type) : false;
                        setIsSnapTargetValid(isValid);
                    }
                } else {
                    setIsSnapTargetValid(true);
                }
            }
            setSnappedPortKey(closestPortKey);
        }
    }, [dragState, view, portPositions, calculateDistance, predictedNodes, isPredictedNodeId, areTypesCompatible, findPortData]);

    const handleKeyDown = useCallback((e: KeyboardEvent): void => {
        // Skip input field events
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
            return;
        }

        const isCtrlOrCmd = e.ctrlKey || e.metaKey;

        if (isCtrlOrCmd && e.key === 'c') {
            e.preventDefault();
            copySelectedNode();
        }
        else if (isCtrlOrCmd && e.key === 'v') {
            e.preventDefault();
            pasteNode();
        }
        else if (isCtrlOrCmd && e.key === 'z') {
            e.preventDefault();
            if (lastDeleted) {
                setNodes(prev => [...prev, lastDeleted.node]);
                setEdges(prev => [...prev, ...lastDeleted.edges]);
                setLastDeleted(null);
                devLog.log('Node restored:', lastDeleted.node.data.nodeName);
            }
        }
        else if (e.key === 'Delete' && selectedNodeId) {
            e.preventDefault();
            const nodeToDelete = nodes.find(node => node.id === selectedNodeId);
            if (nodeToDelete) {
                const connectedEdges = edges.filter(edge => edge.source.nodeId === selectedNodeId || edge.target.nodeId === selectedNodeId);
                setLastDeleted({ node: nodeToDelete, edges: connectedEdges });

                setNodes(prev => prev.filter(node => node.id !== selectedNodeId));
                setEdges(prev => prev.filter(edge => edge.source.nodeId !== selectedNodeId && edge.target.nodeId !== selectedNodeId));
                setSelectedNodeId(null);
                devLog.log('Node deleted and saved for undo:', nodeToDelete.data.nodeName);
            }
        }
    }, [selectedNodeId, copiedNode, nodes, edges, lastDeleted]);

    const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string): void => {
        if (e.button !== 0) return;
        setSelectedNodeId(nodeId);
        setSelectedEdgeId(null);
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            setDragState({
                type: 'node',
                nodeId,
                offsetX: (e.clientX / view.scale) - node.position.x,
                offsetY: (e.clientY / view.scale) - node.position.y,
            });
        }
    }, [nodes, view.scale]);

    const handleEdgeClick = useCallback((edgeId: string): void => {
        setSelectedEdgeId(edgeId);
        setSelectedNodeId(null);
    }, []);

    const handlePortMouseUp = useCallback((data: PortMouseEventData): void => {
        const { nodeId, portId, portType, type } = data;
        const currentEdgePreview = edgePreviewRef.current;
        if (!currentEdgePreview) return;

        if (currentEdgePreview && !areTypesCompatible(currentEdgePreview.source.type, type)) {
            setSnappedPortKey(null);
            setIsSnapTargetValid(true);
            setEdgePreview(null);
            return;
        }

        if (!currentEdgePreview || currentEdgePreview.source.portType === portType) {
            setEdgePreview(null);
            return;
        };

        const sourceNodeId = currentEdgePreview.source.nodeId;
        if (sourceNodeId === nodeId) {
            setEdgePreview(null);
            return;
        }

        // 예측 노드와 연결하는 경우
        if (isPredictedNodeId(nodeId)) {
            devLog.log('Connecting to predicted node:', nodeId);
            convertPredictedNodeAndConnect(
                nodeId,
                portId,
                portType,
                currentEdgePreview.source
            );
            setEdgePreview(null);
            setSnappedPortKey(null);
            setIsSnapTargetValid(true);
            return;
        }

        // 기존 노드와 연결하는 경우 - 예측 노드들 모두 제거
        if (isDraggingOutput) {
            devLog.log('Connecting to existing node, removing predicted nodes');
            setPredictedNodes([]);
            setIsDraggingOutput(false);
            setCurrentOutputType(null);
        }

        const newEdgeSignature = `${currentEdgePreview.source.nodeId}:${currentEdgePreview.source.portId}-${nodeId}:${portId}`;
        const isDuplicate = edges.some(edge =>
            `${edge.source.nodeId}:${edge.source.portId}-${edge.target.nodeId}:${edge.target.portId}` === newEdgeSignature
        );

        if (isDuplicate) {
            setEdgePreview(null);
            return;
        }

        let newEdges = [...edges];
        if (portType === 'input') {
            const targetPort = findPortData(nodeId, portId, 'input');
            if (targetPort && !targetPort.multi) {
                newEdges = newEdges.filter(edge => !(edge.target.nodeId === nodeId && edge.target.portId === portId));
            }
        }

        const newEdge: CanvasEdge = {
            id: `edge-${newEdgeSignature}-${Date.now()}`,
            source: currentEdgePreview.source,
            target: { nodeId, portId, portType }
        };
        setEdges([...newEdges, newEdge]);
        setEdgePreview(null);
        setSnappedPortKey(null);
        setIsSnapTargetValid(true);
    }, [edges, nodes, isPredictedNodeId, convertPredictedNodeAndConnect, isDraggingOutput]);

    const handleMouseUp = useCallback((): void => {
        setDragState({ type: 'none' });

        if (dragState.type === 'edge') {
            const snappedKey = snappedPortKeyRef.current;
            if (snappedKey) {
                const source = edgePreviewRef.current?.source;
                const parts = snappedKey.split('__PORTKEYDELIM__');
                const [targetNodeId, targetPortId, targetPortType] = parts;

                let targetPortData: Port | null = null;
                let targetPortDataType: string = '';

                // 예측 노드인지 확인
                if (isPredictedNodeId(targetNodeId)) {
                    const predictedNode = predictedNodes.find(pNode => pNode.id === targetNodeId);
                    if (predictedNode && predictedNode.nodeData.inputs) {
                        targetPortData = predictedNode.nodeData.inputs.find(port => port.id === targetPortId) || null;
                        targetPortDataType = targetPortData?.type || '';
                    }
                } else {
                    targetPortData = findPortData(targetNodeId, targetPortId, targetPortType);
                    targetPortDataType = targetPortData?.type || '';
                }

                if (source && targetPortData && areTypesCompatible(source.type, targetPortDataType)) {
                    handlePortMouseUp({
                        nodeId: targetNodeId,
                        portId: targetPortId,
                        portType: targetPortType as 'input' | 'output',
                        type: targetPortDataType
                    });
                }
            }
        }

        setEdgePreview(null);
        setSnappedPortKey(null);
        setIsSnapTargetValid(true);
        
        // 예측 노드들 정리
        if (isDraggingOutput) {
            setPredictedNodes([]);
            setIsDraggingOutput(false);
            setCurrentOutputType(null);
        }

    }, [dragState.type, handlePortMouseUp, isDraggingOutput, isPredictedNodeId, predictedNodes]);

    const handlePortMouseDown = useCallback((data: PortMouseEventData): void => {
        const { nodeId, portId, portType, isMulti, type } = data;

        if (portType === 'input') {
            let existingEdge: CanvasEdge | undefined;
            if (!isMulti) {
                existingEdge = edges.find(e => e.target.nodeId === nodeId && e.target.portId === portId);
            } else {
                existingEdge = edges.findLast(e => e.target.nodeId === nodeId && e.target.portId === portId);
            }
            if (existingEdge) {
                setDragState({ type: 'edge' });
                devLog.log(existingEdge);
                const sourcePosKey = `${existingEdge.source.nodeId}__PORTKEYDELIM__${existingEdge.source.portId}__PORTKEYDELIM__${existingEdge.source.portType}`;
                const sourcePos = portPositions[sourcePosKey];
                const targetPosKey = `${existingEdge.target.nodeId}__PORTKEYDELIM__${existingEdge.target.portId}__PORTKEYDELIM__${existingEdge.target.portType}`;
                const targetPos = portPositions[targetPosKey];

                const sourcePortData = findPortData(existingEdge.source.nodeId, existingEdge.source.portId, existingEdge.source.portType);

                if (sourcePos && sourcePortData) {
                    setEdgePreview({
                        source: { ...existingEdge.source, type: sourcePortData.type },
                        startPos: sourcePos,
                        targetPos: targetPos
                    });
                }

                setEdges(prevEdges => prevEdges.filter(e => e.id !== existingEdge.id));
                return;
            }
        }

        if (portType === 'output') {
            setDragState({ type: 'edge' });
            setIsDraggingOutput(true);
            setCurrentOutputType(type);
            
            const startPosKey = `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;
            const startPos = portPositions[startPosKey];
            if (startPos) {
                setEdgePreview({ source: { nodeId, portId, portType, type }, startPos, targetPos: startPos });
                // 예측 노드들 생성
                const predicted = generatePredictedNodes(type, startPos);
                setPredictedNodes(predicted);
            }
            return;
        }
    }, [edges, portPositions, nodes, availableNodeSpecs, generatePredictedNodes, predictedNodes]);

    useEffect(() => {
        nodesRef.current = nodes;
        edgePreviewRef.current = edgePreview;
        snappedPortKeyRef.current = snappedPortKey;
        isSnapTargetValidRef.current = isSnapTargetValid;
    }, [nodes, edgePreview, snappedPortKey, isSnapTargetValid]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleWheel = (e: WheelEvent): void => {
            e.preventDefault();
            setView(prevView => {
                const delta = e.deltaY > 0 ? -1 : 1;
                const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prevView.scale + delta * ZOOM_SENSITIVITY * prevView.scale));
                if (newScale === prevView.scale) return prevView;
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const worldX = (mouseX - prevView.x) / prevView.scale;
                const worldY = (mouseY - prevView.y) / prevView.scale;
                const newX = mouseX - worldX * newScale;
                const newY = mouseY - worldY * newScale;
                return { x: newX, y: newY, scale: newScale };
            });
        };
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('keydown', handleKeyDown);
            container.setAttribute('tabindex', '0');

            return () => {
                container.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [handleKeyDown]);

    useEffect(() => {
        const container = containerRef.current;
        const content = contentRef.current;
        if (container && content) {
            const centeredView = getCenteredView();
            setView(centeredView);
        }
    }, []);

    useEffect(() => {
        devLog.log('Canvas mounted, checking initial state');
        if (onStateChange && (nodes.length > 0 || edges.length > 0)) {
            devLog.log('Canvas has content, sending initial state');
            const initialState: CanvasState = { view, nodes, edges };
            onStateChange(initialState);
        } else {
            devLog.log('Canvas is empty, not sending initial state to avoid overwriting localStorage');
        }
    }, []);

    // 사용 가능한 노드 스펙들을 로드하는 Effect (부모 컴포넌트에서 전달받거나 API에서 가져오기)
    useEffect(() => {
        // 이 부분은 실제로는 부모 컴포넌트에서 props로 전달받거나
        // context에서 가져오는 것이 더 적절할 수 있음
        // 현재는 빈 배열로 초기화하고 후에 설정할 수 있도록 함
        if (availableNodeSpecs.length === 0) {
            // TODO: 실제 노드 스펙 데이터를 가져오는 로직 필요
            devLog.log('Available node specs not loaded yet');
        }
    }, [availableNodeSpecs]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            // Skip input field events
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault(); // Prevent page back navigation
                if (selectedNodeId) {
                    setNodes(prev => prev.filter(node => node.id !== selectedNodeId));
                    setEdges(prev => prev.filter(edge => edge.source.nodeId !== selectedNodeId && edge.target.nodeId !== selectedNodeId));
                    setSelectedNodeId(null);
                } else if (selectedEdgeId) {
                    setEdges(prev => prev.filter(edge => edge.id !== selectedEdgeId));
                    setSelectedEdgeId(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeId, selectedEdgeId]);

    return (
        <div
            ref={containerRef}
            className={styles.canvasContainer}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => containerRef.current?.focus()}
            tabIndex={0}
            style={{ outline: 'none' }}
        >
            <div
                ref={contentRef}
                className={styles.canvasGrid}
                style={{
                    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                    transformOrigin: '0 0',
                }}
            >
                {nodes.map(node => (
                    <Node
                        key={node.id}
                        id={node.id}
                        data={node.data}
                        position={node.position}
                        onNodeMouseDown={handleNodeMouseDown}
                        isSelected={node.id === selectedNodeId}
                        onPortMouseDown={handlePortMouseDown}
                        onPortMouseUp={handlePortMouseUp}
                        registerPortRef={registerPortRef}
                        snappedPortKey={snappedPortKey}
                        onParameterChange={handleParameterChange}
                        onNodeNameChange={handleNodeNameChange}
                        isSnapTargetInvalid={Boolean(snappedPortKey?.startsWith(node.id) && !isSnapTargetValid)}
                        onClearSelection={() => setSelectedNodeId(null)}
                    />
                ))}
                
                {/* 예측 노드들 렌더링 */}
                {predictedNodes.map(predictedNode => (
                    <Node
                        key={predictedNode.id}
                        id={predictedNode.id}
                        data={predictedNode.nodeData}
                        position={predictedNode.position}
                        onNodeMouseDown={handleNodeMouseDown}
                        isSelected={false}
                        onPortMouseDown={handlePortMouseDown}
                        onPortMouseUp={handlePortMouseUp}
                        registerPortRef={registerPortRef}
                        snappedPortKey={snappedPortKey}
                        onParameterChange={handleParameterChange}
                        onNodeNameChange={handleNodeNameChange}
                        isSnapTargetInvalid={false}
                        onClearSelection={() => setSelectedNodeId(null)}
                        isPredicted={true}
                        predictedOpacity={predictedNode.isHovered ? 1.0 : 0.3}
                        onPredictedNodeHover={handlePredictedNodeHover}
                        onPredictedNodeClick={handlePredictedNodeClick}
                    />
                ))}
                <svg className={styles.svgLayer}>
                    <g>
                        {edges
                            .filter(edge => edge.id !== selectedEdgeId)
                            .map(edge => {
                                const sourceKey = `${edge.source.nodeId}__PORTKEYDELIM__${edge.source.portId}__PORTKEYDELIM__${edge.source.portType}`;
                                const targetKey = `${edge.target.nodeId}__PORTKEYDELIM__${edge.target.portId}__PORTKEYDELIM__${edge.target.portType}`;
                                const sourcePos = portPositions[sourceKey];
                                const targetPos = portPositions[targetKey];
                                return <Edge
                                    key={edge.id}
                                    id={edge.id}
                                    sourcePos={sourcePos}
                                    targetPos={targetPos}
                                    onEdgeClick={handleEdgeClick}
                                    isSelected={false}
                                />;
                            })}

                        {edges
                            .filter(edge => edge.id === selectedEdgeId)
                            .map(edge => {
                                const sourceKey = `${edge.source.nodeId}__PORTKEYDELIM__${edge.source.portId}__PORTKEYDELIM__${edge.source.portType}`;
                                const targetKey = `${edge.target.nodeId}__PORTKEYDELIM__${edge.target.portId}__PORTKEYDELIM__${edge.target.portType}`;
                                const sourcePos = portPositions[sourceKey];
                                const targetPos = portPositions[targetKey];
                                return <Edge
                                    key={edge.id}
                                    id={edge.id}
                                    sourcePos={sourcePos}
                                    targetPos={targetPos}
                                    onEdgeClick={handleEdgeClick}
                                    isSelected={true}
                                />;
                            })}
                        {edgePreview?.targetPos && (
                            <Edge
                                sourcePos={edgePreview.startPos}
                                targetPos={edgePreview.targetPos}
                            />
                        )}
                    </g>
                </svg>
            </div>
        </div>
    );
});

Canvas.displayName = 'Canvas';
export default memo(Canvas);
