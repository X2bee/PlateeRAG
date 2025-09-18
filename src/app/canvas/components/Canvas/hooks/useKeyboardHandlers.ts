import { useCallback } from 'react';
import type { CanvasNode, CanvasEdge } from '@/app/canvas/types';

interface UseKeyboardHandlersProps {
    // State
    selectedNodeId: string | null;
    selectedEdgeId: string | null;

    // State setters - removed setEdges as it was only used for undo

    // Handlers from other hooks
    copyNode: (nodeId: string) => void;
    pasteNode: () => string | null;
    deleteNode: (nodeId: string, connectedEdges: CanvasEdge[]) => void;
    removeEdge: (edgeId: string) => void;
    removeNodeEdges: (nodeId: string) => CanvasEdge[];
    clearSelection: () => void;
    selectNode: (nodeId: string) => void;

    // History management
    undo: () => any;
    redo: () => any;
    canUndo: boolean;
    canRedo: boolean;
}

interface UseKeyboardHandlersReturn {
    handleKeyDown: (e: KeyboardEvent) => void;
}

export const useKeyboardHandlers = ({
    selectedNodeId,
    selectedEdgeId,
    copyNode,
    pasteNode,
    deleteNode,
    removeEdge,
    removeNodeEdges,
    clearSelection,
    selectNode,
    undo,
    redo,
    canUndo,
    canRedo
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
        } else if (isCtrlOrCmd && e.shiftKey && e.key === 'Z') {
            // Ctrl+Shift+Z for Redo
            e.preventDefault();
            if (canRedo) {
                redo();
            }
        } else if (isCtrlOrCmd && e.key === 'z') {
            // Ctrl+Z for Undo
            e.preventDefault();
            if (canUndo) {
                undo();
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
        copyNode,
        pasteNode,
        deleteNode,
        removeEdge,
        removeNodeEdges,
        clearSelection,
        selectNode,
        undo,
        redo,
        canUndo,
        canRedo
    ]);

    return {
        handleKeyDown
    };
};
