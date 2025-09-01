import React from 'react';
import Node from '@/app/canvas/components/Node';
import type { PredictedNode, NodeData, Position, NodeProps, CanvasNode, CanvasEdge } from '@/app/canvas/types';

interface CanvasPredictedNodesProps {
    predictedNodes: PredictedNode[];
    onNodeMouseDown: NodeProps['onNodeMouseDown'];
    onPortMouseDown: NodeProps['onPortMouseDown'];
    onPortMouseUp: NodeProps['onPortMouseUp'];
    registerPortRef: NodeProps['registerPortRef'];
    snappedPortKey: string | null;
    onParameterChange: NodeProps['onParameterChange'];
    onNodeNameChange: NodeProps['onNodeNameChange'];
    onParameterNameChange: NodeProps['onParameterNameChange'];
    onClearSelection: () => void;
    onPredictedNodeHover: (nodeId: string, isHovered: boolean) => void;
    onPredictedNodeClick: (nodeData: NodeData, position: Position) => void;
    onSynchronizeSchema?: (nodeId: string, portId: string) => void;
    currentNodes: CanvasNode[];
    currentEdges: CanvasEdge[];
}

export const CanvasPredictedNodes: React.FC<CanvasPredictedNodesProps> = ({
    predictedNodes,
    onNodeMouseDown,
    onPortMouseDown,
    onPortMouseUp,
    registerPortRef,
    snappedPortKey,
    onParameterChange,
    onNodeNameChange,
    onParameterNameChange,
    onClearSelection,
    onPredictedNodeHover,
    onPredictedNodeClick,
    onSynchronizeSchema,
    currentNodes,
    currentEdges
}) => {
    return (
        <>
            {predictedNodes.map(predictedNode => (
                <Node
                    key={predictedNode.id}
                    id={predictedNode.id}
                    data={predictedNode.nodeData}
                    position={predictedNode.position}
                    onNodeMouseDown={onNodeMouseDown}
                    isSelected={false}
                    onPortMouseDown={onPortMouseDown}
                    onPortMouseUp={onPortMouseUp}
                    registerPortRef={registerPortRef}
                    snappedPortKey={snappedPortKey}
                    onParameterChange={onParameterChange}
                    onNodeNameChange={onNodeNameChange}
                    isSnapTargetInvalid={false}
                    onClearSelection={onClearSelection}
                    onParameterNameChange={onParameterNameChange}
                    isPredicted={true}
                    predictedOpacity={predictedNode.isHovered ? 1.0 : 0.3}
                    onPredictedNodeHover={onPredictedNodeHover}
                    onPredictedNodeClick={onPredictedNodeClick}
                    onSynchronizeSchema={onSynchronizeSchema && ((portId: string) => onSynchronizeSchema(predictedNode.id, portId))}
                    currentNodes={currentNodes}
                    currentEdges={currentEdges}
                />
            ))}
        </>
    );
};