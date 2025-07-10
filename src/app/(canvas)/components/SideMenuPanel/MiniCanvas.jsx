"use client";
import React, { useState, useRef, useEffect } from 'react';
import Node from '../Node';
import Edge from '../Edge';
import styles from '@/app/(canvas)/assets/MiniCanvas.module.scss';

const MiniCanvas = ({ template }) => {
    const canvasRef = useRef(null);
    const [scale, setScale] = useState(0.6);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // 워크플로우 데이터
    const nodes = template.data?.nodes || [];
    const edges = template.data?.edges || [];

    // 노드 위치를 미니 캔버스에 맞게 조정
    const adjustedNodes = nodes.map(node => ({
        ...node,
        position: {
            x: (node.position.x - 8800) * 0.8, // 좌표 조정
            y: (node.position.y - 4300) * 0.8
        }
    }));

    // 마우스 휠 줌
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => Math.max(0.2, Math.min(2, prev + delta)));
    };

    // 드래그 시작
    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        const rect = canvasRef.current.getBoundingClientRect();
        setDragStart({ 
            x: e.clientX - rect.left - offset.x, 
            y: e.clientY - rect.top - offset.y 
        });
    };

    // 드래그 중
    const handleMouseMove = (e) => {
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

    // 드래그 종료
    const handleMouseUp = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    // 이벤트 리스너 등록
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('mousedown', handleMouseDown);
        
        return () => {
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    // 드래그 이벤트는 전역으로 등록
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

    // 더미 함수들 (실제 기능은 없지만 Node 컴포넌트에 필요)
    const dummyHandlers = {
        onNodeClick: () => {},
        onNodeDrag: () => {},
        onPortClick: () => {},
        onNodeDelete: () => {},
        onNodeDuplicate: () => {},
        updateNodeData: () => {}
    };

    return (
        <div 
            className={`${styles.miniCanvas} miniCanvas`}
            ref={canvasRef}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            <div 
                className={styles.canvasContent}
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transformOrigin: '0 0'
                }}
            >
                {/* 배경 그리드 */}
                <div className={styles.grid} />

                {/* 엣지 렌더링 */}
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
                            console.warn('Missing node for edge:', edge.id);
                            return null;
                        }

                        // 미니 캔버스 스케일에 맞는 간단한 포트 위치 계산
                        const nodeWidth = 350 * 0.8; // 280px
                        const nodeHeight = 120 * 0.8; // 대략적인 노드 높이
                        
                        // SVG 좌표 오프셋 적용
                        const sourcePos = {
                            x: sourceNode.position.x + nodeWidth + 500,  // SVG 오프셋 + 노드 오른쪽 끝
                            y: sourceNode.position.y + nodeHeight / 2 + 500   // SVG 오프셋 + 노드 중앙 높이
                        };
                        const targetPos = {
                            x: targetNode.position.x + 500,       // SVG 오프셋 + 노드 왼쪽 시작
                            y: targetNode.position.y + nodeHeight / 2 + 500   // SVG 오프셋 + 노드 중앙 높이
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

                {/* 노드 렌더링 */}
                <div className={styles.nodesContainer}>
                    {adjustedNodes.map(node => (
                        <Node
                            key={node.id}
                            id={node.id}
                            data={node.data}
                            position={node.position}
                            isPreview={true}
                            {...dummyHandlers}
                        />
                    ))}
                </div>
            </div>

            {/* 줌 컨트롤 */}
            <div className={styles.zoomControls}>
                <button 
                    className={styles.zoomButton}
                    onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
                >
                    +
                </button>
                <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
                <button 
                    className={styles.zoomButton}
                    onClick={() => setScale(prev => Math.max(0.2, prev - 0.1))}
                >
                    -
                </button>
            </div>
        </div>
    );
};

export default MiniCanvas;
