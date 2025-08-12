import { ReactNode } from 'react';

// ========== Basic Types ==========
export interface Position {
    x: number;
    y: number;
}

export interface View {
    x: number;
    y: number;
    scale: number;
}

// ========== Port and Parameter Types ==========
export interface Port {
    id: string;
    name: string;
    type: string;
    required?: boolean;
    multi?: boolean;
    stream?: boolean;
}

export interface ParameterOption {
    value: string | number;
    label?: string;
    isSingleValue?: boolean; // API에서 단일 값으로 로드된 경우를 나타냄
}

export interface Parameter {
    id: string;
    name: string;
    value: string | number;
    type?: string;
    required?: boolean;
    optional?: boolean;
    options?: ParameterOption[];
    step?: number;
    min?: number;
    max?: number;
    is_api?: boolean;
    api_name?: string;
    description?: string;
    handle_id?: boolean;
    is_added?: boolean;
    expandable?: boolean;
    from_schema?: boolean;
}

// ========== Node Types ==========
export interface NodeData {
    id: string;
    nodeName: string;
    functionId?: string;
    inputs?: Port[];
    outputs?: Port[];
    parameters?: Parameter[];
}

export interface CanvasNode {
    id: string;
    data: NodeData;
    position: Position;
}

// ========== Edge Types ==========
export interface EdgeConnection {
    nodeId: string;
    portId: string;
    portType: string; // 'input' | 'output' expected, but string for JSON compatibility
    type?: string; // For compatibility with JSON templates
}

export interface CanvasEdge {
    id: string;
    source: EdgeConnection;
    target: EdgeConnection;
}

export interface EdgePreview {
    source: EdgeConnection & { type: string };
    startPos: Position;
    targetPos: Position;
}

// ========== Workflow Types ==========
export interface WorkflowData {
    nodes?: CanvasNode[];
    edges?: CanvasEdge[];
    view?: View;
}

export interface WorkflowState {
    nodes?: CanvasNode[];
    edges?: CanvasEdge[];
    view?: View;
}

// ========== Template Types ==========
export interface RawTemplate {
    workflow_id: string;
    workflow_name: string;
    description?: string;
    tags?: string[];
    contents?: WorkflowData;
}

export interface Template {
    id: string;
    name: string;
    description: string;
    tags: string[];
    nodes: number;
    data?: WorkflowData;
}

// ========== Canvas State Types ==========
export interface DragState {
    type: 'none' | 'canvas' | 'node' | 'edge';
    startX?: number;
    startY?: number;
    nodeId?: string;
    offsetX?: number;
    offsetY?: number;
}

export interface PredictedNode {
    id: string;
    nodeData: NodeData;
    position: Position;
    isHovered: boolean;
}

export interface CanvasState {
    view: View;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    nodeId?: string;
    nodeName?: string;
    inputName?: string;
}

// ========== Event Data Types ==========
export interface PortMouseEventData {
    nodeId: string;
    portId: string;
    portType: 'input' | 'output';
    isMulti?: boolean;
    type: string;
}

// ========== Node Management Types ==========
export interface NodeFunction {
    functionId: string;
    functionName: string;
    nodes?: NodeData[];
}

export interface NodeCategory {
    categoryId: string;
    categoryName: string;
    icon: string;
    functions?: NodeFunction[];
}

// ========== Component Props Types ==========
export interface NodeProps {
    id: string;
    data: NodeData;
    position: Position;
    onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    isSelected: boolean;
    onPortMouseDown: (data: PortMouseEventData, mouseEvent?: React.MouseEvent) => void;
    onPortMouseUp: (data: PortMouseEventData, mouseEvent?: React.MouseEvent) => void;
    registerPortRef: (nodeId: string, portId: string, portType: string, el: HTMLElement | null) => void;
    snappedPortKey: string | null;
    onParameterChange: (nodeId: string, paramId: string, value: string | number) => void;
    isSnapTargetInvalid: boolean;
    isPreview?: boolean;
    onNodeNameChange: (nodeId: string, newName: string) => void;
    onParameterNameChange: (nodeId: string, paramId: string, newName: string) => void;
    onParameterAdd?: (nodeId: string, newParameter: Parameter) => void;
    onParameterDelete?: (nodeId: string, paramId: string) => void;
    onClearSelection: () => void;
    isPredicted?: boolean;
    predictedOpacity?: number;
    onPredictedNodeHover?: (nodeId: string, isHovered: boolean) => void;
    onPredictedNodeClick?: (nodeData: NodeData, position: Position) => void;
    onOpenNodeModal?: (nodeId: string, paramId: string, paramName: string, currentValue: string) => void;
    onSynchronizeSchema?: (nodeId: string, portId: string) => void;
    currentNodes?: CanvasNode[];
    currentEdges?: CanvasEdge[];
}

export interface EdgeProps {
    id?: string;
    sourcePos: Position;
    targetPos: Position;
    isPreview?: boolean;
    onEdgeClick?: (edgeId: string) => void;
    isSelected?: boolean;
}

export interface NodeListProps {
    title: string;
    children: React.ReactNode;
}

export interface DraggableNodeItemProps {
    nodeData: NodeData;
}

// ========== Panel Props Types ==========
export interface AddNodePanelProps {
    onBack: () => void;
    nodeSpecs?: NodeCategory[];
    nodesLoading?: boolean;
    nodesError?: string | null;
    onRefreshNodes?: () => Promise<void>;
}

export interface TemplatePanelProps {
    onBack: () => void;
    onLoadWorkflow: (workflowData: WorkflowData, templateName?: string) => void;
}

export interface TemplatePreviewProps {
    template: Template | null;
    onClose: () => void;
    onUseTemplate: (template: Template | null) => void;
}

export interface WorkflowPanelProps {
    onBack: () => void;
    onLoad: () => void;
    onExport: () => void;
    onLoadWorkflow: (workflowData: WorkflowData, workflowName?: string) => void;
}

export interface MiniCanvasProps {
    template: Template;
}

// ========== Canvas Component Specific Types ==========
export interface ExecutionValidationResult {
    error?: string;
    nodeId?: string;
    success?: boolean;
}

export interface DeletedItem {
    node: CanvasNode;
    edges: CanvasEdge[];
}

export interface CanvasProps {
    onStateChange?: (state: CanvasState) => void;
    nodesInitialized?: boolean;
    onOpenNodeModal?: (nodeId: string, paramId: string, paramName: string, currentValue: string) => void;
}

export interface CanvasRef {
    getCanvasState: () => CanvasState;
    addNode: (nodeData: NodeData, clientX: number, clientY: number) => void;
    loadCanvasState: (state: Partial<CanvasState>) => void;
    loadWorkflowState: (state: Partial<CanvasState>) => void;
    getCenteredView: () => View;
    clearSelectedNode: () => void;
    validateAndPrepareExecution: () => ExecutionValidationResult;
    setAvailableNodeSpecs: (nodeSpecs: NodeData[]) => void;
    updateNodeParameter: (nodeId: string, paramId: string, value: string) => void;
}

// ========== Execution Panel Types ==========
export interface ExecutionError {
    error: string;
}

export interface ExecutionSuccess {
    outputs: Record<string, any>;
}

export interface ExecutionStream {
    stream: string;
}

export type ExecutionOutput = ExecutionError | ExecutionSuccess | ExecutionStream | null;

export const hasError = (output: ExecutionOutput): output is ExecutionError => {
    return output !== null && typeof (output as ExecutionError).error === 'string';
};

export const hasOutputs = (output: ExecutionOutput): output is ExecutionSuccess => {
    return output !== null && typeof (output as ExecutionSuccess).outputs !== 'undefined';
};

export const isStreamingOutput = (output: ExecutionOutput): output is ExecutionStream => {
    return output !== null && typeof (output as ExecutionStream).stream === 'string';
};

export interface OutputRendererProps {
    output: ExecutionOutput;
}

export interface ExecutionPanelProps {
    onExecute: () => void;
    onClear: () => void;
    output: ExecutionOutput;
    isLoading: boolean;
}

// ========== Mini Canvas Specific Types ==========
export interface DummyHandlers {
    onNodeClick: () => void;
    onNodeDrag: () => void;
    onPortClick: () => void;
    onNodeDelete: () => void;
    onNodeDuplicate: () => void;
    updateNodeData: () => void;
    onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    onPortMouseDown: (data: PortMouseEventData, mouseEvent?: React.MouseEvent) => void;
    onPortMouseUp: (data: PortMouseEventData, mouseEvent?: React.MouseEvent) => void;
    registerPortRef: (nodeId: string, portId: string, portType: string, el: HTMLElement | null) => void;
    onParameterChange: (nodeId: string, paramId: string, value: string | number) => void;
    onParameterNameChange: (nodeId: string, paramId: string, newName: string) => void;
    onNodeNameChange: (nodeId: string, newName: string) => void;
    onClearSelection: () => void;
}

// ========== Chat Panel Types ==========
export interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

export interface ChatPanelProps {
    onBack: () => void;
}

export interface SendMessageResponse {
    text: string;
    interaction_id?: string;
    session_id?: string;
    session_info?: any;
    timestamp?: string;
    status?: string;
}

// ========== Utility Types ==========
export interface IconMapType {
    [key: string]: ReactNode;
}
