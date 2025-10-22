import React from 'react';
import Node from '@/app/canvas/components/Node';
import type { CanvasNode, NodeProps } from '@/app/canvas/types';
import { findSpecialNode } from '@/app/canvas/components/SpecialNode/specialNode';
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
    // Router specific props
    onOutputAdd?: (nodeId: string, output: any) => void;
    onOutputDelete?: (nodeId: string, outputId: string) => void;
    onOutputNameChange?: (nodeId: string, outputId: string, newName: string) => void;
    currentEdges: any[];
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
    onOutputAdd,
    onOutputDelete,
    onOutputNameChange,
    currentEdges,
    onToggleExpanded
}) => {
    return (
        <>
            {nodes.map(node => {
                const specialNodeConfig = findSpecialNode(node.data);
                const isSelected = node.id === selectedNodeId;
                const isSnapTargetInvalid = Boolean(snappedPortKey?.startsWith(node.id) && !isSnapTargetValid);

                // Common props for all nodes (key는 제외)
                const commonProps = {
                    id: node.id,
                    data: node.data,
                    position: node.position,
                    onNodeMouseDown,
                    isSelected,
                    onPortMouseDown,
                    onPortMouseUp,
                    registerPortRef,
                    snappedPortKey,
                    onParameterChange,
                    onNodeNameChange,
                    onParameterNameChange,
                    onParameterAdd,
                    onParameterDelete,
                    isSnapTargetInvalid,
                    onClearSelection,
                    onOpenNodeModal,
                    onSynchronizeSchema: onSynchronizeSchema && ((portId: string) => onSynchronizeSchema(node.id, portId)),
                    currentNodes: nodes,
                    currentEdges,
                    isExpanded: node.isExpanded !== undefined ? node.isExpanded : true,
                    onToggleExpanded
                };

                // If it's a special node, render with special component
                if (specialNodeConfig) {
                    devLog.log(`Using ${specialNodeConfig.name} for: ${node.data.nodeName}`);
                    const SpecialComponent = specialNodeConfig.component;

                    // Add additional props if defined
                    const additionalProps: any = {};
                    specialNodeConfig.additionalProps?.forEach((propName: string) => {
                        if (propName === 'onOutputAdd') additionalProps.onOutputAdd = onOutputAdd;
                        if (propName === 'onOutputDelete') additionalProps.onOutputDelete = onOutputDelete;
                        if (propName === 'onOutputNameChange') additionalProps.onOutputNameChange = onOutputNameChange;
                    });

                    return <SpecialComponent key={node.id} {...commonProps} {...additionalProps} />;
                }

                // Default node
                return <Node key={node.id} {...commonProps} />;
            })}
        </>
    );
};
