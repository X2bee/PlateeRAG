import React from 'react';
import Edge from '@/app/canvas/components/Edge';
import type { CanvasEdge, EdgePreview, Position } from '@/app/canvas/types';
import { generatePortKey } from '../utils';

interface CanvasEdgesProps {
    edges: CanvasEdge[];
    selectedEdgeId: string | null;
    edgePreview: EdgePreview | null;
    portPositions: Record<string, Position>;
    nodes: any[]; // Array of CanvasNode to access isExpanded
    onEdgeClick: (edgeId: string) => void;
}

export const CanvasEdges: React.FC<CanvasEdgesProps> = ({
    edges,
    selectedEdgeId,
    edgePreview,
    portPositions,
    nodes,
    onEdgeClick
}) => {
    // Helper function to get node isExpanded state
    const getNodeExpanded = (nodeId: string): boolean => {
        const node = nodes.find(n => n.id === nodeId);
        return node?.isExpanded !== undefined ? node.isExpanded : true;
    };
    return (
        <svg style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
        }}>
            <g>
                {/* Render non-selected edges first */}
                {edges
                    .filter(edge => edge.id !== selectedEdgeId)
                    .map(edge => {
                        const sourceKey = generatePortKey(
                            edge.source.nodeId,
                            edge.source.portId,
                            edge.source.portType as 'input' | 'output'
                        );
                        const targetKey = generatePortKey(
                            edge.target.nodeId,
                            edge.target.portId,
                            edge.target.portType as 'input' | 'output'
                        );
                        const sourcePos = portPositions[sourceKey];
                        const targetPos = portPositions[targetKey];

                        return (
                            <Edge
                                key={edge.id}
                                id={edge.id}
                                sourcePos={sourcePos}
                                targetPos={targetPos}
                                sourcePortType={edge.source.portType as 'input' | 'output'}
                                targetPortType={edge.target.portType as 'input' | 'output'}
                                sourceExpanded={getNodeExpanded(edge.source.nodeId)}
                                targetExpanded={getNodeExpanded(edge.target.nodeId)}
                                onEdgeClick={onEdgeClick}
                                isSelected={false}
                            />
                        );
                    })}

                {/* Render selected edge on top */}
                {edges
                    .filter(edge => edge.id === selectedEdgeId)
                    .map(edge => {
                        const sourceKey = generatePortKey(
                            edge.source.nodeId,
                            edge.source.portId,
                            edge.source.portType as 'input' | 'output'
                        );
                        const targetKey = generatePortKey(
                            edge.target.nodeId,
                            edge.target.portId,
                            edge.target.portType as 'input' | 'output'
                        );
                        const sourcePos = portPositions[sourceKey];
                        const targetPos = portPositions[targetKey];

                        return (
                            <Edge
                                key={edge.id}
                                id={edge.id}
                                sourcePos={sourcePos}
                                targetPos={targetPos}
                                sourcePortType={edge.source.portType as 'input' | 'output'}
                                targetPortType={edge.target.portType as 'input' | 'output'}
                                sourceExpanded={getNodeExpanded(edge.source.nodeId)}
                                targetExpanded={getNodeExpanded(edge.target.nodeId)}
                                onEdgeClick={onEdgeClick}
                                isSelected={true}
                            />
                        );
                    })}

                {/* Render edge preview */}
                {edgePreview?.targetPos && (
                    <Edge
                        sourcePos={edgePreview.startPos}
                        targetPos={edgePreview.targetPos}
                        sourcePortType={edgePreview.source.portType as 'input' | 'output'}
                        sourceExpanded={getNodeExpanded(edgePreview.source.nodeId)}
                        isPreview={true}
                    />
                )}
            </g>
        </svg>
    );
};
