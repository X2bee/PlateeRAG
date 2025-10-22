import React, { useState, useMemo } from 'react';
import { LuDownload, LuPlus } from 'react-icons/lu';
import styles from '@/app/canvas/assets/Node.module.scss';
import { generatePortKey, getConnectedSchemaProvider } from '../utils/nodeUtils';
import { filterPortsByDependency } from '../utils/portUtils';
import type { NodePortsProps } from '../types';
import type { Port } from '@/app/canvas/types';

interface RouterNodePortsProps extends NodePortsProps {
    onOutputAdd?: (nodeId: string, output: Port) => void;
    onOutputDelete?: (nodeId: string, outputId: string) => void;
    onOutputNameChange?: (nodeId: string, outputId: string, newName: string) => void;
}

export const RouterNodePorts: React.FC<RouterNodePortsProps> = ({
    nodeId,
    inputs,
    outputs,
    parameters,
    isPreview = false,
    isPredicted = false,
    isSelected,
    onPortMouseDown,
    onPortMouseUp,
    registerPortRef,
    snappedPortKey,
    isSnapTargetInvalid,
    currentNodes,
    currentEdges,
    onSynchronizeSchema,
    onOutputAdd,
    onOutputDelete,
    onOutputNameChange
}) => {
    const [editingOutput, setEditingOutput] = useState<string | null>(null);
    const [editingOutputValue, setEditingOutputValue] = useState<string>('');

    // Filter ports based on parameter dependencies
    const filteredInputs = useMemo(() => filterPortsByDependency(inputs, parameters), [inputs, parameters]);
    const filteredOutputs = useMemo(() => filterPortsByDependency(outputs, parameters), [outputs, parameters]);

    const hasInputs = filteredInputs && filteredInputs.length > 0;
    const hasOutputs = filteredOutputs && filteredOutputs.length > 0;
    const hasOnlyOutputs = hasOutputs && !hasInputs;

    const handleSynchronizeSchema = (portId: string) => {
        if (!onSynchronizeSchema) return;
        onSynchronizeSchema(portId);
    };

    // Handle output addition for Router
    const handleAddCustomOutput = (): void => {
        if (isPreview || !onOutputAdd) return;

        const randomSuffix = Math.random().toString(36).substring(2, 4).padEnd(2, '0');
        const uniqueId = `condition_${randomSuffix}`;

        const newOutput: Port = {
            id: uniqueId,
            name: uniqueId,
            type: "ANY",
            multi: false,
            required: false
        };

        onOutputAdd(nodeId, newOutput);
    };

    // Handle output deletion for Router
    const handleDeleteOutput = (outputId: string): void => {
        if (isPreview || !onOutputDelete) return;
        onOutputDelete(nodeId, outputId);
    };

    // Handle output name editing
    const handleOutputNameEdit = (outputId: string, currentName: string): void => {
        if (isPreview) return;
        setEditingOutput(outputId);
        setEditingOutputValue(currentName);
    };

    const handleOutputNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setEditingOutputValue(e.target.value);
    };

    const handleOutputNameSubmit = (outputId: string): void => {
        if (!onOutputNameChange || !editingOutputValue.trim()) {
            setEditingOutput(null);
            setEditingOutputValue('');
            return;
        }

        const finalName = editingOutputValue.trim();
        onOutputNameChange(nodeId, outputId, finalName);
        setEditingOutput(null);
        setEditingOutputValue('');
    };

    const handleOutputNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, outputId: string): void => {
        if (e.key === 'Enter') {
            handleOutputNameSubmit(outputId);
        } else if (e.key === 'Escape') {
            setEditingOutput(null);
            setEditingOutputValue('');
        }
        e.stopPropagation();
    };

    const handleOutputNameBlur = (outputId: string): void => {
        handleOutputNameSubmit(outputId);
    };

    // For Router nodes, always show OUTPUT section even if no outputs exist
    const shouldShowOutputSection = hasOutputs || onOutputAdd; // Show if has outputs OR if it's a Router node

    if (!hasInputs && !shouldShowOutputSection) {
        return null;
    }

    return (
        <div className={styles.ioContainer}>
            {hasInputs && (
                <div className={styles.column}>
                    <div className={styles.sectionHeader}>INPUT</div>
                    {filteredInputs.map(portData => {
                        const portKey = generatePortKey(nodeId, portData.id, 'input');
                        const isSnapping = snappedPortKey === portKey;

                        const portClasses = [
                            styles.port,
                            styles.inputPort,
                            portData.multi ? styles.multi : '',
                            styles[`type-${portData.type}`],
                            isSnapping ? styles.snapping : '',
                            isSnapping && isSnapTargetInvalid ? styles['invalid-snap'] : ''
                        ].filter(Boolean).join(' ');

                        return (
                            <div key={portData.id} className={styles.portRow}>
                                <div
                                    ref={(el) => registerPortRef && registerPortRef(nodeId, portData.id, 'input', el)}
                                    className={portClasses}
                                    onMouseDown={isPreview || isPredicted ? undefined : (e) => {
                                        e.stopPropagation();
                                        onPortMouseDown({
                                            nodeId: nodeId,
                                            portId: portData.id,
                                            portType: 'input',
                                            isMulti: portData.multi,
                                            type: portData.type
                                        }, e);
                                    }}
                                    onMouseUp={isPreview || isPredicted ? undefined : (e) => {
                                        e.stopPropagation();
                                        onPortMouseUp({
                                            nodeId: nodeId,
                                            portId: portData.id,
                                            portType: 'input',
                                            type: portData.type
                                        }, e);
                                    }}
                                >
                                    {portData.type}
                                </div>
                                <span className={`${styles.portLabel} ${portData.required ? styles.required : ''}`}>
                                    {portData.name}
                                </span>
                                {portData.type === 'InputSchema' && !isPreview && !isPredicted && getConnectedSchemaProvider(nodeId, portData.id, currentEdges, currentNodes) && (
                                    <button
                                        className={styles.downloadButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSynchronizeSchema(portData.id);
                                        }}
                                        type="button"
                                        title="Synchronize schema parameters"
                                    >
                                        <LuDownload />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {shouldShowOutputSection && (
                <div className={`${styles.column} ${styles.outputColumn} ${!hasInputs ? styles.fullWidth : ''}`}>
                    <div className={styles.sectionHeader}>
                        OUTPUT
                        {/* Add button for Router outputs */}
                        {!isPreview && onOutputAdd && (
                            <button
                                className={styles.addOutputButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddCustomOutput();
                                }}
                                type="button"
                                title="Add custom output"
                                style={{
                                    marginLeft: '3px',
                                    background: 'transparent',
                                    border: '1px solid #4a90e2',
                                    borderRadius: '3px',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#4a90e2',
                                    fontSize: '12px',
                                    padding: '0',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#4a90e2';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#4a90e2';
                                }}
                            >
                                <LuPlus />
                            </button>
                        )}
                    </div>
                    {hasOutputs ? filteredOutputs.map(portData => {
                        const portClasses = [
                            styles.port,
                            styles.outputPort,
                            portData.multi ? styles.multi : '',
                            styles[`type-${portData.type}`]
                        ].filter(Boolean).join(' ');

                        const isEditing = editingOutput === portData.id;
                        const isCustomOutput = true; // All outputs are editable in Router nodes

                        return (
                            <div key={portData.id} className={`${styles.portRow} ${styles.outputRow}`}>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editingOutputValue}
                                        onChange={handleOutputNameChange}
                                        onKeyDown={(e) => handleOutputNameKeyDown(e, portData.id)}
                                        onBlur={() => handleOutputNameBlur(portData.id)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        onFocus={(e) => e.stopPropagation()}
                                        onDragStart={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        draggable={false}
                                        className={styles.nameInput}
                                        autoFocus
                                        style={{
                                            fontSize: '0.8em',
                                            padding: '2px 4px',
                                            border: '1px solid #ccc',
                                            borderRadius: '2px',
                                            backgroundColor: '#fff',
                                            color: '#000'
                                        }}
                                    />
                                ) : (
                                    <span
                                        className={styles.portLabel}
                                        onClick={isCustomOutput && !isPreview ? () => handleOutputNameEdit(portData.id, portData.name) : undefined}
                                        style={{
                                            cursor: isCustomOutput && !isPreview ? 'pointer' : 'default',
                                            position: 'relative'
                                        }}
                                        title={isCustomOutput && !isPreview ? 'Click to edit' : ''}
                                    >
                                        {portData.name}
                                        {/* Delete button for custom outputs */}
                                        {isCustomOutput && !isPreview && onOutputDelete && (
                                            <button
                                                className={styles.deleteOutputButton}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteOutput(portData.id);
                                                }}
                                                type="button"
                                                title="Delete output"
                                                style={{
                                                    marginLeft: '6px',
                                                    background: 'transparent',
                                                    border: '1px solid #e74c3c',
                                                    borderRadius: '2px',
                                                    width: '16px',
                                                    height: '16px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    color: '#e74c3c',
                                                    fontSize: '10px',
                                                    padding: '0',
                                                    lineHeight: '1',
                                                    transition: 'all 0.2s ease',
                                                    verticalAlign: 'middle'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#e74c3c';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = '#e74c3c';
                                                }}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </span>
                                )}
                                <div
                                    ref={(el) => registerPortRef && registerPortRef(nodeId, portData.id, 'output', el)}
                                    className={portClasses}
                                    onMouseDown={isPreview || isPredicted ? undefined : (e) => {
                                        e.stopPropagation();
                                        onPortMouseDown({
                                            nodeId: nodeId,
                                            portId: portData.id,
                                            portType: 'output',
                                            isMulti: portData.multi,
                                            type: portData.type
                                        }, e);
                                    }}
                                    onMouseUp={isPreview || isPredicted ? undefined : (e) => {
                                        e.stopPropagation();
                                        onPortMouseUp({
                                            nodeId: nodeId,
                                            portId: portData.id,
                                            portType: 'output',
                                            type: portData.type
                                        }, e);
                                    }}
                                >
                                    {portData.type}
                                </div>
                            </div>
                        );
                    }) : (
                        // Show placeholder when no outputs exist but it's a Router node
                        onOutputAdd && !isPreview && (
                            <div className={styles.noOutputsPlaceholder} style={{
                                padding: '8px 12px',
                                color: '#888',
                                fontSize: '0.8em',
                                fontStyle: 'italic',
                                textAlign: 'center'
                            }}>
                                No outputs added yet
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};
