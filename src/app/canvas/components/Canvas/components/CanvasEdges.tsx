import React from 'react';
import Edge from '@/app/canvas/components/Edge';
import type { CanvasEdge, EdgePreview, Position } from '@/app/canvas/types';
import { generatePortKey } from '../utils';

interface CanvasEdgesProps {
    edges: CanvasEdge[];
    selectedEdgeId: string | null;
    edgePreview: EdgePreview | null;
    portPositions: Record<string, Position>;
    onEdgeClick: (edgeId: string) => void;
}

export const CanvasEdges: React.FC<CanvasEdgesProps> = ({
    edges,
    selectedEdgeId,
    edgePreview,
    portPositions,
    onEdgeClick
}) => {
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
                        isPreview={true}
                    />
                )}
            </g>
        </svg>
    );
};