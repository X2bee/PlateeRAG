// src/app/components/Node.jsx
import React, { memo } from 'react';
import styles from '@/app/(canvas)/assets/Node.module.scss';
import { devLog } from '@/app/utils/logger';

const Node = ({ id, data, position, onNodeMouseDown, isSelected, onPortMouseDown, onPortMouseUp, registerPortRef, snappedPortKey, onParameterChange, isSnapTargetInvalid, isPreview = false }) => {
    const { nodeName, inputs, parameters, outputs, functionId } = data;

    const handleMouseDown = (e) => {
        if (isPreview) return; // 프리뷰 모드에서는 드래그 비활성화
        e.stopPropagation();
        onNodeMouseDown(e, id);
    };

    const handleParamValueChange = (e, paramId) => {
        devLog.log('=== Parameter Change Event ===');
        devLog.log('nodeId:', id, 'paramId:', paramId, 'value:', e.target.value);
        
        // 이벤트 전파 중단
        e.preventDefault();
        e.stopPropagation();
        
        try {
            // 값 검증
            const value = e.target.value;
            if (value === undefined || value === null) {
                devLog.warn('Invalid parameter value:', value);
                return;
            }
            
            devLog.log('Calling onParameterChange...');
            // 안전한 콜백 호출
            if (typeof onParameterChange === 'function') {
                onParameterChange(id, paramId, value);
                devLog.log('onParameterChange completed successfully');
            } else {
                devLog.error('onParameterChange is not a function');
            }
        } catch (error) {
            devLog.error('Error in handleParamValueChange:', error);
        }
        devLog.log('=== End Parameter Change ===');
    };

    const hasInputs = inputs?.length > 0;
    const hasOutputs = outputs?.length > 0;
    const hasIO = hasInputs || hasOutputs;
    const hasParams = parameters?.length > 0;
    const hasOnlyOutputs = hasOutputs && !hasInputs;

    return (
        <div
            className={`${styles.node} ${isSelected ? styles.selected : ''} ${isPreview ? 'preview' : ''}`}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onMouseDown={handleMouseDown}
        >
            <div className={styles.header}>
                <span>{nodeName}</span>
                {functionId && <span className={styles.functionId}>({functionId})</span>}
            </div>
            <div className={styles.body}>
                {hasIO && (
                    <div className={styles.ioContainer}>
                        {hasInputs && (
                            <div className={styles.column}>
                                <div className={styles.sectionHeader}>INPUT</div>
                                {inputs.map(portData => {
                                    const portKey = `${id}__PORTKEYDELIM__${portData.id}__PORTKEYDELIM__input`;
                                    const isSnapping = snappedPortKey === portKey;
                                    
                                    const portClasses = [ styles.port, styles.inputPort, portData.multi ? styles.multi : '', styles[`type-${portData.type}`], isSnapping ? styles.snapping : '', isSnapping && isSnapTargetInvalid ? styles['invalid-snap'] : '' ].filter(Boolean).join(' ');

                                    return (
                                        <div key={portData.id} className={styles.portRow}>
                                            <div
                                                ref={(el) => registerPortRef && registerPortRef(id, portData.id, 'input', el)}
                                                className={portClasses}
                                                onMouseDown={isPreview ? undefined : (e) => { e.stopPropagation(); onPortMouseDown({ nodeId: id, portId: portData.id, portType: 'input', isMulti: portData.multi, type: portData.type }) }}
                                                onMouseUp={isPreview ? undefined : (e) => { e.stopPropagation(); onPortMouseUp({ nodeId: id, portId: portData.id, portType: 'input', type: portData.type }) }}
                                            >
                                                {portData.type}
                                            </div>
                                            <span className={`${styles.portLabel} ${portData.required ? styles.required : ''}`}>
                                                {portData.name}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        {hasOutputs && (
                            <div className={`${styles.column} ${styles.outputColumn} ${hasOnlyOutputs ? styles.fullWidth : ''}`}>
                                <div className={styles.sectionHeader}>OUTPUT</div>
                                {outputs.map(portData => {
                                    const portClasses = [ styles.port, styles.outputPort, portData.multi ? styles.multi : '', styles[`type-${portData.type}`] ].filter(Boolean).join(' ');

                                    return (
                                        <div key={portData.id} className={`${styles.portRow} ${styles.outputRow}`}>
                                            <span className={styles.portLabel}>{portData.name}</span>
                                            <div
                                                ref={(el) => registerPortRef && registerPortRef(id, portData.id, 'output', el)}
                                                className={portClasses}
                                                onMouseDown={isPreview ? undefined : (e) => { e.stopPropagation(); onPortMouseDown({ nodeId: id, portId: portData.id, portType: 'output', isMulti: portData.multi, type: portData.type }) }}
                                                onMouseUp={isPreview ? undefined : (e) => { e.stopPropagation(); onPortMouseUp({ nodeId: id, portId: portData.id, portType: 'output', type: portData.type }) }}
                                            >
                                                {portData.type}
                                            </div>
                                        </div>
                                    )
                                })}
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
                                <div key={param.id} className={`${styles.param} param`}>
                                    <span className={`${styles.paramKey} ${param.required ? styles.required : ''}`}>
                                        {param.name}
                                    </span>
                                    {param.options && param.options.length > 0 ? (
                                        <select 
                                            value={param.value} 
                                            onChange={(e) => handleParamValueChange(e, param.id)} 
                                            onMouseDown={(e) => {
                                                devLog.log('select onMouseDown');
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => {
                                                devLog.log('select onClick');
                                                e.stopPropagation();
                                            }}
                                            onFocus={(e) => {
                                                devLog.log('select onFocus');
                                                e.stopPropagation();
                                            }}
                                            onBlur={(e) => {
                                                devLog.log('select onBlur');
                                                e.stopPropagation();
                                            }}
                                            className={`${styles.paramSelect} paramSelect`}
                                        >
                                            {param.options.map((option, index) => (
                                                <option key={index} value={option.value}>
                                                    {option.label || option.value}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input 
                                            type={typeof param.value === 'number' ? 'number' : 'text'} 
                                            value={param.value} 
                                            onChange={(e) => handleParamValueChange(e, param.id)} 
                                            onMouseDown={(e) => {
                                                devLog.log('input onMouseDown');
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => {
                                                devLog.log('input onClick');
                                                e.stopPropagation();
                                            }}
                                            onFocus={(e) => {
                                                devLog.log('input onFocus');
                                                e.stopPropagation();
                                            }}
                                            className={`${styles.paramInput} paramInput`} 
                                            step={param.step}
                                            min={param.min}
                                            max={param.max}
                                        />
                                    )}
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