import type { CanvasNode, CanvasEdge } from '@/app/canvas/types';
import type { SchemaProviderInfo } from '../types';

// Node display utilities
export const getDisplayNodeName = (nodeName: string, maxLength: number = 25): string => {
    return nodeName.length > maxLength ? nodeName.substring(0, maxLength) + '...' : nodeName;
};

// Node classification utilities
export const hasInputsAndOutputs = (inputs?: any[], outputs?: any[]) => {
    const hasInputs = inputs && inputs.length > 0;
    const hasOutputs = outputs && outputs.length > 0;
    const hasIO = hasInputs || hasOutputs;
    const hasOnlyOutputs = hasOutputs && !hasInputs;
    
    return { hasInputs, hasOutputs, hasIO, hasOnlyOutputs };
};

export const hasParameters = (parameters?: any[]): boolean => {
    return parameters ? parameters.length > 0 : false;
};

// Schema provider utilities
export const getConnectedSchemaProvider = (
    nodeId: string,
    portId: string,
    currentEdges?: CanvasEdge[],
    currentNodes?: CanvasNode[]
): CanvasNode | null => {
    if (!currentEdges || !currentNodes) return null;
    
    // Find edge connected to this port
    const connectedEdge = currentEdges.find((edge: any) =>
        edge.target?.nodeId === nodeId && edge.target?.portId === portId
    );
    
    if (!connectedEdge) return null;
    
    // Find connected source node
    const sourceNode = currentNodes.find((node: any) =>
        node.id === connectedEdge.source.nodeId
    );
    
    if (!sourceNode) return null;
    
    // Check if it's a SchemaProvider node
    if (sourceNode.data?.id === 'input_schema_provider' ||
        sourceNode.data?.id === 'output_schema_provider' ||
        sourceNode.data?.nodeName === 'Schema Provider(Input)') {
        return sourceNode;
    }
    
    return null;
};

export const getSchemaProviderInfo = (
    nodeId: string,
    portId: string,
    currentEdges?: CanvasEdge[],
    currentNodes?: CanvasNode[]
): SchemaProviderInfo => {
    const provider = getConnectedSchemaProvider(nodeId, portId, currentEdges, currentNodes);
    
    return {
        nodeId,
        isSchemaProvider: !!provider,
        canSynchronize: !!provider
    };
};

// Port utilities
export const generatePortKey = (nodeId: string, portId: string, portType: 'input' | 'output'): string => {
    return `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;
};

export const getPortClasses = (
    portData: any,
    isSnapping: boolean = false,
    isSnapTargetInvalid: boolean = false,
    baseClass: string = 'port'
): string => {
    const classes = [
        baseClass,
        portData.multi ? 'multi' : '',
        `type-${portData.type}`,
        isSnapping ? 'snapping' : '',
        isSnapping && isSnapTargetInvalid ? 'invalid-snap' : ''
    ].filter(Boolean);
    
    return classes.join(' ');
};

// Event utilities
export const createCommonEventHandlers = (
    onClearSelection?: () => void
) => ({
    onMouseDown: (e: React.MouseEvent) => {
        e.stopPropagation();
    },
    onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
    },
    onFocus: (e: React.FocusEvent) => {
        e.stopPropagation();
        if (onClearSelection) {
            onClearSelection();
        }
    },
    onKeyDown: (e: React.KeyboardEvent) => {
        e.stopPropagation();
    },
    onDragStart: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }
});

// Node state utilities
export const getNodeContainerClasses = (
    isSelected: boolean,
    isPreview: boolean,
    isPredicted: boolean,
    baseClass: string = 'node'
): string => {
    const classes = [
        baseClass,
        isSelected ? 'selected' : '',
        isPreview ? 'preview' : '',
        isPredicted ? 'predicted' : ''
    ].filter(Boolean);
    
    return classes.join(' ');
};

export const getNodeContainerStyles = (
    position: { x: number; y: number },
    isPredicted: boolean,
    predictedOpacity: number = 1.0
): React.CSSProperties => ({
    transform: `translate(${position.x}px, ${position.y}px)`,
    opacity: isPredicted ? predictedOpacity : 1,
    pointerEvents: (isPredicted ? 'auto' : 'auto') as React.CSSProperties['pointerEvents'],
    cursor: isPredicted ? 'pointer' : 'default'
});

// Validation utilities
export const isValidNodeForInteraction = (
    isPreview?: boolean,
    isPredicted?: boolean
): boolean => {
    return !isPreview && !isPredicted;
};