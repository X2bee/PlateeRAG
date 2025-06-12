"use client";

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback, memo } from 'react';
import styles from '@/app/assets/Canvas.module.scss';
import Node from '@/app/components/Node';
import Edge from '@/app/components/Edge';

const MIN_SCALE = 0.6;
const MAX_SCALE = 100;
const ZOOM_SENSITIVITY = 0.05;

const Canvas = forwardRef((props, ref) => {
    const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [dragState, setDragState] = useState({ type: 'none', startX: 0, startY: 0 });
    const [edgePreview, setEdgePreview] = useState(null);

    const contentRef = useRef(null);
    const containerRef = useRef(null);
    const nodesRef = useRef(nodes);
    const portRefs = useRef(new Map());

    const registerPortRef = useCallback((nodeId, portId, portType, el) => {
        if (el) {
            portRefs.current.set(`${nodeId}-${portId}-${portType}`, el);
        } else {
            portRefs.current.delete(`${nodeId}-${portId}-${portType}`);
        }
    }, []);

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
            setNodes(prev => [...prev, newNode]);
        }
    }));

    // --- 이벤트 핸들러 ---
    const handleCanvasMouseDown = (e) => {
        if (e.button !== 0) return;
        setSelectedNodeId(null);
        setDragState({ type: 'canvas', startX: e.clientX - view.x, startY: e.clientY - view.y });
    };

    const handleMouseMove = (e) => {
        if (dragState.type === 'none') return;
        if (dragState.type === 'canvas') {
            setView(prev => ({ ...prev, x: e.clientX - dragState.startX, y: e.clientY - dragState.startY }));
        } else if (dragState.type === 'node') {
            const newX = (e.clientX / view.scale) - dragState.offsetX;
            const newY = (e.clientY / view.scale) - dragState.offsetY;
            setNodes(prevNodes =>
                prevNodes.map(node =>
                    node.id === dragState.nodeId ? { ...node, position: { x: newX, y: newY } } : node
                )
            );
        } else if (dragState.type === 'edge') {
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            setEdgePreview(prev => ({
                ...prev,
                targetPos: {
                    x: (e.clientX - rect.left - view.x) / view.scale,
                    y: (e.clientY - rect.top - view.y) / view.scale,
                }
            }));
        }
    };

    const handleMouseUp = () => {
        setDragState({ type: 'none' });
        if (edgePreview) {
            setEdgePreview(null);
        }
    };

    const handleNodeMouseDown = useCallback((e, nodeId) => {
        if (e.button !== 0) return;
        setSelectedNodeId(nodeId);
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            setDragState({
                type: 'node',
                nodeId,
                offsetX: (e.clientX / view.scale) - node.position.x,
                offsetY: (e.clientY / view.scale) - node.position.y,
            });
        }
    }, [nodes, view.scale]);

    const handlePortMouseUp = useCallback(({ nodeId, portId, portType }) => {
        if (!edgePreview || edgePreview.source.portType === portType) {
            setEdgePreview(null);
            return;
        };

        const sourceNodeId = edgePreview.source.nodeId;
        if (sourceNodeId === nodeId) {
            setEdgePreview(null);
            return;
        }

        const newEdge = {
            id: `edge-${sourceNodeId}:${edgePreview.source.portId}-${nodeId}:${portId}`,
            source: edgePreview.source,
            target: { nodeId, portId, portType }
        };
        setEdges(prev => [...prev.filter(edge => edge.id !== newEdge.id), newEdge]);
        setEdgePreview(null);
    }, [edgePreview]);

    const handlePortMouseDown = useCallback(({ nodeId, portId, portType }) => {
        setDragState({ type: 'edge' });
        setEdgePreview({
            source: { nodeId, portId, portType },
            targetPos: null
        });
    }, []);


    // --- Effect ---
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleWheel = (e) => {
            e.preventDefault();
            setView(prevView => {
                const delta = e.deltaY > 0 ? -1 : 1;
                const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prevView.scale + delta * ZOOM_SENSITIVITY * prevView.scale));
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
        };
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        const content = contentRef.current;
        if (container && content) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const contentWidth = content.offsetWidth;
            const contentHeight = content.offsetHeight;
            setView({ x: (containerWidth - contentWidth) / 2, y: (containerHeight - contentHeight) / 2, scale: 1 });
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
                setNodes(prev => prev.filter(node => node.id !== selectedNodeId));
                setSelectedNodeId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeId]);

    const getPortPosition = (nodeId, portId, portType) => {
        const portEl = portRefs.current.get(`${nodeId}-${portId}-${portType}`);
        const contentEl = contentRef.current;
        if (!portEl || !contentEl) return null;

        const contentRect = contentEl.getBoundingClientRect();
        const portRect = portEl.getBoundingClientRect();

        // [수정] 줌 레벨(view.scale)을 고려하여 정확한 월드 좌표 계산
        const x = (portRect.left + portRect.width / 2 - contentRect.left) / view.scale;
        const y = (portRect.top + portRect.height / 2 - contentRect.top) / view.scale;

        return { x, y };
    };
    return (
        <div
            ref={containerRef}
            className={styles.canvasContainer}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                ref={contentRef}
                className={styles.canvasGrid}
                style={{
                    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                    transformOrigin: '0 0',
                }}
            >
                <svg className={styles.svgLayer}>
                    <g>
                        {edges.map(edge => {
                            const sourcePos = getPortPosition(edge.source.nodeId, edge.source.portId, edge.source.portType);
                            const targetPos = getPortPosition(edge.target.nodeId, edge.target.portId, edge.target.portType);
                            return <Edge key={edge.id} sourcePos={sourcePos} targetPos={targetPos} />;
                        })}
                        {edgePreview?.targetPos && (
                            <Edge
                                sourcePos={getPortPosition(edgePreview.source.nodeId, edgePreview.source.portId, edgePreview.source.portType)}
                                targetPos={edgePreview.targetPos}
                            />
                        )}
                    </g>
                </svg>
                {nodes.map(node => (
                    <Node
                        key={node.id}
                        id={node.id}
                        data={node.data}
                        position={node.position}
                        onNodeMouseDown={handleNodeMouseDown}
                        isSelected={node.id === selectedNodeId}
                        onPortMouseDown={handlePortMouseDown}
                        onPortMouseUp={handlePortMouseUp}
                        registerPortRef={registerPortRef}
                    />
                ))}
            </div>
        </div>
    );
});

Canvas.displayName = 'Canvas';
export default memo(Canvas);