// Node Interaction Hook - Handles all node-related events and interactions
import { useCallback, useRef } from 'react';
import { devLog } from '@/app/_common/utils/logger';
import type {
    Position,
    CanvasNode,
    CanvasEdge,
    NodeData,
    DragState,
    PortMouseEventData,
    PredictedNode,
} from '@/app/canvas/types';

export interface NodeInteractionHook {
    // Node Creation & Management
    addNode: (nodeSpec: NodeData, position: Position) => void;
    deleteNode: (nodeId: string) => void;
    duplicateNode: (nodeId: string) => void;
    updateNodePosition: (nodeId: string, position: Position) => void;
    updateNodeParameter: (nodeId: string, paramId: string, value: any) => void;
    
    // Node Selection
    selectNode: (nodeId: string | null) => void;
    clearSelection: () => void;
    
    // Node Events
    handleNodeMouseDown: (nodeId: string, event: React.MouseEvent) => void;
    handleNodeClick: (nodeId: string, event: React.MouseEvent) => void;
    handleNodeDoubleClick: (nodeId: string) => void;
    
    // Drag Operations
    startNodeDrag: (nodeId: string, startPosition: Position) => void;
    updateNodeDrag: (currentPosition: Position) => void;
    endNodeDrag: () => void;
    
    // Port Interactions
    handlePortMouseDown: (data: PortMouseEventData, event: React.MouseEvent) => void;
    handlePortMouseEnter: (portKey: string, isValid: boolean) => void;
    handlePortMouseLeave: () => void;
    
    // Copy & Paste
    copySelectedNode: () => void;
    pasteNode: (position?: Position) => void;
    
    // Keyboard Shortcuts
    handleKeyboardShortcuts: (event: KeyboardEvent) => void;
    
    // Predicted Nodes
    showPredictedNodes: (sourceType: string, sourcePosition: Position) => void;
    hidePredictedNodes: () => void;
    createPredictedNode: (predictedNode: PredictedNode, position: Position) => void;
}

interface UseNodeInteractionProps {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    selectedNodeId: string | null;
    dragState: DragState;
    availableNodeSpecs: NodeData[];
    view: { x: number; y: number; scale: number };
    
    setNodes: (nodes: CanvasNode[] | ((prev: CanvasNode[]) => CanvasNode[])) => void;
    setEdges: (edges: CanvasEdge[] | ((prev: CanvasEdge[]) => CanvasEdge[])) => void;
    setSelectedNodeId: (id: string | null) => void;
    setDragState: (state: DragState) => void;
    setPredictedNodes: (nodes: PredictedNode[]) => void;
    setSnappedPortKey: (key: string | null) => void;
    setIsSnapTargetValid: (valid: boolean) => void;
    setCopiedNode: (node: CanvasNode | null) => void;
    setLastDeleted: (item: any) => void;
    
    onOpenNodeModal?: (nodeId: string, paramId: string, paramName: string, currentValue: string) => void;
}

export const useNodeInteraction = ({
    nodes,
    edges,
    selectedNodeId,
    dragState,
    availableNodeSpecs,
    view,
    setNodes,
    setEdges,
    setSelectedNodeId,
    setDragState,
    setPredictedNodes,
    setSnappedPortKey,
    setIsSnapTargetValid,
    setCopiedNode,
    setLastDeleted,
    onOpenNodeModal,
}: UseNodeInteractionProps): NodeInteractionHook => {
    
    const dragStartPosition = useRef<Position>({ x: 0, y: 0 });
    const dragOffset = useRef<Position>({ x: 0, y: 0 });
    
    // Node Creation & Management
    const addNode = useCallback((nodeSpec: NodeData, position: Position) => {
        const newNode: CanvasNode = {
            id: `${nodeSpec.nodeName}_${Date.now()}`,
            position,
            data: {
                ...nodeSpec,
                parameters: nodeSpec.parameters?.map(param => ({
                    ...param,
                    value: param.default || ''
                })) || []
            }
        };
        
        setNodes(prev => [...prev, newNode]);
        devLog.log('Node added:', newNode.id);
    }, [setNodes]);
    
    const deleteNode = useCallback((nodeId: string) => {
        const nodeToDelete = nodes.find(n => n.id === nodeId);
        if (!nodeToDelete) return;
        
        // Remove connected edges
        setEdges(prev => prev.filter(edge => 
            edge.source.nodeId !== nodeId && edge.target.nodeId !== nodeId
        ));
        
        // Remove node
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        
        // Store for undo
        setLastDeleted({
            type: 'node',
            data: nodeToDelete,
            edges: edges.filter(edge => 
                edge.source.nodeId === nodeId || edge.target.nodeId === nodeId
            )
        });
        
        // Clear selection if deleted node was selected
        if (selectedNodeId === nodeId) {
            setSelectedNodeId(null);
        }
        
        devLog.log('Node deleted:', nodeId);
    }, [nodes, edges, selectedNodeId, setNodes, setEdges, setSelectedNodeId, setLastDeleted]);
    
    const duplicateNode = useCallback((nodeId: string) => {
        const nodeToDuplicate = nodes.find(n => n.id === nodeId);
        if (!nodeToDuplicate) return;
        
        const newPosition = {
            x: nodeToDuplicate.position.x + 50,
            y: nodeToDuplicate.position.y + 50
        };
        
        const duplicatedNode: CanvasNode = {
            ...nodeToDuplicate,
            id: `${nodeToDuplicate.data.nodeName}_${Date.now()}`,
            position: newPosition
        };
        
        setNodes(prev => [...prev, duplicatedNode]);
        setSelectedNodeId(duplicatedNode.id);
        devLog.log('Node duplicated:', duplicatedNode.id);
    }, [nodes, setNodes, setSelectedNodeId]);
    
    const updateNodePosition = useCallback((nodeId: string, position: Position) => {
        setNodes(prev => prev.map(node => 
            node.id === nodeId ? { ...node, position } : node
        ));
    }, [setNodes]);
    
    const updateNodeParameter = useCallback((nodeId: string, paramId: string, value: any) => {
        setNodes(prev => prev.map(node => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        parameters: node.data.parameters?.map(param =>
                            param.id === paramId ? { ...param, value } : param
                        ) || []
                    }
                };
            }
            return node;
        }));
        devLog.log('Node parameter updated:', nodeId, paramId, value);
    }, [setNodes]);
    
    // Node Selection
    const selectNode = useCallback((nodeId: string | null) => {
        setSelectedNodeId(nodeId);
        devLog.log('Node selected:', nodeId);
    }, [setSelectedNodeId]);
    
    const clearSelection = useCallback(() => {
        setSelectedNodeId(null);
    }, [setSelectedNodeId]);
    
    // Node Events
    const handleNodeMouseDown = useCallback((nodeId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        dragStartPosition.current = { x: event.clientX, y: event.clientY };
        dragOffset.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        
        setDragState({
            type: 'node',
            nodeId,
            startX: event.clientX,
            startY: event.clientY
        });
        
        setSelectedNodeId(nodeId);
    }, [nodes, setDragState, setSelectedNodeId]);
    
    const handleNodeClick = useCallback((nodeId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (event.detail === 1) { // Single click
            setSelectedNodeId(nodeId);
        }
    }, [setSelectedNodeId]);
    
    const handleNodeDoubleClick = useCallback((nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node || !node.data.parameters?.length) return;
        
        // Open modal for first editable parameter
        const editableParam = node.data.parameters.find(p => p.type !== 'output');
        if (editableParam && onOpenNodeModal) {
            onOpenNodeModal(nodeId, editableParam.id, editableParam.name, editableParam.value || '');
        }
    }, [nodes, onOpenNodeModal]);
    
    // Drag Operations
    const startNodeDrag = useCallback((nodeId: string, startPosition: Position) => {
        setDragState({
            type: 'node',
            nodeId,
            startX: startPosition.x,
            startY: startPosition.y
        });
    }, [setDragState]);
    
    const updateNodeDrag = useCallback((currentPosition: Position) => {
        if (dragState.type !== 'node' || !dragState.nodeId) return;
        
        const deltaX = (currentPosition.x - dragState.startX) / view.scale;
        const deltaY = (currentPosition.y - dragState.startY) / view.scale;
        
        setNodes(prev => prev.map(node => {
            if (node.id === dragState.nodeId) {
                return {
                    ...node,
                    position: {
                        x: node.position.x + deltaX,
                        y: node.position.y + deltaY
                    }
                };
            }
            return node;
        }));
        
        setDragState(prev => ({
            ...prev,
            startX: currentPosition.x,
            startY: currentPosition.y
        }));
    }, [dragState, view.scale, setNodes, setDragState]);
    
    const endNodeDrag = useCallback(() => {
        setDragState({ type: 'none', startX: 0, startY: 0 });
    }, [setDragState]);
    
    // Port Interactions
    const handlePortMouseDown = useCallback((data: PortMouseEventData, event: React.MouseEvent) => {
        event.stopPropagation();
        // Port interaction logic will be handled by edge interaction hook
    }, []);
    
    const handlePortMouseEnter = useCallback((portKey: string, isValid: boolean) => {
        setSnappedPortKey(portKey);
        setIsSnapTargetValid(isValid);
    }, [setSnappedPortKey, setIsSnapTargetValid]);
    
    const handlePortMouseLeave = useCallback(() => {
        setSnappedPortKey(null);
        setIsSnapTargetValid(true);
    }, [setSnappedPortKey, setIsSnapTargetValid]);
    
    // Copy & Paste
    const copySelectedNode = useCallback(() => {
        if (!selectedNodeId) return;
        const nodeToCopy = nodes.find(n => n.id === selectedNodeId);
        if (nodeToCopy) {
            setCopiedNode(nodeToCopy);
            devLog.log('Node copied to clipboard:', selectedNodeId);
        }
    }, [selectedNodeId, nodes, setCopiedNode]);
    
    const pasteNode = useCallback((position?: Position) => {
        // Paste logic will be implemented based on copied node state
    }, []);
    
    // Keyboard Shortcuts
    const handleKeyboardShortcuts = useCallback((event: KeyboardEvent) => {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'c':
                    event.preventDefault();
                    copySelectedNode();
                    break;
                case 'v':
                    event.preventDefault();
                    pasteNode();
                    break;
                case 'd':
                    event.preventDefault();
                    if (selectedNodeId) {
                        duplicateNode(selectedNodeId);
                    }
                    break;
            }
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
            if (selectedNodeId) {
                event.preventDefault();
                deleteNode(selectedNodeId);
            }
        }
    }, [selectedNodeId, copySelectedNode, pasteNode, duplicateNode, deleteNode]);
    
    // Predicted Nodes
    const showPredictedNodes = useCallback((sourceType: string, sourcePosition: Position) => {
        const compatibleSpecs = availableNodeSpecs.filter(spec => {
            // Logic to determine compatible nodes based on type
            return spec.inputs?.some(input => input.type === sourceType || input.type === 'ANY');
        });
        
        const predicted: PredictedNode[] = compatibleSpecs.slice(0, 5).map((spec, index) => ({
            id: `predicted_${spec.nodeName}_${index}`,
            nodeSpec: spec,
            position: {
                x: sourcePosition.x + 200,
                y: sourcePosition.y + (index * 60) - 120
            }
        }));
        
        setPredictedNodes(predicted);
    }, [availableNodeSpecs, setPredictedNodes]);
    
    const hidePredictedNodes = useCallback(() => {
        setPredictedNodes([]);
    }, [setPredictedNodes]);
    
    const createPredictedNode = useCallback((predictedNode: PredictedNode, position: Position) => {
        addNode(predictedNode.nodeSpec, position);
        hidePredictedNodes();
    }, [addNode, hidePredictedNodes]);
    
    return {
        // Node Creation & Management
        addNode,
        deleteNode,
        duplicateNode,
        updateNodePosition,
        updateNodeParameter,
        
        // Node Selection
        selectNode,
        clearSelection,
        
        // Node Events
        handleNodeMouseDown,
        handleNodeClick,
        handleNodeDoubleClick,
        
        // Drag Operations
        startNodeDrag,
        updateNodeDrag,
        endNodeDrag,
        
        // Port Interactions
        handlePortMouseDown,
        handlePortMouseEnter,
        handlePortMouseLeave,
        
        // Copy & Paste
        copySelectedNode,
        pasteNode,
        
        // Keyboard Shortcuts
        handleKeyboardShortcuts,
        
        // Predicted Nodes
        showPredictedNodes,
        hidePredictedNodes,
        createPredictedNode,
    };
};