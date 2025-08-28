import React, { useState } from 'react';
import { LuPlus } from 'react-icons/lu';
import styles from '@/app/canvas/assets/Node.module.scss';
import { separateParameters, detectParameterType, createCustomParameter } from '../utils/parameterUtils';
import { useApiParameters } from '../hooks/useApiParameters';
import { useParameterEditing } from '../hooks/useParameterEditing';
import type { NodeParametersProps } from '../types';

// Parameter components
import { ApiParameter } from './parameters/ApiParameter';
import { HandleParameter } from './parameters/HandleParameter';
import { BooleanParameter } from './parameters/BooleanParameter';
import { ToolNameParameter } from './parameters/ToolNameParameter';
import { ExpandableParameter } from './parameters/ExpandableParameter';
import { DefaultParameter } from './parameters/DefaultParameter';

export const NodeParameters: React.FC<NodeParametersProps> = ({
    nodeId,
    nodeDataId,
    parameters,
    isPreview = false,
    isPredicted = false,
    onParameterChange,
    onParameterNameChange,
    onParameterAdd,
    onParameterDelete,
    onClearSelection,
    onOpenNodeModal,
    showAdvanced,
    onToggleAdvanced
}) => {
    const [toolNameError, setToolNameError] = useState('');
    const [hoveredParam, setHoveredParam] = useState<string | null>(null);

    const { basicParameters, advancedParameters, hasAdvancedParams } = separateParameters(parameters);
    
    // Custom hooks
    const apiParamsHook = useApiParameters(nodeDataId, nodeId, parameters, onParameterChange);
    const paramEditingHook = useParameterEditing();

    const handleAddCustomParameter = (): void => {
        if (isPreview || !onParameterAdd) return;
        
        const newParameter = createCustomParameter();
        onParameterAdd(nodeId, newParameter);
    };

    const renderParameter = (param: any) => {
        const parameterType = detectParameterType(param);
        const paramKey = `${nodeId}-${param.id}`;

        const baseProps = {
            id: param.id,
            parameter: param,
            nodeId,
            onParameterChange,
            onClearSelection,
            isPreview
        };

        // Parameter name with description tooltip
        const parameterLabel = (
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
                {param.name}
            </span>
        );

        const renderParameterInput = () => {
            switch (parameterType) {
                case 'api': {
                    const apiOptions = apiParamsHook.apiOptions[paramKey] || [];
                    const isLoading = apiParamsHook.loadingApiOptions[paramKey] || false;
                    const apiSingleValue = apiParamsHook.apiSingleValues[paramKey];
                    
                    return (
                        <ApiParameter
                            {...baseProps}
                            apiOptions={apiOptions}
                            isLoading={isLoading}
                            apiSingleValue={apiSingleValue}
                            onRefreshOptions={() => apiParamsHook.refreshApiOptions(param, nodeId)}
                        />
                    );
                }
                
                case 'handle': {
                    const isEditing = paramEditingHook.editingHandleParams[paramKey] || false;
                    const editingValue = paramEditingHook.editingHandleValues[paramKey] || '';
                    
                    return (
                        <HandleParameter
                            {...baseProps}
                            isEditing={isEditing}
                            editingValue={editingValue}
                            onStartEdit={() => paramEditingHook.handleHandleParamClick(param, nodeId)}
                            onChangeEdit={(value) => {
                                const event = { target: { value } } as React.ChangeEvent<HTMLInputElement>;
                                paramEditingHook.handleHandleParamChange(event, param, nodeId);
                            }}
                            onSubmitEdit={() => paramEditingHook.handleHandleParamSubmit(param, nodeId, onParameterNameChange)}
                            onCancelEdit={() => paramEditingHook.handleHandleParamCancel(param, nodeId)}
                            onParameterNameChange={onParameterNameChange}
                            onParameterDelete={onParameterDelete}
                        />
                    );
                }
                
                case 'boolean':
                    return <BooleanParameter {...baseProps} />;
                    
                case 'tool_name':
                    return (
                        <ToolNameParameter
                            {...baseProps}
                            error={toolNameError}
                            onValidationError={setToolNameError}
                        />
                    );
                    
                case 'expandable':
                    return (
                        <ExpandableParameter
                            {...baseProps}
                            onOpenModal={onOpenNodeModal}
                        />
                    );
                    
                default:
                    return <DefaultParameter {...baseProps} />;
            }
        };

        return (
            <div key={param.id} className={`${styles.param} param`}>
                {parameterType !== 'handle' && parameterLabel}
                {renderParameterInput()}
            </div>
        );
    };

    if (!parameters || parameters.length === 0 || isPredicted) {
        return null;
    }

    return (
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
            
            {/* Basic Parameters */}
            {basicParameters.map(param => renderParameter(param))}
            
            {/* Advanced Parameters */}
            {hasAdvancedParams && (
                <div className={styles.advancedParams}>
                    <div className={styles.advancedHeader} onClick={onToggleAdvanced}>
                        <span>Advanced {showAdvanced ? '▲' : '▼'}</span>
                    </div>
                    {showAdvanced && advancedParameters.map(param => renderParameter(param))}
                </div>
            )}
        </div>
    );
};