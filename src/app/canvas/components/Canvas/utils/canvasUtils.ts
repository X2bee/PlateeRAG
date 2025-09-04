import type { Position, CanvasNode, CanvasEdge, ValidationResult, Port } from '@/app/canvas/types';

// Constants
export const MIN_SCALE = 0.6;
export const MAX_SCALE = 20;
export const ZOOM_SENSITIVITY = 0.05;
export const SNAP_DISTANCE = 40;
export const VERTICAL_SPACING = 350;
export const HORIZONTAL_SPACING = 500;

// Type compatibility utilities
export const areTypesCompatible = (sourceType?: string, targetType?: string): boolean => {
    if (!sourceType || !targetType) return true;
    if (sourceType === targetType) return true;
    if (targetType === 'ANY') return true;
    if (sourceType === 'INT' && targetType === 'FLOAT') return true;
    return false;
};

// Validation utilities
export const validateRequiredInputs = (nodes: CanvasNode[], edges: CanvasEdge[]): ValidationResult => {
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

// Position utilities
export const calculateDistance = (pos1?: Position, pos2?: Position): number => {
    if (!pos1 || !pos2) return Infinity;
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
};

// Port utilities
export const generatePortKey = (nodeId: string, portId: string, portType: 'input' | 'output'): string => {
    return `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;
};

export const parsePortKey = (portKey: string): { nodeId: string; portId: string; portType: string } | null => {
    const parts = portKey.split('__PORTKEYDELIM__');
    if (parts.length !== 3) return null;
    return {
        nodeId: parts[0],
        portId: parts[1],
        portType: parts[2]
    };
};

export const findPortData = (
    nodes: CanvasNode[], 
    nodeId: string, 
    portId: string, 
    portType: string
): Port | null => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    const portList = portType === 'input' ? node.data.inputs : node.data.outputs;
    return portList?.find(p => p.id === portId) || null;
};

// Node identification utilities
export const isPredictedNodeId = (nodeId: string): boolean => {
    return nodeId.startsWith('predicted-') || nodeId.startsWith('predicted-output-');
};

export const isSchemaProviderNode = (nodeData: any): boolean => {
    return nodeData.id === 'input_schema_provider' || 
           nodeData.id === 'output_schema_provider' ||
           nodeData.nodeName === 'Schema Provider(Input)';
};

// Event utilities
export const isParameterInput = (target: HTMLElement): boolean => {
    return target.matches('input, select, option') ||
           target.classList.contains('paramInput') ||
           target.classList.contains('paramSelect') ||
           target.closest('.param') !== null ||
           target.closest('[class*="param"]') !== null;
};

// Canvas coordinate utilities
export const getWorldPosition = (
    clientX: number,
    clientY: number,
    containerRect: DOMRect,
    view: { x: number; y: number; scale: number }
): Position => {
    return {
        x: (clientX - containerRect.left - view.x) / view.scale,
        y: (clientY - containerRect.top - view.y) / view.scale
    };
};

// Grid calculation utilities
export const calculateGridLayout = (totalItems: number, maxCols: number = 3) => {
    const cols = Math.min(maxCols, Math.ceil(Math.sqrt(totalItems)));
    const rows = Math.ceil(totalItems / cols);
    return { cols, rows };
};

export const getGridPosition = (
    index: number,
    cols: number,
    startX: number,
    startY: number,
    spacingX: number = HORIZONTAL_SPACING,
    spacingY: number = VERTICAL_SPACING
): Position => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
        x: startX + (col * spacingX),
        y: startY + (row * spacingY)
    };
};

// Edge signature utilities
export const createEdgeSignature = (
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
): string => {
    return `${sourceNodeId}:${sourcePortId}-${targetNodeId}:${targetPortId}`;
};

export const parseEdgeSignature = (signature: string) => {
    const [source, target] = signature.split('-');
    const [sourceNodeId, sourcePortId] = source.split(':');
    const [targetNodeId, targetPortId] = target.split(':');
    return { sourceNodeId, sourcePortId, targetNodeId, targetPortId };
};

// Schema synchronization utilities
export const getConnectedSchemaProvider = (
    targetNodeId: string,
    targetPortId: string,
    edges: CanvasEdge[],
    nodes: CanvasNode[]
): CanvasNode | null => {
    // Find edge connected to this port
    const connectedEdge = edges.find(edge =>
        edge.target?.nodeId === targetNodeId && edge.target?.portId === targetPortId
    );

    if (!connectedEdge) return null;

    // Find connected source node
    const sourceNode = nodes.find(node =>
        node.id === connectedEdge.source.nodeId
    );

    if (!sourceNode) return null;

    // Check if it's a SchemaProvider node
    if (isSchemaProviderNode(sourceNode.data)) {
        return sourceNode;
    }

    return null;
};

// Mouse event utilities
export const isClick = (
    startTime: number,
    startPos: { x: number; y: number },
    currentPos: { x: number; y: number },
    timeThreshold: number = 200,
    distanceThreshold: number = 5
): boolean => {
    const timeDiff = Date.now() - startTime;
    const distance = calculateDistance(startPos, currentPos);
    return timeDiff < timeThreshold && distance < distanceThreshold;
};

// Viewport utilities
export const getCenteredViewport = (
    containerWidth: number,
    containerHeight: number,
    contentWidth: number,
    contentHeight: number
) => {
    if (containerWidth <= 0 || containerHeight <= 0) {
        return { x: 0, y: 0, scale: 1 };
    }

    return {
        x: (containerWidth - contentWidth) / 2,
        y: (containerHeight - contentHeight) / 2,
        scale: 1
    };
};

// Snap utilities
export const findClosestSnapTarget = (
    mousePos: Position,
    portPositions: Record<string, Position>,
    snapDistance: number = SNAP_DISTANCE,
    filterFn?: (portKey: string) => boolean
): string | null => {
    let closestPortKey: string | null = null;
    let minSnapDistance = snapDistance;

    Object.entries(portPositions).forEach(([key, pos]) => {
        if (filterFn && !filterFn(key)) return;
        
        const distance = calculateDistance(mousePos, pos);
        if (distance < minSnapDistance) {
            minSnapDistance = distance;
            closestPortKey = key;
        }
    });

    return closestPortKey;
};