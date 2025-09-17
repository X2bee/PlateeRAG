import { useState, useCallback } from 'react';
import type { DragState, View } from '@/app/canvas/types';

interface UseDragStateProps {
    historyHelpers?: {
        recordNodeMove: (nodeId: string, fromPosition: { x: number; y: number }, toPosition: { x: number; y: number }) => void;
    };
    nodes: any[];
}

interface UseDragStateReturn {
    dragState: DragState;
    setDragState: React.Dispatch<React.SetStateAction<DragState>>;
    startCanvasDrag: (e: React.MouseEvent, view: View) => void;
    startNodeDrag: (e: React.MouseEvent, nodeId: string, nodePosition: { x: number; y: number }, view: View) => void;
    startEdgeDrag: () => void;
    stopDrag: () => void;
}

export const useDragState = ({ historyHelpers, nodes }: UseDragStateProps): UseDragStateReturn => {
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
            initialNodePosition: { ...nodePosition }
        });
    }, []);

    const startEdgeDrag = useCallback(() => {
        setDragState({ type: 'edge' });
    }, []);

    const stopDrag = useCallback(() => {
        console.log('🛑 stopDrag called, dragState:', dragState);
        // 노드 드래그가 끝났을 때 히스토리 기록
        if (dragState.type === 'node' && dragState.nodeId && historyHelpers?.recordNodeMove) {
            const node = nodes.find(n => n.id === dragState.nodeId);
            console.log('🛑 Found node for drag:', node, 'initialPosition:', dragState.initialNodePosition);
            if (node && dragState.initialNodePosition) {
                const currentPosition = node.position;
                const initialPosition = dragState.initialNodePosition;

                // 실제로 이동했는지 확인 (5px 이상 이동한 경우에만 기록)
                const distance = Math.sqrt(
                    Math.pow(currentPosition.x - initialPosition.x, 2) +
                    Math.pow(currentPosition.y - initialPosition.y, 2)
                );

                console.log('🛑 Movement distance:', distance, 'from', initialPosition, 'to', currentPosition);

                if (distance > 5) {
                    console.log('🛑 Recording node move:', { nodeId: dragState.nodeId, initialPosition, currentPosition });
                    historyHelpers.recordNodeMove(dragState.nodeId, initialPosition, currentPosition);
                }
            }
        }

        setDragState({ type: 'none' });
    }, [dragState, historyHelpers, nodes]);

    return {
        dragState,
        setDragState,
        startCanvasDrag,
        startNodeDrag,
        startEdgeDrag,
        stopDrag
    };
};
