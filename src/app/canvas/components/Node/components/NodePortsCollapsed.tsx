import React, { useMemo } from 'react';
import styles from '@/app/canvas/assets/Node.module.scss';
import { generatePortKey } from '../utils/nodeUtils';
import { filterPortsByDependency } from '../utils/portUtils';
import type { NodePortsProps } from '../types';

export const NodePortsCollapsed: React.FC<NodePortsProps> = ({
    nodeId,
    inputs,
    outputs,
    parameters,
    isPreview = false,
    isPredicted = false,
    onPortMouseDown,
    onPortMouseUp,
    registerPortRef,
    snappedPortKey,
    isSnapTargetInvalid
}) => {
    // Dependency를 고려하여 실제 렌더링할 포트만 필터링
    const filteredInputs = useMemo(() => filterPortsByDependency(inputs, parameters), [inputs, parameters]);
    const filteredOutputs = useMemo(() => filterPortsByDependency(outputs, parameters), [outputs, parameters]);
    const hasInputs = filteredInputs && filteredInputs.length > 0;
    const hasOutputs = filteredOutputs && filteredOutputs.length > 0;

    if (!hasInputs && !hasOutputs) {
        return null;
    }

    return (
        <div className={styles.collapsedPorts}>
            {/* 입력 포트들 - 왼쪽 */}
            <div className={styles.collapsedInputs}>
                {hasInputs && filteredInputs?.map((input) => {
                    const portKey = generatePortKey(nodeId, input.id, 'input');
                    const isSnapping = snappedPortKey === portKey;

                    return (
                        <div
                            key={input.id}
                            className={styles.collapsedPortItem}
                        >
                            <div
                                className={`${styles.collapsedPortCircle} ${styles[`type-${input.type}`]} ${
                                    input.multi ? styles.multi : ''
                                } ${
                                    isSnapping
                                        ? (isSnapTargetInvalid ? styles['invalid-snap'] : styles.snapping)
                                        : ''
                                }`}
                                ref={(el) => registerPortRef(nodeId, input.id, 'input', el)}
                                onMouseDown={(e) => {
                                    if (isPreview || isPredicted) return;
                                    e.stopPropagation();
                                    onPortMouseDown({
                                        nodeId: nodeId,
                                        portId: input.id,
                                        portType: 'input',
                                        isMulti: input.multi,
                                        type: input.type
                                    }, e);
                                }}
                                onMouseUp={(e) => {
                                    if (isPreview || isPredicted) return;
                                    e.stopPropagation();
                                    onPortMouseUp({
                                        nodeId: nodeId,
                                        portId: input.id,
                                        portType: 'input',
                                        isMulti: input.multi,
                                        type: input.type
                                    }, e);
                                }}
                                title={`${input.name} (${input.type})`}
                            />
                            <span className={styles.collapsedPortType}>{input.type}</span>
                        </div>
                    );
                })}
            </div>

            {/* 출력 포트들 - 오른쪽 */}
            <div className={styles.collapsedOutputs}>
                {hasOutputs && filteredOutputs?.map((output) => {
                    const portKey = generatePortKey(nodeId, output.id, 'output');
                    const isSnapping = snappedPortKey === portKey;

                    return (
                        <div
                            key={output.id}
                            className={styles.collapsedPortItem}
                        >
                            <span className={styles.collapsedPortType}>{output.type}</span>
                            <div
                                className={`${styles.collapsedPortCircle} ${styles[`type-${output.type}`]} ${
                                    output.multi ? styles.multi : ''
                                } ${
                                    isSnapping
                                        ? (isSnapTargetInvalid ? styles['invalid-snap'] : styles.snapping)
                                        : ''
                                }`}
                                ref={(el) => registerPortRef(nodeId, output.id, 'output', el)}
                                onMouseDown={(e) => {
                                    if (isPreview || isPredicted) return;
                                    e.stopPropagation();
                                    onPortMouseDown({
                                        nodeId: nodeId,
                                        portId: output.id,
                                        portType: 'output',
                                        isMulti: output.multi,
                                        type: output.type
                                    }, e);
                                }}
                                onMouseUp={(e) => {
                                    if (isPreview || isPredicted) return;
                                    e.stopPropagation();
                                    onPortMouseUp({
                                        nodeId: nodeId,
                                        portId: output.id,
                                        portType: 'output',
                                        isMulti: output.multi,
                                        type: output.type
                                    }, e);
                                }}
                                title={`${output.name} (${output.type})`}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
