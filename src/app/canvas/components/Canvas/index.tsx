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
import { devLog } from '@/app/_common/utils/logger';

// Hooks
import {
    useCanvasView,
    useCanvasSelection,
    useNodeManagement,
    useEdgeManagement,
    useDragState,
    usePredictedNodes,
    useCanvasEventHandlers,
    usePortHandlers,
    useKeyboardHandlers
} from './hooks';

// Components
import { CanvasNodes, CanvasPredictedNodes, CanvasEdges } from './components';

// Utils
import { areTypesCompatible, validateRequiredInputs } from './utils';

// Types
import type {
    Position,
    NodeData,
    CanvasNode,
    CanvasEdge,
    EdgePreview,
    CanvasState,
    PortMouseEventData,
    ExecutionValidationResult,
    CanvasProps,
    CanvasRef,
    Parameter,
    View
} from './types';

const Canvas = forwardRef<CanvasRef, CanvasProps>(({
    onStateChange,
    nodesInitialized = false,
    onOpenNodeModal,
    historyHelpers
}, ref) => {
    // Refs
    const contentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const portRefs = useRef<Map<string, HTMLElement>>(new Map());

    // Hooks
    const { view, setView, getCenteredView, handleWheel } = useCanvasView({
        containerRef,
        contentRef
    });

    const {
        selectedNodeId,
        selectedEdgeId,
        clearSelection,
        selectNode,
        selectEdge
    } = useCanvasSelection();

    const {
        nodes,
        setNodes,
        addNode,
        deleteNode,
        copyNode,
        pasteNode,
        updateNodeParameter,
        updateNodeName,
        updateParameterName,
        addParameter,
        deleteParameter
    } = useNodeManagement({ historyHelpers });

    const {
        edges,
        setEdges,
        addEdge,
        removeEdge,
        removeNodeEdges,
        isDuplicateEdge
    } = useEdgeManagement({ historyHelpers });

    const {
        dragState,
        startCanvasDrag,
        startNodeDrag,
        startEdgeDrag,
        stopDrag
    } = useDragState({ historyHelpers, nodes });

    // State for port interactions and edge preview
    const [edgePreview, setEdgePreview] = useState<EdgePreview | null>(null);
    const [portPositions, setPortPositions] = useState<Record<string, Position>>({});
    const [snappedPortKey, setSnappedPortKey] = useState<string | null>(null);
    const [isSnapTargetValid, setIsSnapTargetValid] = useState<boolean>(true);
    const [availableNodeSpecs, setAvailableNodeSpecs] = useState<NodeData[]>([]);
    const [, forceUpdate] = useState({});
    const [portClickStart, setPortClickStart] = useState<{
        data: PortMouseEventData;
        timestamp: number;
        position: { x: number; y: number };
    } | null>(null);

    // Predicted nodes hook
    const {
        predictedNodes,
        setPredictedNodes,
        isDraggingOutput,
        isDraggingInput,
        sourcePortForConnection,
        setIsDraggingOutput,
        setIsDraggingInput,
        setCurrentOutputType,
        setCurrentInputType,
        setSourcePortForConnection,
        generatePredictedNodes,
        generatePredictedOutputNodes,
        handlePredictedNodeHover,
        handlePredictedNodeClick: basePredictedNodeClick,
        clearPredictedNodes,
        isPredictedNodeId: isNodePredicted
    } = usePredictedNodes({
        availableNodeSpecs,
        areTypesCompatible
    });

    // Refs for accessing current state in callbacks
    const nodesRef = useRef<CanvasNode[]>(nodes);
    const edgesRef = useRef<CanvasEdge[]>(edges);
    const viewRef = useRef<View>(view);
    const edgePreviewRef = useRef<EdgePreview | null>(edgePreview);
    const snappedPortKeyRef = useRef<string | null>(snappedPortKey);
    const isSnapTargetValidRef = useRef<boolean>(isSnapTargetValid);

    // Update refs when state changes
    useEffect(() => {
        nodesRef.current = nodes;
        edgesRef.current = edges;
        viewRef.current = view;
        edgePreviewRef.current = edgePreview;
        snappedPortKeyRef.current = snappedPortKey;
        isSnapTargetValidRef.current = isSnapTargetValid;
    }, [nodes, edges, view, edgePreview, snappedPortKey, isSnapTargetValid]);

    // Port positions calculation
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
    }, [nodes, view.scale, predictedNodes]);

    // State change notification
    useEffect(() => {
        if (onStateChange) {
            const currentState: CanvasState = { view, nodes, edges };
            if (nodes.length > 0 || edges.length > 0) {
                onStateChange(currentState);
            }
        }
    }, [nodes, edges, view, onStateChange]);

    // Initialization effect
    useEffect(() => {
        if (!nodesInitialized) {
            devLog.log('Canvas mounted, waiting for nodes initialization...');
        } else {
            devLog.log('Canvas mounted, nodes already initialized');
        }
    }, [nodesInitialized]);

    // 히스토리 관리 설정 - 상태 캡처 함수 등록 (한 번만 실행)
    useEffect(() => {
        if (!historyHelpers) return;

        // 현재 상태 캡처 함수 설정 (ref를 사용하여 최신 상태 확보)
        if ('setCurrentStateCapture' in historyHelpers) {
            const setCurrentStateCapture = historyHelpers.setCurrentStateCapture as (captureFunction: () => any) => void;
            setCurrentStateCapture(() => {
                // ref를 통해 캡처 시점의 최신 상태를 반환
                return {
                    view: { ...viewRef.current },
                    nodes: [...nodesRef.current],
                    edges: [...edgesRef.current]
                };
            });
        }
    }, [setNodes, setEdges, setView]);

    // Port reference registration
    const registerPortRef = useCallback((nodeId: string, portId: string, portType: string, el: HTMLElement | null) => {
        const key = `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;

        if (el) {
            portRefs.current.set(key, el);
        } else {
            portRefs.current.delete(key);
        }
    }, []);

    // Enhanced predicted node click handler that integrates with edge creation
    const handlePredictedNodeClick = useCallback((nodeData: NodeData, position: Position): void => {
        devLog.log('=== handlePredictedNodeClick called ===');

        const newNode = basePredictedNodeClick(nodeData, position);
        if (!newNode) return;

        // Create edge if there's a connection source
        const currentEdgePreview = edgePreviewRef.current;
        const sourceConnection = currentEdgePreview?.source || sourcePortForConnection;

        if (sourceConnection && (isDraggingOutput || isDraggingInput)) {
            let newEdge: CanvasEdge | null = null;

            if (isDraggingOutput && nodeData.inputs) {
                const compatibleInput = nodeData.inputs.find(input =>
                    areTypesCompatible(sourceConnection.type, input.type)
                );

                if (compatibleInput) {
                    newEdge = {
                        id: `edge-${sourceConnection.nodeId}:${sourceConnection.portId}-${newNode.id}:${compatibleInput.id}-${Date.now()}`,
                        source: {
                            nodeId: sourceConnection.nodeId,
                            portId: sourceConnection.portId,
                            portType: sourceConnection.portType as 'input' | 'output'
                        },
                        target: {
                            nodeId: newNode.id,
                            portId: compatibleInput.id,
                            portType: 'input'
                        }
                    };
                }
            } else if (isDraggingInput && nodeData.outputs) {
                const compatibleOutput = nodeData.outputs.find(output =>
                    areTypesCompatible(output.type, sourceConnection.type)
                );

                if (compatibleOutput) {
                    newEdge = {
                        id: `edge-${newNode.id}:${compatibleOutput.id}-${sourceConnection.nodeId}:${sourceConnection.portId}-${Date.now()}`,
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

            if (newEdge) {
                // MULTI_ACTION으로 통합 히스토리 기록
                if (historyHelpers?.recordMultiAction) {
                    const actions = [
                        {
                            actionType: 'NODE_CREATE' as const,
                            nodeId: newNode.id,
                            nodeType: newNode.data.nodeName,
                            position: newNode.position
                        },
                        {
                            actionType: 'EDGE_CREATE' as const,
                            edgeId: newEdge.id,
                            sourceId: newEdge.source.nodeId,
                            targetId: newEdge.target.nodeId
                        }
                    ];

                    const description = `Created predicted node ${newNode.data.nodeName} with edge connection`;
                    historyHelpers.recordMultiAction(description, actions);
                }

                // Add node and edge without individual history recording
                addNode(newNode, true); // skipHistory = true
                addEdge(newEdge, true); // skipHistory = true
            } else {
                // No edge created, just add node normally
                addNode(newNode);
            }
        } else {
            // No connection source, just add node normally
            addNode(newNode);
        }

        // Clean up edge preview
        setEdgePreview(null);
        setSourcePortForConnection(null);
    }, [
        basePredictedNodeClick,
        addNode,
        addEdge,
        isDraggingOutput,
        isDraggingInput,
        sourcePortForConnection,
        setEdgePreview,
        setSourcePortForConnection,
        historyHelpers
    ]);

    // Schema synchronization
    const handleSynchronizeSchema = useCallback((nodeId: string, portId: string): void => {
        devLog.log('=== Schema Synchronization Started ===');

        const connectedEdge = edges.find(edge =>
            edge.target?.nodeId === nodeId && edge.target?.portId === portId
        );

        if (!connectedEdge) return;

        const sourceNode = nodes.find(node => node.id === connectedEdge.source.nodeId);
        if (!sourceNode) return;

        const isSchemaProvider = sourceNode.data?.id === 'input_schema_provider' ||
                                sourceNode.data?.id === 'output_schema_provider' ||
                                sourceNode.data?.nodeName === 'Schema Provider(Input)';

        if (!isSchemaProvider) return;

        const schemaParameters = sourceNode.data.parameters?.filter(param =>
            param.handle_id === true
        ) || [];

        if (schemaParameters.length === 0) return;

        const targetNodeIndex = nodes.findIndex(node => node.id === nodeId);
        if (targetNodeIndex === -1) return;

        const targetNode = nodes[targetNodeIndex];
        const existingParams = targetNode.data.parameters || [];

        const newParameters: Parameter[] = [];

        schemaParameters.forEach(schemaParam => {
            const existingParam = existingParams.find(param =>
                param.id === schemaParam.id || param.name === schemaParam.name
            );

            if (!existingParam) {
                const newParam: Parameter = {
                    id: schemaParam.id,
                    name: schemaParam.name || schemaParam.id,
                    type: schemaParam.type || 'STR',
                    value: '',
                    required: false,
                    is_added: true,
                };
                newParameters.push(newParam);
            }
        });

        if (newParameters.length === 0) return;

        const updatedNode = {
            ...targetNode,
            data: {
                ...targetNode.data,
                parameters: [...existingParams, ...newParameters]
            }
        };

        const newNodes = [
            ...nodes.slice(0, targetNodeIndex),
            updatedNode,
            ...nodes.slice(targetNodeIndex + 1)
        ];

        setNodes(newNodes);
        devLog.log('Schema synchronization completed successfully');
    }, [nodes, edges, setNodes]);

    // Event Handlers using custom hooks
    const canvasHandlers = useCanvasEventHandlers({
        dragState,
        view,
        portPositions,
        nodes,
        predictedNodes,
        isDraggingOutput,
        isDraggingInput,
        portClickStart,
        containerRef,
        edgePreviewRef,
        snappedPortKeyRef,
        setView,
        setNodes,
        setEdgePreview,
        setSnappedPortKey,
        setIsSnapTargetValid,
        setPortClickStart,
        setPredictedNodes,
        clearSelection,
        startCanvasDrag,
        clearPredictedNodes,
        generatePredictedNodes,
        generatePredictedOutputNodes,
        stopDrag,
        selectNode,
        startNodeDrag,
        selectEdge,
        areTypesCompatible,
        findPortData: (nodes: CanvasNode[], nodeId: string, portId: string, portType: string) => {
            const node = nodes.find(n => n.id === nodeId);
            if (!node) return null;
            const portList = portType === 'input' ? node.data.inputs : node.data.outputs;
            return portList?.find(p => p.id === portId) || null;
        },
        isNodePredicted,
        handlePortMouseUp: () => {} // Will be provided by portHandlers
    });

    const portHandlers = usePortHandlers({
        edges,
        nodes,
        predictedNodes,
        portPositions,
        isDraggingOutput,
        isDraggingInput,
        portClickStart,
        edgePreviewRef,
        setPortClickStart,
        setEdgePreview,
        setSnappedPortKey,
        setIsSnapTargetValid,
        setIsDraggingOutput,
        setIsDraggingInput,
        setCurrentOutputType,
        setCurrentInputType,
        setSourcePortForConnection,
        setPredictedNodes,
        setEdges,
        startEdgeDrag,
        removeEdge,
        addNode,
        addEdge,
        clearPredictedNodes,
        isDuplicateEdge,
        generatePredictedNodes,
        generatePredictedOutputNodes,
        isNodePredicted
    });

    const keyboardHandlers = useKeyboardHandlers({
        selectedNodeId,
        selectedEdgeId,
        copyNode,
        pasteNode,
        deleteNode,
        removeEdge,
        removeNodeEdges,
        clearSelection,
        selectNode,
        undo: historyHelpers?.undo || (() => devLog.warn('Undo called - no historyHelpers')),
        redo: historyHelpers?.redo || (() => devLog.warn('Redo called - no historyHelpers')),
        canUndo: historyHelpers?.canUndo || false,
        canRedo: historyHelpers?.canRedo || false
    });

    // Get final handlers from hooks
    const {
        handleCanvasMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleNodeMouseDown,
        handleEdgeClick
    } = canvasHandlers;

    const {
        handlePortMouseDown,
        handlePortMouseUp
    } = portHandlers;

    const { handleKeyDown } = keyboardHandlers;

    // Imperative handle for parent component access
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
            addNode(newNode);
        },
        loadCanvasState: (state: Partial<CanvasState>): void => {
            // NODE_MOVE 특별 처리
            if ('actionType' in state && state.actionType === 'NODE_MOVE') {
                const { nodeId, position } = state as any;

                // 현재 nodes에서 해당 노드를 찾아서 업데이트
                const currentNodes = nodesRef.current;
                const nodeIndex = currentNodes.findIndex(n => n.id === nodeId);

                if (nodeIndex !== -1) {
                    const updatedNodes = [...currentNodes];
                    updatedNodes[nodeIndex] = {
                        ...updatedNodes[nodeIndex],
                        position: { ...position }
                    };

                    devLog.log('NODE_MOVE restored', {
                        nodeId,
                        position,
                        nodeIndex
                    });

                    setNodes(updatedNodes);
                    nodesRef.current = updatedNodes;
                } else {
                    devLog.error('Node not found for restoration:', nodeId);
                }
            } else {
                // 일반적인 전체 상태 복원
                if (state.nodes) setNodes(state.nodes);
                if (state.edges) setEdges(state.edges);
                if (state.view) setView(state.view);
            }
        },
        loadWorkflowState: (state: Partial<CanvasState>): void => {
            if (state.nodes) setNodes(state.nodes);
            if (state.edges) setEdges(state.edges);
            if (state.view) setView(state.view);
        },
        getCenteredView,
        clearSelectedNode: clearSelection,
        validateAndPrepareExecution: (): ExecutionValidationResult => {
            const validationResult = validateRequiredInputs(nodes, edges);
            if (!validationResult.isValid) {
                if (validationResult.nodeId) selectNode(validationResult.nodeId);
                return {
                    error: `Required input "${validationResult.inputName}" is missing in node "${validationResult.nodeName}"`,
                    nodeId: validationResult.nodeId
                };
            }
            clearSelection();
            return { success: true };
        },
        setAvailableNodeSpecs: (nodeSpecs: NodeData[]): void => {
            setAvailableNodeSpecs(nodeSpecs);
        },
        updateNodeParameter: (nodeId: string, paramId: string, value: string | number | boolean, skipHistory?: boolean): void => {
            updateNodeParameter(nodeId, paramId, value, skipHistory);
        }
    }));

    // Event listeners setup
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Wheel event for zooming
        container.addEventListener('wheel', handleWheel, { passive: false });

        // Global keyboard events (only window level to avoid duplication)
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('wheel', handleWheel);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleWheel, handleKeyDown]);

    // Initial centered view
    useEffect(() => {
        const container = containerRef.current;
        const content = contentRef.current;
        if (container && content) {
            const centeredView = getCenteredView();
            setView(centeredView);
        }
    }, [getCenteredView, setView]);

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
                {/* Regular Nodes */}
                <CanvasNodes
                    nodes={nodes}
                    selectedNodeId={selectedNodeId}
                    onNodeMouseDown={handleNodeMouseDown}
                    onPortMouseDown={handlePortMouseDown}
                    onPortMouseUp={handlePortMouseUp}
                    registerPortRef={registerPortRef}
                    snappedPortKey={snappedPortKey}
                    isSnapTargetValid={isSnapTargetValid}
                    onParameterChange={updateNodeParameter}
                    onNodeNameChange={updateNodeName}
                    onParameterNameChange={updateParameterName}
                    onParameterAdd={addParameter}
                    onParameterDelete={deleteParameter}
                    onClearSelection={clearSelection}
                    onOpenNodeModal={onOpenNodeModal}
                    onSynchronizeSchema={handleSynchronizeSchema}
                    currentEdges={edges}
                />

                {/* Predicted Nodes */}
                <CanvasPredictedNodes
                    predictedNodes={predictedNodes}
                    onNodeMouseDown={handleNodeMouseDown}
                    onPortMouseDown={handlePortMouseDown}
                    onPortMouseUp={handlePortMouseUp}
                    registerPortRef={registerPortRef}
                    snappedPortKey={snappedPortKey}
                    onParameterChange={updateNodeParameter}
                    onNodeNameChange={updateNodeName}
                    onParameterNameChange={updateParameterName}
                    onClearSelection={clearSelection}
                    onPredictedNodeHover={handlePredictedNodeHover}
                    onPredictedNodeClick={handlePredictedNodeClick}
                    onSynchronizeSchema={handleSynchronizeSchema}
                    currentNodes={nodes}
                    currentEdges={edges}
                />

                {/* Edges */}
                <CanvasEdges
                    edges={edges}
                    selectedEdgeId={selectedEdgeId}
                    edgePreview={edgePreview}
                    portPositions={portPositions}
                    onEdgeClick={handleEdgeClick}
                />
            </div>
        </div>
    );
});

Canvas.displayName = 'Canvas';
export default memo(Canvas);
