import React from 'react';
import styles from '@/app/canvas/assets/Node.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import { isNumberType, getParameterDisplayValue } from '../../utils/parameterUtils';
import { createCommonEventHandlers } from '../../utils/nodeUtils';
import type { DefaultParameterProps } from '../../types';

export const DefaultParameter: React.FC<DefaultParameterProps> = ({
    id,
    parameter,
    nodeId,
    onParameterChange,
    onClearSelection,
    isPreview = false
}) => {
    const eventHandlers = createCommonEventHandlers(onClearSelection);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        devLog.log('=== Default Parameter Change Event ===');
        devLog.log('nodeId:', nodeId, 'paramId:', parameter.id, 'value:', e.target.value);

        e.preventDefault();
        e.stopPropagation();

        try {
            const value = e.target.value;
            if (value === undefined || value === null) {
                devLog.warn('Invalid parameter value:', value);
                return;
            }

            devLog.log('Calling onParameterChange...');
            if (typeof onParameterChange === 'function') {
                onParameterChange(nodeId, parameter.id, value);
                devLog.log('onParameterChange completed successfully');
            } else {
                devLog.error('onParameterChange is not a function');
            }
        } catch (error) {
            devLog.error('Error in handleValueChange:', error);
        }
        devLog.log('=== End Default Parameter Change ===');
    };

    // Handle parameters with options (dropdown)
    if (parameter.options && parameter.options.length > 0) {
        return (
            <select
                value={parameter.value !== undefined && parameter.value !== null ? parameter.value.toString() : ''}
                onChange={handleValueChange}
                {...eventHandlers}
                className={`${styles.paramSelect} paramSelect`}
                draggable={false}
            >
                <option value="">-- Select --</option>
                {parameter.options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label || option.value}
                    </option>
                ))}
            </select>
        );
    }

    // Regular input field
    const inputType = isNumberType(parameter.type) ? 'number' : 'text';
    const inputValue = getParameterDisplayValue(parameter);

    return (
        <input
            type={inputType}
            value={inputValue}
            onChange={handleValueChange}
            {...eventHandlers}
            className={`${styles.paramInput} paramInput`}
            step={parameter.step}
            min={parameter.min}
            max={parameter.max}
            draggable={false}
        />
    );
};