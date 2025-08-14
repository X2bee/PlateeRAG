// Edge Interaction Hook - Handles all edge-related events and interactions
import { useCallback, useRef } from 'react';
import { devLog } from '@/app/_common/utils/logger';
import type {
    Position,
    CanvasNode,
    CanvasEdge,
    EdgePreview,
    DragState,
    PortMouseEventData,
} from '@/app/canvas/types';

export interface EdgeInteractionHook {
    // Edge Creation
    startEdgeCreation: (data: PortMouseEventData, startPosition: Position) => void;
    updateEdgePreview: (currentPosition: Position) => void;
    completeEdgeCreation: (targetData?: PortMouseEventData) => void;
    cancelEdgeCreation: () => void;
    
    // Edge Management
    deleteEdge: (edgeId: string) => void;
    selectEdge: (edgeId: string | null) => void;
    
    // Edge Events
    handleEdgeClick: (edgeId: string, event: React.MouseEvent) => void;
    handleEdgeDoubleClick: (edgeId: string) => void;
    
    // Port Validation
    isValidConnection: (sourceData: PortMouseEventData, targetData: PortMouseEventData) => boolean;
    areTypesCompatible: (sourceType?: string, targetType?: string) => boolean;
    
    // Edge Utilities
    findEdgeByPorts: (sourceNodeId: string, sourcePortId: string, targetNodeId: string, targetPortId: string) => CanvasEdge | undefined;
    getConnectedEdges: (nodeId: string) => CanvasEdge[];
    getPortConnections: (nodeId: string, portId: string, portType: 'input' | 'output') => CanvasEdge[];
    
    // Keyboard Shortcuts
    handleEdgeKeyboardShortcuts: (event: KeyboardEvent) => void;
}

interface UseEdgeInteractionProps {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    selectedEdgeId: string | null;
    dragState: DragState;
    edgePreview: EdgePreview | null;
    view: { x: number; y: number; scale: number };
    
    setEdges: (edges: CanvasEdge[] | ((prev: CanvasEdge[]) => CanvasEdge[])) => void;
    setSelectedEdgeId: (id: string | null) => void;
    setDragState: (state: DragState) => void;
    setEdgePreview: (preview: EdgePreview | null) => void;
    setLastDeleted: (item: any) => void;
}

export const useEdgeInteraction = ({
    nodes,
    edges,
    selectedEdgeId,
    dragState,
    edgePreview,
    view,
    setEdges,
    setSelectedEdgeId,
    setDragState,
    setEdgePreview,
    setLastDeleted,
}: UseEdgeInteractionProps): EdgeInteractionHook => {
    
    const edgeCreationData = useRef<PortMouseEventData | null>(null);
    
    // Type compatibility check
    const areTypesCompatible = useCallback((sourceType?: string, targetType?: string): boolean => {
        if (!sourceType || !targetType) return true;
        if (sourceType === targetType) return true;
        if (targetType === 'ANY') return true;
        if (sourceType === 'INT' && targetType === 'FLOAT') return true;
        return false;
    }, []);
    
    // Connection validation
    const isValidConnection = useCallback((sourceData: PortMouseEventData, targetData: PortMouseEventData): boolean => {
        // Cannot connect to itself
        if (sourceData.nodeId === targetData.nodeId) return false;
        
        // Cannot connect output to output or input to input
        if (sourceData.portType === targetData.portType) return false;
        
        // Check type compatibility
        const sourceType = sourceData.portType === 'output' ? sourceData.dataType : targetData.dataType;
        const targetType = sourceData.portType === 'input' ? sourceData.dataType : targetData.dataType;
        
        if (!areTypesCompatible(sourceType, targetType)) return false;
        
        // Check if target input already has a connection
        const targetPortId = targetData.portType === 'input' ? targetData.portId : sourceData.portId;
        const targetNodeId = targetData.portType === 'input' ? targetData.nodeId : sourceData.nodeId;
        
        const existingConnection = edges.find(edge => 
            edge.target.nodeId === targetNodeId && edge.target.portId === targetPortId
        );
        
        return !existingConnection;
    }, [edges, areTypesCompatible]);
    
    // Edge Creation
    const startEdgeCreation = useCallback((data: PortMouseEventData, startPosition: Position) => {
        edgeCreationData.current = data;
        
        setDragState({
            type: 'edge',
            startX: startPosition.x,
            startY: startPosition.y
        });
        
        setEdgePreview({
            start: startPosition,
            end: startPosition,
            sourceData: data,
            isValid: true
        });
        
        devLog.log('Edge creation started from port:', data);
    }, [setDragState, setEdgePreview]);
    
    const updateEdgePreview = useCallback((currentPosition: Position) => {
        if (!edgePreview || !edgeCreationData.current) return;
        
        setEdgePreview(prev => prev ? {
            ...prev,
            end: currentPosition
        } : null);
    }, [edgePreview, setEdgePreview]);
    
    const completeEdgeCreation = useCallback((targetData?: PortMouseEventData) => {
        if (!edgeCreationData.current || !targetData) {
            cancelEdgeCreation();
            return;
        }
        
        const sourceData = edgeCreationData.current;
        
        if (!isValidConnection(sourceData, targetData)) {
            devLog.warn('Invalid connection attempted:', sourceData, targetData);
            cancelEdgeCreation();
            return;
        }
        
        // Determine source and target based on port types
        const isSourceOutput = sourceData.portType === 'output';
        const source = isSourceOutput ? sourceData : targetData;
        const target = isSourceOutput ? targetData : sourceData;
        
        const newEdge: CanvasEdge = {
            id: `edge_${source.nodeId}_${source.portId}_${target.nodeId}_${target.portId}`,
            source: {
                nodeId: source.nodeId,
                portId: source.portId
            },
            target: {
                nodeId: target.nodeId,
                portId: target.portId
            }
        };
        
        setEdges(prev => [...prev, newEdge]);
        setEdgePreview(null);
        setDragState({ type: 'none', startX: 0, startY: 0 });
        edgeCreationData.current = null;
        
        devLog.log('Edge created:', newEdge);
    }, [isValidConnection, setEdges, setEdgePreview, setDragState]);
    
    const cancelEdgeCreation = useCallback(() => {
        setEdgePreview(null);
        setDragState({ type: 'none', startX: 0, startY: 0 });
        edgeCreationData.current = null;
        devLog.log('Edge creation cancelled');
    }, [setEdgePreview, setDragState]);
    
    // Edge Management
    const deleteEdge = useCallback((edgeId: string) => {
        const edgeToDelete = edges.find(e => e.id === edgeId);
        if (!edgeToDelete) return;
        
        setEdges(prev => prev.filter(e => e.id !== edgeId));
        
        // Store for undo
        setLastDeleted({
            type: 'edge',
            data: edgeToDelete
        });
        
        // Clear selection if deleted edge was selected
        if (selectedEdgeId === edgeId) {
            setSelectedEdgeId(null);
        }
        
        devLog.log('Edge deleted:', edgeId);
    }, [edges, selectedEdgeId, setEdges, setSelectedEdgeId, setLastDeleted]);
    
    const selectEdge = useCallback((edgeId: string | null) => {
        setSelectedEdgeId(edgeId);
        devLog.log('Edge selected:', edgeId);
    }, [setSelectedEdgeId]);
    
    // Edge Events
    const handleEdgeClick = useCallback((edgeId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setSelectedEdgeId(edgeId);
    }, [setSelectedEdgeId]);
    
    const handleEdgeDoubleClick = useCallback((edgeId: string) => {
        // Future: Could open edge properties modal
        devLog.log('Edge double-clicked:', edgeId);
    }, []);
    
    // Edge Utilities
    const findEdgeByPorts = useCallback((
        sourceNodeId: string, 
        sourcePortId: string, 
        targetNodeId: string, 
        targetPortId: string
    ): CanvasEdge | undefined => {
        return edges.find(edge => 
            edge.source.nodeId === sourceNodeId &&
            edge.source.portId === sourcePortId &&
            edge.target.nodeId === targetNodeId &&
            edge.target.portId === targetPortId
        );
    }, [edges]);
    
    const getConnectedEdges = useCallback((nodeId: string): CanvasEdge[] => {
        return edges.filter(edge => 
            edge.source.nodeId === nodeId || edge.target.nodeId === nodeId
        );
    }, [edges]);
    
    const getPortConnections = useCallback((
        nodeId: string, 
        portId: string, 
        portType: 'input' | 'output'
    ): CanvasEdge[] => {
        return edges.filter(edge => {
            if (portType === 'input') {
                return edge.target.nodeId === nodeId && edge.target.portId === portId;
            } else {
                return edge.source.nodeId === nodeId && edge.source.portId === portId;
            }
        });
    }, [edges]);
    
    // Keyboard Shortcuts
    const handleEdgeKeyboardShortcuts = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Delete' || event.key === 'Backspace') {
            if (selectedEdgeId) {
                event.preventDefault();
                deleteEdge(selectedEdgeId);
            }
        } else if (event.key === 'Escape') {
            if (dragState.type === 'edge') {
                event.preventDefault();
                cancelEdgeCreation();
            }
        }
    }, [selectedEdgeId, dragState.type, deleteEdge, cancelEdgeCreation]);
    
    return {
        // Edge Creation
        startEdgeCreation,
        updateEdgePreview,
        completeEdgeCreation,
        cancelEdgeCreation,
        
        // Edge Management
        deleteEdge,
        selectEdge,
        
        // Edge Events
        handleEdgeClick,
        handleEdgeDoubleClick,
        
        // Port Validation
        isValidConnection,
        areTypesCompatible,
        
        // Edge Utilities
        findEdgeByPorts,
        getConnectedEdges,
        getPortConnections,
        
        // Keyboard Shortcuts
        handleEdgeKeyboardShortcuts,
    };
};