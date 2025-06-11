"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import '@/app/assets/nodeEditor.module.scss';

//--- Node 자식 컴포넌트 ---//
const Node = React.memo(({ node, onNodeMouseDown }) => {
    const colorMap = {
        input: 'node-header-green',
        process: 'node-header-blue',
        output: 'node-header-red'
    };

    return (
        <div
            id={node.id}
            className="node"
            style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
            onMouseDown={(e) => onNodeMouseDown(e, node)}
        >
            <div className={`node-header ${colorMap[node.type] || 'node-header-blue'}`}>
                {node.type.charAt(0).toUpperCase() + node.type.slice(1)} Node
            </div>
            <div className="node-body">
                {node.type === 'input' ? 'Start data here' :
                    node.type === 'output' ? 'Result goes here' :
                        'Process things here'}
            </div>
            <div className="node-port input" data-node-id={node.id} data-port-type="input" style={{ top: `${node.height / 2 - 6}px` }}></div>
            <div className="node-port output" data-node-id={node.id} data-port-type="output" style={{ top: `${node.height / 2 - 6}px` }}></div>
        </div>
    );
});

//--- Connection (SVG Path) 자식 컴포넌트 ---//
const Connection = React.memo(({ connection, nodes }) => {
    const fromNode = nodes.find(n => n.id === connection.fromNodeId);
    const toNode = nodes.find(n => n.id === connection.toNodeId);

    if (!fromNode || !toNode) return null;

    const fromX = fromNode.x + (connection.fromPortType === 'output' ? fromNode.width : 0);
    const fromY = fromNode.y + fromNode.height / 2;
    const toX = toNode.x + (connection.toPortType === 'output' ? toNode.width : 0);
    const toY = toNode.y + toNode.height / 2;

    const pathData = `M ${fromX} ${fromY} C ${fromX + 100} ${fromY}, ${toX - 100} ${toY}, ${toX} ${toY}`;

    return (
        <svg className="connection-path-svg">
            <path d={pathData} className="connection-path" />
        </svg>
    );
});


//--- 메인 에디터 컴포넌트 ---//
export default function NodeEditor() {
    // --- 상태 관리 --- //
    const [nodes, setNodes] = useState([]);
    const [connections, setConnections] = useState([]);
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    // --- DOM 및 상호작용 상태를 위한 Ref --- //
    const isPanning = useRef(false);
    const isDraggingNode = useRef(null);
    const isConnecting = useRef(null);
    const dragInfo = useRef({ startX: 0, startY: 0, nodeInitialX: 0, nodeInitialY: 0 });
    const canvasContainerRef = useRef(null);
    const canvasRef = useRef(null);
    const tempConnectionPathRef = useRef(null);

    // --- 유틸리티 함수 --- //
    const getCanvasCoords = useCallback((clientX, clientY) => {
        if (!canvasContainerRef.current) return { x: 0, y: 0 };
        const rect = canvasContainerRef.current.getBoundingClientRect();
        return {
            x: (clientX - rect.left - pan.x) / scale,
            y: (clientY - rect.top - pan.y) / scale,
        };
    }, [pan, scale]);

    // --- 캔버스 초기화 및 리사이즈 --- //
    const initializeCanvas = useCallback(() => {
        if (!canvasContainerRef.current || !canvasRef.current) return;
        const containerRect = canvasContainerRef.current.getBoundingClientRect();
        const canvasSize = { width: containerRect.width * 20, height: containerRect.height * 20 };

        canvasRef.current.style.width = `${canvasSize.width}px`;
        canvasRef.current.style.height = `${canvasSize.height}px`;

        const initialPanX = (containerRect.width - canvasSize.width * scale) / 2;
        const initialPanY = (containerRect.height - canvasSize.height * scale) / 2;
        setPan({ x: initialPanX, y: initialPanY });
    }, [scale]);

    useEffect(() => {
        initializeCanvas();
        window.addEventListener('resize', initializeCanvas);

        // 데모 노드 생성
        const node1 = { id: `node-${Date.now()}-1`, type: 'input', x: 2850, y: 2920, width: 120, height: 60 };
        const node2 = { id: `node-${Date.now()}-2`, type: 'process', x: 3050, y: 2970, width: 120, height: 60 };
        const node3 = { id: `node-${Date.now()}-3`, type: 'output', x: 2950, y: 3080, width: 120, height: 60 };
        setNodes([node1, node2, node3]);
        setConnections([
            { id: `conn-${Date.now()}-1`, fromNodeId: node1.id, fromPortType: 'output', toNodeId: node2.id, toPortType: 'input' },
            { id: `conn-${Date.now()}-2`, fromNodeId: node2.id, fromPortType: 'output', toNodeId: node3.id, toPortType: 'input' },
        ]);

        return () => window.removeEventListener('resize', initializeCanvas);
    }, [initializeCanvas]);

    // --- 이벤트 핸들러 --- //
    const handleCanvasMouseDown = (e) => {
        if (e.button !== 0 || e.target.closest('.node, .node-port')) return;
        isPanning.current = true;
        dragInfo.current = { startX: e.clientX, startY: e.clientY };
        canvasContainerRef.current.classList.add('grabbing');
    };

    const handleNodeMouseDown = (e, node) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        if (e.target.matches('.node-port')) {
            isConnecting.current = { fromNodeId: node.id, fromPortType: e.target.dataset.portType };
        } else {
            isDraggingNode.current = node.id;
            dragInfo.current = { startX: e.clientX, startY: e.clientY, nodeInitialX: node.x, nodeInitialY: node.y };
        }
    };

    const handleMouseMove = useCallback((e) => {
        if (isPanning.current) {
            const dx = e.clientX - dragInfo.current.startX;
            const dy = e.clientY - dragInfo.current.startY;
            setPan(p => ({ x: p.x + dx, y: p.y + dy }));
            dragInfo.current.startX = e.clientX;
            dragInfo.current.startY = e.clientY;
        } else if (isDraggingNode.current) {
            const dx = (e.clientX - dragInfo.current.startX) / scale;
            const dy = (e.clientY - dragInfo.current.startY) / scale;
            setNodes(nodes => nodes.map(n => n.id === isDraggingNode.current ? { ...n, x: dragInfo.current.nodeInitialX + dx, y: dragInfo.current.nodeInitialY + dy } : n));
        } else if (isConnecting.current) {
            const fromNode = nodes.find(n => n.id === isConnecting.current.fromNodeId);
            if (!fromNode || !tempConnectionPathRef.current) return;
            const fromX = fromNode.x + (isConnecting.current.fromPortType === 'output' ? fromNode.width : 0);
            const fromY = fromNode.y + fromNode.height / 2;
            const { x: mouseX, y: mouseY } = getCanvasCoords(e.clientX, e.clientY);
            const pathData = `M ${fromX} ${fromY} C ${fromX + 100} ${fromY}, ${mouseX - 100} ${mouseY}, ${mouseX} ${mouseY}`;
            tempConnectionPathRef.current.setAttribute('d', pathData);
        }
    }, [scale, nodes, getCanvasCoords]);

    const handleMouseUp = useCallback((e) => {
        if (isConnecting.current) {
            const targetPort = e.target.closest('.node-port');
            if (targetPort) {
                const toNodeId = targetPort.dataset.nodeId;
                const toPortType = targetPort.dataset.portType;
                const { fromNodeId, fromPortType } = isConnecting.current;
                if (toNodeId !== fromNodeId && toPortType !== fromPortType) {
                    setConnections(conns => [...conns, { id: `conn-${Date.now()}`, fromNodeId, fromPortType, toNodeId, toPortType }]);
                }
            }
            if (tempConnectionPathRef.current) tempConnectionPathRef.current.setAttribute('d', '');
        }
        isPanning.current = false;
        isDraggingNode.current = null;
        isConnecting.current = null;
        if (canvasContainerRef.current) canvasContainerRef.current.classList.remove('grabbing');
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const handleWheel = (e) => {
        e.preventDefault();
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldX = (mouseX - pan.x) / scale;
        const worldY = (mouseY - pan.y) / scale;
        const newScale = Math.min(Math.max(scale - e.deltaY * 0.001, 0.2), 3);
        setPan({
            x: mouseX - worldX * newScale,
            y: mouseY - worldY * newScale
        });
        setScale(newScale);
    };

    const addNode = (type) => {
        const { x, y } = getCanvasCoords(canvasContainerRef.current.clientWidth / 2, canvasContainerRef.current.clientHeight / 2);
        const newNode = { id: `node-${Date.now()}`, type, x, y, width: 120, height: 60 };
        setNodes(nodes => [...nodes, newNode]);
    };

    const handleZoomAction = (factor) => {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const worldX = (centerX - pan.x) / scale;
        const worldY = (centerY - pan.y) / scale;
        const newScale = Math.min(Math.max(scale * factor, 0.2), 3);
        setPan({
            x: centerX - worldX * newScale,
            y: centerY - worldY * newScale
        });
        setScale(newScale);
    };

    return (
        <div className="app-container">
            <header id="header">
                <h1>Node Editor</h1>
                <div className="controls">
                    <button onClick={() => handleZoomAction(1.2)}>Zoom In</button>
                    <button onClick={() => handleZoomAction(0.8)}>Zoom Out</button>
                    <button onClick={initializeCanvas}>Reset View</button>
                    <button onClick={() => addNode('process')}>Add Node</button>
                </div>
            </header>

            <aside id="sidebar">
                <h2>Node Palette</h2>
                <div className="node-template" onClick={() => addNode('input')}>Input Node</div>
                <div className="node-template" onClick={() => addNode('process')}>Process Node</div>
                <div className="node-template" onClick={() => addNode('output')}>Output Node</div>
                <hr />
                <h3>Properties</h3>
                <div id="node-properties">
                    <p>Select a node to see its properties.</p>
                </div>
            </aside>

            <main id="canvas-container" ref={canvasContainerRef} onMouseDown={handleCanvasMouseDown} onWheel={handleWheel}>
                <div
                    id="canvas"
                    ref={canvasRef}
                    style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
                >
                    {connections.map(conn => <Connection key={conn.id} connection={conn} nodes={nodes} />)}
                    <svg className="connection-path-svg">
                        <path ref={tempConnectionPathRef} className="connection-path temp" />
                    </svg>
                    {nodes.map(node => <Node key={node.id} node={node} onNodeMouseDown={handleNodeMouseDown} />)}
                </div>
            </main>
        </div>
    );
}

