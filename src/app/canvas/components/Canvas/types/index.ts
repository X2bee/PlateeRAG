import type {
    CanvasProps,
    CanvasRef,
    CanvasState,
    View,
    CanvasNode,
    CanvasEdge,
    PredictedNode,
    NodeData,
    Position,
    EdgePreview,
    DragState,
    PortMouseEventData,
    Parameter,
    NodeProps
} from '@/app/canvas/types';

// Canvas component specific props
export interface CanvasComponentProps extends CanvasProps {
    containerRef: React.RefObject<HTMLDivElement>;
    contentRef: React.RefObject<HTMLDivElement>;
}

// Port interaction props
export interface PortInteractionProps {
    portClickStart: {
        data: PortMouseEventData;
        timestamp: number;
        position: { x: number; y: number };
    } | null;
    setPortClickStart: React.Dispatch<React.SetStateAction<{
        data: PortMouseEventData;
        timestamp: number;
        position: { x: number; y: number };
    } | null>>;
    portPositions: Record<string, Position>;
    setPortPositions: React.Dispatch<React.SetStateAction<Record<string, Position>>>;
}

// Edge preview props
export interface EdgePreviewProps {
    edgePreview: EdgePreview | null;
    setEdgePreview: React.Dispatch<React.SetStateAction<EdgePreview | null>>;
    snappedPortKey: string | null;
    setSnappedPortKey: React.Dispatch<React.SetStateAction<string | null>>;
    isSnapTargetValid: boolean;
    setIsSnapTargetValid: React.Dispatch<React.SetStateAction<boolean>>;
}

// Schema synchronization props
export interface SchemaSyncProps {
    onSynchronizeSchema?: (nodeId: string, portId: string) => void;
}

// Canvas imperative handle methods
export interface CanvasImperativeHandle extends CanvasRef {
    getCanvasState: () => CanvasState;
    addNode: (nodeData: NodeData, clientX: number, clientY: number) => void;
    loadCanvasState: (state: Partial<CanvasState>) => void;
    loadCanvasStateWithoutView: (state: Partial<CanvasState>) => void;
    loadWorkflowState: (state: Partial<CanvasState>) => void;
    getCenteredView: () => View;
    clearSelectedNode: () => void;
    updateNodeParameter: (nodeId: string, paramId: string, value: string | number | boolean, skipHistory?: boolean) => void;
    setAvailableNodeSpecs: (nodeSpecs: NodeData[]) => void;
    getCurrentViewportCenter: () => { x: number; y: number };
}

// Event handler types
export interface CanvasEventHandlers {
    handleCanvasMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    handleMouseUp: (e?: React.MouseEvent<HTMLDivElement>) => void;
    handleKeyDown: (e: KeyboardEvent) => void;
    handleNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    handlePortMouseDown: (data: PortMouseEventData, mouseEvent?: React.MouseEvent) => void;
    handlePortMouseUp: (data: PortMouseEventData, mouseEvent?: React.MouseEvent) => void;
    handleEdgeClick: (edgeId: string) => void;
}

// Node management types
export interface NodeManagementHandlers {
    handleParameterChange: (nodeId: string, paramId: string, value: string | number | boolean) => void;
    handleNodeNameChange: (nodeId: string, newName: string) => void;
    handleParameterNameChange: (nodeId: string, paramId: string, newName: string) => void;
    handleParameterAdd: (nodeId: string, newParameter: Parameter) => void;
    handleParameterDelete: (nodeId: string, paramId: string) => void;
    handleSynchronizeSchema: (nodeId: string, portId: string) => void;
}

// Keyboard shortcuts
export interface KeyboardShortcuts {
    copySelectedNode: () => void;
    pasteNode: () => void;
    deleteSelectedNode: () => void;
    undoDelete: () => void;
}

export * from '@/app/canvas/types';
