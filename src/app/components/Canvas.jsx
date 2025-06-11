"use client";

import React, { useRef, useEffect, useState } from 'react';
import styles from '@/app/assets/Canvas.module.scss';

const MIN_SCALE = 0.6;
const MAX_SCALE = 3;
const ZOOM_SENSITIVITY = 0.05;

const Canvas = () => {
    const contentRef = useRef(null)
    const containerRef = useRef(null)
    const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0, viewX: 0, viewY: 0 });

    // useEffect(() => {
    //     const container = containerRef.current;
    //     if (container) {
    //         const scrollableWidth = container.scrollWidth - container.clientWidth;
    //         const scrollableHeight = container.scrollHeight - container.clientHeight;
    //         container.scrollLeft = scrollableWidth / 2;
    //         container.scrollTop = scrollableHeight / 2;
    //     }
    // }, []);

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
            const scrollableWidth = container.clientWidth - container.scrollWidth;
            const scrollableHeight = container.clientHeight - container.scrollHeight;

            const initialX = (scrollableWidth) / 2;
            const initialY = (scrollableHeight) / 2;

            setView({ x: initialX, y: initialY, scale: 1 });
        }
    }, [])
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
                <div style={{
                    "display": "flex",
                    "justifyContent": "center",
                    "alignContent": "center",
                    "height": "100%",
                    "alignItems": "center",
                }}>
                    <div>ababababab</div>
                </div>
            </div>
        </div>
    );
};

export default Canvas;
