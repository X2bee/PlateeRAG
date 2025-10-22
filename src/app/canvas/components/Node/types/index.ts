import type { Parameter, ParameterOption, NodeProps } from '@/app/canvas/types';

// ========== Parameter Component Types ==========

export interface ParameterComponentProps {
    id: string;
    parameter: Parameter;
    nodeId: string;
    onParameterChange: (nodeId: string, paramId: string, value: string | number | boolean, skipHistory?: boolean) => void;
    onClearSelection?: () => void;
    isPreview?: boolean;
}

// API Parameter specific types
export interface ApiParameterProps extends ParameterComponentProps {
    apiOptions: ParameterOption[];
    isLoading: boolean;
    apiSingleValue?: string;
    loadApiOptions?:(param: Parameter, nodeId: string) => void
}

// Handle Parameter specific types
export interface HandleParameterProps extends ParameterComponentProps {
    isEditing: boolean;
    editingValue: string;
    onStartEdit: () => void;
    onChangeEdit: (value: string) => void;
    onSubmitEdit: () => void;
    onCancelEdit: () => void;
    onParameterNameChange?: (nodeId: string, paramId: string, newName: string) => void;
    onParameterDelete?: (nodeId: string, paramId: string) => void;
}

// Boolean Parameter specific types
export interface BooleanParameterProps extends ParameterComponentProps {
    id: string;
}

// Tool Name Parameter specific types
export interface ToolNameParameterProps extends ParameterComponentProps {
    error?: string;
    onValidationError: (error: string) => void;
}

// Expandable Parameter specific types
export interface ExpandableParameterProps extends ParameterComponentProps {
    onOpenModal?: (nodeId: string, paramId: string, paramName: string, currentValue: string) => void;
}

// Default Parameter specific types
export interface DefaultParameterProps extends ParameterComponentProps {
    id: string;
}

// ========== Parameter State Types ==========

export interface ApiParameterState {
    apiOptions: Record<string, ParameterOption[]>;
    loadingApiOptions: Record<string, boolean>;
    apiSingleValues: Record<string, string>;
}

export interface ParameterEditingState {
    editingHandleParams: Record<string, boolean>;
    editingHandleValues: Record<string, string>;
}

export interface NodeEditingState {
    isEditingName: boolean;
    editingName: string;
}

export interface NodeTooltipState {
    hoveredParam: string | null;
}

export interface ValidationState {
    error: string;
}

// ========== Component Specific Props ==========

export interface NodeHeaderProps {
    nodeName: string;
    functionId?: string;
    isEditingName: boolean;
    editingName: string;
    isPreview?: boolean;
    isExpanded?: boolean;
    onNameDoubleClick: (e: React.MouseEvent) => void;
    onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onNameBlur: () => void;
    onClearSelection?: () => void;
    onToggleExpanded?: (e: React.MouseEvent) => void;
}

export interface NodePortsProps {
    nodeId: string;
    inputs?: any[];
    outputs?: any[];
    parameters?: Parameter[]; // Port dependency 체크를 위해 필요
    isPreview?: boolean;
    isPredicted?: boolean;
    isSelected: boolean;
    onPortMouseDown: NodeProps['onPortMouseDown'];
    onPortMouseUp: NodeProps['onPortMouseUp'];
    registerPortRef: NodeProps['registerPortRef'];
    snappedPortKey: string | null;
    isSnapTargetInvalid: boolean;
    currentNodes?: any[];
    currentEdges?: any[];
    onSynchronizeSchema?: (portId: string) => void;
}

export interface NodeParametersProps {
    nodeId: string;
    nodeDataId: string;
    parameters?: Parameter[];
    isPreview?: boolean;
    isPredicted?: boolean;
    onParameterChange: NodeProps['onParameterChange'];
    onParameterNameChange?: NodeProps['onParameterNameChange'];
    onParameterAdd?: NodeProps['onParameterAdd'];
    onParameterDelete?: NodeProps['onParameterDelete'];
    onClearSelection?: () => void;
    onOpenNodeModal?: NodeProps['onOpenNodeModal'];
    showAdvanced: boolean;
    onToggleAdvanced: (e: React.MouseEvent) => void;
    currentNodes?: any[];
    currentEdges?: any[];
}

// ========== Hook Types ==========

export interface UseApiParametersReturn {
    apiOptions: Record<string, ParameterOption[]>;
    loadingApiOptions: Record<string, boolean>;
    apiSingleValues: Record<string, string>;
    loadApiOptions: (param: Parameter, nodeId: string) => Promise<void>;
    refreshApiOptions: (param: Parameter, nodeId: string) => Promise<void>;
}

export interface UseParameterEditingReturn {
    editingHandleParams: Record<string, boolean>;
    editingHandleValues: Record<string, string>;
    handleHandleParamClick: (param: Parameter, nodeId: string) => void;
    handleHandleParamChange: (e: React.ChangeEvent<HTMLInputElement>, param: Parameter, nodeId: string) => void;
    handleHandleParamKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, param: Parameter) => void;
    handleHandleParamSubmit: (param: Parameter, nodeId: string, onParameterNameChange?: NodeProps['onParameterNameChange']) => void;
    handleHandleParamCancel: (param: Parameter, nodeId: string) => void;
    handleHandleParamBlur: (param: Parameter, nodeId: string, onParameterNameChange?: NodeProps['onParameterNameChange']) => void;
}

export interface UseNodeEditingReturn {
    isEditingName: boolean;
    editingName: string;
    handleNameDoubleClick: (e: React.MouseEvent, nodeName: string, isPreview?: boolean) => void;
    handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleNameSubmit: (nodeId: string, nodeName: string, onNodeNameChange?: NodeProps['onNodeNameChange']) => void;
    handleNameCancel: (nodeName: string) => void;
    handleNameBlur: (nodeId: string, nodeName: string, onNodeNameChange?: NodeProps['onNodeNameChange']) => void;
}

// ========== Utility Types ==========

export interface ParameterRenderOptions {
    paramKey: string;
    isApiParam: boolean|undefined;
    isHandleParam: boolean;
    isEditingHandle: boolean;
    effectiveOptions: ParameterOption[];
    isLoadingOptions: boolean;
    apiSingleValue?: string;
    shouldRenderAsInput: boolean|undefined;
}

export type ParameterType =
    | 'api'
    | 'handle'
    | 'boolean'
    | 'tool_name'
    | 'expandable'
    | 'default';

// ========== Event Handler Types ==========

export interface NodeEventHandlers {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

export interface ParameterEventHandlers {
    onMouseDown: (e: React.MouseEvent) => void;
    onClick: (e: React.MouseEvent) => void;
    onFocus: (e: React.FocusEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onDragStart: (e: React.DragEvent) => void;
}

// ========== Schema Provider Types ==========

export interface SchemaProviderInfo {
    nodeId: string;
    isSchemaProvider: boolean;
    canSynchronize: boolean;
}
