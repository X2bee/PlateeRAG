"use client";
import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import Node from '@/app/canvas/components/Node';
import Edge from '@/app/canvas/components/Edge';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/canvas/assets/MiniCanvas.module.scss';
import type {
    Position,
    Port,
    Parameter,
    NodeData,
    CanvasNode,
    EdgeConnection,
    CanvasEdge,
    WorkflowData,
    Template,
    MiniCanvasProps,
    PortMouseEventData,
    DummyHandlers
} from '@/app/canvas/types';

const MiniCanvas: React.FC<MiniCanvasProps> = ({ template }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState<number>(0.6);
    const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

    // Workflow data
    const nodes: CanvasNode[] = template.data?.nodes || [];
    const edges: CanvasEdge[] = template.data?.edges || [];

    // Adjust node positions for mini canvas
    const adjustedNodes: CanvasNode[] = nodes.map(node => ({
        ...node,
        position: {
            x: (node.position.x - 8800) * 0.8, // Coordinate adjustment
            y: (node.position.y - 4300) * 0.8
        }
    }));

    // Mouse wheel zoom
    const handleWheel = (e: WheelEvent): void => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => Math.max(0.2, Math.min(2, prev + delta)));
    };

    // Start drag
    const handleMouseDown = (e: MouseEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            setDragStart({
                x: e.clientX - rect.left - offset.x,
                y: e.clientY - rect.top - offset.y
            });
        }
    };

    // During drag
    const handleMouseMove = (e: globalThis.MouseEvent): void => {
        if (!isDragging) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        setOffset({
            x: e.clientX - rect.left - dragStart.x,
            y: e.clientY - rect.top - dragStart.y
        });
    };

    // End drag
    const handleMouseUp = (e: globalThis.MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    // Register event listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const wheelHandler = (e: WheelEvent) => handleWheel(e);
        canvas.addEventListener('wheel', wheelHandler, { passive: false });

        return () => {
            canvas.removeEventListener('wheel', wheelHandler);
        };
    }, []);

    // Global drag events
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    // Dummy handlers (no actual functionality but required for Node component)
    const dummyHandlers: DummyHandlers = {
        onNodeClick: () => {},
        onNodeDrag: () => {},
        onPortClick: () => {},
        onNodeDelete: () => {},
        onNodeDuplicate: () => {},
        updateNodeData: () => {},
        onNodeMouseDown: () => {},
        onPortMouseDown: () => {},
        onPortMouseUp: () => {},
        registerPortRef: () => {},
        onParameterChange: () => {},
        onNodeNameChange: () => {},
        onClearSelection: () => {}
    };

    const handleZoomIn = (): void => {
        setScale(prev => Math.min(2, prev + 0.1));
    };

    const handleZoomOut = (): void => {
        setScale(prev => Math.max(0.2, prev - 0.1));
    };

    return (
        <div
            className={`${styles.miniCanvas} miniCanvas`}
            ref={canvasRef}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
        >
            <div
                className={styles.canvasContent}
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transformOrigin: '0 0'
                }}
            >
                {/* Background grid */}
                <div className={styles.grid} />

                {/* Edge rendering */}
                <svg
                    className={styles.edgesSvg}
                    style={{
                        width: '2000px',
                        height: '2000px',
                        position: 'absolute',
                        top: '-500px',
                        left: '-500px',
                        pointerEvents: 'none',
                        zIndex: 1
                    }}
                >
                    {edges.map(edge => {
                        const sourceNode = adjustedNodes.find(n => n.id === edge.source.nodeId);
                        const targetNode = adjustedNodes.find(n => n.id === edge.target.nodeId);

                        if (!sourceNode || !targetNode) {
                            devLog.warn('Missing node for edge:', edge.id);
                            return null;
                        }

                        // Simple port position calculation for mini canvas scale
                        const nodeWidth = 350 * 0.8; // 280px
                        const nodeHeight = 120 * 0.8; // Approximate node height

                        // Apply SVG coordinate offset
                        const sourcePos: Position = {
                            x: sourceNode.position.x + nodeWidth + 500,  // SVG offset + node right end
                            y: sourceNode.position.y + nodeHeight / 2 + 500   // SVG offset + node center height
                        };
                        const targetPos: Position = {
                            x: targetNode.position.x + 500,       // SVG offset + node left start
                            y: targetNode.position.y + nodeHeight / 2 + 500   // SVG offset + node center height
                        };

                        return (
                            <Edge
                                key={edge.id}
                                id={edge.id}
                                sourcePos={sourcePos}
                                targetPos={targetPos}
                                isPreview={true}
                                onEdgeClick={() => {}}
                                isSelected={false}
                            />
                        );
                    })}
                </svg>

                {/* Node rendering */}
                <div className={styles.nodesContainer}>
                    {adjustedNodes.map(node => (
                        <Node
                            key={node.id}
                            id={node.id}
                            data={node.data}
                            position={node.position}
                            isPreview={true}
                            isSelected={false}
                            snappedPortKey={null}
                            isSnapTargetInvalid={false}
                            {...dummyHandlers}
                        />
                    ))}
                </div>
            </div>

            {/* Zoom controls */}
            <div className={styles.zoomControls}>
                <button
                    className={styles.zoomButton}
                    onClick={handleZoomIn}
                >
                    +
                </button>
                <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
                <button
                    className={styles.zoomButton}
                    onClick={handleZoomOut}
                >
                    -
                </button>
            </div>
        </div>
    );
};

export default MiniCanvas;
