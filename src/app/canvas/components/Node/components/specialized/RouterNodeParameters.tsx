import React, { useState } from 'react';
import styles from '@/app/canvas/assets/Node.module.scss';
import { separateParameters } from '../../utils/parameterUtils';
import { useParameterEditing } from '../../hooks/useParameterEditing';
import type { NodeParametersProps } from '../../types';
import type { Parameter } from '@/app/canvas/types';

export const RouterNodeParameters: React.FC<NodeParametersProps> = ({
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
    const [hoveredParam, setHoveredParam] = useState<string | null>(null);

    const { basicParameters, advancedParameters, hasAdvancedParams } = separateParameters(parameters);
    const paramEditingHook = useParameterEditing();

    const renderParameter = (param: Parameter) => {
        const paramKey = `${nodeId}-${param.id}`;

        // Regular parameters (same as SchemaProvider but without handle_id logic)
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
