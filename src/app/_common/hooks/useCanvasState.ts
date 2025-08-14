// Canvas State Management Hook
import { useState, useCallback, useRef } from 'react';
import { devLog } from '@/app/_common/utils/logger';
import {
    getWorkflowName,
    getWorkflowState,
    saveWorkflowState,
    saveWorkflowName,
} from '@/app/_common/utils/workflowStorage';
import type {
    View,
    CanvasNode,
    CanvasEdge,
    DragState,
    EdgePreview,
    Position,
    DeletedItem,
    PredictedNode,
    NodeData,
    CanvasState,
} from '@/app/canvas/types';

export interface WorkflowInfo {
    id: string;
    name: string;
    filename: string;
    author: string;
    nodeCount: number;
    status: 'active' | 'inactive';
}

export interface CanvasStateHook {
    // Core Canvas State
    view: View;
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    dragState: DragState;
    edgePreview: EdgePreview | null;
    
    // Workflow State
    workflowId: string;
    currentWorkflowName: string;
    workflow: WorkflowInfo;
    workflowDetailData: any;
    isCanvasReady: boolean;
    
    // Execution State
    executionOutput: any;
    isExecuting: boolean;
    
    // Modal State
    nodeModalState: {
        isOpen: boolean;
        nodeId: string;
        paramId: string;
        paramName: string;
        currentValue: string;
    };
    showDeploymentModal: boolean;
    isDeploy: boolean;
    
    // Interaction State
    portPositions: Record<string, Position>;
    snappedPortKey: string | null;
    isSnapTargetValid: boolean;
    copiedNode: CanvasNode | null;
    lastDeleted: DeletedItem | null;
    
    // Predicted Nodes
    predictedNodes: PredictedNode[];
    availableNodeSpecs: NodeData[];
    isDraggingOutput: boolean;
    isDraggingInput: boolean;
    currentOutputType: string | null;
    currentInputType: string | null;
    
    // State Update Functions
    setView: (view: View | ((prev: View) => View)) => void;
    setNodes: (nodes: CanvasNode[] | ((prev: CanvasNode[]) => CanvasNode[])) => void;
    setEdges: (edges: CanvasEdge[] | ((prev: CanvasEdge[]) => CanvasEdge[])) => void;
    setSelectedNodeId: (id: string | null) => void;
    setSelectedEdgeId: (id: string | null) => void;
    setDragState: (state: DragState) => void;
    setEdgePreview: (preview: EdgePreview | null) => void;
    
    // Workflow Actions
    setWorkflowId: (id: string) => void;
    setCurrentWorkflowName: (name: string) => void;
    setWorkflow: (workflow: WorkflowInfo) => void;
    setWorkflowDetailData: (data: any) => void;
    setIsCanvasReady: (ready: boolean) => void;
    
    // Execution Actions
    setExecutionOutput: (output: any) => void;
    setIsExecuting: (executing: boolean) => void;
    
    // Modal Actions
    setNodeModalState: (state: any) => void;
    setShowDeploymentModal: (show: boolean) => void;
    setIsDeploy: (deploy: boolean) => void;
    
    // Interaction Actions
    setPortPositions: (positions: Record<string, Position>) => void;
    setSnappedPortKey: (key: string | null) => void;
    setIsSnapTargetValid: (valid: boolean) => void;
    setCopiedNode: (node: CanvasNode | null) => void;
    setLastDeleted: (item: DeletedItem | null) => void;
    
    // Predicted Node Actions
    setPredictedNodes: (nodes: PredictedNode[]) => void;
    setAvailableNodeSpecs: (specs: NodeData[]) => void;
    setIsDraggingOutput: (dragging: boolean) => void;
    setIsDraggingInput: (dragging: boolean) => void;
    setCurrentOutputType: (type: string | null) => void;
    setCurrentInputType: (type: string | null) => void;
    
    // Utility Functions
    getCanvasState: () => CanvasState;
    saveCurrentState: () => void;
    loadWorkflowState: (workflowName?: string) => void;
    resetCanvasState: () => void;
    updateNodeCount: () => void;
}

export const useCanvasState = (): CanvasStateHook => {
    // Core Canvas State
    const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 });
    const [nodes, setNodes] = useState<CanvasNode[]>([]);
    const [edges, setEdges] = useState<CanvasEdge[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [dragState, setDragState] = useState<DragState>({ type: 'none', startX: 0, startY: 0 });
    const [edgePreview, setEdgePreview] = useState<EdgePreview | null>(null);
    
    // Workflow State
    const [workflowId, setWorkflowId] = useState('None');
    const [currentWorkflowName, setCurrentWorkflowName] = useState('Workflow');
    const [workflow, setWorkflow] = useState<WorkflowInfo>({
        id: 'None',
        name: 'None',
        filename: 'None',
        author: 'Unknown',
        nodeCount: 0,
        status: 'active' as const,
    });
    const [workflowDetailData, setWorkflowDetailData] = useState<any>(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    
    // Execution State
    const [executionOutput, setExecutionOutput] = useState<any>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    
    // Modal State
    const [nodeModalState, setNodeModalState] = useState<{
        isOpen: boolean;
        nodeId: string;
        paramId: string;
        paramName: string;
        currentValue: string;
    }>({
        isOpen: false,
        nodeId: '',
        paramId: '',
        paramName: '',
        currentValue: ''
    });
    const [showDeploymentModal, setShowDeploymentModal] = useState(false);
    const [isDeploy, setIsDeploy] = useState(false);
    
    // Interaction State
    const [portPositions, setPortPositions] = useState<Record<string, Position>>({});
    const [snappedPortKey, setSnappedPortKey] = useState<string | null>(null);
    const [isSnapTargetValid, setIsSnapTargetValid] = useState<boolean>(true);
    const [copiedNode, setCopiedNode] = useState<CanvasNode | null>(null);
    const [lastDeleted, setLastDeleted] = useState<DeletedItem | null>(null);
    
    // Predicted Nodes State
    const [predictedNodes, setPredictedNodes] = useState<PredictedNode[]>([]);
    const [availableNodeSpecs, setAvailableNodeSpecs] = useState<NodeData[]>([]);
    const [isDraggingOutput, setIsDraggingOutput] = useState<boolean>(false);
    const [isDraggingInput, setIsDraggingInput] = useState<boolean>(false);
    const [currentOutputType, setCurrentOutputType] = useState<string | null>(null);
    const [currentInputType, setCurrentInputType] = useState<string | null>(null);
    
    // Utility Functions
    const getCanvasState = useCallback((): CanvasState => {
        return {
            view,
            nodes,
            edges,
            selectedNodeId,
            selectedEdgeId,
        };
    }, [view, nodes, edges, selectedNodeId, selectedEdgeId]);
    
    const saveCurrentState = useCallback(() => {
        try {
            const state = getCanvasState();
            saveWorkflowState(currentWorkflowName, state);
            saveWorkflowName(currentWorkflowName);
            devLog.log('Canvas state saved successfully');
        } catch (error) {
            devLog.error('Failed to save canvas state:', error);
        }
    }, [getCanvasState, currentWorkflowName]);
    
    const loadWorkflowState = useCallback((workflowName?: string) => {
        try {
            const nameToLoad = workflowName || getWorkflowName() || 'Workflow';
            const savedState = getWorkflowState(nameToLoad);
            
            if (savedState) {
                setView(savedState.view);
                setNodes(savedState.nodes || []);
                setEdges(savedState.edges || []);
                setSelectedNodeId(savedState.selectedNodeId || null);
                setSelectedEdgeId(savedState.selectedEdgeId || null);
                setCurrentWorkflowName(nameToLoad);
                devLog.log('Canvas state loaded successfully for:', nameToLoad);
            } else {
                devLog.log('No saved state found for:', nameToLoad);
            }
        } catch (error) {
            devLog.error('Failed to load canvas state:', error);
        }
    }, []);
    
    const resetCanvasState = useCallback(() => {
        setView({ x: 0, y: 0, scale: 1 });
        setNodes([]);
        setEdges([]);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setDragState({ type: 'none', startX: 0, startY: 0 });
        setEdgePreview(null);
        setExecutionOutput(null);
        setIsExecuting(false);
        setPredictedNodes([]);
        setPortPositions({});
        setSnappedPortKey(null);
        setCopiedNode(null);
        setLastDeleted(null);
        devLog.log('Canvas state reset');
    }, []);
    
    const updateNodeCount = useCallback(() => {
        setWorkflow(prev => ({
            ...prev,
            nodeCount: nodes.length
        }));
    }, [nodes.length]);
    
    return {
        // Core Canvas State
        view,
        nodes,
        edges,
        selectedNodeId,
        selectedEdgeId,
        dragState,
        edgePreview,
        
        // Workflow State
        workflowId,
        currentWorkflowName,
        workflow,
        workflowDetailData,
        isCanvasReady,
        
        // Execution State
        executionOutput,
        isExecuting,
        
        // Modal State
        nodeModalState,
        showDeploymentModal,
        isDeploy,
        
        // Interaction State
        portPositions,
        snappedPortKey,
        isSnapTargetValid,
        copiedNode,
        lastDeleted,
        
        // Predicted Nodes
        predictedNodes,
        availableNodeSpecs,
        isDraggingOutput,
        isDraggingInput,
        currentOutputType,
        currentInputType,
        
        // State Update Functions
        setView,
        setNodes,
        setEdges,
        setSelectedNodeId,
        setSelectedEdgeId,
        setDragState,
        setEdgePreview,
        
        // Workflow Actions
        setWorkflowId,
        setCurrentWorkflowName,
        setWorkflow,
        setWorkflowDetailData,
        setIsCanvasReady,
        
        // Execution Actions
        setExecutionOutput,
        setIsExecuting,
        
        // Modal Actions
        setNodeModalState,
        setShowDeploymentModal,
        setIsDeploy,
        
        // Interaction Actions
        setPortPositions,
        setSnappedPortKey,
        setIsSnapTargetValid,
        setCopiedNode,
        setLastDeleted,
        
        // Predicted Node Actions
        setPredictedNodes,
        setAvailableNodeSpecs,
        setIsDraggingOutput,
        setIsDraggingInput,
        setCurrentOutputType,
        setCurrentInputType,
        
        // Utility Functions
        getCanvasState,
        saveCurrentState,
        loadWorkflowState,
        resetCanvasState,
        updateNodeCount,
    };
};