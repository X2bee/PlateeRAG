import React from 'react';
import styles from '@/app/canvas/assets/Node.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import { createCommonEventHandlers } from '../../utils/nodeUtils';
import type { ApiParameterProps } from '../../types';

export const ApiParameter: React.FC<ApiParameterProps> = ({
    parameter,
    nodeId,
    apiOptions,
    isLoading,
    apiSingleValue,
    onParameterChange,
    onClearSelection
}) => {
    const eventHandlers = createCommonEventHandlers(onClearSelection);
    const numberList = ['INT', 'FLOAT', 'NUMBER', 'INTEGER'];

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

        e.preventDefault();
        e.stopPropagation();

        const value = e.target.value;
        if (value === undefined || value === null) {
            devLog.warn('Invalid parameter value:', value);
            return;
        }

        if (typeof onParameterChange === 'function') {
            onParameterChange(nodeId, parameter.id, value);
            devLog.log('onParameterChange completed successfully');
        } else {
            devLog.error('onParameterChange is not a function');
        }
        devLog.log('=== API Parameter Change Complete ===');
    };

    // Determine if this should be rendered as input or select
    const hasOptions = apiOptions && apiOptions.length > 0;
    const hasSingleValue = apiSingleValue !== undefined; 

    // Option type parameters should use dropdown select
    return (
        hasSingleValue ? (
            <input
                type="text"
                value={parameter.value !== undefined && parameter.value !== null ? parameter.value.toString() : (apiSingleValue || '')}
                onChange={handleValueChange}
                {...eventHandlers}
                className={`${styles.paramInput} paramInput`}
                placeholder={apiSingleValue ? `Default: ${apiSingleValue}` : ''}
                draggable={false}
            />
        ) : hasOptions ? (
            <select
                value={parameter.value !== undefined && parameter.value !== null ? parameter.value.toString() : ''}
                onChange={handleValueChange}
                {...eventHandlers}
                draggable={false}
                className={`${styles.paramSelect} paramSelect`}
                disabled={isLoading}
            >
                {isLoading ? (
                    <option value="">Loading...</option>
                ) : apiOptions.length === 0 ? (
                    <option value="">-- No options available --</option>
                ) : (
                    <>
                        <option value="">-- Select --</option>
                        {apiOptions.map((option, index) => (
                            <option key={index} value={option.value}>
                                {option.label || option.value}
                            </option>
                        ))}
                    </>
                )}
            </select>
        ) : (<input
                type={parameter.type && numberList.includes(parameter.type) ? 'number' : 'text'}
                value={(parameter.value !== undefined && parameter.value !== null) ? parameter.type === 'STR' ? parameter.value.toString(): parseFloat(parameter.value.toString()): ''}
                onChange={handleValueChange}
                {...eventHandlers}
                draggable={false}
                className={`${styles.paramInput} paramInput`}
                step={parameter.step}
                min={parameter.min}
                max={parameter.max}
        />)
    );
};