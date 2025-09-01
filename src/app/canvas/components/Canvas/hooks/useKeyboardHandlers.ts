import { useCallback } from 'react';
import type { CanvasNode, CanvasEdge, DeletedItem } from '@/app/canvas/types';

interface UseKeyboardHandlersProps {
    // State
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    lastDeleted: DeletedItem | null;
    
    // State setters
    setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
    
    // Handlers from other hooks
    copyNode: (nodeId: string) => void;
    pasteNode: () => string | null;
    undoDelete: () => CanvasNode | null;
    deleteNode: (nodeId: string, connectedEdges: CanvasEdge[]) => void;
    removeEdge: (edgeId: string) => void;
    removeNodeEdges: (nodeId: string) => CanvasEdge[];
    clearSelection: () => void;
    selectNode: (nodeId: string) => void;
}

interface UseKeyboardHandlersReturn {
    handleKeyDown: (e: KeyboardEvent) => void;
}

export const useKeyboardHandlers = ({
    selectedNodeId,
    selectedEdgeId,
    lastDeleted,
    setEdges,
    copyNode,
    pasteNode,
    undoDelete,
    deleteNode,
    removeEdge,
    removeNodeEdges,
    clearSelection,
    selectNode
}: UseKeyboardHandlersProps): UseKeyboardHandlersReturn => {

    const handleKeyDown = useCallback((e: KeyboardEvent): void => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
            return;
        }

        const isCtrlOrCmd = e.ctrlKey || e.metaKey;

        if (isCtrlOrCmd && e.key === 'c') {
            e.preventDefault();
            if (selectedNodeId) copyNode(selectedNodeId);
        } else if (isCtrlOrCmd && e.key === 'v') {
            e.preventDefault();
            const pastedNodeId = pasteNode();
            if (pastedNodeId) selectNode(pastedNodeId);
        } else if (isCtrlOrCmd && e.key === 'z') {
            e.preventDefault();
            const restoredNode = undoDelete();
            if (restoredNode) {
                const connectedEdges = lastDeleted?.edges || [];
                setEdges(prev => [...prev, ...connectedEdges]);
            }
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
            e.preventDefault();
            const connectedEdges = removeNodeEdges(selectedNodeId);
            deleteNode(selectedNodeId, connectedEdges);
            clearSelection();
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
            e.preventDefault();
            removeEdge(selectedEdgeId);
            clearSelection();
        }
    }, [
        selectedNodeId,
        selectedEdgeId,
        lastDeleted,
        copyNode,
        pasteNode,
        undoDelete,
        deleteNode,
        removeEdge,
        removeNodeEdges,
        clearSelection,
        selectNode,
        setEdges
    ]);

    return {
        handleKeyDown
    };
};