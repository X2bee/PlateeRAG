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
import SchemaProviderNode from '@/app/canvas/components/SpecialNode/SchemaProviderNode';
import Edge from '@/app/canvas/components/Edge';
import { devLog } from '@/app/_common/utils/logger';
import type {
    Position,
    View,
    Port,
    Parameter,
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

const Canvas = forwardRef<CanvasRef, CanvasProps>(({ onStateChange, nodesInitialized = false, onOpenNodeModal, ...otherProps }, ref) => {
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
    const [isDraggingInput, setIsDraggingInput] = useState<boolean>(false);
    const [currentOutputType, setCurrentOutputType] = useState<string | null>(null);
    const [currentInputType, setCurrentInputType] = useState<string | null>(null);

    // 포트 클릭/드래그 구분을 위한 상태
    const [portClickStart, setPortClickStart] = useState<{
        data: PortMouseEventData;
        timestamp: number;
        position: { x: number; y: number };
    } | null>(null);

    // 예측 노드 클릭 시 연결을 위한 소스 포트 정보 저장
    const [sourcePortForConnection, setSourcePortForConnection] = useState<{
        nodeId: string;
        portId: string;
        portType: string;
        type: string;
    } | null>(null);

    const nodesRef = useRef<CanvasNode[]>(nodes);
    const edgePreviewRef = useRef<EdgePreview | null>(edgePreview);
    const portRefs = useRef<Map<string, HTMLElement>>(new Map());
    const snappedPortKeyRef = useRef<string | null>(snappedPortKey);
    const isSnapTargetValidRef = useRef<boolean>(isSnapTargetValid);

    const VERTICAL_SPACING = 350; // 수직 간격 (노드 높이 + 여백)
    const HORIZONTAL_SPACING = 500; // 수평 간격 (노드 폭 + 여백)

    useLayoutEffect(() => {
        const newPortPositions: Record<string, Position> = {};
        const contentEl = contentRef.current;
        if (!contentEl) return;

        const contentRect = contentEl.getBoundingClientRect();

        // 포트 등록 상황 로그
        const predictedPortKeys = Array.from(portRefs.current.keys()).filter(key => key.includes('predicted-'));
        devLog.log('Port positions calculation triggered:', {
            totalPorts: portRefs.current.size,
            predictedPorts: predictedPortKeys.length,
            predictedPortKeys,
            predictedNodesCount: predictedNodes.length
        });

        portRefs.current.forEach((portEl, key) => {
            if (portEl) {
                const portRect = portEl.getBoundingClientRect();
                const x = (portRect.left + portRect.width / 2 - contentRect.left) / view.scale;
                const y = (portRect.top + portRect.height / 2 - contentRect.top) / view.scale;
                newPortPositions[key] = { x, y };

                // 예측 노드 포트인 경우 로그
                if (key.includes('predicted-')) {
                    devLog.log('Calculated predicted port position:', {
                        key, position: { x, y }
                    });
                }
            }
        });

        setPortPositions(newPortPositions);

        // 최종 결과 로그
        const finalPredictedPositions = Object.keys(newPortPositions).filter(key => key.includes('predicted-'));
        devLog.log('Port positions updated:', {
            totalPositions: Object.keys(newPortPositions).length,
            predictedPositions: finalPredictedPositions.length,
            predictedPositionKeys: finalPredictedPositions
        });
    }, [nodes, view.scale, predictedNodes]);

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
        const isPredicted = nodeId.startsWith('predicted-');

        if (isPredicted) {
            devLog.log('Registering predicted node port:', {
                nodeId, portId, portType, key, hasElement: !!el
            });
        }

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
        },
        updateNodeParameter: (nodeId: string, paramId: string, value: string): void => {
            setNodes(prev => prev.map(node => {
                if (node.id === nodeId && node.data.parameters) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            parameters: node.data.parameters.map(param =>
                                param.id === paramId ? { ...param, value } : param
                            )
                        }
                    };
                }
                return node;
            }));
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

    const handleSynchronizeSchema = useCallback((nodeId: string, portId: string): void => {
        devLog.log('=== Schema Synchronization Started ===');
        devLog.log('Target node ID:', nodeId, 'Port ID:', portId);

        // 해당 포트로 연결되는 edge 찾기
        const connectedEdge = edges.find(edge =>
            edge.target?.nodeId === nodeId && edge.target?.portId === portId
        );

        if (!connectedEdge) {
            devLog.warn('No connected edge found for synchronization');
            return;
        }

        // 연결된 source 노드 찾기 (SchemaProvider)
        const sourceNode = nodes.find(node =>
            node.id === connectedEdge.source.nodeId
        );

        if (!sourceNode) {
            devLog.warn('Source node not found');
            return;
        }

        // SchemaProvider 노드인지 확인
        const isSchemaProvider = sourceNode.data?.id === 'input_schema_provider' ||
                                 sourceNode.data?.id === 'output_schema_provider' ||
                                 sourceNode.data?.nodeName === 'Schema Provider(Input)';

        if (!isSchemaProvider) {
            devLog.warn('Source node is not a Schema Provider');
            return;
        }

        // handle_id가 true인 parameters 추출
        const schemaParameters = sourceNode.data.parameters?.filter(param =>
            param.handle_id === true
        ) || [];

        if (schemaParameters.length === 0) {
            devLog.warn('No schema parameters found in SchemaProvider');
            return;
        }

        devLog.log('Found schema parameters:', schemaParameters);

        // 타겟 노드에 파라미터 추가
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) {
                devLog.warn('Target node not found for synchronization');
                return prevNodes;
            }

            const targetNode = prevNodes[targetNodeIndex];
            const existingParams = targetNode.data.parameters || [];

            // 새로 추가할 파라미터들 (기존에 없는 key만)
            const newParameters: Parameter[] = [];

            schemaParameters.forEach(schemaParam => {
                // 이미 동일한 key가 존재하는지 확인
                const existingParam = existingParams.find(param =>
                    param.id === schemaParam.id || param.name === schemaParam.name
                );

                if (!existingParam) {
                    // 새로운 파라미터 생성 (value는 빈 값으로)
                    const newParam: Parameter = {
                        id: schemaParam.id,
                        name: schemaParam.name || schemaParam.id,
                        type: schemaParam.type || 'STR',
                        value: '', // 빈 값으로 설정
                        required: false,
                        is_added: true, // 동기화로 추가됨을 표시
                    };
                    newParameters.push(newParam);
                }
            });

            if (newParameters.length === 0) {
                devLog.log('No new parameters to add - all keys already exist');
                return prevNodes;
            }

            devLog.log('Adding new parameters:', newParameters);

            const updatedNode = {
                ...targetNode,
                data: {
                    ...targetNode.data,
                    parameters: [...existingParams, ...newParameters]
                }
            };

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                updatedNode,
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            devLog.log('Schema synchronization completed successfully');
            return newNodes;
        });

        devLog.log('=== Schema Synchronization Completed ===');
    }, [nodes, edges]);

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

    const handleParameterNameChange = useCallback((nodeId: string, paramId: string, newName: string): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) {
                return prevNodes;
            }

            const targetNode = prevNodes[targetNodeIndex];
            if (!targetNode.data.parameters || !Array.isArray(targetNode.data.parameters)) {
                return prevNodes;
            }

            const targetParamIndex = targetNode.data.parameters.findIndex(param => param.id === paramId);
            if (targetParamIndex === -1) {
                return prevNodes;
            }

            const targetParam = targetNode.data.parameters[targetParamIndex];
            if (targetParam.name === newName) {
                return prevNodes;
            }

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        parameters: [
                            ...targetNode.data.parameters.slice(0, targetParamIndex),
                            { ...targetParam, name: newName, id: newName },
                            ...targetNode.data.parameters.slice(targetParamIndex + 1)
                        ]
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    const handleParameterAdd = useCallback((nodeId: string, newParameter: Parameter): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) {
                return prevNodes;
            }

            const targetNode = prevNodes[targetNodeIndex];
            const existingParameters = targetNode.data.parameters || [];

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        parameters: [...existingParameters, newParameter]
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

            return newNodes;
        });
    }, []);

    const handleParameterDelete = useCallback((nodeId: string, paramId: string): void => {
        setNodes(prevNodes => {
            const targetNodeIndex = prevNodes.findIndex(node => node.id === nodeId);
            if (targetNodeIndex === -1) {
                return prevNodes;
            }

            const targetNode = prevNodes[targetNodeIndex];
            if (!targetNode.data.parameters || !Array.isArray(targetNode.data.parameters)) {
                return prevNodes;
            }

            const newNodes = [
                ...prevNodes.slice(0, targetNodeIndex),
                {
                    ...targetNode,
                    data: {
                        ...targetNode.data,
                        parameters: targetNode.data.parameters.filter(param => param.id !== paramId)
                    }
                },
                ...prevNodes.slice(targetNodeIndex + 1)
            ];

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

    // 주어진 출력 타입과 연결 가능한 노드들을 찾는 함수 (출력 포트 기반)
    const findCompatibleNodes = (outputType: string): NodeData[] => {
        return availableNodeSpecs.filter(nodeSpec => {
            if (!nodeSpec.inputs) return false;
            return nodeSpec.inputs.some(input => canConnectTypes(outputType, input.type));
        });
    };

    // 주어진 입력 타입과 연결 가능한 노드들을 찾는 함수 (입력 포트 기반)
    const findCompatibleOutputNodes = (inputType: string): NodeData[] => {
        return availableNodeSpecs.filter(nodeSpec => {
            if (!nodeSpec.outputs) return false;
            return nodeSpec.outputs.some(output => canConnectTypes(output.type, inputType));
        });
    };

    // // 캔버스 경계 내에서 유효한 위치인지 확인
    // const isPositionValid = (position: Position, nodeWidth: number = 450, nodeHeight: number = 200): boolean => {
    //     const container = containerRef.current;
    //     if (!container) return true;

    //     // 캔버스의 현재 뷰포트 고려
    //     const viewportMargin = 100; // 뷰포트 가장자리에서의 여백
    //     const minX = -view.x / view.scale + viewportMargin;
    //     const minY = -view.y / view.scale + viewportMargin;
    //     const maxX = (-view.x + container.clientWidth) / view.scale - nodeWidth - viewportMargin;
    //     const maxY = (-view.y + container.clientHeight) / view.scale - nodeHeight - viewportMargin;

    //     return position.x >= minX && position.x <= maxX && position.y >= minY && position.y <= maxY;
    // };

    // 출력 포트용 예측 노드들을 생성하는 함수 (마우스 기준 오른쪽에 격자 배치)
    const generatePredictedNodes = (outputType: string, targetPos: Position): PredictedNode[] => {
        const compatibleNodes = findCompatibleNodes(outputType);
        const predicted: PredictedNode[] = [];

        // 노드 배치를 위한 기본 설정
        const OFFSET_DISTANCE = 100; // 마우스 위치에서 떨어진 거리

        if (compatibleNodes.length === 0) return predicted;

        // 격자 배치 계산
        const cols = Math.min(3, Math.ceil(Math.sqrt(compatibleNodes.length))); // 최대 3열
        const rows = Math.ceil(compatibleNodes.length / cols);

        // 격자의 전체 크기 계산
        const totalGridWidth = (cols - 1) * HORIZONTAL_SPACING;
        const totalGridHeight = (rows - 1) * VERTICAL_SPACING;

        // 마우스 위치 기준 오른쪽에 격자 배치
        const startX = targetPos.x + OFFSET_DISTANCE; // 마우스 오른쪽에서 시작
        const startY = targetPos.y - totalGridHeight / 2; // 세로 중앙 정렬

        devLog.log('Generating output predicted nodes to the right of mouse:', {
            totalNodes: compatibleNodes.length,
            cols, rows,
            targetPos,
            startX, startY,
            gridSize: { width: totalGridWidth, height: totalGridHeight },
            direction: 'right'
        });

        compatibleNodes.forEach((nodeData, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);

            // 격자 위치 계산
            const position = {
                x: startX + (col * HORIZONTAL_SPACING),
                y: startY + (row * VERTICAL_SPACING)
            };

            devLog.log(`Output Node ${index} (${nodeData.id}): col=${col}, row=${row}, position=`, position);

            predicted.push({
                id: `predicted-${nodeData.id}-${Date.now()}-${index}`,
                nodeData,
                position,
                isHovered: false
            });
        });

        return predicted;
    };

    // 입력 포트용 예측 노드들을 생성하는 함수 (마우스 기준 왼쪽에 격자 배치)
    const generatePredictedOutputNodes = (inputType: string, targetPos: Position): PredictedNode[] => {
        const compatibleNodes = findCompatibleOutputNodes(inputType);
        const predicted: PredictedNode[] = [];

        // 노드 배치를 위한 기본 설정
        const OFFSET_DISTANCE = 550; // 마우스 위치에서 떨어진 거리 (노드 폭 + 여백)

        if (compatibleNodes.length === 0) return predicted;

        // 격자 배치 계산
        const cols = Math.min(3, Math.ceil(Math.sqrt(compatibleNodes.length))); // 최대 3열
        const rows = Math.ceil(compatibleNodes.length / cols);

        // 격자의 전체 크기 계산
        const totalGridWidth = (cols - 1) * HORIZONTAL_SPACING;
        const totalGridHeight = (rows - 1) * VERTICAL_SPACING;

        // 마우스 위치 기준 왼쪽에 격자 배치
        const startX = targetPos.x - OFFSET_DISTANCE - totalGridWidth; // 마우스 왼쪽에서 시작 (오른쪽 끝부터)
        const startY = targetPos.y - totalGridHeight / 2; // 세로 중앙 정렬

        devLog.log('Generating input predicted nodes to the left of mouse:', {
            totalNodes: compatibleNodes.length,
            cols, rows,
            targetPos,
            startX, startY,
            gridSize: { width: totalGridWidth, height: totalGridHeight },
            direction: 'left'
        });

        compatibleNodes.forEach((nodeData, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);

            // 격자 위치 계산
            const position = {
                x: startX + (col * HORIZONTAL_SPACING),
                y: startY + (row * VERTICAL_SPACING)
            };

            devLog.log(`Input Node ${index} (${nodeData.id}): col=${col}, row=${row}, position=`, position);

            predicted.push({
                id: `predicted-output-${nodeData.id}-${Date.now()}-${index}`,
                nodeData,
                position,
                isHovered: false
            });
        });

        return predicted;
    };

    // 예측 노드의 hover 상태를 업데이트하는 함수
    const handlePredictedNodeHover = useCallback((nodeId: string, isHovered: boolean): void => {
        setPredictedNodes(prev => prev.map(node =>
            node.id === nodeId ? { ...node, isHovered } : node
        ));
    }, []);

    // 예측 노드를 실제 노드로 변환하고 자동 연결하는 함수
    const handlePredictedNodeClick = useCallback((nodeData: NodeData, position: Position): void => {
        devLog.log('=== handlePredictedNodeClick called ===', {
            nodeData: nodeData.nodeName,
            isDraggingOutput,
            isDraggingInput,
            hasEdgePreview: !!edgePreviewRef.current
        });

        const newNode: CanvasNode = {
            id: `${nodeData.id}-${Date.now()}`,
            data: nodeData,
            position: position
        };

        // 현재 드래그 중인 포트 정보 가져오기
        const currentEdgePreview = edgePreviewRef.current;
        let newEdge: CanvasEdge | null = null;

        devLog.log('Edge preview details:', currentEdgePreview);
        devLog.log('Source port for connection:', sourcePortForConnection);

        // edgePreview가 없으면 저장된 소스 포트 정보 사용
        const sourceConnection = currentEdgePreview?.source || sourcePortForConnection;

        if (sourceConnection && (isDraggingOutput || isDraggingInput)) {

            if (isDraggingOutput && nodeData.inputs) {
                // 출력 포트에서 드래그한 경우 - 예측 노드의 호환되는 입력 포트 찾기
                devLog.log('Looking for compatible input ports:', {
                    sourceType: sourceConnection.type,
                    availableInputs: nodeData.inputs.map(input => ({ id: input.id, name: input.name, type: input.type }))
                });

                const compatibleInput = nodeData.inputs.find(input =>
                    areTypesCompatible(sourceConnection.type, input.type)
                );

                devLog.log('Compatible input found:', compatibleInput);

                if (compatibleInput) {
                    const newEdgeSignature = `${sourceConnection.nodeId}:${sourceConnection.portId}-${newNode.id}:${compatibleInput.id}`;
                    newEdge = {
                        id: `edge-${newEdgeSignature}-${Date.now()}`,
                        source: {
                            nodeId: sourceConnection.nodeId,
                            portId: sourceConnection.portId,
                            portType: sourceConnection.portType as 'input' | 'output',
                            type: sourceConnection.type,
                        },
                        target: {
                            nodeId: newNode.id,
                            portId: compatibleInput.id,
                            portType: 'input'
                        }
                    };

                    devLog.log('Created new edge for output connection:', newEdge);
                }
            } else if (isDraggingInput && nodeData.outputs) {
                // 입력 포트에서 드래그한 경우 - 예측 노드의 호환되는 출력 포트 찾기
                devLog.log('Looking for compatible output ports:', {
                    sourceType: sourceConnection.type,
                    availableOutputs: nodeData.outputs.map(output => ({ id: output.id, name: output.name, type: output.type }))
                });

                const compatibleOutput = nodeData.outputs.find(output =>
                    areTypesCompatible(output.type, sourceConnection.type)
                );

                devLog.log('Compatible output found:', compatibleOutput);

                if (compatibleOutput) {
                    const newEdgeSignature = `${newNode.id}:${compatibleOutput.id}-${sourceConnection.nodeId}:${sourceConnection.portId}`;
                    newEdge = {
                        id: `edge-${newEdgeSignature}-${Date.now()}`,
                        source: {
                            nodeId: newNode.id,
                            portId: compatibleOutput.id,
                            portType: 'output'
                        },
                        target: {
                            nodeId: sourceConnection.nodeId,
                            portId: sourceConnection.portId,
                            portType: sourceConnection.portType as 'input' | 'output'
                        }
                    };
                }
            }
        }

        // 노드 추가
        setNodes(prev => [...prev, newNode]);

        // 에지 추가 (있는 경우)
        if (newEdge) {
            setEdges(prev => [...prev, newEdge]);
            devLog.log('Auto-connected predicted node:', {
                nodeId: newNode.id,
                edgeId: newEdge.id,
                source: newEdge.source,
                target: newEdge.target
            });
        } else {
            devLog.log('No edge was created - missing conditions:', {
                hasEdgePreview: !!currentEdgePreview,
                isDraggingOutput,
                isDraggingInput,
                hasInputs: !!nodeData.inputs,
                hasOutputs: !!nodeData.outputs
            });
        }

        // 상태 정리
        setPredictedNodes([]);
        setIsDraggingOutput(false);
        setIsDraggingInput(false);
        setCurrentOutputType(null);
        setCurrentInputType(null);
        setEdgePreview(null);
        setSourcePortForConnection(null);

        devLog.log('Predicted node converted to actual node:', newNode.id);
    }, [isDraggingOutput, isDraggingInput, areTypesCompatible, sourcePortForConnection]);

    // 노드 ID가 예측 노드인지 확인하는 함수
    const isPredictedNodeId = useCallback((nodeId: string): boolean => {
        return nodeId.startsWith('predicted-') || nodeId.startsWith('predicted-output-');
    }, []);

    // 예측 노드를 실제 노드로 변환하면서 연결까지 처리하는 함수
    const convertPredictedNodeAndConnect = useCallback((
        predictedNodeId: string,
        targetPortId: string,
        targetPortType: 'input' | 'output',
        sourceConnection: { nodeId: string, portId: string, portType: string, type: string }
    ): CanvasNode | null => {
        devLog.log('=== convertPredictedNodeAndConnect called ===', {
            predictedNodeId, targetPortId, targetPortType, sourceConnection,
            predictedNodesCount: predictedNodes.length,
            isDraggingOutput, isDraggingInput
        });

        const predictedNode = predictedNodes.find(pNode => pNode.id === predictedNodeId);
        if (!predictedNode) {
            devLog.log('ERROR: Predicted node not found:', predictedNodeId);
            return null;
        }

        devLog.log('Found predicted node:', predictedNode);

        // 예측 노드를 실제 노드로 변환
        const newNode: CanvasNode = {
            id: `${predictedNode.nodeData.id}-${Date.now()}`,
            data: predictedNode.nodeData,
            position: predictedNode.position
        };

        devLog.log('Created new node:', newNode);

        // 노드 추가
        setNodes(prev => {
            const newNodes = [...prev, newNode];
            devLog.log('Updated nodes, new count:', newNodes.length);
            return newNodes;
        });

        // 에지 연결 생성 - 드래그 방향에 따라 source와 target 결정
        let newEdge: CanvasEdge;

        if (isDraggingOutput) {
            // 출력 포트에서 예측 노드의 입력 포트로 드래그
            const newEdgeSignature = `${sourceConnection.nodeId}:${sourceConnection.portId}-${newNode.id}:${targetPortId}`;
            newEdge = {
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
        } else if (isDraggingInput) {
            // 입력 포트에서 예측 노드의 출력 포트로 드래그
            // 예측 노드의 출력 포트가 source, 원본 노드의 입력 포트가 target
            const newEdgeSignature = `${newNode.id}:${targetPortId}-${sourceConnection.nodeId}:${sourceConnection.portId}`;
            newEdge = {
                id: `edge-${newEdgeSignature}-${Date.now()}`,
                source: {
                    nodeId: newNode.id,
                    portId: targetPortId,
                    portType: 'output' // 예측 노드의 출력 포트
                },
                target: {
                    nodeId: sourceConnection.nodeId,
                    portId: sourceConnection.portId,
                    portType: 'input' // 원본 노드의 입력 포트
                }
            };
        } else {
            devLog.log('ERROR: Neither isDraggingOutput nor isDraggingInput is true');
            return null;
        }

        devLog.log('Created new edge:', newEdge);

        setEdges(prev => {
            const newEdges = [...prev, newEdge];
            devLog.log('Updated edges, new count:', newEdges.length);
            return newEdges;
        });

        // 예측 노드들 정리
        setPredictedNodes([]);
        setIsDraggingOutput(false);
        setIsDraggingInput(false);
        setCurrentOutputType(null);
        setCurrentInputType(null);

        devLog.log('Predicted node converted and connected successfully:', {
            newNodeId: newNode.id,
            edgeId: newEdge.id,
            source: newEdge.source,
            target: newEdge.target
        });

        return newNode;
    }, [predictedNodes, isDraggingOutput, isDraggingInput]);

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
        if (isDraggingOutput || isDraggingInput) {
            devLog.log('Canvas clicked, removing predicted nodes');
            setPredictedNodes([]);
            setIsDraggingOutput(false);
            setIsDraggingInput(false);
            setCurrentOutputType(null);
            setCurrentInputType(null);
            setSourcePortForConnection(null);
        }

        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setDragState({ type: 'canvas', startX: e.clientX - view.x, startY: e.clientY - view.y });
    };

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
        if (dragState.type === 'none') return;

        // 드래그 시작 시 포트 클릭 정보 초기화 (드래그로 전환)
        if (portClickStart) {
            setPortClickStart(null);
        }

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

                // 예측 노드들의 포트도 검사 - 실제 포트 위치 사용
                if (predictedNodes.length > 0) {
                    devLog.log('Checking predicted nodes, available portPositions keys:',
                        Object.keys(portPositions).filter(key => key.includes('predicted-')));
                }

                predictedNodes.forEach(predictedNode => {
                    // 출력 포트 기반 드래그 (기존 로직): 예측 노드의 입력 포트 확인
                    if (isDraggingOutput && predictedNode.nodeData.inputs) {
                        predictedNode.nodeData.inputs.forEach(inputPort => {
                            // 예측 노드의 실제 포트 위치 사용
                            const portKey = `${predictedNode.id}__PORTKEYDELIM__${inputPort.id}__PORTKEYDELIM__input`;
                            const actualPortPos = portPositions[portKey];

                            if (actualPortPos) {
                                const distance = calculateDistance(mousePos, actualPortPos);
                                const isCompatible = areTypesCompatible(edgeSource.type, inputPort.type);

                                // 디버그 로그
                                if (distance < 50) { // 가까운 거리에서만 로그
                                    devLog.log('Predicted input port check:', {
                                        portKey,
                                        distance,
                                        isCompatible,
                                        edgeSourceType: edgeSource.type,
                                        inputPortType: inputPort.type,
                                        minSnapDistance,
                                        actualPortPos
                                    });
                                }

                                if (distance < minSnapDistance && isCompatible) {
                                    minSnapDistance = distance;
                                    closestPortKey = portKey;
                                    devLog.log('New closest predicted input port found:', portKey, distance);
                                }
                            }
                        });
                    }

                    // 입력 포트 기반 드래그: 예측 노드의 출력 포트 확인
                    if (isDraggingInput && predictedNode.nodeData.outputs) {
                        predictedNode.nodeData.outputs.forEach(outputPort => {
                            // 예측 노드의 실제 포트 위치 사용
                            const portKey = `${predictedNode.id}__PORTKEYDELIM__${outputPort.id}__PORTKEYDELIM__output`;
                            const actualPortPos = portPositions[portKey];

                            if (actualPortPos) {
                                const distance = calculateDistance(mousePos, actualPortPos);
                                const isCompatible = areTypesCompatible(outputPort.type, edgeSource.type);

                                // 디버그 로그
                                if (distance < 50) { // 가까운 거리에서만 로그
                                    devLog.log('Predicted output port check:', {
                                        portKey,
                                        distance,
                                        isCompatible,
                                        outputPortType: outputPort.type,
                                        edgeSourceType: edgeSource.type,
                                        minSnapDistance,
                                        actualPortPos
                                    });
                                }

                                if (distance < minSnapDistance && isCompatible) {
                                    minSnapDistance = distance;
                                    closestPortKey = portKey;
                                    devLog.log('New closest predicted output port found:', portKey, distance);
                                }
                            } else {
                                devLog.log('No port position found for predicted output port:', portKey);
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
                        if (predictedNode) {
                            // 입력 포트와 출력 포트 모두 확인
                            let targetPort: Port | null = null;
                            if (predictedNode.nodeData.inputs) {
                                targetPort = predictedNode.nodeData.inputs.find(port => port.id === parts[1]) || null;
                            }
                            if (!targetPort && predictedNode.nodeData.outputs) {
                                targetPort = predictedNode.nodeData.outputs.find(port => port.id === parts[1]) || null;
                            }
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
    }, [dragState, view, portPositions, calculateDistance, predictedNodes, isPredictedNodeId, areTypesCompatible, findPortData, isDraggingOutput, isDraggingInput]);

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

    const handlePortMouseUp = useCallback((data: PortMouseEventData, mouseEvent?: React.MouseEvent): void => {
        const { nodeId, portId, portType, type } = data;
        const currentEdgePreview = edgePreviewRef.current;

        devLog.log('=== handlePortMouseUp called ===', {
            nodeId, portId, portType, type,
            isPredicted: isPredictedNodeId(nodeId),
            edgePreview: currentEdgePreview
        });

        // 클릭과 드래그 구분
        const isClick = portClickStart && mouseEvent &&
            Date.now() - portClickStart.timestamp < 200 && // 200ms 이내
            Math.abs(mouseEvent.clientX - portClickStart.position.x) < 5 && // 5px 이내 이동
            Math.abs(mouseEvent.clientY - portClickStart.position.y) < 5;

        // 클릭인 경우 예측 노드 생성
        if (isClick && portClickStart &&
            portClickStart.data.nodeId === nodeId &&
            portClickStart.data.portId === portId &&
            portClickStart.data.portType === portType) {

            const portPosKey = `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;
            const portPos = portPositions[portPosKey];

            if (portPos) {
                // 소스 포트 정보 저장 (예측 노드 클릭 시 연결용)
                setSourcePortForConnection({
                    nodeId,
                    portId,
                    portType,
                    type
                });

                // 예측 노드 클릭 시 연결을 위해 edgePreview 설정
                setEdgePreview({
                    source: { nodeId, portId, portType, type },
                    startPos: portPos,
                    targetPos: portPos
                });

                // 드래깅 상태 설정 (예측 노드 클릭 시 연결을 위해 필요)
                if (portType === 'output') {
                    setIsDraggingOutput(true);
                    setCurrentOutputType(type);
                } else if (portType === 'input') {
                    setIsDraggingInput(true);
                    setCurrentInputType(type);
                }

                let predicted: PredictedNode[] = [];

                if (portType === 'output') {
                    predicted = generatePredictedNodes(type, portPos);
                    devLog.log('Generated predicted nodes for output port click:', predicted);
                } else if (portType === 'input') {
                    predicted = generatePredictedOutputNodes(type, portPos);
                    devLog.log('Generated predicted nodes for input port click:', predicted);
                }

                if (predicted.length > 0) {
                    setPredictedNodes(predicted);
                }
            }

            // 클릭 정보 초기화
            setPortClickStart(null);
            return;
        }

        // 클릭 정보 초기화
        setPortClickStart(null);

        if (!currentEdgePreview) return;

        if (currentEdgePreview && !areTypesCompatible(currentEdgePreview.source.type, type)) {
            devLog.log('Type incompatible, aborting connection');
            setSnappedPortKey(null);
            setIsSnapTargetValid(true);
            setEdgePreview(null);
            return;
        }

        if (!currentEdgePreview || currentEdgePreview.source.portType === portType) {
            devLog.log('Same port type, aborting connection');
            setEdgePreview(null);
            return;
        };

        const sourceNodeId = currentEdgePreview.source.nodeId;
        if (sourceNodeId === nodeId) {
            devLog.log('Same node, aborting connection');
            setEdgePreview(null);
            return;
        }

        // 예측 노드와 연결하는 경우
        if (isPredictedNodeId(nodeId)) {
            devLog.log('Connecting to predicted node:', nodeId, 'portId:', portId, 'portType:', portType);
            const result = convertPredictedNodeAndConnect(
                nodeId,
                portId,
                portType,
                currentEdgePreview.source
            );
            devLog.log('convertPredictedNodeAndConnect result:', result);
            setEdgePreview(null);
            setSnappedPortKey(null);
            setIsSnapTargetValid(true);
            return;
        }

        // 기존 노드와 연결하는 경우 - 예측 노드들 모두 제거
        if (isDraggingOutput || isDraggingInput) {
            devLog.log('Connecting to existing node, removing predicted nodes');
            setPredictedNodes([]);
            setIsDraggingOutput(false);
            setIsDraggingInput(false);
            setCurrentOutputType(null);
            setCurrentInputType(null);
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
        let newEdge: CanvasEdge;
        if (currentEdgePreview.source.portType === 'input') {
            const reversedEdgeSignature = `${nodeId}:${portId}-${currentEdgePreview.source.nodeId}:${currentEdgePreview.source.portId}`;
            newEdge = {
                id: `edge-${reversedEdgeSignature}-${Date.now()}`,
                source: { nodeId, portId, portType },
                target: currentEdgePreview.source,
            };

        } else {
            newEdge = {
                id: `edge-${newEdgeSignature}-${Date.now()}`,
                source: currentEdgePreview.source,
                target: { nodeId, portId, portType }
            };
        }
        setEdges([...newEdges, newEdge]);
        setEdgePreview(null);
        setSnappedPortKey(null);
        setIsSnapTargetValid(true);
    }, [edges, nodes, isPredictedNodeId, convertPredictedNodeAndConnect, isDraggingOutput, isDraggingInput]);

    const handleMouseUp = useCallback((e?: React.MouseEvent<HTMLDivElement>): void => {
        if (dragState.type === 'edge' && (isDraggingOutput || isDraggingInput) && !snappedPortKeyRef.current && e) {
            // 엣지 드래그 중 마우스를 떼는 위치에 예측 노드 생성
            const container = containerRef.current;
            if (container && edgePreviewRef.current) {
                const rect = container.getBoundingClientRect();
                const mousePos: Position = {
                    x: (e.clientX - rect.left - view.x) / view.scale,
                    y: (e.clientY - rect.top - view.y) / view.scale,
                };

                // 현재 드래그하는 포트의 타입에 따라 예측 노드 생성
                const sourceType = edgePreviewRef.current.source.type;
                let predicted: PredictedNode[] = [];

                if (isDraggingOutput) {
                    predicted = generatePredictedNodes(sourceType, mousePos);
                } else if (isDraggingInput) {
                    predicted = generatePredictedOutputNodes(sourceType, mousePos);
                }

                setPredictedNodes(predicted);
                // 드래그로 생성한 예측 노드 연결을 위한 소스 포트 정보 저장
                if (edgePreviewRef.current) {
                    setSourcePortForConnection({
                        nodeId: edgePreviewRef.current.source.nodeId,
                        portId: edgePreviewRef.current.source.portId,
                        portType: edgePreviewRef.current.source.portType as 'input' | 'output',
                        type: edgePreviewRef.current.source.type
                    });
                }
                setEdgePreview(null);
                setDragState({ type: 'none' });
                return;
            }
        }

        setDragState({ type: 'none' });

        if (dragState.type === 'edge') {
            const snappedKey = snappedPortKeyRef.current;
            if (snappedKey) {
                const source = edgePreviewRef.current?.source;
                const parts = snappedKey.split('__PORTKEYDELIM__');
                const [targetNodeId, targetPortId, targetPortType] = parts;

                let targetPortData: Port | null = null;
                let targetPortDataType: string = '';
                let isConnectedToPredicted = false;

                // 예측 노드인지 확인
                if (isPredictedNodeId(targetNodeId)) {
                    const predictedNode = predictedNodes.find(pNode => pNode.id === targetNodeId);
                    if (predictedNode) {
                        // 입력 포트와 출력 포트 모두 확인
                        if (predictedNode.nodeData.inputs) {
                            targetPortData = predictedNode.nodeData.inputs.find(port => port.id === targetPortId) || null;
                        }
                        if (!targetPortData && predictedNode.nodeData.outputs) {
                            targetPortData = predictedNode.nodeData.outputs.find(port => port.id === targetPortId) || null;
                        }
                        targetPortDataType = targetPortData?.type || '';
                        isConnectedToPredicted = true;
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

                    // 예측 노드에 연결된 경우, 예측 노드들이 이미 정리되었으므로 여기서 종료
                    if (isConnectedToPredicted) {
                        return;
                    }
                }
            }
        }

        setEdgePreview(null);
        setSnappedPortKey(null);
        setIsSnapTargetValid(true);

        // 일반적인 경우에만 예측 노드들 정리 (예측 노드 연결이 아닌 경우)
        if (isDraggingOutput || isDraggingInput) {
            // 예측 노드가 생성된 경우가 아닐 때만 정리
            if (predictedNodes.length === 0) {
                setIsDraggingOutput(false);
                setIsDraggingInput(false);
                setCurrentOutputType(null);
                setCurrentInputType(null);
                setSourcePortForConnection(null);
            }
        }

    }, [dragState.type, handlePortMouseUp, isDraggingOutput, isDraggingInput, isPredictedNodeId, predictedNodes, view, generatePredictedNodes, generatePredictedOutputNodes]);

    const handlePortMouseDown = useCallback((data: PortMouseEventData, mouseEvent?: React.MouseEvent): void => {
        const { nodeId, portId, portType, isMulti, type } = data;

        // 포트 클릭 시작 정보 저장
        if (mouseEvent) {
            setPortClickStart({
                data,
                timestamp: Date.now(),
                position: { x: mouseEvent.clientX, y: mouseEvent.clientY }
            });
        }

        if (portType === 'input') {
            let existingEdge: CanvasEdge | undefined;
            if (!isMulti) {
                existingEdge = edges.find(e => e.target.nodeId === nodeId && e.target.portId === portId);
            } else {
                existingEdge = edges.findLast(e => e.target.nodeId === nodeId && e.target.portId === portId);
            }
            if (existingEdge) {
                // 기존 엣지가 있으면 기존 로직 유지 (엣지 재연결)
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
            } else {
                // 드래그 시작 준비하고 소스 포트 정보 저장
                setDragState({ type: 'edge' });
                setIsDraggingInput(true);
                setCurrentInputType(type);

                // 소스 포트 정보 저장 (예측 노드 클릭 시 연결용)
                setSourcePortForConnection({
                    nodeId,
                    portId,
                    portType,
                    type
                });

                const startPosKey = `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;
                const startPos = portPositions[startPosKey];
                if (startPos) {
                    setEdgePreview({
                        source: { nodeId, portId, portType, type },
                        startPos,
                        targetPos: startPos
                    });
                }
                return;
            }
        }

        if (portType === 'output') {
            // 드래그 시작 준비하고 소스 포트 정보 저장
            setDragState({ type: 'edge' });
            setIsDraggingOutput(true);
            setCurrentOutputType(type);

            // 소스 포트 정보 저장 (예측 노드 클릭 시 연결용)
            setSourcePortForConnection({
                nodeId,
                portId,
                portType,
                type
            });

            const startPosKey = `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;
            const startPos = portPositions[startPosKey];
            if (startPos) {
                setEdgePreview({ source: { nodeId, portId, portType, type }, startPos, targetPos: startPos });
            }
            return;
        }
    }, [edges, portPositions, findPortData]);


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
                {nodes.map(node => {
                    const isSchemaProvider = node.data.id === 'input_schema_provider' || node.data.id === 'output_schema_provider';
                    if (isSchemaProvider) {
                        devLog.log(`Using SchemaProviderNode for: ${node.data.nodeName}`);
                        return (
                            <SchemaProviderNode
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
                                onParameterNameChange={handleParameterNameChange}
                                onParameterAdd={handleParameterAdd}
                                onParameterDelete={handleParameterDelete}
                                isSnapTargetInvalid={Boolean(snappedPortKey?.startsWith(node.id) && !isSnapTargetValid)}
                                onClearSelection={() => setSelectedNodeId(null)}
                                onOpenNodeModal={onOpenNodeModal}
                            />
                        );
                    }
                    return (
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
                            onParameterNameChange={handleParameterNameChange}
                            onParameterAdd={handleParameterAdd}
                            onParameterDelete={handleParameterDelete}
                            isSnapTargetInvalid={Boolean(snappedPortKey?.startsWith(node.id) && !isSnapTargetValid)}
                            onClearSelection={() => setSelectedNodeId(null)}
                            onOpenNodeModal={onOpenNodeModal}
                            onSynchronizeSchema={handleSynchronizeSchema}
                            currentNodes={nodes}
                            currentEdges={edges}
                        />
                    )
                })}

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
                        onParameterNameChange={handleParameterNameChange}
                        isPredicted={true}
                        predictedOpacity={predictedNode.isHovered ? 1.0 : 0.3}
                        onPredictedNodeHover={handlePredictedNodeHover}
                        onPredictedNodeClick={handlePredictedNodeClick}
                        onSynchronizeSchema={handleSynchronizeSchema}
                        currentNodes={nodes}
                        currentEdges={edges}
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
                                isPreview={true}
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
