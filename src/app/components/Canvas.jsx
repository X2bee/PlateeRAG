"use client";

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback, memo, useLayoutEffect } from 'react';
import styles from '@/app/assets/Canvas.module.scss';
import Node from '@/app/components/Node';
import Edge from '@/app/components/Edge';

const MIN_SCALE = 0.6;
const MAX_SCALE = 20;
const ZOOM_SENSITIVITY = 0.05;
const SNAP_DISTANCE = 20; // World units

const Canvas = forwardRef((props, ref) => {
    const contentRef = useRef(null);
    const containerRef = useRef(null);

    const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState(null);
    const [dragState, setDragState] = useState({ type: 'none', startX: 0, startY: 0 });
    const [edgePreview, setEdgePreview] = useState(null);
    const [portPositions, setPortPositions] = useState({});

    const nodesRef = useRef(nodes);
    const edgePreviewRef = useRef(edgePreview);
    const portRefs = useRef(new Map());

    useLayoutEffect(() => {
        const newPortPositions = {};
        const contentEl = contentRef.current;
        if (!contentEl) return;

        const contentRect = contentEl.getBoundingClientRect();

        portRefs.current.forEach((portEl, key) => {
            if (portEl) {
                const portRect = portEl.getBoundingClientRect();
                const x = (portRect.left + portRect.width / 2 - contentRect.left) / view.scale;
                const y = (portRect.top + portRect.height / 2 - contentRect.top) / view.scale;
                newPortPositions[key] = { x, y };
            }
        });
        setPortPositions(newPortPositions);
    }, [nodes, view.scale]);


    const registerPortRef = useCallback((nodeId, portId, portType, el) => {
        const key = `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;
        if (el) {
            portRefs.current.set(key, el);
        } else {
            portRefs.current.delete(key);
        }
    }, []);


    useImperativeHandle(ref, () => ({
        getCanvasState: () => ({ view, nodes, edges }),
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
        },
        loadCanvasState: (state) => {
            if (state.nodes) setNodes(state.nodes);
            if (state.edges) setEdges(state.edges);
            if (state.view) setView(state.view);
        }
    }));

    const calculateDistance = (pos1, pos2) => {
        if (!pos1 || !pos2) return Infinity;
        return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
    };

    // --- 이벤트 핸들러 ---
    const handleCanvasMouseDown = (e) => {
        if (e.button !== 0) return;
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
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

    const handleNodeMouseDown = useCallback((e, nodeId) => {
        if (e.button !== 0) return;
        setSelectedNodeId(nodeId);
        setSelectedEdgeId(null);
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

    const handleEdgeClick = useCallback((edgeId) => {
        setSelectedEdgeId(edgeId);
        setSelectedNodeId(null);
    }, []);

    // handlePortMouseUp is now defined before handleMouseUp
    const handlePortMouseUp = useCallback(({ nodeId, portId, portType }) => {
        const currentEdgePreview = edgePreviewRef.current;
        if (!currentEdgePreview || currentEdgePreview.source.portType === portType) {
            setEdgePreview(null);
            return;
        };

        const sourceNodeId = currentEdgePreview.source.nodeId;
        if (sourceNodeId === nodeId) {
            setEdgePreview(null);
            return;
        }

        const newEdgeSignature = `${currentEdgePreview.source.nodeId}:${currentEdgePreview.source.portId}-${nodeId}:${portId}`; // Signature can remain simple
        const isDuplicate = edges.some(edge =>
            `${edge.source.nodeId}:${edge.source.portId}-${edge.target.nodeId}:${edge.target.portId}` === newEdgeSignature
        );

        if (isDuplicate) {
            setEdgePreview(null);
            return;
        }

        let newEdges = [...edges];
        if (portType === 'input') { // Only apply for input targets
            const targetPort = findPortData(nodeId, portId, 'input');
            if (targetPort && !targetPort.multi) {
                newEdges = newEdges.filter(edge => !(edge.target.nodeId === nodeId && edge.target.portId === portId));
            }
        }

        const newEdge = {
            id: `edge-${newEdgeSignature}-${Date.now()}`,
            source: currentEdgePreview.source,
            target: { nodeId, portId, portType }
        };
        setEdges([...newEdges, newEdge]);
        setEdgePreview(null);
    }, [edges, nodes]); // Dependencies: [edges, nodes]

    const handleMouseUp = useCallback(() => {
        const currentDragStateType = dragState.type;
        const currentEdgePreview = edgePreviewRef.current;

        setDragState({ type: 'none' });

        if (currentDragStateType === 'edge' && currentEdgePreview) {
            if (currentEdgePreview.source && currentEdgePreview.source.portType === 'output') {
                const { source: edgeSource, targetPos: mouseUpPos } = currentEdgePreview;
                let snappedPortDetails = null;
                let minSnapDistance = SNAP_DISTANCE; // SNAP_DISTANCE should be defined in the file

                portRefs.current.forEach((portEl, key) => {
                    const parts = key.split('__PORTKEYDELIM__');
                    if (parts.length !== 3) {
                        console.warn(`[Canvas Debug] Malformed port key encountered (new delimiter): ${key}`);
                        return; // Skip this iteration
                    }
                    const targetNodeId = parts[0];
                    const targetPortId = parts[1];
                    const targetPortType = parts[2];

                    if (targetPortType === 'input') {
                        if (edgeSource.nodeId === targetNodeId) {
                            return;
                        }

                        const targetPortWorldPos = portPositions[key];
                        // calculateDistance should be defined in the file
                        if (targetPortWorldPos && typeof calculateDistance === 'function') {
                            const distance = calculateDistance(mouseUpPos, targetPortWorldPos);
                            if (distance < minSnapDistance) {
                                minSnapDistance = distance;
                                snappedPortDetails = { nodeId: targetNodeId, portId: targetPortId, portType: targetPortType };
                            }
                        }
                    }
                });

                if (snappedPortDetails) {
                    handlePortMouseUp(snappedPortDetails);
                    return;
                }
            }
            setEdgePreview(null);
        } else if (currentEdgePreview) {
            setEdgePreview(null);
        }
    }, [
        dragState,
        edgePreviewRef,
        setDragState,
        setEdgePreview,
        portRefs,
        portPositions,
        handlePortMouseUp
        // Assuming SNAP_DISTANCE is a module/component const and calculateDistance is a stable function (e.g. defined outside or plain function in component scope)
        // If calculateDistance is defined inside Canvas and not useCallback, it should be in deps.
        // The last subtask report for adding logging confirmed calculateDistance is a plain function in component scope.
        // For stricter linting, it might be listed, but often isn't for plain helpers if they don't cause issues.
        // Keeping deps as per last confirmed state: [dragState, edgePreviewRef, setDragState, setEdgePreview, portRefs, portPositions, handlePortMouseUp]
    ]);

    const handlePortMouseDown = useCallback(({ nodeId, portId, portType, isMulti }) => {
        if (portType === 'input' && !isMulti) {
            const existingEdge = edges.find(e => e.target.nodeId === nodeId && e.target.portId === portId);
            if (existingEdge) {
                setDragState({ type: 'edge' });
                setEdges(prevEdges => prevEdges.filter(e => e.id !== existingEdge.id));

                // Corrected key for lookup (already applied in previous step, ensure it's this version)
                const sourcePosKey = `${existingEdge.source.nodeId}__PORTKEYDELIM__${existingEdge.source.portId}__PORTKEYDELIM__${existingEdge.source.portType}`;
                const sourcePos = portPositions[sourcePosKey];
                if (sourcePos) {
                    setEdgePreview({
                        source: existingEdge.source,
                        startPos: sourcePos,
                        targetPos: sourcePos
                    });
                }
                return;
            }
        }

        if (portType === 'output') {
            setDragState({ type: 'edge' });
            // Corrected key for lookup
            const startPosKey = `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;
            const startPos = portPositions[startPosKey];
            if (startPos) {
                setEdgePreview({ source: { nodeId, portId, portType }, startPos, targetPos: startPos });
            }
            return;
        }
    }, [edges, portPositions, setDragState, setEdges, setEdgePreview]); // Updated dependencies


    // --- Effect ---
    useEffect(() => {
        nodesRef.current = nodes;
        edgePreviewRef.current = edgePreview;
    }, [nodes, edgePreview]);

    useEffect(() => { edgePreviewRef.current = edgePreview; }, [edgePreview]);


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
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedNodeId) {
                    setNodes(prev => prev.filter(node => node.id !== selectedNodeId));
                    setEdges(prev => prev.filter(edge => edge.source.nodeId !== selectedNodeId && edge.target.nodeId !== selectedNodeId));
                    setSelectedNodeId(null);
                } else if (selectedEdgeId) {
                    setEdges(prev => prev.filter(edge => edge.id !== selectedEdgeId));
                    setSelectedEdgeId(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeId, selectedEdgeId]);

    // --- Helper Function ---
    const findPortData = (nodeId, portId, portType) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return null;
        const portList = portType === 'input' ? node.data.inputs : node.data.outputs;
        return portList?.find(p => p.id === portId) || null;
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
                            const sourceKey = `${edge.source.nodeId}__PORTKEYDELIM__${edge.source.portId}__PORTKEYDELIM__${edge.source.portType}`;
                            const targetKey = `${edge.target.nodeId}__PORTKEYDELIM__${edge.target.portId}__PORTKEYDELIM__${edge.target.portType}`;
                            const sourcePos = portPositions[sourceKey];
                            const targetPos = portPositions[targetKey];
                            return <Edge
                                key={edge.id}
                                id={edge.id}
                                sourcePos={sourcePos}
                                targetPos={targetPos}
                                onEdgeClick={handleEdgeClick}
                                isSelected={edge.id === selectedEdgeId}
                            />;
                        })}

                        {edgePreview?.targetPos && (
                            <Edge
                                sourcePos={edgePreview.startPos}
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