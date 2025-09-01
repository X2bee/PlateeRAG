import React from 'react';
import styles from '@/app/canvas/assets/Node.module.scss';
import type { NodeHeaderProps } from '../types';

export const NodeHeader: React.FC<NodeHeaderProps> = ({
    nodeName,
    functionId,
    isEditingName,
    editingName,
    isPreview = false,
    onNameDoubleClick,
    onNameChange,
    onNameKeyDown,
    onNameBlur,
    onClearSelection
}) => {
    const handleInputMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleInputClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleInputFocus = (e: React.FocusEvent) => {
        e.stopPropagation();
        if (onClearSelection) {
            onClearSelection();
        }
    };

    const handleInputDragStart = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const displayName = nodeName.length > 25 ? nodeName.substring(0, 25) + '...' : nodeName;

    return (
        <div className={styles.header}>
            {isEditingName ? (
                <input
                    type="text"
                    value={editingName}
                    onChange={onNameChange}
                    onKeyDown={onNameKeyDown}
                    onBlur={onNameBlur}
                    onMouseDown={handleInputMouseDown}
                    onClick={handleInputClick}
                    onFocus={handleInputFocus}
                    onDragStart={handleInputDragStart}
                    draggable={false}
                    className={styles.nameInput}
                    autoFocus
                />
            ) : (
                <span onDoubleClick={onNameDoubleClick} className={styles.nodeName}>
                    {displayName}
                </span>
            )}
            {functionId && <span className={styles.functionId}>({functionId})</span>}
        </div>
    );
};