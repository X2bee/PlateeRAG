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
    usePredictedNodes
} from './hooks';

// Components
import { CanvasNodes, CanvasPredictedNodes, CanvasEdges } from './components';

// Utils
import {
    areTypesCompatible,
    validateRequiredInputs,
    generatePortKey,
    parsePortKey,
    findPortData,
    isParameterInput,
    getWorldPosition,
    isClick,
    findClosestSnapTarget,
    SNAP_DISTANCE
} from './utils';

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
    Parameter
} from './types';

const Canvas = forwardRef<CanvasRef, CanvasProps>(({ 
    onStateChange, 
    nodesInitialized = false, 
    onOpenNodeModal
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
        lastDeleted,
        addNode,
        deleteNode,
        copyNode,
        pasteNode,
        undoDelete,
        updateNodeParameter,
        updateNodeName,
        updateParameterName,
        addParameter,
        deleteParameter
    } = useNodeManagement();

    const {
        edges,
        setEdges,
        addEdge,
        removeEdge,
        removeNodeEdges,
        isDuplicateEdge
    } = useEdgeManagement();

    const {
        dragState,
        startCanvasDrag,
        startNodeDrag,
        startEdgeDrag,
        stopDrag
    } = useDragState();

    // State for port interactions and edge preview
    const [edgePreview, setEdgePreview] = useState<EdgePreview | null>(null);
    const [portPositions, setPortPositions] = useState<Record<string, Position>>({});
    const [snappedPortKey, setSnappedPortKey] = useState<string | null>(null);
    const [isSnapTargetValid, setIsSnapTargetValid] = useState<boolean>(true);
    const [availableNodeSpecs, setAvailableNodeSpecs] = useState<NodeData[]>([]);
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
    const edgePreviewRef = useRef<EdgePreview | null>(edgePreview);
    const snappedPortKeyRef = useRef<string | null>(snappedPortKey);
    const isSnapTargetValidRef = useRef<boolean>(isSnapTargetValid);

    // Update refs when state changes
    useEffect(() => {
        nodesRef.current = nodes;
        edgePreviewRef.current = edgePreview;
        snappedPortKeyRef.current = snappedPortKey;
        isSnapTargetValidRef.current = isSnapTargetValid;
    }, [nodes, edgePreview, snappedPortKey, isSnapTargetValid]);

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

    // Port reference registration
    const registerPortRef = useCallback((nodeId: string, portId: string, portType: string, el: HTMLElement | null) => {
        const key = generatePortKey(nodeId, portId, portType as 'input' | 'output');
        
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

        // Add the new node
        addNode(newNode);

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
                addEdge(newEdge);
            }
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
        areTypesCompatible
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

    // Event Handlers
    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
        const target = e.target as HTMLElement;
        if (isParameterInput(target)) return;
        if (e.button !== 0) return;

        if (isDraggingOutput || isDraggingInput) {
            clearPredictedNodes();
        }

        clearSelection();
        startCanvasDrag(e, view);
    };

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
        if (dragState.type === 'none') return;

        // Clear port click start when dragging begins
        if (portClickStart) {
            setPortClickStart(null);
        }

        if (dragState.type === 'canvas') {
            setView(prev => ({ 
                ...prev, 
                x: e.clientX - (dragState.startX || 0), 
                y: e.clientY - (dragState.startY || 0) 
            }));
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
            const mousePos = getWorldPosition(e.clientX, e.clientY, rect, view);

            setEdgePreview(prev => prev ? { ...prev, targetPos: mousePos } : null);

            // Find closest snap target
            const edgeSource = edgePreviewRef.current.source;
            if (!edgeSource) return;

            const closestPortKey = findClosestSnapTarget(
                mousePos,
                portPositions,
                SNAP_DISTANCE,
                (key) => {
                    const parsed = parsePortKey(key);
                    if (!parsed) return false;
                    
                    // Filter logic for valid snap targets
                    return parsed.portType === 'input' && edgeSource.nodeId !== parsed.nodeId;
                }
            );

            if (closestPortKey) {
                const parsed = parsePortKey(closestPortKey);
                if (parsed) {
                    let targetPort = null;
                    
                    if (isNodePredicted(parsed.nodeId)) {
                        const predictedNode = predictedNodes.find(pNode => pNode.id === parsed.nodeId);
                        if (predictedNode?.nodeData.inputs) {
                            targetPort = predictedNode.nodeData.inputs.find(port => port.id === parsed.portId);
                        }
                    } else {
                        targetPort = findPortData(nodes, parsed.nodeId, parsed.portId, parsed.portType);
                    }
                    
                    const isValid = targetPort ? areTypesCompatible(edgeSource.type, targetPort.type) : false;
                    setIsSnapTargetValid(isValid);
                }
            } else {
                setIsSnapTargetValid(true);
            }

            setSnappedPortKey(closestPortKey);
        }
    }, [
        dragState, 
        view, 
        portPositions, 
        predictedNodes, 
        nodes, 
        portClickStart, 
        setView, 
        setNodes, 
        setEdgePreview, 
        setSnappedPortKey, 
        setIsSnapTargetValid, 
        setPortClickStart
    ]);

    const handleMouseUp = useCallback((e?: React.MouseEvent<HTMLDivElement>): void => {
        if (dragState.type === 'edge' && (isDraggingOutput || isDraggingInput) && !snappedPortKeyRef.current && e) {
            const container = containerRef.current;
            if (container && edgePreviewRef.current) {
                const rect = container.getBoundingClientRect();
                const mousePos = getWorldPosition(e.clientX, e.clientY, rect, view);

                const sourceType = edgePreviewRef.current.source.type;
                let predicted: any[] = [];

                if (isDraggingOutput) {
                    predicted = generatePredictedNodes(sourceType, mousePos);
                } else if (isDraggingInput) {
                    predicted = generatePredictedOutputNodes(sourceType, mousePos);
                }

                setPredictedNodes(predicted);
                setEdgePreview(null);
                stopDrag();
                return;
            }
        }

        stopDrag();

        if (dragState.type === 'edge' && snappedPortKeyRef.current) {
            const source = edgePreviewRef.current?.source;
            const parsed = parsePortKey(snappedPortKeyRef.current);
            
            if (source && parsed) {
                handlePortMouseUp({
                    nodeId: parsed.nodeId,
                    portId: parsed.portId,
                    portType: parsed.portType as 'input' | 'output',
                    type: '' // Will be filled by handlePortMouseUp
                });
            }
        }

        setEdgePreview(null);
        setSnappedPortKey(null);
        setIsSnapTargetValid(true);
    }, [
        dragState, 
        isDraggingOutput, 
        isDraggingInput, 
        view, 
        generatePredictedNodes, 
        generatePredictedOutputNodes, 
        setPredictedNodes, 
        setEdgePreview, 
        stopDrag, 
        setSnappedPortKey, 
        setIsSnapTargetValid
    ]);

    const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string): void => {
        if (e.button !== 0) return;
        selectNode(nodeId);
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            startNodeDrag(e, nodeId, node.position, view);
        }
    }, [nodes, view, selectNode, startNodeDrag]);

    const handleEdgeClick = useCallback((edgeId: string): void => {
        selectEdge(edgeId);
    }, [selectEdge]);

    const handlePortMouseDown = useCallback((data: PortMouseEventData, mouseEvent?: React.MouseEvent): void => {
        const { nodeId, portId, portType, isMulti, type } = data;

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
                startEdgeDrag();
                const sourcePosKey = generatePortKey(existingEdge.source.nodeId, existingEdge.source.portId, existingEdge.source.portType as 'input' | 'output');
                const sourcePos = portPositions[sourcePosKey];
                const targetPosKey = generatePortKey(existingEdge.target.nodeId, existingEdge.target.portId, existingEdge.target.portType as 'input' | 'output');
                const targetPos = portPositions[targetPosKey];

                const sourcePortData = findPortData(nodes, existingEdge.source.nodeId, existingEdge.source.portId, existingEdge.source.portType);

                if (sourcePos && sourcePortData) {
                    setEdgePreview({
                        source: { ...existingEdge.source, type: sourcePortData.type },
                        startPos: sourcePos,
                        targetPos: targetPos
                    });
                }

                removeEdge(existingEdge.id);
                return;
            } else {
                startEdgeDrag();
                setIsDraggingInput(true);
                setCurrentInputType(type);
                setSourcePortForConnection({ nodeId, portId, portType, type });

                const startPosKey = generatePortKey(nodeId, portId, portType as 'input' | 'output');
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
            startEdgeDrag();
            setIsDraggingOutput(true);
            setCurrentOutputType(type);
            setSourcePortForConnection({ nodeId, portId, portType, type });

            const startPosKey = generatePortKey(nodeId, portId, portType as 'input' | 'output');
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
    }, [
        edges, 
        portPositions, 
        nodes, 
        startEdgeDrag, 
        setPortClickStart, 
        setEdgePreview, 
        removeEdge, 
        setIsDraggingInput, 
        setIsDraggingOutput, 
        setCurrentInputType, 
        setCurrentOutputType, 
        setSourcePortForConnection
    ]);

    const handlePortMouseUp = useCallback((data: PortMouseEventData, mouseEvent?: React.MouseEvent): void => {
        const { nodeId, portId, portType, type } = data;
        const currentEdgePreview = edgePreviewRef.current;

        // Handle click vs drag detection
        const isClickAction = portClickStart && mouseEvent &&
            isClick(
                portClickStart.timestamp,
                portClickStart.position,
                { x: mouseEvent.clientX, y: mouseEvent.clientY }
            );

        // Handle port click (generate predicted nodes)
        if (isClickAction && 
            portClickStart.data.nodeId === nodeId &&
            portClickStart.data.portId === portId &&
            portClickStart.data.portType === portType) {
            
            const portPosKey = generatePortKey(nodeId, portId, portType as 'input' | 'output');
            const portPos = portPositions[portPosKey];

            if (portPos) {
                setSourcePortForConnection({ nodeId, portId, portType, type });
                setEdgePreview({
                    source: { nodeId, portId, portType, type },
                    startPos: portPos,
                    targetPos: portPos
                });

                let predicted: any[] = [];
                if (portType === 'output') {
                    setIsDraggingOutput(true);
                    setCurrentOutputType(type);
                    predicted = generatePredictedNodes(type, portPos);
                } else if (portType === 'input') {
                    setIsDraggingInput(true);
                    setCurrentInputType(type);
                    predicted = generatePredictedOutputNodes(type, portPos);
                }

                if (predicted.length > 0) {
                    setPredictedNodes(predicted);
                }
            }

            setPortClickStart(null);
            return;
        }

        setPortClickStart(null);

        if (!currentEdgePreview) return;

        // Validate connection
        if (!areTypesCompatible(currentEdgePreview.source.type, type)) {
            setSnappedPortKey(null);
            setIsSnapTargetValid(true);
            setEdgePreview(null);
            return;
        }

        if (currentEdgePreview.source.portType === portType) {
            setEdgePreview(null);
            return;
        }

        if (currentEdgePreview.source.nodeId === nodeId) {
            setEdgePreview(null);
            return;
        }

        // Handle predicted node connection
        if (isNodePredicted(nodeId)) {
            // Convert predicted node and connect
            const predictedNode = predictedNodes.find(pNode => pNode.id === nodeId);
            if (predictedNode) {
                const newNode: CanvasNode = {
                    id: `${predictedNode.nodeData.id}-${Date.now()}`,
                    data: predictedNode.nodeData,
                    position: predictedNode.position
                };

                addNode(newNode);

                let newEdge: CanvasEdge;
                if (isDraggingOutput) {
                    newEdge = {
                        id: `edge-${currentEdgePreview.source.nodeId}:${currentEdgePreview.source.portId}-${newNode.id}:${portId}-${Date.now()}`,
                        source: currentEdgePreview.source,
                        target: { nodeId: newNode.id, portId, portType }
                    };
                } else {
                    newEdge = {
                        id: `edge-${newNode.id}:${portId}-${currentEdgePreview.source.nodeId}:${currentEdgePreview.source.portId}-${Date.now()}`,
                        source: { nodeId: newNode.id, portId, portType: 'output' },
                        target: currentEdgePreview.source
                    };
                }

                addEdge(newEdge);
                clearPredictedNodes();
            }
            
            setEdgePreview(null);
            setSnappedPortKey(null);
            setIsSnapTargetValid(true);
            return;
        }

        // Handle regular node connection
        clearPredictedNodes();

        const edgeSignature = `${currentEdgePreview.source.nodeId}:${currentEdgePreview.source.portId}-${nodeId}:${portId}`;
        if (isDuplicateEdge(currentEdgePreview.source.nodeId, currentEdgePreview.source.portId, nodeId, portId)) {
            setEdgePreview(null);
            return;
        }

        let newEdges = [...edges];
        if (portType === 'input') {
            const targetPort = findPortData(nodes, nodeId, portId, 'input');
            if (targetPort && !targetPort.multi) {
                newEdges = newEdges.filter(edge => !(edge.target.nodeId === nodeId && edge.target.portId === portId));
            }
        }

        let newEdge: CanvasEdge;
        if (currentEdgePreview.source.portType === 'input') {
            newEdge = {
                id: `edge-${nodeId}:${portId}-${currentEdgePreview.source.nodeId}:${currentEdgePreview.source.portId}-${Date.now()}`,
                source: { nodeId, portId, portType },
                target: currentEdgePreview.source,
            };
        } else {
            newEdge = {
                id: `edge-${edgeSignature}-${Date.now()}`,
                source: currentEdgePreview.source,
                target: { nodeId, portId, portType }
            };
        }

        setEdges([...newEdges, newEdge]);
        setEdgePreview(null);
        setSnappedPortKey(null);
        setIsSnapTargetValid(true);
    }, [
        portClickStart,
        portPositions,
        edges,
        nodes,
        predictedNodes,
        isDraggingOutput,
        isDraggingInput,
        areTypesCompatible,
        isNodePredicted,
        isDuplicateEdge,
        findPortData,
        addNode,
        addEdge,
        clearPredictedNodes,
        setPortClickStart,
        setSourcePortForConnection,
        setEdgePreview,
        setIsDraggingOutput,
        setIsDraggingInput,
        setCurrentOutputType,
        setCurrentInputType,
        setPredictedNodes,
        generatePredictedNodes,
        generatePredictedOutputNodes,
        setSnappedPortKey,
        setIsSnapTargetValid,
        setEdges
    ]);

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent): void => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
            return;
        }

        const isCtrlOrCmd = e.ctrlKey || e.metaKey;

        if (isCtrlOrCmd && e.key === 'c') {
            e.preventDefault();
            if (selectedNodeId) copyNode(selectedNodeId);
        } else if (isCtrlOrCmd && e.key === 'v') {
            e.preventDefault();
            const pastedNodeId = pasteNode();
            if (pastedNodeId) selectNode(pastedNodeId);
        } else if (isCtrlOrCmd && e.key === 'z') {
            e.preventDefault();
            const restoredNode = undoDelete();
            if (restoredNode) {
                const connectedEdges = lastDeleted?.edges || [];
                setEdges(prev => [...prev, ...connectedEdges]);
            }
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
            e.preventDefault();
            const connectedEdges = removeNodeEdges(selectedNodeId);
            deleteNode(selectedNodeId, connectedEdges);
            clearSelection();
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
            e.preventDefault();
            removeEdge(selectedEdgeId);
            clearSelection();
        }
    }, [
        selectedNodeId,
        selectedEdgeId,
        copyNode,
        pasteNode,
        undoDelete,
        deleteNode,
        removeEdge,
        removeNodeEdges,
        clearSelection,
        selectNode,
        lastDeleted,
        setEdges
    ]);

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
            if (state.nodes) setNodes(state.nodes);
            if (state.edges) setEdges(state.edges);
            if (state.view) setView(state.view);
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
        updateNodeParameter: (nodeId: string, paramId: string, value: string): void => {
            updateNodeParameter(nodeId, paramId, value);
        }
    }));

    // Event listeners setup
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Wheel event for zooming
        container.addEventListener('wheel', handleWheel, { passive: false });
        
        // Keyboard events
        container.addEventListener('keydown', handleKeyDown);
        container.setAttribute('tabindex', '0');

        // Global keyboard events
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('keydown', handleKeyDown);
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