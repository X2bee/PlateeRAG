// src/app/components/Node.jsx
import React, { memo, useState, useEffect } from 'react';
import styles from '@/app/(canvas)/assets/Node.module.scss';
import { devLog } from '@/app/utils/logger';

const Node = ({ id, data, position, onNodeMouseDown, isSelected, onPortMouseDown, onPortMouseUp, registerPortRef, snappedPortKey, onParameterChange, isSnapTargetInvalid, isPreview = false, onNodeNameChange }) => {
    const { nodeName, inputs, parameters, outputs, functionId } = data;
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingName, setEditingName] = useState(nodeName);

    // nodeName이 변경될 때 editingName 동기화
    useEffect(() => {
        setEditingName(nodeName);
    }, [nodeName]);

    // 노드 이름 편집 관련 함수들
    const handleNameDoubleClick = (e) => {
        if (isPreview) return;
        e.stopPropagation();
        setIsEditingName(true);
        setEditingName(nodeName);
    };

    const handleNameChange = (e) => {
        setEditingName(e.target.value);
    };

    const handleNameKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleNameSubmit();
        } else if (e.key === 'Escape') {
            handleNameCancel();
        }
        e.stopPropagation();
    };

    const handleNameSubmit = () => {
        const trimmedName = editingName.trim();
        if (trimmedName && trimmedName !== nodeName && onNodeNameChange) {
            onNodeNameChange(id, trimmedName);
        } else {
            // 변경사항이 없거나 빈 문자열인 경우 원래 값으로 복원
            setEditingName(nodeName);
        }
        setIsEditingName(false);
    };

    const handleNameCancel = () => {
        setEditingName(nodeName);
        setIsEditingName(false);
    };

    const handleNameBlur = () => {
        handleNameSubmit();
    };

    // 파라미터를 기본/고급으로 분리
    const basicParameters = parameters?.filter(param => !param.optional) || [];
    const advancedParameters = parameters?.filter(param => param.optional) || [];
    const hasAdvancedParams = advancedParameters.length > 0;

    const toggleAdvanced = (e) => {
        e.stopPropagation();
        setShowAdvanced(prev => !prev);
    };

    // 파라미터 렌더링 함수
    const renderParameter = (param) => (
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
    );

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

    // 노드 이름 표시용 (10자 넘으면 ... 처리)
    const displayName = nodeName.length > 20 ? nodeName.substring(0, 20) + '...' : nodeName;

    return (
        <div
            className={`${styles.node} ${isSelected ? styles.selected : ''} ${isPreview ? 'preview' : ''}`}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onMouseDown={handleMouseDown}
        >
            <div className={styles.header}>
                {isEditingName ? (
                    <input
                        type="text"
                        value={editingName}
                        onChange={handleNameChange}
                        onKeyDown={handleNameKeyDown}
                        onBlur={handleNameBlur}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        onFocus={(e) => {
                            e.stopPropagation();
                        }}
                        className={styles.nameInput}
                        autoFocus
                    />
                ) : (
                    <span onDoubleClick={handleNameDoubleClick} className={styles.nodeName}>
                        {displayName}
                    </span>
                )}
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
                            {basicParameters.map(param => renderParameter(param))}
                            {hasAdvancedParams && (
                                <div className={styles.advancedParams}>
                                    <div className={styles.advancedHeader} onClick={toggleAdvanced}>
                                        <span>Advanced {showAdvanced ? '▲' : '▼'}</span>
                                    </div>
                                    {showAdvanced && advancedParameters.map(param => renderParameter(param))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default memo(Node);