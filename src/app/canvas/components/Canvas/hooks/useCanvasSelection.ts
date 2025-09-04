import { useState, useCallback } from 'react';

interface UseCanvasSelectionReturn {
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
    setSelectedEdgeId: React.Dispatch<React.SetStateAction<string | null>>;
    clearSelection: () => void;
    selectNode: (nodeId: string) => void;
    selectEdge: (edgeId: string) => void;
}

export const useCanvasSelection = (): UseCanvasSelectionReturn => {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

    const clearSelection = useCallback(() => {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
    }, []);

    const selectNode = useCallback((nodeId: string) => {
        setSelectedNodeId(nodeId);
        setSelectedEdgeId(null);
    }, []);

    const selectEdge = useCallback((edgeId: string) => {
        setSelectedEdgeId(edgeId);
        setSelectedNodeId(null);
    }, []);

    return {
        selectedNodeId,
        selectedEdgeId,
        setSelectedNodeId,
        setSelectedEdgeId,
        clearSelection,
        selectNode,
        selectEdge
    };
};