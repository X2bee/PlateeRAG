import React from 'react';
import { LuDownload } from 'react-icons/lu';
import styles from '@/app/canvas/assets/Node.module.scss';
import { generatePortKey, getConnectedSchemaProvider } from '../utils/nodeUtils';
import type { NodePortsProps } from '../types';

export const NodePorts: React.FC<NodePortsProps> = ({
    nodeId,
    inputs,
    outputs,
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
    onSynchronizeSchema
}) => {
    const hasInputs = inputs && inputs.length > 0;
    const hasOutputs = outputs && outputs.length > 0;
    const hasOnlyOutputs = hasOutputs && !hasInputs;

    const handleSynchronizeSchema = (portId: string) => {
        if (!onSynchronizeSchema) return;
        onSynchronizeSchema(portId);
    };

    if (!hasInputs && !hasOutputs) {
        return null;
    }

    return (
        <div className={styles.ioContainer}>
            {hasInputs && (
                <div className={styles.column}>
                    <div className={styles.sectionHeader}>INPUT</div>
                    {inputs.map(portData => {
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
            {hasOutputs && (
                <div className={`${styles.column} ${styles.outputColumn} ${hasOnlyOutputs ? styles.fullWidth : ''}`}>
                    <div className={styles.sectionHeader}>OUTPUT</div>
                    {outputs.map(portData => {
                        const portClasses = [
                            styles.port,
                            styles.outputPort,
                            portData.multi ? styles.multi : '',
                            styles[`type-${portData.type}`]
                        ].filter(Boolean).join(' ');

                        return (
                            <div key={portData.id} className={`${styles.portRow} ${styles.outputRow}`}>
                                <span className={styles.portLabel}>{portData.name}</span>
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
                    })}
                </div>
            )}
        </div>
    );
};