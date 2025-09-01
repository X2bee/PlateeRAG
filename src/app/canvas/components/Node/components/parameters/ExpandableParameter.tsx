import React from 'react';
import styles from '@/app/canvas/assets/Node.module.scss';
import { createCommonEventHandlers } from '../../utils/nodeUtils';
import type { ExpandableParameterProps } from '../../types';

export const ExpandableParameter: React.FC<ExpandableParameterProps> = ({
    id,
    parameter,
    nodeId,
    onParameterChange,
    onOpenModal,
    onClearSelection,
    isPreview = false
}) => {
    const eventHandlers = createCommonEventHandlers(onClearSelection);

    const handleExpandClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onOpenModal) {
            onOpenModal(nodeId, parameter.id, parameter.name, String(parameter.value || ''));
        }
    };

    return (
        <div className={styles.expandableWrapper}>
            <input
                type="text"
                value={parameter.value !== undefined && parameter.value !== null ? parameter.value.toString() : ''}
                onChange={() => {}} // Read-only
                {...eventHandlers}
                className={`${styles.paramInput} paramInput`}
                readOnly
                placeholder="Click expand button to edit..."
                draggable={false}
            />
            <button
                className={styles.expandButton}
                onClick={handleExpandClick}
                type="button"
                title="Expand to edit"
            >
                ⧉
            </button>
        </div>
    );
};