import React, { useState } from 'react';
import { LuPlus } from 'react-icons/lu';
import styles from '@/app/canvas/assets/Node.module.scss';
import { separateParameters } from '../../utils/parameterUtils';
import { useParameterEditing } from '../../hooks/useParameterEditing';
import type { NodeParametersProps } from '../../types';
import type { Parameter } from '@/app/canvas/types';
import { SchemaProviderParameter } from '../parameters/specialized/SchemaProviderParameter';
import { ExpandableParameter } from '../parameters/ExpandableParameter';

export const SchemaProviderNodeParameters: React.FC<NodeParametersProps> = ({
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
    , currentNodes, currentEdges
}) => {
    const [hoveredParam, setHoveredParam] = useState<string | null>(null);

    // Determine connected target node (e.g., API Calling Tool) to decide visibility of body-related params
    let methodUpper: string | null = null;
    try {
        if (currentEdges && currentNodes) {
            // find any edge that connects to this SchemaProvider node and locate the other node (API node)
            const connectedEdge = currentEdges.find((edge: any) =>
                (edge.source?.nodeId === nodeId) || (edge.target?.nodeId === nodeId)
            );

            if (connectedEdge) {
                let otherNodeId = null;
                if (connectedEdge.source?.nodeId === nodeId) otherNodeId = connectedEdge.target?.nodeId;
                else if (connectedEdge.target?.nodeId === nodeId) otherNodeId = connectedEdge.source?.nodeId;

                if (otherNodeId) {
                    const otherNode = currentNodes.find((n: any) => n.id === otherNodeId);
                    if (otherNode && otherNode.data && otherNode.data.parameters) {
                        const methodParam = otherNode.data.parameters.find((p: any) => (p.id && ['method', 'http_method', 'api_method'].includes(String(p.id).toLowerCase())) || (p.name && String(p.name).toLowerCase().includes('method')));
                        if (methodParam && methodParam.value !== undefined && methodParam.value !== null) {
                            methodUpper = String(methodParam.value).toUpperCase();
                        }
                    }
                }
            }
        }
    } catch (e) {
        // ignore
    }

    // Determine explicit body_type parameter on this SchemaProvider node (JSON or FORM)
    const bodyTypeParam = (parameters || []).find((p: Parameter) => p.id === 'body_type');
    const bodyTypeValue = bodyTypeParam && bodyTypeParam.value ? String(bodyTypeParam.value).toUpperCase() : null;

    // Filter parameters based on methodUpper and bodyTypeValue
    const effectiveParameters = (parameters || []).filter((p: Parameter) => {
        // Always hide legacy 'as_form' parameter if present
        if (p.id === 'as_form') return false;
        // If API method is GET, hide body helpers and body type selector
        if (methodUpper === 'GET') {
            if (p.id === 'request_body_editor' || p.id === 'request_body_note' || p.id === 'body_type' || p.id.endsWith('_body')) return false;
        }

        // If SchemaProvider is configured for FORM body, hide JSON editor and note
        if (bodyTypeValue === 'FORM') {
            if (p.id === 'request_body_editor' || p.id === 'request_body_note') return false;
        }

        // If SchemaProvider is configured for JSON body, hide as_form toggle
        // no as_form handling here; body_type drives behavior

        return true;
    });

    const { basicParameters, advancedParameters, hasAdvancedParams } = separateParameters(effectiveParameters);
    const paramEditingHook = useParameterEditing();

    // Handle custom parameter addition for SchemaProvider
    const handleAddCustomParameter = (): void => {
        if (isPreview || !onParameterAdd) return;

        const randomSuffix = Math.random().toString(36).substring(2, 12).padEnd(10, '0');
        const uniqueId = `key_${randomSuffix}`;

        // Main parameter
        const mainParameter: Parameter = {
            id: uniqueId,
            name: "**kwargs",
            type: "STR",
            value: "value",
            handle_id: true,
            is_added: true,
            options: [
                { value: 'str', label: 'STRING'},
                { value: 'int', label: 'INTEGER'},
                { value: 'float', label: 'FLOAT'},
                { value: 'bool', label: 'BOOLEAN' }
            ]
        };

        // Description parameter
        const descriptionParameter: Parameter = {
            id: `${uniqueId}_description`,
            name: "**kwargs_description",
            type: "STR",
            value: "description",
            handle_id: false,
            is_added: true,
            expandable: true,
        };

        onParameterAdd(nodeId, mainParameter);
        onParameterAdd(nodeId, descriptionParameter);
    };

    // Handle parameter deletion for SchemaProvider (with linked description)
    const handleDeleteParameter = (deleteNodeId: string, paramId: string): void => {
        if (isPreview || !onParameterDelete) return;

        onParameterDelete(deleteNodeId, paramId);

        // Delete linked description parameter
        const param = parameters?.find((p: Parameter) => p.id === paramId);
        if (param && param.handle_id && param.is_added) {
            const descriptionParamId = `${paramId}_description`;
            const descriptionParam = parameters?.find((p: Parameter) => p.id === descriptionParamId);
            if (descriptionParam) {
                onParameterDelete(deleteNodeId, descriptionParamId);
            }
        }
    };

    // Enhanced parameter name change handler for SchemaProvider
    const handleParameterNameChange = (nodeId: string, paramId: string, newName: string): void => {
        if (!onParameterNameChange) return;

        // Update main parameter name
        onParameterNameChange(nodeId, paramId, newName);

        // Update linked description parameter name
        const param = parameters?.find((p: Parameter) => p.id === paramId);
        if (param && param.handle_id && param.is_added) {
            const descriptionParamId = `${paramId}_description`;
            const descriptionParamName = `${newName}_description`;
            const descriptionParam = parameters?.find((p: Parameter) => p.id === descriptionParamId);

            if (descriptionParam && onParameterNameChange) {
                onParameterNameChange(nodeId, descriptionParamId, descriptionParamName);
            }
        }
    };

    const renderParameter = (param: Parameter) => {
        const paramKey = `${nodeId}-${param.id}`;

        // Hide description parameters (they're handled by main parameters)
        if (param.is_added && param.id.endsWith('_description') && !param.handle_id) {
            return null;
        }

        // Find linked description parameter for handle_id parameters
        const descriptionParam = param.is_added && param.handle_id
            ? parameters?.find((p: Parameter) => p.id === `${param.id}_description`)
            : undefined;

        // Handle SchemaProvider specific parameters (handle_id params with description)
        if (param.handle_id === true && param.is_added) {
            const isEditing = paramEditingHook.editingHandleParams[paramKey] || false;
            const editingValue = paramEditingHook.editingHandleValues[paramKey] ??
                ((param.name && param.name.toString().trim()) || "");

            return (
                <div key={param.id} className={`${styles.param} param`}>
                    <SchemaProviderParameter
                        id={param.id}
                        parameter={param}
                        descriptionParameter={descriptionParam}
                        nodeId={nodeId}
                        isEditing={isEditing}
                        editingValue={editingValue}
                        onParameterChange={onParameterChange}
                        onStartEdit={() => paramEditingHook.handleHandleParamClick(param, nodeId)}
                        onChangeEdit={(value) => {
                            const event = { target: { value } } as React.ChangeEvent<HTMLInputElement>;
                            paramEditingHook.handleHandleParamChange(event, param, nodeId);
                        }}
                        onSubmitEdit={() => paramEditingHook.handleHandleParamSubmit(param, nodeId, handleParameterNameChange)}
                        onCancelEdit={() => paramEditingHook.handleHandleParamCancel(param, nodeId)}
                        onParameterDelete={handleDeleteParameter}
                        onClearSelection={onClearSelection}
                        onOpenNodeModal={onOpenNodeModal}
                        isPreview={isPreview}
                    />
                </div>
            );
        }

        // Expandable parameter (Request Body Editor) — show expand button/modal
        if ((param as any).expandable || param.id === 'request_body_editor') {
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
                        {param.name}
                    </span>
                    <ExpandableParameter
                        id={param.id}
                        parameter={param}
                        nodeId={nodeId}
                        onParameterChange={onParameterChange}
                        onOpenModal={onOpenNodeModal}
                        onClearSelection={onClearSelection}
                        isPreview={isPreview}
                    />
                </div>
            );
        }

        // Regular parameters (non-specialized)
        const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            e.preventDefault();
            e.stopPropagation();
            const value = e.target.value;
            if (typeof onParameterChange === 'function') {
                onParameterChange(nodeId, param.id, value);
            }
        };

        const renderParameterInput = () => {
            // Handle parameters with options (dropdown)
            if (param.options && param.options.length > 0) {
                return (
                    <select
                        value={param.value !== undefined && param.value !== null ? param.value.toString() : ''}
                        onChange={handleValueChange}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => {
                            e.stopPropagation();
                            if (onClearSelection) {
                                onClearSelection();
                            }
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        onDragStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        className={`${styles.paramSelect} paramSelect`}
                        draggable={false}
                    >
                        <option value="">-- Select --</option>
                        {param.options.map((option, index) => (
                            <option key={index} value={option.value}>
                                {option.label || option.value}
                            </option>
                        ))}
                    </select>
                );
            }

            // Regular input field
            return (
                <input
                    type="text"
                    value={param.value !== undefined && param.value !== null ? param.value.toString() : ''}
                    onChange={handleValueChange}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => {
                        e.stopPropagation();
                        if (onClearSelection) {
                            onClearSelection();
                        }
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    onDragStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    draggable={false}
                    className={`${styles.paramInput} paramInput`}
                />
            );
        };

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
                    {param.name}
                </span>

                {renderParameterInput()}
            </div>
        );
    };

    if (isPredicted) {
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
                    <div
                        className={styles.advancedHeader}
                        onClick={onToggleAdvanced}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                onToggleAdvanced(e as any);
                            }
                        }}
                        role="button"
                        tabIndex={0}
                    >
                        <span>Advanced {showAdvanced ? '▲' : '▼'}</span>
                    </div>
                    {showAdvanced && advancedParameters.map(param => renderParameter(param))}
                </div>
            )}
        </div>
    );
};
