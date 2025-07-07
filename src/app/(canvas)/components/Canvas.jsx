"use client";

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback, memo, useLayoutEffect } from 'react';
import styles from '@/app/(canvas)/assets/Canvas.module.scss';
import Node from '@/app/(canvas)/components/Node';
import Edge from '@/app/(canvas)/components/Edge';

const MIN_SCALE = 0.6;
const MAX_SCALE = 20;
const ZOOM_SENSITIVITY = 0.05;
const SNAP_DISTANCE = 40;

// 타입 호환성 검사 헬퍼 함수
const areTypesCompatible = (sourceType, targetType) => {
    if (!sourceType || !targetType) return true;
    if (sourceType === targetType) return true;
    if (sourceType === 'INT' && targetType === 'FLOAT') return true;
    return false;
};

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
    const [snappedPortKey, setSnappedPortKey] = useState(null);
    const [isSnapTargetValid, setIsSnapTargetValid] = useState(true);

    const nodesRef = useRef(nodes);
    const edgePreviewRef = useRef(edgePreview);
    const portRefs = useRef(new Map());
    const snappedPortKeyRef = useRef(snappedPortKey);
    const isSnapTargetValidRef = useRef(isSnapTargetValid);

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

    const handleParameterChange = useCallback((nodeId, paramId, value) => {
        setNodes(prevNodes =>
            prevNodes.map(node => {
                if (node.id === nodeId) {
                    const newParameters = node.data.parameters.map(param => {
                        if (param.id === paramId) {
                            const newValue = typeof param.value === 'number' ? Number(value) : value;
                            return { ...param, value: newValue };
                        }
                        return param;
                    });
                    const newData = { ...node.data, parameters: newParameters };
                    return { ...node, data: newData };
                }
                return node;
            })
        );
    }, []);

    const findPortData = (nodeId, portId, portType) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return null;
        const portList = portType === 'input' ? node.data.inputs : node.data.outputs;
        return portList?.find(p => p.id === portId) || null;
    };

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
            if (!container || !edgePreviewRef.current) return;

            const rect = container.getBoundingClientRect();
            const mousePos = {
                x: (e.clientX - rect.left - view.x) / view.scale,
                y: (e.clientY - rect.top - view.y) / view.scale,
            };

            setEdgePreview(prev => ({ ...prev, targetPos: mousePos }));

            let closestPortKey = null;
            let minSnapDistance = SNAP_DISTANCE;
            const edgeSource = edgePreviewRef.current.source;

            if (edgeSource) {
                portRefs.current.forEach((portEl, key) => {
                    const parts = key.split('__PORTKEYDELIM__');
                    if (parts.length !== 3) return;
                    const [targetNodeId, targetPortId, targetPortType] = parts;
                    if (targetPortType === 'input' && edgeSource.nodeId !== targetNodeId) {
                        const targetPortWorldPos = portPositions[key];
                        if (targetPortWorldPos) {
                            const distance = calculateDistance(mousePos, targetPortWorldPos);
                            if (distance < minSnapDistance) {
                                minSnapDistance = distance;
                                closestPortKey = key;
                            }
                        }
                    }
                });

                if (closestPortKey) {
                    const parts = closestPortKey.split('__PORTKEYDELIM__');
                    const targetPort = findPortData(parts[0], parts[1], parts[2]);
                    const isValid = areTypesCompatible(edgeSource.type, targetPort.type);
                    setIsSnapTargetValid(isValid);
                } else {
                    setIsSnapTargetValid(true);
                }
            }
            setSnappedPortKey(closestPortKey);
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

    const handlePortMouseUp = useCallback(({ nodeId, portId, portType, type }) => {
        const currentEdgePreview = edgePreviewRef.current;
        if (!currentEdgePreview) return;

        if (currentEdgePreview && !areTypesCompatible(currentEdgePreview.source.type, type)) {
            setSnappedPortKey(null);
            setIsSnapTargetValid(true);
            setEdgePreview(null);
            return;
        }

        if (!currentEdgePreview || currentEdgePreview.source.portType === portType) {
            setEdgePreview(null);
            return;
        };

        const sourceNodeId = currentEdgePreview.source.nodeId;
        if (sourceNodeId === nodeId) {
            setEdgePreview(null);
            return;
        }

        const newEdgeSignature = `${currentEdgePreview.source.nodeId}:${currentEdgePreview.source.portId}-${nodeId}:${portId}`;
        const isDuplicate = edges.some(edge =>
            `${edge.source.nodeId}:${edge.source.portId}-${edge.target.nodeId}:${edge.target.portId}` === newEdgeSignature
        );

        if (isDuplicate) {
            setEdgePreview(null);
            return;
        }

        let newEdges = [...edges];
        if (portType === 'input') {
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
        setSnappedPortKey(null);
        setIsSnapTargetValid(true);
    }, [edges, nodes]);

    const handleMouseUp = useCallback(() => {
        setDragState({ type: 'none' });

        if (dragState.type === 'edge') {
            const snappedKey = snappedPortKeyRef.current;
            if (snappedKey) {
                const source = edgePreviewRef.current.source;
                const parts = snappedKey.split('__PORTKEYDELIM__');
                const [targetNodeId, targetPortId, targetPortType] = parts;

                const targetPortData = findPortData(targetNodeId, targetPortId, targetPortType);

                if (targetPortData && areTypesCompatible(source.type, targetPortData.type)) {
                    handlePortMouseUp({
                        nodeId: targetNodeId,
                        portId: targetPortId,
                        portType: targetPortType,
                        type: targetPortData.type
                    });
                }
            }
        }

        setEdgePreview(null);
        setSnappedPortKey(null);
        setIsSnapTargetValid(true);

    }, [dragState.type, handlePortMouseUp]);

    const handlePortMouseDown = useCallback(({ nodeId, portId, portType, isMulti, type }) => {
        if (portType === 'input') {
            let existingEdge
            if (!isMulti) {
                existingEdge = edges.find(e => e.target.nodeId === nodeId && e.target.portId === portId);
            } else{
                existingEdge = edges.findLast(e => e.target.nodeId === nodeId && e.target.portId === portId);
            }
            if (existingEdge) {
                setDragState({ type: 'edge' });
                console.log(existingEdge)
                const sourcePosKey = `${existingEdge.source.nodeId}__PORTKEYDELIM__${existingEdge.source.portId}__PORTKEYDELIM__${existingEdge.source.portType}`;
                const sourcePos = portPositions[sourcePosKey];
                const targetPosKey = `${existingEdge.target.nodeId}__PORTKEYDELIM__${existingEdge.target.portId}__PORTKEYDELIM__${existingEdge.target.portType}`;
                const targetPos = portPositions[targetPosKey];

                const sourcePortData = findPortData(existingEdge.source.nodeId, existingEdge.source.portId, existingEdge.source.portType);
                
                if (sourcePos && sourcePortData) {
                    setEdgePreview({
                        source: { ...existingEdge.source, type: sourcePortData.type },
                        startPos: sourcePos,
                        targetPos: targetPos
                    });
                }
                
                setEdges(prevEdges => prevEdges.filter(e => e.id !== existingEdge.id));
                return;
            }
            
        }

        if (portType === 'output') {
            setDragState({ type: 'edge' });
            const startPosKey = `${nodeId}__PORTKEYDELIM__${portId}__PORTKEYDELIM__${portType}`;
            const startPos = portPositions[startPosKey];
            if (startPos) {
                setEdgePreview({ source: { nodeId, portId, portType, type }, startPos, targetPos: startPos });
            }
            return;
        }
    }, [edges, portPositions, nodes]);


    useEffect(() => {
        nodesRef.current = nodes;
        edgePreviewRef.current = edgePreview;
        snappedPortKeyRef.current = snappedPortKey;
        isSnapTargetValidRef.current = isSnapTargetValid;
    }, [nodes, edgePreview, snappedPortKey, isSnapTargetValid]);

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
                        snappedPortKey={snappedPortKey}
                        onParameterChange={handleParameterChange}
                        isSnapTargetInvalid={snappedPortKey?.startsWith(node.id) && !isSnapTargetValid}
                    />
                ))}
                <svg className={styles.svgLayer}>
                    <g>
                        {edges
                            .filter(edge => edge.id !== selectedEdgeId)
                            .map(edge => {
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
                                    isSelected={false}
                                />;
                            })}

                        {edges
                            .filter(edge => edge.id === selectedEdgeId)
                            .map(edge => {
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
                                    isSelected={true}
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
            </div>
        </div>
    );
});

Canvas.displayName = 'Canvas';
export default memo(Canvas);