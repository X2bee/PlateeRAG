import { useState, useCallback } from 'react';
import type { DragState, View } from '@/app/canvas/types';

interface UseDragStateReturn {
    dragState: DragState;
    setDragState: React.Dispatch<React.SetStateAction<DragState>>;
    startCanvasDrag: (e: React.MouseEvent, view: View) => void;
    startNodeDrag: (e: React.MouseEvent, nodeId: string, nodePosition: { x: number; y: number }, view: View) => void;
    startEdgeDrag: () => void;
    stopDrag: () => void;
}

export const useDragState = (): UseDragStateReturn => {
    const [dragState, setDragState] = useState<DragState>({ type: 'none', startX: 0, startY: 0 });

    const startCanvasDrag = useCallback((e: React.MouseEvent, view: View) => {
        setDragState({ 
            type: 'canvas', 
            startX: e.clientX - view.x, 
            startY: e.clientY - view.y 
        });
    }, []);

    const startNodeDrag = useCallback((
        e: React.MouseEvent, 
        nodeId: string, 
        nodePosition: { x: number; y: number }, 
        view: View
    ) => {
        setDragState({
            type: 'node',
            nodeId,
            offsetX: (e.clientX / view.scale) - nodePosition.x,
            offsetY: (e.clientY / view.scale) - nodePosition.y,
        });
    }, []);

    const startEdgeDrag = useCallback(() => {
        setDragState({ type: 'edge' });
    }, []);

    const stopDrag = useCallback(() => {
        setDragState({ type: 'none' });
    }, []);

    return {
        dragState,
        setDragState,
        startCanvasDrag,
        startNodeDrag,
        startEdgeDrag,
        stopDrag
    };
};