"use client";

import React, { useRef, useEffect, forwardRef, useState, useImperativeHandle  } from 'react';
import styles from '@/app/assets/Canvas.module.scss';
import Node from '@/app/components/Node';

const MIN_SCALE = 0.6;
const MAX_SCALE = 3;
const ZOOM_SENSITIVITY = 0.05;

const Canvas = forwardRef((props, ref) => {
    const contentRef = useRef(null)
    const containerRef = useRef(null)
    const dragStart = useRef({ x: 0, y: 0, viewX: 0, viewY: 0 });
    const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    
    const [nodes, setNodes] = useState([]);
    useImperativeHandle(ref, () => ({
        getCanvasState: () => {
            return {
                view,
                nodes,
            };
        }
    }));

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        setIsDragging(true);
        containerRef.current.style.cursor = 'grabbing';
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            viewX: view.x,
            viewY: view.y,
        };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setView(prev => ({
            scale: prev.scale,
            x: dragStart.current.viewX + dx,
            y: dragStart.current.viewY + dy,
        }));
    };

    const handleMouseUpOrLeave = (e) => {
        if (isDragging) {
            setIsDragging(false);
            containerRef.current.style.cursor = 'grab';
        }
    };
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            e.preventDefault();

            setView(prevView => {
                const delta = e.deltaY > 0 ? -1 : 1;
                const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prevView.scale + delta * ZOOM_SENSITIVITY * prevView.scale));

                if (newScale === prevView.scale) {
                    return prevView;
                }

                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const worldX = (mouseX - prevView.x) / prevView.scale;
                const worldY = (mouseY - prevView.y) / prevView.scale;

                const newX = mouseX - worldX * newScale;
                const newY = mouseY - worldY * newScale;

                return { x: newX, y: newY, scale: newScale };
            });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [view]);

    useEffect(() => {
        const container = containerRef.current;
        const content = contentRef.current;

        if (container && content) {
            const scrollableWidth = container.clientWidth - content.offsetWidth;
            const scrollableHeight = container.clientHeight - content.offsetHeight;

            const initialX = (scrollableWidth) / 2;
            const initialY = (scrollableHeight) / 2;

            setView({ x: initialX, y: initialY, scale: 1 });
        }
    }, [])

    useImperativeHandle(ref, () => ({
        getCanvasState: () => ({ view, nodes }),
        addNode: (nodeData, clientX, clientY) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const worldX = (clientX - rect.left - view.x) / view.scale;
            const worldY = (clientY - rect.top - view.y) / view.scale;

            const newNode = {
                id: `${nodeData.id}-${Date.now()}`,
                data: nodeData,
                position: { x: worldX, y: worldY },
            };

            setNodes(prevNodes => [...prevNodes, newNode]);
        }
    }));

    return (
        <div
            ref={containerRef}
            className={styles.canvasContainer}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
        >
            <div
                ref={contentRef}
                className={styles.canvasGrid}
                style={{
                    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                    transformOrigin: '0 0',
                }}
            >
                {nodes.map(node => (
                    <Node key={node.id} data={node.data} position={node.position} />
                ))}
            </div>
        </div>
    );
});

Canvas.displayName = 'Canvas';

export default Canvas;
