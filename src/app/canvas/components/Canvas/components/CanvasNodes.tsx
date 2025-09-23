import React from 'react';
import Node from '@/app/canvas/components/Node';
import SchemaProviderNode from '@/app/canvas/components/SpecialNode/SchemaProviderNode';
import type { CanvasNode, NodeProps } from '@/app/canvas/types';
import { isSchemaProviderNode } from '../utils';
import { devLog } from '@/app/_common/utils/logger';

interface CanvasNodesProps {
    nodes: CanvasNode[];
    selectedNodeId: string | null;
    onNodeMouseDown: NodeProps['onNodeMouseDown'];
    onPortMouseDown: NodeProps['onPortMouseDown'];
    onPortMouseUp: NodeProps['onPortMouseUp'];
    registerPortRef: NodeProps['registerPortRef'];
    snappedPortKey: string | null;
    isSnapTargetValid: boolean;
    onParameterChange: NodeProps['onParameterChange'];
    onNodeNameChange: NodeProps['onNodeNameChange'];
    onParameterNameChange: NodeProps['onParameterNameChange'];
    onParameterAdd: NodeProps['onParameterAdd'];
    onParameterDelete: NodeProps['onParameterDelete'];
    onClearSelection: () => void;
    onOpenNodeModal?: NodeProps['onOpenNodeModal'];
    onSynchronizeSchema?: (nodeId: string, portId: string) => void;
    currentEdges: any[];
    nodeExpandedState: Record<string, boolean>;
    onToggleExpanded: (nodeId: string) => void;
}

export const CanvasNodes: React.FC<CanvasNodesProps> = ({
    nodes,
    selectedNodeId,
    onNodeMouseDown,
    onPortMouseDown,
    onPortMouseUp,
    registerPortRef,
    snappedPortKey,
    isSnapTargetValid,
    onParameterChange,
    onNodeNameChange,
    onParameterNameChange,
    onParameterAdd,
    onParameterDelete,
    onClearSelection,
    onOpenNodeModal,
    onSynchronizeSchema,
    currentEdges,
    nodeExpandedState,
    onToggleExpanded
}) => {
    return (
        <>
            {nodes.map(node => {
                const isSchemaProvider = isSchemaProviderNode(node.data);
                const isSelected = node.id === selectedNodeId;
                const isSnapTargetInvalid = Boolean(snappedPortKey?.startsWith(node.id) && !isSnapTargetValid);

                if (isSchemaProvider) {
                    devLog.log(`Using SchemaProviderNode for: ${node.data.nodeName}`);
                    return (
                        <SchemaProviderNode
                            key={node.id}
                            id={node.id}
                            data={node.data}
                            position={node.position}
                            onNodeMouseDown={onNodeMouseDown}
                            isSelected={isSelected}
                            onPortMouseDown={onPortMouseDown}
                            onPortMouseUp={onPortMouseUp}
                            registerPortRef={registerPortRef}
                            snappedPortKey={snappedPortKey}
                            onParameterChange={onParameterChange}
                            onNodeNameChange={onNodeNameChange}
                            onParameterNameChange={onParameterNameChange}
                            onParameterAdd={onParameterAdd}
                            onParameterDelete={onParameterDelete}
                            isSnapTargetInvalid={isSnapTargetInvalid}
                            onClearSelection={onClearSelection}
                            onOpenNodeModal={onOpenNodeModal}
                        />
                    );
                }

                return (
                    <Node
                        key={node.id}
                        id={node.id}
                        data={node.data}
                        position={node.position}
                        onNodeMouseDown={onNodeMouseDown}
                        isSelected={isSelected}
                        onPortMouseDown={onPortMouseDown}
                        onPortMouseUp={onPortMouseUp}
                        registerPortRef={registerPortRef}
                        snappedPortKey={snappedPortKey}
                        onParameterChange={onParameterChange}
                        onNodeNameChange={onNodeNameChange}
                        onParameterNameChange={onParameterNameChange}
                        onParameterAdd={onParameterAdd}
                        onParameterDelete={onParameterDelete}
                        isSnapTargetInvalid={isSnapTargetInvalid}
                        onClearSelection={onClearSelection}
                        onOpenNodeModal={onOpenNodeModal}
                        onSynchronizeSchema={onSynchronizeSchema && ((portId: string) => onSynchronizeSchema(node.id, portId))}
                        currentNodes={nodes}
                        currentEdges={currentEdges}
                        isExpanded={nodeExpandedState[node.id] ?? false}
                        onToggleExpanded={onToggleExpanded}
                    />
                );
            })}
        </>
    );
};
