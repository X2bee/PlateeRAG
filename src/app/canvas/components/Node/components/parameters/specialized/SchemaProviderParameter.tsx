import React from 'react';
import { LuX } from 'react-icons/lu';
import styles from '@/app/canvas/assets/Node.module.scss';
import { createCommonEventHandlers } from '../../../utils/nodeUtils';
import type { Parameter } from '@/app/canvas/types';
import { devLog } from '@/app/_common/utils/logger';

interface SchemaProviderParameterProps {
    id: string;
    parameter: Parameter;
    descriptionParameter?: Parameter;
    nodeId: string;
    isEditing: boolean;
    editingValue: string;
    onParameterChange: (nodeId: string, paramId: string, value: string) => void;
    onStartEdit: () => void;
    onChangeEdit: (value: string) => void;
    onSubmitEdit: () => void;
    onCancelEdit: () => void;
    onParameterDelete?: (nodeId: string, paramId: string) => void;
    onClearSelection?: () => void;
    onOpenNodeModal?: (nodeId: string, paramId: string, paramName: string, value: string) => void;
    isPreview?: boolean;
}

export const SchemaProviderParameter: React.FC<SchemaProviderParameterProps> = ({
    id,
    parameter,
    descriptionParameter,
    nodeId,
    isEditing,
    editingValue,
    onParameterChange,
    onStartEdit,
    onChangeEdit,
    onSubmitEdit,
    onCancelEdit,
    onParameterDelete,
    onClearSelection,
    onOpenNodeModal,
    isPreview = false
}) => {
    const eventHandlers = createCommonEventHandlers(onClearSelection);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const value = e.target.value;
        if (value === undefined || value === null) return;

        if (typeof onParameterChange === 'function') {
            onParameterChange(nodeId, parameter.id, value);
        }
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!descriptionParameter) return;

        const value = e.target.value;
        if (value === undefined || value === null) return;

        if (typeof onParameterChange === 'function') {
            onParameterChange(nodeId, descriptionParameter.id, value);
        }
    };

    const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChangeEdit(e.target.value);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSubmitEdit();
        } else if (e.key === 'Escape') {
            onCancelEdit();
        }
        e.stopPropagation();
    };

    const handleNameBlur = () => {
        onSubmitEdit();
    };

    // Render main value input (select or input based on options)
    const renderValueInput = () => {
        const effectiveOptions = parameter.options || [];

        if (effectiveOptions.length > 0) {
            return (
                <select
                    value={parameter.value !== undefined && parameter.value !== null ? parameter.value.toString() : ''}
                    onChange={handleValueChange}
                    {...eventHandlers}
                    className={`${styles.paramSelect} paramSelect`}
                >
                    <option value="">-- Select --</option>
                    {effectiveOptions.map((option, index) => (
                        <option key={index} value={option.value}>
                            {option.label || option.value}
                        </option>
                    ))}
                </select>
            );
        } else {
            return (
                <input
                    type="text"
                    value={parameter.value !== undefined && parameter.value !== null ? parameter.value.toString() : ''}
                    onChange={handleValueChange}
                    {...eventHandlers}
                    draggable={false}
                    className={`${styles.paramInput} paramInput`}
                    placeholder="Value"
                />
            );
        }
    };

    // Render description input
    const renderDescriptionInput = () => {
        if (!descriptionParameter) return null;

        if (descriptionParameter.expandable) {
            return (
                <div className={styles.expandableWrapper}>
                    <input
                        type="text"
                        value={descriptionParameter.value?.toString() || ''}
                        onChange={handleDescriptionChange}
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
                                onOpenNodeModal(nodeId, descriptionParameter.id, descriptionParameter.name, String(descriptionParameter.value || ''));
                            }
                        }}
                        type="button"
                        title="Expand to edit"
                        style={{ marginTop: '4px' }}
                    >
                        ⧉
                    </button>
                </div>
            );
        } else {
            return (
                <input
                    type="text"
                    value={descriptionParameter.value?.toString() || ''}
                    onChange={handleDescriptionChange}
                    {...eventHandlers}
                    draggable={false}
                    className={`${styles.paramInput} paramInput`}
                    placeholder="Description"
                    style={{ marginTop: '4px' }}
                />
            );
        }
    };

    return (
        <>
            {/* Parameter Name (editable) */}
            <span className={`${styles.paramKey} ${parameter.required ? styles.required : ''}`}>
                {isEditing ? (
                    <input
                        type="text"
                        value={editingValue}
                        onChange={handleNameInputChange}
                        onKeyDown={handleNameKeyDown}
                        onBlur={handleNameBlur}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={onStartEdit}
                        className={styles.nodeName}
                        style={{ cursor: isPreview ? 'default' : 'pointer' }}
                    >
                        {parameter.name && parameter.name.toString().trim() ? parameter.name : '<empty>'}
                    </span>
                )}

                {/* Delete button for added parameters */}
                {parameter.is_added && !isPreview && onParameterDelete && (
                    <button
                        className={styles.deleteParameterButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            onParameterDelete(nodeId, parameter.id);
                        }}
                        type="button"
                        title="Delete parameter"
                    >
                        <LuX />
                    </button>
                )}
            </span>

            {/* Double Input Wrapper: Value + Description */}
            <div className={styles.doubleInputWrapper || `${styles.paramInput} doubleInputWrapper`}>
                {renderValueInput()}
                {renderDescriptionInput()}
            </div>
        </>
    );
};
