import React from 'react';
import styles from '@/app/canvas/assets/Node.module.scss';
import type { NodeHeaderProps } from '../types';

export const NodeHeader: React.FC<NodeHeaderProps> = ({
    nodeName,
    functionId,
    isEditingName,
    editingName,
    isPreview = false,
    isExpanded = true,
    onNameDoubleClick,
    onNameChange,
    onNameKeyDown,
    onNameBlur,
    onClearSelection,
    onToggleExpanded
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

    const handleToggleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggleExpanded && !isPreview) {
            onToggleExpanded(e);
        }
    };

    const displayName = nodeName.length > 25 ? nodeName.substring(0, 25) + '...' : nodeName;

    return (
        <div className={styles.header}>
            <div className={styles.headerContent}>
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
            {!isPreview && onToggleExpanded && (
                <button
                    className={styles.toggleButton}
                    onClick={handleToggleClick}
                    title={isExpanded ? "축소" : "확대"}
                >
                    {isExpanded ? (
                        // 축소 아이콘: 아래쪽 화살표
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6,9 12,15 18,9"/>
                        </svg>
                    ) : (
                        // 확대 아이콘: 위쪽 화살표
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="18,15 12,9 6,15"/>
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
};
