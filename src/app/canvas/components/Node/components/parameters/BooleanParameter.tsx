import React from 'react';
import styles from '@/app/canvas/assets/Node.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import { createCommonEventHandlers } from '../../utils/nodeUtils';
import type { BooleanParameterProps } from '../../types';

export const BooleanParameter: React.FC<BooleanParameterProps> = ({
    id,
    parameter,
    nodeId,
    onParameterChange,
    onClearSelection,
    isPreview = false
}) => {
    const eventHandlers = createCommonEventHandlers(onClearSelection);

    const handleValueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        devLog.log('=== Boolean Parameter Change ===');
        devLog.log('Parameter:', parameter.name, 'Previous value:', parameter.value, 'New value:', e.target.value);

        // Convert to boolean value
        const booleanValue = e.target.value === 'true' ? true : e.target.value === 'false' ? false : e.target.value;

        // Call onParameterChange directly
        if (typeof onParameterChange === 'function') {
            onParameterChange(nodeId, parameter.id, booleanValue);
            devLog.log('Boolean value sent:', booleanValue, 'type:', typeof booleanValue);
        }

        devLog.log('=== Boolean Parameter Change Complete ===');
    };

    return (
        <select
            value={parameter.value !== undefined && parameter.value !== null ? parameter.value.toString() : ''}
            onChange={handleValueChange}
            {...eventHandlers}
            className={`${styles.paramSelect} paramSelect`}
            draggable={false}
        >
            <option value="" disabled>-- Select --</option>
            <option value="true">True</option>
            <option value="false">False</option>
        </select>
    );
};