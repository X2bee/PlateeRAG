'use client';
import React, { useRef, useEffect, useState } from 'react';
import Node from '@/app/canvas/components/Node';
import Edge from '@/app/canvas/components/Edge';
import styles from '../../assets/WorkflowStoreMiniCanvas.module.scss';

interface Position {
    x: number;
    y: number;
}

interface CanvasNode {
    id: string;
    position: Position;
    data: any; // Full node data from canvas
    isExpanded?: boolean;
}

interface CanvasEdge {
    id: string;
    source: {
        nodeId: string;
        portId: string;
        portType: string;
    };
    target: {
        nodeId: string;
        portId: string;
        portType: string;
    };
}

interface WorkflowData {
    nodes?: CanvasNode[];
    edges?: CanvasEdge[];
    view?: {
        x: number;
        y: number;
        scale: number;
    };
}

interface DummyHandlers {
    onNodeClick: () => void;
    onNodeDrag: () => void;
    onPortClick: () => void;
    onNodeDelete: () => void;
    onNodeDuplicate: () => void;
    updateNodeData: () => void;
    onNodeMouseDown: () => void;
    onPortMouseDown: () => void;
    onPortMouseUp: () => void;
    registerPortRef: () => void;
    onParameterChange: () => void;
    onParameterNameChange: () => void;
    onNodeNameChange: () => void;
    onClearSelection: () => void;
}

interface WorkflowStoreMiniCanvasProps {
    workflowData: WorkflowData | string | null;
}

const WorkflowStoreMiniCanvas: React.FC<WorkflowStoreMiniCanvasProps> = ({ workflowData }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // workflow_data 파싱 (문자열인 경우 JSON.parse)
    let parsedWorkflowData: WorkflowData | null = null;

    if (typeof workflowData === 'string') {
        try {
            parsedWorkflowData = JSON.parse(workflowData) as WorkflowData;
        } catch (e) {
            console.error('Failed to parse workflow_data:', e);
            parsedWorkflowData = null;
        }
    } else if (workflowData && typeof workflowData === 'object') {
        parsedWorkflowData = workflowData as WorkflowData;
    }

    // workflow_data에서 nodes와 edges 추출
    const nodes: CanvasNode[] = parsedWorkflowData?.nodes || [];
    const edges: CanvasEdge[] = parsedWorkflowData?.edges || [];

    // Dummy handlers (Canvas Node 컴포넌트가 요구하는 props)
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
        onParameterNameChange: () => {},
        onNodeNameChange: () => {},
        onClearSelection: () => {}
    };

    // 최적 뷰 계산 및 노드 조정
    const calculateOptimalViewAndNodes = () => {
        if (nodes.length === 0) return { adjustedNodes: [], optimalView: null };

        const minX = Math.min(...nodes.map(node => node.position.x));
        const maxX = Math.max(...nodes.map(node => node.position.x));
        const minY = Math.min(...nodes.map(node => node.position.y));
        const maxY = Math.max(...nodes.map(node => node.position.y));

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const width = maxX - minX;
        const height = maxY - minY;

        const canvasWidth = 800;
        const canvasHeight = 600;
        const scaleX = width > 0 ? canvasWidth / width : 1;
        const scaleY = height > 0 ? canvasHeight / height : 1;
        const optimalScale = Math.min(scaleX, scaleY, 0.3);

        const spacingMultiplier = 4;
        const adjustedNodes: CanvasNode[] = nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                parameters: [] // Mini canvas에서는 파라미터 숨김
            },
            position: {
                x: (node.position.x - centerX) * optimalScale * spacingMultiplier,
                y: (node.position.y - centerY) * optimalScale * spacingMultiplier
            },
            isExpanded: false // Mini canvas에서는 접힌 상태
        }));

        const optimalView = {
            x: 0,
            y: 0,
            scale: optimalScale
        };

        return { adjustedNodes, optimalView };
    };

    const { adjustedNodes, optimalView } = calculateOptimalViewAndNodes();

    // 초기 뷰 설정 (nodes 길이가 변경될 때만)
    useEffect(() => {
        if (optimalView && canvasRef.current && nodes.length > 0) {
            const canvasWidth = canvasRef.current.clientWidth;
            const canvasHeight = canvasRef.current.clientHeight;
            setViewTransform({
                x: canvasWidth / 2,
                y: canvasHeight / 2,
                scale: optimalView.scale
            });
        }
    }, [nodes.length]);

    // 마우스 휠 줌
    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setViewTransform(prev => ({
            ...prev,
            scale: Math.max(0.1, Math.min(2, prev.scale + delta))
        }));
    };

    // 드래그 시작
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Only handle left mouse button
        if (e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();

        setIsDragging(true);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            setDragStart({
                x: e.clientX - viewTransform.x,
                y: e.clientY - viewTransform.y
            });
        }
    };

    // 클릭 이벤트 차단
    const handleClickEvent = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
    };

    // 드래그 중
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        e.preventDefault();
        e.stopPropagation();

        setViewTransform(prev => ({
            ...prev,
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        }));
    };

    // 드래그 종료
    const handleMouseUp = (e: MouseEvent) => {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
        }
        setIsDragging(false);
    };

    // 이벤트 리스너 등록
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [viewTransform.scale]);

    // 전역 드래그 이벤트
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove, true);
            document.addEventListener('mouseup', handleMouseUp, true);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove, true);
                document.removeEventListener('mouseup', handleMouseUp, true);
            };
        }
    }, [isDragging, dragStart.x, dragStart.y, viewTransform.x, viewTransform.y]);

    if (!parsedWorkflowData || nodes.length === 0) {
        return (
            <div className={styles.miniCanvas} ref={canvasRef}>
                <div className={styles.emptyState}>
                    <p>워크플로우 데이터가 없습니다</p>
                </div>
            </div>
        );
    }

    // 실제 노드 크기 (isExpanded: false인 경우 접힌 크기)
    const baseNodeWidth = 350;
    const baseNodeHeight = 120;

    // spacingMultiplier를 적용한 후의 노드 크기
    const { adjustedNodes: adjustedNodesData, optimalView: optimalViewData } = calculateOptimalViewAndNodes();
    const spacingMultiplier = 3;
    const scaledNodeWidth = baseNodeWidth * (optimalViewData?.scale || 0.3) * spacingMultiplier;
    const scaledNodeHeight = baseNodeHeight * (optimalViewData?.scale || 0.3) * spacingMultiplier;

    return (
        <div
            className={styles.miniCanvas}
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onClick={handleClickEvent}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            <div
                className={styles.canvasContent}
                style={{
                    transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
                    transformOrigin: '0 0'
                }}
            >
                {/* Edge rendering using Canvas Edge component */}
                <svg
                    className={styles.edgesSvg}
                    style={{
                        width: '10000px',
                        height: '10000px',
                        position: 'absolute',
                        top: '-5000px',
                        left: '-5000px',
                        pointerEvents: 'none',
                        zIndex: 1
                    }}
                >
                    {edges.map(edge => {
                        const sourceNode = adjustedNodes.find(n => n.id === edge.source.nodeId);
                        const targetNode = adjustedNodes.find(n => n.id === edge.target.nodeId);

                        if (!sourceNode || !targetNode) {
                            return null;
                        }

                        // Output port는 노드 오른쪽 끝, Input port는 노드 왼쪽 끝
                        // scaledNodeWidth/Height를 사용하여 spacing에 맞춘 크기 계산
                        const sourcePos: Position = {
                            x: sourceNode.position.x + (edge.source.portType === 'output' ? scaledNodeWidth : 0) + 5000,
                            y: sourceNode.position.y + scaledNodeHeight / 2 + 5000
                        };
                        const targetPos: Position = {
                            x: targetNode.position.x + (edge.target.portType === 'output' ? scaledNodeWidth : 0) + 5000,
                            y: targetNode.position.y + scaledNodeHeight / 2 + 5000
                        };

                        return (
                            <Edge
                                key={edge.id}
                                id={edge.id}
                                sourcePos={sourcePos}
                                targetPos={targetPos}
                                sourcePortType={edge.source.portType as 'input' | 'output'}
                                targetPortType={edge.target.portType as 'input' | 'output'}
                                isPreview={true}
                                onEdgeClick={() => {}}
                                isSelected={false}
                            />
                        );
                    })}
                </svg>

                {/* Node rendering using Canvas Node component */}
                <div className={styles.nodesContainer}>
                    {adjustedNodes.map(node => (
                        <Node
                            key={node.id}
                            id={node.id}
                            data={node.data}
                            position={node.position}
                            isPreview={true}
                            isSelected={false}
                            isExpanded={false}
                            snappedPortKey={null}
                            isSnapTargetInvalid={false}
                            {...dummyHandlers}
                        />
                    ))}
                </div>
            </div>

            {/* Scale indicator */}
            <div className={styles.scaleIndicator}>
                {Math.round(viewTransform.scale * 100)}%
            </div>
        </div>
    );
};

export default WorkflowStoreMiniCanvas;
