import { useState, useCallback, useRef } from 'react';
import type { View, Position } from '@/app/canvas/types';

const MIN_SCALE = 0.6;
const MAX_SCALE = 20;
const ZOOM_SENSITIVITY = 0.05;

interface UseCanvasViewProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
    contentRef: React.RefObject<HTMLDivElement | null>;
}

interface UseCanvasViewReturn {
    view: View;
    setView: React.Dispatch<React.SetStateAction<View>>;
    getCenteredView: () => View;
    handleWheel: (e: WheelEvent) => void;
}

export const useCanvasView = ({ 
    containerRef, 
    contentRef 
}: UseCanvasViewProps): UseCanvasViewReturn => {
    const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 });

    const getCenteredView = useCallback((): View => {
        const container = containerRef.current;
        const content = contentRef.current;

        if (container && content) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const contentWidth = content.offsetWidth;
            const contentHeight = content.offsetHeight;

            if (containerWidth <= 0 || containerHeight <= 0) {
                return { x: 0, y: 0, scale: 1 };
            }

            const centeredView: View = {
                x: (containerWidth - contentWidth) / 2,
                y: (containerHeight - contentHeight) / 2,
                scale: 1
            };

            return centeredView;
        }

        return { x: 0, y: 0, scale: 1 };
    }, [containerRef, contentRef]);

    const handleWheel = useCallback((e: WheelEvent): void => {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;

        setView(prevView => {
            const delta = e.deltaY > 0 ? -1 : 1;
            const newScale = Math.max(
                MIN_SCALE, 
                Math.min(MAX_SCALE, prevView.scale + delta * ZOOM_SENSITIVITY * prevView.scale)
            );
            
            if (newScale === prevView.scale) return prevView;
            
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldX = (mouseX - prevView.x) / prevView.scale;
            const worldY = (mouseY - prevView.y) / prevView.scale;
            const newX = mouseX - worldX * newScale;
            const newY = mouseY - worldY * newScale;
            
            return { x: newX, y: newY, scale: newScale };
        });
    }, [containerRef]);

    return {
        view,
        setView,
        getCenteredView,
        handleWheel
    };
};