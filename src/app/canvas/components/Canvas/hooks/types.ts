import type { 
    View, 
    CanvasNode, 
    CanvasEdge, 
    Parameter, 
    DeletedItem, 
    DragState, 
    PredictedNode, 
    NodeData, 
    Position 
} from '@/app/canvas/types';

export interface UseCanvasViewReturn {
    view: View;
    setView: React.Dispatch<React.SetStateAction<View>>;
    getCenteredView: () => View;
    handleWheel: (e: WheelEvent) => void;
}

export interface UseCanvasSelectionReturn {
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
    setSelectedEdgeId: React.Dispatch<React.SetStateAction<string | null>>;
    clearSelection: () => void;
    selectNode: (nodeId: string) => void;
    selectEdge: (edgeId: string) => void;
}

export interface UseNodeManagementReturn {
    nodes: CanvasNode[];
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
    copiedNode: CanvasNode | null;
    lastDeleted: DeletedItem | null;
    addNode: (node: CanvasNode) => void;
    deleteNode: (nodeId: string, connectedEdges: any[]) => void;
    copyNode: (nodeId: string) => void;
    pasteNode: () => string | null;
    undoDelete: () => CanvasNode | null;
    updateNodeParameter: (nodeId: string, paramId: string, value: string | number | boolean) => void;
    updateNodeName: (nodeId: string, newName: string) => void;
    updateParameterName: (nodeId: string, paramId: string, newName: string) => void;
    addParameter: (nodeId: string, newParameter: Parameter) => void;
    deleteParameter: (nodeId: string, paramId: string) => void;
}

export interface UseEdgeManagementReturn {
    edges: CanvasEdge[];
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    addEdge: (edge: CanvasEdge) => void;
    removeEdge: (edgeId: string) => void;
    removeNodeEdges: (nodeId: string) => CanvasEdge[];
    isDuplicateEdge: (sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string) => boolean;
    replaceInputEdge: (nodeId: string, portId: string, newEdge: CanvasEdge) => void;
}

export interface UseDragStateReturn {
    dragState: DragState;
    setDragState: React.Dispatch<React.SetStateAction<DragState>>;
    startCanvasDrag: (e: React.MouseEvent, view: View) => void;
    startNodeDrag: (e: React.MouseEvent, nodeId: string, nodePosition: { x: number; y: number }, view: View) => void;
    startEdgeDrag: () => void;
    stopDrag: () => void;
}

export interface UsePredictedNodesReturn {
    predictedNodes: PredictedNode[];
    setPredictedNodes: React.Dispatch<React.SetStateAction<PredictedNode[]>>;
    isDraggingOutput: boolean;
    isDraggingInput: boolean;
    currentOutputType: string | null;
    currentInputType: string | null;
    sourcePortForConnection: { nodeId: string; portId: string; portType: string; type: string } | null;
    setIsDraggingOutput: (value: boolean) => void;
    setIsDraggingInput: (value: boolean) => void;
    setCurrentOutputType: (value: string | null) => void;
    setCurrentInputType: (value: string | null) => void;
    setSourcePortForConnection: (value: { nodeId: string; portId: string; portType: string; type: string } | null) => void;
    generatePredictedNodes: (outputType: string, targetPos: Position) => PredictedNode[];
    generatePredictedOutputNodes: (inputType: string, targetPos: Position) => PredictedNode[];
    handlePredictedNodeHover: (nodeId: string, isHovered: boolean) => void;
    handlePredictedNodeClick: (nodeData: NodeData, position: Position) => CanvasNode | null;
    clearPredictedNodes: () => void;
    isPredictedNodeId: (nodeId: string) => boolean;
}