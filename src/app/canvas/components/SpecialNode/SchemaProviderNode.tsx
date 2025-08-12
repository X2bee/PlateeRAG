import React, { memo, useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import styles from '@/app/canvas/assets/Node.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import { fetchParameterOptions } from '@/app/api/parameterApi';
import { LuRefreshCw, LuPlus, LuX } from 'react-icons/lu';
import type {
    Parameter,
    NodeProps,
    ParameterOption
} from '@/app/canvas/types';

const SchemaProviderNode: React.FC<NodeProps> = ({
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
    onClearSelection,
    onOpenNodeModal
}) => {
    const { nodeName, inputs, parameters, outputs, functionId } = data;
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [isEditingName, setIsEditingName] = useState<boolean>(false);
    const [editingName, setEditingName] = useState<string>(nodeName);
    const [hoveredParam, setHoveredParam] = useState<string | null>(null);
    const [editingHandleParams, setEditingHandleParams] = useState<Record<string, boolean>>({});
    const [editingHandleValues, setEditingHandleValues] = useState<Record<string, string>>({});

    useEffect(() => {
        setEditingName(nodeName);
    }, [nodeName]);

    // Node name editing functions
    const handleNameDoubleClick = (e: React.MouseEvent): void => {
        if (isPreview) return;
        e.stopPropagation();
        setIsEditingName(true);
        setEditingName(nodeName);
    };

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setEditingName(e.target.value);
    };

    const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            handleNameSubmit();
        } else if (e.key === 'Escape') {
            handleNameCancel();
        }
        e.stopPropagation();
    };

    const handleNameSubmit = (): void => {
        const trimmedName = editingName.trim();
        if (trimmedName && trimmedName !== nodeName && onNodeNameChange) {
            onNodeNameChange(id, trimmedName);
        } else {
            // Restore original value if no changes or empty string
            setEditingName(nodeName);
        }
        setIsEditingName(false);
    };

    const handleNameCancel = (): void => {
        setEditingName(nodeName);
        setIsEditingName(false);
    };

    const handleNameBlur = (): void => {
        handleNameSubmit();
    };

    const handleHandleParamClick = (param: Parameter): void => {
        if (isPreview || !param.handle_id) return;
        const paramKey = `${id}-${param.id}`;
        setEditingHandleParams(prev => ({ ...prev, [paramKey]: true }));
        setEditingHandleValues(prev => ({
            ...prev,
            [paramKey]: (param.name && param.name.toString().trim()) || param.id
        }));
    };

    const handleHandleParamChange = (e: ChangeEvent<HTMLInputElement>, param: Parameter): void => {
        const paramKey = `${id}-${param.id}`;
        setEditingHandleValues(prev => ({ ...prev, [paramKey]: e.target.value }));
    };

    const handleHandleParamKeyDown = (e: KeyboardEvent<HTMLInputElement>, param: Parameter): void => {
        if (e.key === 'Enter') {
            handleHandleParamSubmit(param);
        } else if (e.key === 'Escape') {
            handleHandleParamCancel(param);
        }
        e.stopPropagation();
    };

    const handleHandleParamSubmit = (param: Parameter): void => {
        const paramKey = `${id}-${param.id}`;
        const trimmedValue = editingHandleValues[paramKey]?.trim() || '';
        const finalValue = trimmedValue || param.id; // placeholder를 key(param.id)로 설정

        if (finalValue !== param.name && onParameterNameChange) {
            // 메인 파라미터의 name을 변경
            onParameterNameChange(id, param.id, finalValue);

            // SchemaProviderNode의 특별한 로직: 연동된 description 파라미터도 함께 업데이트
            if (param.handle_id && param.is_added) {
                const descriptionParamId = `${param.id}_description`;
                const descriptionParamName = `${finalValue}_description`;

                // description 파라미터가 존재하는지 확인하고 업데이트
                const descriptionParam = parameters?.find(p => p.id === descriptionParamId);
                if (descriptionParam && onParameterNameChange) {
                    onParameterNameChange(id, descriptionParamId, descriptionParamName);
                }
            }
        }

        setEditingHandleParams(prev => ({ ...prev, [paramKey]: false }));
    };

    const handleHandleParamCancel = (param: Parameter): void => {
        const paramKey = `${id}-${param.id}`;
        setEditingHandleValues(prev => ({
            ...prev,
            [paramKey]: (param.name && param.name.toString().trim()) || param.id
        }));
        setEditingHandleParams(prev => ({ ...prev, [paramKey]: false }));
    };

    const handleHandleParamBlur = (param: Parameter): void => {
        handleHandleParamSubmit(param);
    };

    const handleAddCustomParameter = (): void => {
        if (isPreview || !onParameterAdd) return;

        // 임의의 10자리 값 생성
        const randomSuffix = Math.random().toString(36).substring(2, 12).padEnd(10, '0');
        const uniqueId = `key_${randomSuffix}`;

        // 첫 번째 파라미터 (메인 파라미터)
        const mainParameter: Parameter = {
            id: uniqueId,
            name: "**kwargs",
            type: "STR",
            value: "value",
            handle_id: true,
            is_added: true,
            options: [{ value: 'str', label: 'STRING'}, { value: 'int', label: 'INTEGER'}, { value: 'float', label: 'FLOAT'}, { value: 'bool', label: 'BOOLEAN' }]
        };

        // 두 번째 파라미터 (description 파라미터)
        const descriptionParameter: Parameter = {
            id: `${uniqueId}_description`,
            name: "**kwargs_description",
            type: "STR",
            value: "description",
            handle_id: false,
            is_added: true,
            expandable: true,
        };

        // 두 파라미터를 순차적으로 추가
        onParameterAdd(id, mainParameter);
        onParameterAdd(id, descriptionParameter);
    };    // 파라미터 삭제 함수 (SchemaProviderNode용 - 연동된 파라미터도 함께 삭제)
    const handleDeleteParameter = (paramId: string): void => {
        if (isPreview || !onParameterDelete) return;

        // 메인 파라미터 삭제
        onParameterDelete(id, paramId);

        // SchemaProviderNode 특별 로직: 연동된 description 파라미터도 함께 삭제
        const param = parameters?.find(p => p.id === paramId);
        if (param && param.handle_id && param.is_added) {
            const descriptionParamId = `${paramId}_description`;
            const descriptionParam = parameters?.find(p => p.id === descriptionParamId);
            if (descriptionParam) {
                onParameterDelete(id, descriptionParamId);
            }
        }
    };


    const numberList = ['INT', 'FLOAT', 'NUMBER', 'INTEGER'];

    // Separate parameters into basic/advanced
    const basicParameters = parameters?.filter(param => !param.optional) || [];
    const advancedParameters = parameters?.filter(param => param.optional) || [];
    const hasAdvancedParams = advancedParameters.length > 0;

    const toggleAdvanced = (e: React.MouseEvent): void => {
        e.stopPropagation();
        setShowAdvanced(prev => !prev);
    };

    // Parameter rendering function
    const renderParameter = (param: Parameter) => {
        const paramKey = `${id}-${param.id}`;
        const isApiParam = param.is_api && param.api_name;
        const isHandleParam = param.handle_id === true;
        const isEditingHandle = editingHandleParams[paramKey] || false;

        // SchemaProviderNode 특별 로직: description 파라미터는 숨김 (첫 번째 파라미터에서 함께 처리)
        if (param.is_added && param.id.endsWith('_description') && !param.handle_id) {
            return null; // description 파라미터는 렌더링하지 않음
        }

        // 연동된 description 파라미터 찾기 (첫 번째 파라미터인 경우)
        const descriptionParam = param.is_added && param.handle_id
            ? parameters?.find(p => p.id === `${param.id}_description`)
            : null;

        // 옵션 처리 - 일반 옵션과 API 옵션 모두 지원
        const effectiveOptions = param.options || [];
        const isLoadingOptions = false;
        const apiSingleValue = null;

        // shouldRenderAsInput 정의 (API 관련 로직 제거했으므로 false로 설정)
        const shouldRenderAsInput = false;

        return (
            <div key={param.id} className={`${styles.param} param`}>
                <span className={`${styles.paramKey} ${param.required ? styles.required : ''}`}>
                    {param.description && param.description.trim() !== '' && (
                        <div
                            className={styles.infoIcon}
                            onMouseEnter={() => setHoveredParam(param.id)}
                            onMouseLeave={() => setHoveredParam(null)}
                        >
                            ?
                            {hoveredParam === param.id && (
                                <div className={styles.tooltip}>
                                    {param.description}
                                </div>
                            )}
                        </div>
                    )}
                    {isHandleParam ? (
                        // handle_id가 true인 경우 클릭으로 편집 가능한 name
                        isEditingHandle ? (
                            <input
                                type="text"
                                value={editingHandleValues[paramKey] || ''}
                                onChange={(e) => handleHandleParamChange(e, param)}
                                onKeyDown={(e) => handleHandleParamKeyDown(e, param)}
                                onBlur={() => handleHandleParamBlur(param)}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                                onFocus={(e) => {
                                    e.stopPropagation();
                                    if (onClearSelection) {
                                        onClearSelection();
                                    }
                                }}
                                onDragStart={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                draggable={false}
                                className={styles.nameInput}
                                autoFocus
                            />
                        ) : (
                            <span
                                onClick={() => handleHandleParamClick(param)}
                                className={styles.nodeName}
                                style={{ cursor: isPreview ? 'default' : 'pointer' }}
                            >
                                {param.name && param.name.toString().trim() ? param.name : param.id}
                            </span>
                        )
                    ) : (
                        param.name
                    )}
                    {param.is_added && !isPreview && onParameterDelete && (
                        <button
                            className={styles.deleteParameterButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteParameter(param.id);
                            }}
                            type="button"
                            title="Delete parameter"
                        >
                            <LuX />
                        </button>
                    )}
                </span>
                {isHandleParam ? (
                    // handle_id가 true인 경우: 옵션이 있으면 select, 없으면 input
                    <div className={styles.doubleInputWrapper || `${styles.paramInput} doubleInputWrapper`}>
                        {effectiveOptions.length > 0 ? (
                            <select
                                value={param.value !== undefined && param.value !== null ? param.value.toString() : ''}
                                onChange={(e) => {
                                    devLog.log('=== Handle Param Select Change ===');
                                    devLog.log('Parameter:', param.name, 'Previous value:', param.value, 'New value:', e.target.value);
                                    devLog.log('Available options:', effectiveOptions);
                                    handleParamValueChange(e, param.id);
                                    devLog.log('=== Handle Param Select Change Complete ===');
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                                onFocus={(e) => {
                                    e.stopPropagation();
                                    if (onClearSelection) {
                                        onClearSelection();
                                    }
                                }}
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                }}
                                onDragStart={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                draggable={false}
                                className={`${styles.paramSelect} paramSelect`}
                            >
                                <option value="">-- Select --</option>
                                {effectiveOptions.map((option, index) => (
                                    <option key={index} value={option.value}>
                                        {option.label || option.value}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={param.value !== undefined && param.value !== null ? param.value.toString() : ''}
                                onChange={(e) => handleParamValueChange(e, param.id)}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                                onFocus={(e) => {
                                    e.stopPropagation();
                                    if (onClearSelection) {
                                        onClearSelection();
                                    }
                                }}
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                }}
                                onDragStart={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                draggable={false}
                                className={`${styles.paramInput} paramInput`}
                                placeholder="Value"
                            />
                        )}
                        {descriptionParam && (
                            descriptionParam.expandable ? (
                                <div className={styles.expandableWrapper}>
                                    <input
                                        type="text"
                                        value={descriptionParam.value.toString() || ''}
                                        onChange={(e) => handleParamValueChange(e, descriptionParam.id)}
                                        onMouseDown={(e) => {
                                            devLog.log('expandable input onMouseDown');
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                            devLog.log('expandable input onClick');
                                            e.stopPropagation();
                                        }}
                                        onFocus={(e) => {
                                            devLog.log('expandable input onFocus');
                                            e.stopPropagation();
                                            if (onClearSelection) {
                                                onClearSelection();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            e.stopPropagation();
                                        }}
                                        onDragStart={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        draggable={false}
                                        className={`${styles.paramInput} paramInput`}
                                        placeholder="Description"
                                        style={{ marginTop: '4px' }}
                                    />
                                    <button
                                        className={styles.expandButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onOpenNodeModal) {
                                                onOpenNodeModal(id, descriptionParam.id, descriptionParam.name, String(descriptionParam.value || ''));
                                            }
                                        }}
                                        type="button"
                                        title="Expand to edit"
                                        style={{ marginTop: '4px' }}
                                    >
                                        ⧉
                                    </button>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    value={descriptionParam.value.toString() || ''}
                                    onChange={(e) => handleParamValueChange(e, descriptionParam.id)}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                    onFocus={(e) => {
                                        e.stopPropagation();
                                        if (onClearSelection) {
                                            onClearSelection();
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                    }}
                                    onDragStart={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    draggable={false}
                                    className={`${styles.paramInput} paramInput`}
                                    placeholder="Description"
                                    style={{ marginTop: '4px' }}
                                />
                            )
                        )}
                    </div>
                ) : shouldRenderAsInput ? (
                    // API에서 단일 값을 로드한 경우 input으로 렌더링
                    <input
                        type="text"
                        value={param.value !== undefined && param.value !== null ? param.value.toString() : (apiSingleValue || '')}
                        onChange={(e) => handleParamValueChange(e, param.id)}
                        onMouseDown={(e) => {
                            devLog.log('api single value input onMouseDown');
                            e.stopPropagation();
                        }}
                        onClick={(e) => {
                            devLog.log('api single value input onClick');
                            e.stopPropagation();
                        }}
                        onFocus={(e) => {
                            devLog.log('api single value input onFocus');
                            e.stopPropagation();
                            // Clear node selection when editing parameter
                            if (onClearSelection) {
                                onClearSelection();
                            }
                        }}
                        onKeyDown={(e) => {
                            // Prevent keyboard event propagation
                            e.stopPropagation();
                        }}
                        onDragStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        draggable={false}
                        className={`${styles.paramInput} paramInput`}
                        placeholder={apiSingleValue ? `Default: ${apiSingleValue}` : ''}
                    />
                ) : effectiveOptions.length > 0 ? (
                    <select
                        value={param.value !== undefined && param.value !== null ? param.value.toString() : ''}
                        onChange={(e) => {
                            devLog.log('=== Select Parameter Change ===');
                            devLog.log('Parameter:', param.name, 'Previous value:', param.value, 'New value:', e.target.value);
                            devLog.log('Available options:', effectiveOptions);
                            handleParamValueChange(e, param.id);
                            devLog.log('=== Select Parameter Change Complete ===');
                        }}
                        onMouseDown={(e) => {
                            devLog.log('select onMouseDown');
                            e.stopPropagation();
                        }}
                        onClick={(e) => {
                            devLog.log('select onClick');
                            e.stopPropagation();
                        }}
                        onFocus={(e) => {
                            devLog.log('select onFocus - Parameter:', param.name, 'Current value:', param.value);
                            e.stopPropagation();
                            // Clear node selection when editing parameter
                            if (onClearSelection) {
                                onClearSelection();
                            }
                        }}
                        onBlur={(e) => {
                            devLog.log('select onBlur - Parameter:', param.name, 'Final value:', e.target.value);
                            e.stopPropagation();
                        }}
                        onKeyDown={(e) => {
                            // Prevent keyboard event propagation
                            e.stopPropagation();
                        }}
                        onDragStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        draggable={false}
                        className={`${styles.paramSelect} paramSelect`}
                        disabled={isLoadingOptions}
                    >
                        {isLoadingOptions ? (
                            <option value="">Loading...</option>
                        ) : effectiveOptions.length === 0 ? (
                            <option value="">-- No options available --</option>
                        ) : (
                            <>
                                <option value="">-- Select --</option>
                                {effectiveOptions.map((option, index) => (
                                    <option key={index} value={option.value}>
                                        {option.label || option.value}
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                ) : (param as any).expandable ? (
                    <div className={styles.expandableWrapper}>
                        <input
                            type="text"
                            value={param.value !== undefined && param.value !== null ? param.value.toString() : ''}
                            onChange={(e) => handleParamValueChange(e, param.id)}
                            onMouseDown={(e) => {
                                devLog.log('expandable input onMouseDown');
                                e.stopPropagation();
                            }}
                            onClick={(e) => {
                                devLog.log('expandable input onClick');
                                e.stopPropagation();
                            }}
                            onFocus={(e) => {
                                devLog.log('expandable input onFocus');
                                e.stopPropagation();
                                if (onClearSelection) {
                                    onClearSelection();
                                }
                            }}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                            }}
                            onDragStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            draggable={false}
                            className={`${styles.paramInput} paramInput`}
                            readOnly
                            placeholder="Click expand button to edit..."
                        />
                        <button
                            className={styles.expandButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenNodeModal) {
                                    onOpenNodeModal(id, param.id, param.name, String(param.value || ''));
                                }
                            }}
                            type="button"
                            title="Expand to edit"
                        >
                            ⧉
                        </button>
                    </div>
                ) : (
                    <input
                        type={param.type && numberList.includes(param.type) ? 'number' : 'text'}
                        value={(param.value !== undefined && param.value !== null) ? param.type === 'STR' ? param.value.toString(): parseFloat(param.value.toString()): ''}
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
                            // Clear node selection when editing parameter
                            if (onClearSelection) {
                                onClearSelection();
                            }
                        }}
                        onKeyDown={(e) => {
                            // Prevent keyboard event propagation (backspace, delete, etc.)
                            e.stopPropagation();
                        }}
                        onDragStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        draggable={false}
                        className={`${styles.paramInput} paramInput`}
                        step={param.step}
                        min={param.min}
                        max={param.max}
                    />
                )}
            </div>
        );
    };

    const handleMouseDown = (e: React.MouseEvent): void => {
        if (isPreview) return; // Disable drag in preview mode
        e.stopPropagation();
        onNodeMouseDown(e, id);
    };

    const handleParamValueChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, paramId: string): void => {
        e.preventDefault();
        e.stopPropagation();

        try {
            // Value validation
            const value = e.target.value;
            if (value === undefined || value === null) {
                devLog.warn('Invalid parameter value:', value);
                return;
            }

            devLog.log('Calling onParameterChange...');
            // Safe callback call
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

    const hasInputs = inputs && inputs.length > 0;
    const hasOutputs = outputs && outputs.length > 0;
    const hasIO = hasInputs || hasOutputs;
    const hasParams = true;
    const hasOnlyOutputs = hasOutputs && !hasInputs;

    const displayName = nodeName.length > 25 ? nodeName.substring(0, 25) + '...' : nodeName;

    return (
        <>
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
                            onDragStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            draggable={false}
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
                                                    ref={(el) => registerPortRef && registerPortRef(id, portData.id, 'input', el)}
                                                    className={portClasses}
                                                    onMouseDown={isPreview ? undefined : (e) => {
                                                        e.stopPropagation();
                                                        onPortMouseDown({
                                                            nodeId: id,
                                                            portId: portData.id,
                                                            portType: 'input',
                                                            isMulti: portData.multi,
                                                            type: portData.type
                                                        });
                                                    }}
                                                    onMouseUp={isPreview ? undefined : (e) => {
                                                        e.stopPropagation();
                                                        onPortMouseUp({
                                                            nodeId: id,
                                                            portId: portData.id,
                                                            portType: 'input',
                                                            type: portData.type
                                                        });
                                                    }}
                                                >
                                                    {portData.type}
                                                </div>
                                                <span className={`${styles.portLabel} ${portData.required ? styles.required : ''}`}>
                                                    {portData.name}
                                                </span>
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
                                                    ref={(el) => registerPortRef && registerPortRef(id, portData.id, 'output', el)}
                                                    className={portClasses}
                                                    onMouseDown={isPreview ? undefined : (e) => {
                                                        e.stopPropagation();
                                                        onPortMouseDown({
                                                            nodeId: id,
                                                            portId: portData.id,
                                                            portType: 'output',
                                                            isMulti: portData.multi,
                                                            type: portData.type
                                                        });
                                                    }}
                                                    onMouseUp={isPreview ? undefined : (e) => {
                                                        e.stopPropagation();
                                                        onPortMouseUp({
                                                            nodeId: id,
                                                            portId: portData.id,
                                                            portType: 'output',
                                                            type: portData.type
                                                        });
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
                    )}
                    {hasParams && (
                        <>
                            {hasIO && <div className={styles.divider}></div>}
                            <div className={styles.paramSection}>
                                <div className={styles.sectionHeader}>
                                    <span>PARAMETER</span>
                                    {!isPreview && onParameterAdd && (
                                        <button
                                            className={styles.addParameterButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddCustomParameter();
                                            }}
                                            type="button"
                                            title="Add custom parameter"
                                        >
                                            <LuPlus />
                                        </button>
                                    )}
                                </div>
                                {basicParameters.map(param => renderParameter(param))}
                                {hasAdvancedParams && (
                                    <div className={styles.advancedParams}>
                                        {showAdvanced && advancedParameters.map(param => renderParameter(param))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default memo(SchemaProviderNode);
