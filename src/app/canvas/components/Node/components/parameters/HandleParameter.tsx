import React from 'react';
import { LuX } from 'react-icons/lu';
import styles from '@/app/canvas/assets/Node.module.scss';
import { createCommonEventHandlers } from '../../utils/nodeUtils';
import type { HandleParameterProps } from '../../types';

export const HandleParameter: React.FC<HandleParameterProps> = ({
    id,
    parameter,
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
    isPreview = false
}) => {
    const eventHandlers = createCommonEventHandlers(onClearSelection);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const value = e.target.value;
        if (value === undefined || value === null) return;

        if (typeof onParameterChange === 'function') {
            onParameterChange(nodeId, parameter.id, value);
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

    return (
        <div>
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
                        {parameter.name && parameter.name.toString().trim() ? parameter.name : parameter.id}
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

            {/* Parameter Value */}
            <input
                type="text"
                value={parameter.value !== undefined && parameter.value !== null ? parameter.value.toString() : ''}
                onChange={handleValueChange}
                {...eventHandlers}
                className={`${styles.paramInput} paramInput`}
                draggable={false}
            />
        </div>
    );
};