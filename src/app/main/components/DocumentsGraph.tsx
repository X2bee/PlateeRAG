'use client';
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from '../assets/Documents.module.scss';

interface DocumentsGraphProps {
    loading: boolean;
    documentDetailMeta: any;
    documentDetailEdges: any;
}

interface Node {
    id: string;
    label: string;
    type: 'chunk' | 'concept';
    data?: any;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

interface Link {
    source: string | Node;
    target: string | Node;
    relation_type: string;
    edge_weight: number;
}

interface GraphData {
    nodes: Node[];
    links: Link[];
}

type GraphViewMode = 'graph' | 'data';

const DocumentsGraph: React.FC<DocumentsGraphProps> = ({
    loading,
    documentDetailMeta,
    documentDetailEdges
}) => {
    const [viewMode, setViewMode] = useState<GraphViewMode>('graph');
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

    // 데이터 처리 함수
    const processGraphData = (): GraphData => {
        if (!documentDetailMeta || !documentDetailEdges) {
            return { nodes: [], links: [] };
        }

        const nodes: Node[] = [];
        const links: Link[] = [];
        const nodeMap = new Map<string, Node>();

        // 청크 노드 생성 (메타데이터에서)
        if (Array.isArray(documentDetailMeta)) {
            documentDetailMeta.forEach((meta: any) => {
                const chunkNode: Node = {
                    id: meta.chunk_id,
                    label: `${meta.file_name} (청크 ${meta.chunk_index + 1})`,
                    type: 'chunk',
                    data: meta
                };
                nodes.push(chunkNode);
                nodeMap.set(meta.chunk_id, chunkNode);
            });
        }

        // 엣지에서 컨셉 노드와 링크 생성
        if (Array.isArray(documentDetailEdges)) {
            documentDetailEdges.forEach((edge: any) => {
                // source가 실제 노드(chunk_id)인지 확인
                if (!nodeMap.has(edge.source)) {
                    console.warn(`Source node not found: ${edge.source}`);
                    return; // 소스 노드가 없으면 이 엣지는 건너뛰기
                }

                // 타겟 컨셉 노드 생성 (target은 개념 이름)
                if (!nodeMap.has(edge.target)) {
                    const conceptNode: Node = {
                        id: edge.target,
                        label: edge.target,
                        type: 'concept'
                    };
                    nodes.push(conceptNode);
                    nodeMap.set(edge.target, conceptNode);
                }

                // 링크 생성 (indirect이므로 방향성 없음)
                links.push({
                    source: edge.source,
                    target: edge.target,
                    relation_type: edge.relation_type,
                    edge_weight: edge.edge_weight
                });
            });
        }

        return { nodes, links };
    };

    // D3 그래프 렌더링
    useEffect(() => {
        if (viewMode !== 'graph' || !svgRef.current || loading) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // 기존 요소 제거

        const graphData = processGraphData();
        if (graphData.nodes.length === 0) return;

        const width = 800;
        const height = 600;

        svg.attr("width", width).attr("height", height);

        // 줌 컨테이너 생성
        const container = svg.append("g").attr("class", "zoom-container");

        // 줌 동작 설정
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4]) // 최소 0.1배, 최대 4배 확대
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });

        // 줌 인스턴스를 ref에 저장
        zoomRef.current = zoom;

        // SVG에 줌 동작 적용
        svg.call(zoom);

        // 시뮬레이션 설정
        const simulation = d3.forceSimulation(graphData.nodes as any)
            .force("link", d3.forceLink(graphData.links)
                .id((d: any) => d.id)
                .distance(150)
                .strength(0.8))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(40));

        // 링크 그리기 (컨테이너 내부에)
        const link = container.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graphData.links)
            .enter().append("line")
            .attr("class", styles.graphLink)
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", (d: any) => Math.sqrt(d.edge_weight) * 2);

        // 링크 라벨 (relation_type 표시) (컨테이너 내부에)
        const linkLabels = container.append("g")
            .attr("class", "link-labels")
            .selectAll("text")
            .data(graphData.links)
            .enter().append("text")
            .attr("class", styles.linkLabel)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "#666")
            .text((d: any) => d.relation_type);

        // 노드 그리기 (컨테이너 내부에)
        const node = container.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(graphData.nodes)
            .enter().append("circle")
            .attr("class", (d: any) => d.type === 'chunk' ? styles.chunkNode : styles.conceptNode)
            .attr("r", (d: any) => d.type === 'chunk' ? 20 : 15)
            .attr("fill", (d: any) => d.type === 'chunk' ? "#1f77b4" : "#ff7f0e")
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .call(d3.drag<SVGCircleElement, Node>()
                .on("start", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on("end", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }))
            .on("click", (event, d) => {
                event.stopPropagation(); // 줌 이벤트와 충돌 방지
                setSelectedNode(d);
            });

        // 노드 라벨 (컨테이너 내부에)
        const nodeLabels = container.append("g")
            .attr("class", "node-labels")
            .selectAll("text")
            .data(graphData.nodes)
            .enter().append("text")
            .attr("class", styles.nodeLabel)
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .attr("font-size", "12px")
            .attr("fill", "#333")
            .text((d: any) => {
                const maxLength = d.type === 'chunk' ? 20 : 15;
                return d.label.length > maxLength ?
                    d.label.substring(0, maxLength) + '...' : d.label;
            })
            .style("pointer-events", "none");

        // 시뮬레이션 틱 이벤트
        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            linkLabels
                .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
                .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

            node
                .attr("cx", (d: any) => d.x)
                .attr("cy", (d: any) => d.y);

            nodeLabels
                .attr("x", (d: any) => d.x)
                .attr("y", (d: any) => d.y + 30);
        });

        return () => {
            simulation.stop();
        };

    }, [viewMode, documentDetailMeta, documentDetailEdges, loading]);

    return (
        <div className={styles.documentGraphContainer}>
            {/* 탭 헤더 */}
            <div className={styles.graphTabHeader}>
                <button
                    onClick={() => setViewMode('graph')}
                    className={`${styles.tabButton} ${viewMode === 'graph' ? styles.active : ''}`}
                >
                    그래프보기
                </button>
                <button
                    onClick={() => setViewMode('data')}
                    className={`${styles.tabButton} ${viewMode === 'data' ? styles.active : ''}`}
                >
                    Data보기
                </button>
            </div>

            {loading ? (
                <div className={styles.loading}>그래프 데이터를 불러오는 중...</div>
            ) : (
                <div className={styles.graphContent}>
                    {viewMode === 'graph' ? (
                        <div className={styles.graphContainer}>
                            <div className={styles.graphWrapper}>
                                <svg ref={svgRef} className={styles.graphSvg}></svg>

                                {/* 줌 컨트롤 버튼 */}
                                <div className={styles.zoomControls}>
                                    <button
                                        className={styles.zoomButton}
                                        onClick={() => {
                                            if (svgRef.current && zoomRef.current) {
                                                const svg = d3.select(svgRef.current);
                                                svg.transition().duration(300).call(
                                                    zoomRef.current.scaleBy,
                                                    1.5
                                                );
                                            }
                                        }}
                                        title="확대"
                                    >
                                        +
                                    </button>
                                    <button
                                        className={styles.zoomButton}
                                        onClick={() => {
                                            if (svgRef.current && zoomRef.current) {
                                                const svg = d3.select(svgRef.current);
                                                svg.transition().duration(300).call(
                                                    zoomRef.current.scaleBy,
                                                    1 / 1.5
                                                );
                                            }
                                        }}
                                        title="축소"
                                    >
                                        -
                                    </button>
                                    <button
                                        className={styles.zoomButton}
                                        onClick={() => {
                                            if (svgRef.current && zoomRef.current) {
                                                const svg = d3.select(svgRef.current);
                                                svg.transition().duration(500).call(
                                                    zoomRef.current.transform,
                                                    d3.zoomIdentity
                                                );
                                            }
                                        }}
                                        title="원래 크기로 되돌리기"
                                    >
                                        ⌂
                                    </button>
                                </div>
                            </div>

                            {/* 선택된 노드 정보 패널 */}
                            {selectedNode && (
                                <div className={styles.nodeInfoPanel}>
                                    <div className={styles.nodeInfoHeader}>
                                        <h4>{selectedNode.type === 'chunk' ? '문서 청크' : '개념'}</h4>
                                        <button
                                            onClick={() => setSelectedNode(null)}
                                            className={styles.closeButton}
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <div className={styles.nodeInfoContent}>
                                        <p><strong>이름:</strong> {selectedNode.label}</p>
                                        {selectedNode.type === 'chunk' && selectedNode.data && (
                                            <>
                                                <p><strong>파일명:</strong> {selectedNode.data.file_name}</p>
                                                <p><strong>청크 인덱스:</strong> {selectedNode.data.chunk_index + 1}</p>
                                                <p><strong>크기:</strong> {selectedNode.data.chunk_size} 문자</p>
                                                <p><strong>요약:</strong></p>
                                                <div className={styles.summaryText}>
                                                    {selectedNode.data.summary}
                                                </div>
                                                {selectedNode.data.keywords && (
                                                    <>
                                                        <p><strong>키워드:</strong></p>
                                                        <div className={styles.keywords}>
                                                            {selectedNode.data.keywords.map((keyword: string, index: number) => (
                                                                <span key={index} className={styles.keyword}>
                                                                    {keyword}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                                {selectedNode.data.main_concepts && (
                                                    <>
                                                        <p><strong>주요 개념:</strong></p>
                                                        <div className={styles.concepts}>
                                                            {selectedNode.data.main_concepts.map((concept: string, index: number) => (
                                                                <span key={index} className={styles.concept}>
                                                                    {concept}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Data 보기 */
                        <div className={styles.graphPlaceholder}>
                            <h3>그래프 데이터</h3>
                            <p>문서 관계 그래프를 구성하는 원본 데이터를 확인할 수 있습니다.</p>

                            {/* 디버그 정보 */}
                            {documentDetailMeta && (
                                <div className={styles.debugInfo}>
                                    <h4>메타데이터 정보:</h4>
                                    <pre>{JSON.stringify(documentDetailMeta, null, 2)}</pre>
                                </div>
                            )}

                            {documentDetailEdges && (
                                <div className={styles.debugInfo}>
                                    <h4>엣지 정보:</h4>
                                    <pre>{JSON.stringify(documentDetailEdges, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentsGraph;
