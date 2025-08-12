import React, { memo, useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import styles from '@/app/canvas/assets/Node.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import { fetchParameterOptions } from '@/app/api/parameterApi';
import { LuRefreshCw, LuPlus, LuX, LuDownload } from 'react-icons/lu';
import type {
    Parameter,
    NodeProps,
    ParameterOption
} from '@/app/canvas/types';

const Node: React.FC<NodeProps> = ({
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
    const [isEditingName, setIsEditingName] = useState<boolean>(false);
    const [editingName, setEditingName] = useState<string>(nodeName);
    const [tool_name, setToolNameValue] = useState('tool_name');
    const [error, setError] = useState('');


    // API 기반 옵션을 관리하는 상태
    const [apiOptions, setApiOptions] = useState<Record<string, ParameterOption[]>>({});
    const [loadingApiOptions, setLoadingApiOptions] = useState<Record<string, boolean>>({});
    // API에서 로드된 단일 값을 저장하는 상태
    const [apiSingleValues, setApiSingleValues] = useState<Record<string, string>>({});

    // 툴팁 표시 상태를 관리하는 상태
    const [hoveredParam, setHoveredParam] = useState<string | null>(null);

    // handle_id 파라미터 편집 상태
    const [editingHandleParams, setEditingHandleParams] = useState<Record<string, boolean>>({});
    const [editingHandleValues, setEditingHandleValues] = useState<Record<string, string>>({});

    // Sync editingName when nodeName changes
    useEffect(() => {
        setEditingName(nodeName);
    }, [nodeName]);

    // API 기반 파라미터의 옵션을 로드하는 함수
    const loadApiOptions = async (param: Parameter) => {
        if (!param.is_api || !param.api_name) return;

        const paramKey = `${id}-${param.id}`;

        // 이미 로딩 중이거나 옵션이 이미 있거나 단일 값이 이미 있으면 스킵
        if (loadingApiOptions[paramKey] || apiOptions[paramKey] || apiSingleValues[paramKey]) return;

        setLoadingApiOptions(prev => ({ ...prev, [paramKey]: true }));

        try {
            const options = await fetchParameterOptions(data.id, param.api_name);

            // 단일 값인지 확인 (첫 번째 옵션에 isSingleValue가 true인 경우)
            if (options.length === 1 && options[0].isSingleValue) {
                const singleValue = String(options[0].value);
                setApiSingleValues(prev => ({ ...prev, [paramKey]: singleValue }));

                // 파라미터의 기본값을 API에서 로드한 값으로 설정 (undefined나 null인 경우에만)
                if (param.value === undefined || param.value === null) {
                    onParameterChange(id, param.id, singleValue);
                }

                devLog.log('Single value loaded for parameter:', param.name, 'value:', singleValue);
            } else {
                // 배열 옵션인 경우
                setApiOptions(prev => ({ ...prev, [paramKey]: options }));
                devLog.log('Options loaded for parameter:', param.name, 'count:', options.length);
            }
        } catch (error) {
            devLog.error('Error loading API options for parameter:', param.name, error);
        } finally {
            setLoadingApiOptions(prev => ({ ...prev, [paramKey]: false }));
        }
    };

    // API 기반 파라미터의 옵션을 강제로 다시 로드하는 함수 (refresh 버튼용)
    const refreshApiOptions = async (param: Parameter) => {
        if (!param.is_api || !param.api_name) return;

        const paramKey = `${id}-${param.id}`;

        // 이미 로딩 중이면 스킵
        if (loadingApiOptions[paramKey]) return;

        setLoadingApiOptions(prev => ({ ...prev, [paramKey]: true }));

        try {
            // 기존 옵션 및 단일 값 삭제하고 새로 로드
            setApiOptions(prev => {
                const newOptions = { ...prev };
                delete newOptions[paramKey];
                return newOptions;
            });

            setApiSingleValues(prev => {
                const newValues = { ...prev };
                delete newValues[paramKey];
                return newValues;
            });

            const options = await fetchParameterOptions(data.id, param.api_name);

            // 단일 값인지 확인 (첫 번째 옵션에 isSingleValue가 true인 경우)
            if (options.length === 1 && options[0].isSingleValue) {
                const singleValue = String(options[0].value);
                setApiSingleValues(prev => ({ ...prev, [paramKey]: singleValue }));

                // 파라미터 값을 새로운 API 값으로 업데이트
                onParameterChange(id, param.id, singleValue);

                devLog.log('Single value refreshed for parameter:', param.name, 'value:', singleValue);
            } else {
                // 배열 옵션인 경우
                setApiOptions(prev => ({ ...prev, [paramKey]: options }));
                devLog.log('Options refreshed for parameter:', param.name, 'count:', options.length);
            }
        } catch (error) {
            devLog.error('Error refreshing API options for parameter:', param.name, error);
        } finally {
            setLoadingApiOptions(prev => ({ ...prev, [paramKey]: false }));
        }
    };

    // 컴포넌트 마운트 시 API 기반 파라미터들의 옵션을 로드
    useEffect(() => {
        if (!parameters) return;

        parameters.forEach(param => {
            if (param.is_api && param.api_name) {
                loadApiOptions(param);
            }
        });
    }, [parameters, data.id]);

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

    // handle_id 파라미터 편집 함수들
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
            // name을 변경 (id와 name을 모두 변경)
            onParameterNameChange(id, param.id, finalValue);
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

    // 새로운 파라미터 추가 함수
    const handleAddCustomParameter = (): void => {
        if (isPreview || !onParameterAdd) return;

        // 임의의 10자리 값 생성
        const randomSuffix = Math.random().toString(36).substring(2, 12).padEnd(10, '0');
        const uniqueId = `key_${randomSuffix}`;

        const newParameter: Parameter = {
            id: uniqueId,
            name: "**kwargs",
            type: "STR",
            value: "value",
            handle_id: true,
            is_added: true
        };

        onParameterAdd(id, newParameter);
    };    // 파라미터 삭제 함수
    const handleDeleteParameter = (paramId: string): void => {
        if (isPreview || !onParameterDelete) return;
        onParameterDelete(id, paramId);
    };

    // InputSchema 연결 확인 및 동기화 함수
    const getConnectedSchemaProvider = (nodeId: string, portId: string) => {
        if (!currentEdges || !currentNodes) return null;

        // 해당 포트로 연결되는 edge 찾기
        const connectedEdge = currentEdges.find((edge: any) =>
            edge.target?.nodeId === nodeId && edge.target?.portId === portId
        );

        if (!connectedEdge) return null;

        // 연결된 source 노드 찾기
        const sourceNode = currentNodes.find((node: any) =>
            node.id === connectedEdge.source.nodeId
        );

        if (!sourceNode) return null;

        // SchemaProvider 노드인지 확인 (data 속성 내의 id와 nodeName 확인)
        if (sourceNode.data?.id === 'input_schema_provider' ||
            sourceNode.data?.id === 'output_schema_provider' ||
            sourceNode.data?.nodeName === 'Schema Provider(Input)') {
            return sourceNode;
        }

        return null;
    };

    const handleSynchronizeSchema = (portId: string): void => {
        if (!onSynchronizeSchema) return;
        onSynchronizeSchema(id, portId);
    };

    const validationMessage = '최대 64자, 영문 대소문자(a-z, A-Z), 숫자(0-9), 언더스코어(_)';

    const handleToolNameChange = (e: React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLInputElement>, paramId: string) => {
        const originalValue = e.target.value;
        let processedValue = originalValue;

        if (processedValue.length > 64) {
            processedValue = processedValue.substring(0, 64);
        }

        const validPattern = /^[a-zA-Z0-9_]*$/;

        if (!validPattern.test(processedValue)) {
            processedValue = processedValue.replace(/[^a-zA-Z0-9_]/g, '');
        }

        if (originalValue !== processedValue) {
            setError(validationMessage);
        } else {
            setError('');
        }


        const value = processedValue;
        if (value === undefined || value === null) {
            devLog.warn('Invalid parameter value:', value);
            return;
        }

        setToolNameValue(processedValue);

        devLog.log('Calling onParameterChange...');
        if (typeof onParameterChange === 'function') {
            onParameterChange(id, paramId, value);
            devLog.log('onParameterChange completed successfully');
        } else {
            devLog.error('onParameterChange is not a function');
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

        // API 기반 파라미터인 경우 API 옵션 또는 단일 값을 사용, 아니면 기본 옵션 사용
        let effectiveOptions = param.options || [];
        let isLoadingOptions = false;
        let apiSingleValue = null;

        if (isApiParam) {
            effectiveOptions = apiOptions[paramKey] || [];
            isLoadingOptions = loadingApiOptions[paramKey] || false;
            apiSingleValue = apiSingleValues[paramKey];
        }

        // API에서 단일 값을 로드한 경우 input으로 렌더링
        const shouldRenderAsInput = isApiParam && apiSingleValue !== undefined;

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
                    {isApiParam && (
                        <button
                            className={`${styles.refreshButton} ${isLoadingOptions ? styles.loading : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                refreshApiOptions(param);
                            }}
                            disabled={isLoadingOptions}
                            title="Refresh options"
                            type="button"
                        >
                            <LuRefreshCw />
                        </button>
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
                    // handle_id가 true인 경우에는 일반 파라미터 value 렌더링
                    <input
                        type="text"
                        value={param.value || ''}
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
                    />
                ) : shouldRenderAsInput ? (
                    // API에서 단일 값을 로드한 경우 input으로 렌더링
                    <input
                        type="text"
                        value={param.value !== undefined && param.value !== null ? param.value : (apiSingleValue || '')}
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
                ) : (effectiveOptions.length > 0 || isApiParam) ? (
                    <select
                        value={param.value}
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

                            // API 파라미터이고 옵션이 없으면 다시 로드 시도
                            if (isApiParam && effectiveOptions.length === 0 && !isLoadingOptions) {
                                loadApiOptions(param);
                            }
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
                ) : param.type === 'BOOL' ? (
                    <select
                        value={param.value}
                        onChange={(e) => {
                            devLog.log('=== Boolean Parameter Change ===');
                            devLog.log('Parameter:', param.name, 'Previous value:', param.value, 'New value:', e.target.value);
                            handleParamValueChange(e, param.id);
                            devLog.log('=== Boolean Parameter Change Complete ===');
                        }}
                        onMouseDown={(e) => {
                            devLog.log('boolean select onMouseDown');
                            e.stopPropagation();
                        }}
                        onClick={(e) => {
                            devLog.log('boolean select onClick');
                            e.stopPropagation();
                        }}
                        onFocus={(e) => {
                            devLog.log('boolean select onFocus - Parameter:', param.name, 'Current value:', param.value);
                            e.stopPropagation();
                            // Clear node selection when editing parameter
                            if (onClearSelection) {
                                onClearSelection();
                            }
                        }}
                        onBlur={(e) => {
                            devLog.log('boolean select onBlur - Parameter:', param.name, 'Final value:', e.target.value);
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
                    >
                        <option value="" disabled>-- Select --</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                ) : param.id === 'tool_name' ? (
                    <div className={styles.inputWrapper}>
                        <input
                            type={'text'}
                            value={tool_name}
                            onChange={(e) => handleToolNameChange(e, param.id)}
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
                            className={`${styles.paramInput} paramInput ${error ? styles.inputError : ''}`}
                            step={param.step}
                            min={param.min}
                            max={param.max}
                            maxLength={64}
                        />
                        {error && <div className={styles.errorMessage}>{error}</div>}
                    </div>
                ) : (param as any).expandable ? (
                    <div className={styles.expandableWrapper}>
                        <input
                            type="text"
                            value={param.value || ''}
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

        // 예측 노드인 경우 클릭 시 실제 노드로 변환하고 자동 연결
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

    const handleParamValueChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>, paramId: string): void => {
        devLog.log('=== Parameter Change Event ===');
        devLog.log('nodeId:', id, 'paramId:', paramId, 'value:', e.target.value);

        // Stop event propagation
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
    const hasParams = parameters && parameters.length > 0;
    const hasOnlyOutputs = hasOutputs && !hasInputs;

    // Node name display (add ... if over 20 characters)
    const displayName = nodeName.length > 25 ? nodeName.substring(0, 25) + '...' : nodeName;

    return (
        <>
            <div
                className={`${styles.node} ${isSelected ? styles.selected : ''} ${isPreview ? 'preview' : ''} ${isPredicted ? styles.predicted : ''}`}
                style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    opacity: isPredicted ? predictedOpacity : 1,
                    pointerEvents: isPredicted ? 'auto' : 'auto',
                    cursor: isPredicted ? 'pointer' : 'default'
                }}
                onMouseDown={handleMouseDown}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
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
                                                    onMouseDown={isPreview || isPredicted ? undefined : (e) => {
                                                        e.stopPropagation();
                                                        onPortMouseDown({
                                                            nodeId: id,
                                                            portId: portData.id,
                                                            portType: 'input',
                                                            isMulti: portData.multi,
                                                            type: portData.type
                                                        }, e);
                                                    }}
                                                    onMouseUp={isPreview || isPredicted ? undefined : (e) => {
                                                        e.stopPropagation();
                                                        onPortMouseUp({
                                                            nodeId: id,
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
                                                {portData.type === 'InputSchema' && !isPreview && !isPredicted && getConnectedSchemaProvider(id, portData.id) && (
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
                                                    ref={(el) => registerPortRef && registerPortRef(id, portData.id, 'output', el)}
                                                    className={portClasses}
                                                    onMouseDown={isPreview || isPredicted ? undefined : (e) => {
                                                        e.stopPropagation();
                                                        onPortMouseDown({
                                                            nodeId: id,
                                                            portId: portData.id,
                                                            portType: 'output',
                                                            isMulti: portData.multi,
                                                            type: portData.type
                                                        }, e);
                                                    }}
                                                    onMouseUp={isPreview || isPredicted ? undefined : (e) => {
                                                        e.stopPropagation();
                                                        onPortMouseUp({
                                                            nodeId: id,
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
                    )}
                    {hasParams && !isPredicted && (
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
        </>
    );
};

export default memo(Node);
