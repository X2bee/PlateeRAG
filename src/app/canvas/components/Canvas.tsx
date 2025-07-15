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
import { devLog } from '@/app/utils/logger';

// Type definitions
interface Position {
    x: number;
    y: number;
}

interface View {
    x: number;
    y: number;
    scale: number;
}

interface Port {
    id: string;
    name: string;
    type: string;
    required?: boolean;
    multi?: boolean;
}

interface Parameter {
    id: string;
    name: string;
    value: string | number;
    type?: string;
    required?: boolean;
    optional?: boolean;
    options?: Array<{ value: string | number; label?: string }>;
    step?: number;
    min?: number;
    max?: number;
}

interface NodeData {
    id: string;
    nodeName: string;
    functionId?: string;
    inputs?: Port[];
    outputs?: Port[];
    parameters?: Parameter[];
}

interface CanvasNode {
    id: string;
    data: NodeData;
    position: Position;
}

interface EdgeConnection {
    nodeId: string;
    portId: string;
    portType: 'input' | 'output';
}

interface CanvasEdge {
    id: string;
    source: EdgeConnection;
    target: EdgeConnection;
}

interface EdgePreview {
    source: EdgeConnection & { type: string };
    startPos: Position;
    targetPos: Position;
}

interface DragState {
    type: 'none' | 'canvas' | 'node' | 'edge';
    startX?: number;
    startY?: number;
    nodeId?: string;
    offsetX?: number;
    offsetY?: number;
}

interface CanvasState {
    view: View;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

interface ValidationResult {
    isValid: boolean;
    nodeId?: string;
    nodeName?: string;
    inputName?: string;
}

interface ExecutionValidationResult {
    error?: string;
    nodeId?: string;
    success?: boolean;
}

interface DeletedItem {
    node: CanvasNode;
    edges: CanvasEdge[];
}

interface PortMouseEventData {
    nodeId: string;
    portId: string;
    portType: 'input' | 'output';
    isMulti?: boolean;
    type: string;
}

interface CanvasProps {
    onStateChange?: (state: CanvasState) => void;
}

interface CanvasRef {
    getCanvasState: () => CanvasState;
    addNode: (nodeData: NodeData, clientX: number, clientY: number) => void;
    loadCanvasState: (state: Partial<CanvasState>) => void;
    loadWorkflowState: (state: Partial<CanvasState>) => void;
    getCenteredView: () => View;
    clearSelectedNode: () => void;
    validateAndPrepareExecution: () => ExecutionValidationResult;
}

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

const Canvas = forwardRef<CanvasRef, CanvasProps>(({ onStateChange, ...otherProps }, ref) => {
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
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setDragState({ type: 'canvas', startX: e.clientX - view.x, startY: e.clientY - view.y });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
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
                portRefs.current.forEach((portEl, key) => {
                    const parts = key.split('__PORTKEYDELIM__');
                    if (parts.length !== 3) return;
                    const [targetNodeId, targetPortId, targetPortType] = parts;
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

                if (closestPortKey && typeof closestPortKey === 'string') {
                    // TypeScript sometimes infers never, so force string
                    const keyStr: string = closestPortKey as string;
                    const parts = keyStr.split('__PORTKEYDELIM__');
                    const targetPort = findPortData(parts[0], parts[1], parts[2]);
                    const isValid = targetPort ? areTypesCompatible(edgeSource.type, targetPort.type) : false;
                    setIsSnapTargetValid(isValid);
                } else {
                    setIsSnapTargetValid(true);
                }
            }
            setSnappedPortKey(closestPortKey);
        }
    };

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
    }, [edges, nodes]);

    const handleMouseUp = useCallback((): void => {
        setDragState({ type: 'none' });

        if (dragState.type === 'edge') {
            const snappedKey = snappedPortKeyRef.current;
            if (snappedKey) {
                const source = edgePreviewRef.current?.source;
                const parts = snappedKey.split('__PORTKEYDELIM__');
                const [targetNodeId, targetPortId, targetPortType] = parts;

                const targetPortData = findPortData(targetNodeId, targetPortId, targetPortType);

                if (source && targetPortData && areTypesCompatible(source.type, targetPortData.type)) {
                    handlePortMouseUp({
                        nodeId: targetNodeId,
                        portId: targetPortId,
                        portType: targetPortType as 'input' | 'output',
                        type: targetPortData.type
                    });
                }
            }
        }

        setEdgePreview(null);
        setSnappedPortKey(null);
        setIsSnapTargetValid(true);

    }, [dragState.type, handlePortMouseUp]);

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
            const startPosKey = `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;
            const startPos = portPositions[startPosKey];
            if (startPos) {
                setEdgePreview({ source: { nodeId, portId, portType, type }, startPos, targetPos: startPos });
            }
            return;
        }
    }, [edges, portPositions, nodes]);

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