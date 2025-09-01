import { useCallback } from 'react';
import type { 
    DragState, 
    View, 
    Position, 
    CanvasNode, 
    PredictedNode, 
    EdgePreview 
} from '@/app/canvas/types';
import { 
    isParameterInput, 
    getWorldPosition, 
    parsePortKey, 
    findClosestSnapTarget, 
    SNAP_DISTANCE 
} from '../utils';

interface UseCanvasEventHandlersProps {
    // State
    dragState: DragState;
    view: View;
    portPositions: Record<string, Position>;
    nodes: CanvasNode[];
    predictedNodes: PredictedNode[];
    isDraggingOutput: boolean;
    isDraggingInput: boolean;
    portClickStart: { data: any; timestamp: number; position: { x: number; y: number } } | null;
    
    // Refs
    containerRef: React.RefObject<HTMLDivElement | null>;
    edgePreviewRef: React.MutableRefObject<EdgePreview | null>;
    snappedPortKeyRef: React.MutableRefObject<string | null>;
    
    // State setters
    setView: React.Dispatch<React.SetStateAction<View>>;
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    setEdgePreview: React.Dispatch<React.SetStateAction<EdgePreview | null>>;
    setSnappedPortKey: React.Dispatch<React.SetStateAction<string | null>>;
    setIsSnapTargetValid: React.Dispatch<React.SetStateAction<boolean>>;
    setPortClickStart: React.Dispatch<React.SetStateAction<any>>;
    setPredictedNodes: React.Dispatch<React.SetStateAction<PredictedNode[]>>;
    
    // Handlers from other hooks
    clearSelection: () => void;
    startCanvasDrag: (e: React.MouseEvent, view: View) => void;
    clearPredictedNodes: () => void;
    generatePredictedNodes: (outputType: string, targetPos: Position) => PredictedNode[];
    generatePredictedOutputNodes: (inputType: string, targetPos: Position) => PredictedNode[];
    stopDrag: () => void;
    selectNode: (nodeId: string) => void;
    startNodeDrag: (e: React.MouseEvent, nodeId: string, nodePosition: { x: number; y: number }, view: View) => void;
    selectEdge: (edgeId: string) => void;
    
    // Utils
    areTypesCompatible: (sourceType?: string, targetType?: string) => boolean;
    findPortData: (nodes: CanvasNode[], nodeId: string, portId: string, portType: string) => any;
    isNodePredicted: (nodeId: string) => boolean;
    handlePortMouseUp: (data: any, mouseEvent?: React.MouseEvent) => void;
}

interface UseCanvasEventHandlersReturn {
    handleCanvasMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseUp: (e?: React.MouseEvent<HTMLDivElement>) => void;
    handleNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    handleEdgeClick: (edgeId: string) => void;
}

export const useCanvasEventHandlers = ({
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
    findPortData,
    isNodePredicted,
    handlePortMouseUp
}: UseCanvasEventHandlersProps): UseCanvasEventHandlersReturn => {

    const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
        const target = e.target as HTMLElement;
        if (isParameterInput(target)) return;
        if (e.button !== 0) return;

        if (isDraggingOutput || isDraggingInput) {
            clearPredictedNodes();
        }

        clearSelection();
        startCanvasDrag(e, view);
    }, [isDraggingOutput, isDraggingInput, clearPredictedNodes, clearSelection, startCanvasDrag, view]);

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
        setPortClickStart,
        containerRef,
        edgePreviewRef,
        areTypesCompatible,
        findPortData,
        isNodePredicted
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
        setIsSnapTargetValid,
        containerRef,
        edgePreviewRef,
        snappedPortKeyRef,
        handlePortMouseUp
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

    return {
        handleCanvasMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleNodeMouseDown,
        handleEdgeClick
    };
};