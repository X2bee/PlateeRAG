import React, { memo } from 'react';
import styles from '@/app/assets/Node.module.scss';

// CHANGED: snappedPortKey prop이 비구조화 할당에 포함되었습니다.
const Node = ({ id, data, position, onNodeMouseDown, isSelected, onPortMouseDown, onPortMouseUp, registerPortRef, snappedPortKey, onParameterChange }) => {
    const { nodeName, inputs, parameters, outputs } = data;

    const handleMouseDown = (e) => {
        e.stopPropagation();
        onNodeMouseDown(e, id);
    };
    const handleParamValueChange = (e, paramId) => {
        e.stopPropagation();
        onParameterChange(id, paramId, e.target.value);
    };
    const hasInputs = inputs?.length > 0;
    const hasOutputs = outputs?.length > 0;
    const hasIO = hasInputs || hasOutputs;
    const hasParams = parameters?.length > 0;

    return (
        <div
            className={`${styles.node} ${isSelected ? styles.selected : ''}`}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onMouseDown={handleMouseDown}
        >
            <div className={styles.header}>
                {nodeName}
            </div>

            <div className={styles.body}>
                {hasIO && (
                    <div className={styles.ioContainer}>
                        {hasInputs && (
                            <div className={styles.column}>
                                <div className={styles.sectionHeader}>INPUT</div>
                                {inputs.map(portData => {
                                    // ADDED: 현재 포트가 스냅 대상인지 확인하기 위한 로직
                                    const portKey = `${id}__PORTKEYDELIM__${portData.id}__PORTKEYDELIM__input`;
                                    const isSnapping = snappedPortKey === portKey;

                                    return (
                                        <div key={portData.id} className={styles.portRow}>
                                            <div
                                                ref={(el) => registerPortRef(id, portData.id, 'input', el)}
                                                className={`${styles.port} ${styles.inputPort} ${portData.multi ? styles.multi : ''} ${isSnapping ? styles.snapping : ''}`}
                                                onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown({ nodeId: id, portId: portData.id, portType: 'input', isMulti: portData.multi }) }}
                                                onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp({ nodeId: id, portId: portData.id, portType: 'input' }) }}
                                            />
                                            <span className={styles.portLabel}>{portData.name}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        {hasOutputs && (
                            <div className={`${styles.column} ${styles.outputColumn}`}>
                                <div className={styles.sectionHeader}>OUTPUT</div>
                                {outputs.map(portData => (
                                    <div key={portData.id} className={`${styles.portRow} ${styles.outputRow}`}>
                                        <span className={styles.portLabel}>{portData.name}</span>
                                        <div
                                            ref={(el) => registerPortRef(id, portData.id, 'output', el)}
                                            className={`${styles.port} ${styles.outputPort} ${portData.multi ? styles.multi : ''}`}
                                            onMouseDown={(e) => { e.stopPropagation(); onPortMouseDown({ nodeId: id, portId: portData.id, portType: 'output', isMulti: portData.multi }) }}
                                            onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp({ nodeId: id, portId: portData.id, portType: 'output' }) }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {hasParams && (
                    <>
                        {hasIO && <div className={styles.divider}></div>}
                        <div className={styles.paramSection}>
                            <div className={styles.sectionHeader}>PARAMETER</div>
                            {parameters.map(param => (
                                <div key={param.id} className={styles.param}>
                                    <span className={styles.paramKey}>{param.name}</span>
                                    <input
                                        type={typeof param.value === 'number' ? 'number' : 'text'}
                                        value={param.value}
                                        onChange={(e) => handleParamValueChange(e, param.id)}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className={styles.paramInput}
                                        step={param.step}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default memo(Node);