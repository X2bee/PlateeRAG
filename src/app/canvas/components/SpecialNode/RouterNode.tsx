import React, { memo, useState } from 'react';
import styles from '@/app/canvas/assets/Node.module.scss';
import type { NodeProps, Port } from '@/app/canvas/types';
import { useNodeEditing } from '../Node/hooks/useNodeEditing';
import {
    hasInputsAndOutputs,
    getNodeContainerClasses,
    getNodeContainerStyles
} from '../Node/utils/nodeUtils';

// Components
import { NodeHeader } from '../Node/components/NodeHeader';
import { RouterNodePorts } from '../Node/components/RouterNodePorts';
import { RouterNodeParameters } from '../Node/components/specialized/RouterNodeParameters';

const RouterNode: React.FC<NodeProps & {
    onOutputAdd?: (nodeId: string, output: Port) => void;
    onOutputDelete?: (nodeId: string, outputId: string) => void;
    onOutputNameChange?: (nodeId: string, outputId: string, newName: string) => void;
}> = ({
    id,
    data,
    position,
    onNodeMouseDown,
    isSelected,
    onPortMouseDown,
    onPortMouseUp,
    registerPortRef,
    snappedPortKey,
    onParameterChange,
    isSnapTargetInvalid,
    isPreview = false,
    onNodeNameChange,
    onParameterNameChange,
    onParameterAdd,
    onParameterDelete,
    onOutputAdd,
    onOutputDelete,
    onOutputNameChange,
    onClearSelection,
    isPredicted = false,
    predictedOpacity = 1.0,
    onPredictedNodeHover,
    onPredictedNodeClick,
    onOpenNodeModal,
    onSynchronizeSchema,
    currentNodes = [],
    currentEdges = []
}) => {
    const { nodeName, inputs, parameters, outputs, functionId } = data;
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

    // Custom hooks
    const nodeEditingHook = useNodeEditing(nodeName);

    // Event handlers
    const handleMouseDown = (e: React.MouseEvent): void => {
        if (isPreview) return;

        // Handle predicted node click
        if (isPredicted && onPredictedNodeClick) {
            e.stopPropagation();
            onPredictedNodeClick(data, position);
            return;
        }

        e.stopPropagation();
        onNodeMouseDown(e, id);
    };

    const handleMouseEnter = (): void => {
        if (isPredicted && onPredictedNodeHover) {
            onPredictedNodeHover(id, true);
        }
    };

    const handleMouseLeave = (): void => {
        if (isPredicted && onPredictedNodeHover) {
            onPredictedNodeHover(id, false);
        }
    };

    const handleToggleAdvanced = (e: React.MouseEvent): void => {
        e.stopPropagation();
        setShowAdvanced(prev => !prev);
    };

    const handleSynchronizeSchema = (portId: string): void => {
        if (!onSynchronizeSchema) return;
        onSynchronizeSchema(id, portId);
    };

    // Handle output operations specific to Router
    const handleOutputAdd = (nodeId: string, output: Port): void => {
        if (onOutputAdd) {
            onOutputAdd(nodeId, output);
        }
    };

    const handleOutputDelete = (nodeId: string, outputId: string): void => {
        if (onOutputDelete) {
            onOutputDelete(nodeId, outputId);
        }
    };

    const handleOutputNameChange = (nodeId: string, outputId: string, newName: string): void => {
        if (onOutputNameChange) {
            onOutputNameChange(nodeId, outputId, newName);
        }
    };

    // Utility calculations
    const { hasIO } = hasInputsAndOutputs(inputs, outputs);

    // Node container classes and styles
    const nodeClasses = getNodeContainerClasses(isSelected, isPreview, isPredicted, styles);
    const nodeStyles = getNodeContainerStyles(position, isPredicted, predictedOpacity);

    return (
        <div
            className={nodeClasses}
            style={nodeStyles}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Header Section */}
            <NodeHeader
                nodeName={nodeName}
                functionId={functionId}
                isEditingName={nodeEditingHook.isEditingName}
                editingName={nodeEditingHook.editingName}
                isPreview={isPreview}
                onNameDoubleClick={(e) => nodeEditingHook.handleNameDoubleClick(e, nodeName, isPreview)}
                onNameChange={nodeEditingHook.handleNameChange}
                onNameKeyDown={nodeEditingHook.handleNameKeyDown}
                onNameBlur={() => nodeEditingHook.handleNameBlur(id, nodeName, onNodeNameChange)}
                onClearSelection={onClearSelection}
            />

            {/* Body Section */}
            <div className={styles.body}>
                {/* Input/Output Ports */}
                {hasIO && (
                    <RouterNodePorts
                        nodeId={id}
                        inputs={inputs}
                        outputs={outputs}
                        isPreview={isPreview}
                        isPredicted={isPredicted}
                        isSelected={isSelected}
                        onPortMouseDown={onPortMouseDown}
                        onPortMouseUp={onPortMouseUp}
                        registerPortRef={registerPortRef}
                        snappedPortKey={snappedPortKey}
                        isSnapTargetInvalid={isSnapTargetInvalid}
                        currentNodes={currentNodes}
                        currentEdges={currentEdges}
                        onSynchronizeSchema={handleSynchronizeSchema}
                        onOutputAdd={handleOutputAdd}
                        onOutputDelete={handleOutputDelete}
                        onOutputNameChange={handleOutputNameChange}
                    />
                )}

                {/* Parameters */}
                {!isPredicted && (
                    <>
                        {hasIO && <div className={styles.divider}></div>}
                        <RouterNodeParameters
                            nodeId={id}
                            nodeDataId={data.id}
                            parameters={parameters}
                            isPreview={isPreview}
                            isPredicted={isPredicted}
                            onParameterChange={onParameterChange}
                            onParameterNameChange={onParameterNameChange}
                            onParameterAdd={onParameterAdd}
                            onParameterDelete={onParameterDelete}
                            onClearSelection={onClearSelection}
                            onOpenNodeModal={onOpenNodeModal}
                            showAdvanced={showAdvanced}
                            onToggleAdvanced={handleToggleAdvanced}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default memo(RouterNode);
