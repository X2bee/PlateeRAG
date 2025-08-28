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

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        devLog.log('=== API Parameter Change ===');
        devLog.log('Parameter:', parameter.name, 'Previous value:', parameter.value, 'New value:', e.target.value);
        devLog.log('Available options:', apiOptions);
        devLog.log('API single value:', apiSingleValue);

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
    const isStringType = parameter.type === 'string' || parameter.type === 'str';
    const hasOptions = apiOptions && apiOptions.length > 0;
    const hasSingleValue = apiSingleValue !== undefined;
    
    // Debug logging for value display
    devLog.log('ApiParameter render - name:', parameter.name, 'value:', parameter.value, 'type:', parameter.type);
    devLog.log('ApiParameter render - hasOptions:', hasOptions, 'hasSingleValue:', hasSingleValue, 'apiSingleValue:', apiSingleValue);
    
    // String type parameters should always use input field
    if (isStringType || (hasSingleValue && !hasOptions)) {
        return (
            <input
                type="text"
                value={parameter.value !== undefined && parameter.value !== null ? parameter.value.toString() : (apiSingleValue || '')}
                onChange={handleValueChange}
                {...eventHandlers}
                className={`${styles.paramInput} paramInput`}
                placeholder={apiSingleValue ? `Default: ${apiSingleValue}` : parameter.description || ''}
                draggable={false}
            />
        );
    }

    // Option type parameters should use dropdown select
    return (
        <select
            value={parameter.value !== undefined && parameter.value !== null ? parameter.value.toString() : ''}
            onChange={handleValueChange}
            onMouseDown={eventHandlers.onMouseDown}
            onFocus={eventHandlers.onFocus}
            onKeyDown={eventHandlers.onKeyDown}
            onDragStart={eventHandlers.onDragStart}
            onClick={(e) => {
                devLog.log('API select onClick');
                e.stopPropagation();
                // Try to load options again if empty and not loading
                if (apiOptions.length === 0 && !isLoading) {
                    // This would be handled by parent component
                }
            }}
            className={`${styles.paramSelect} paramSelect`}
            disabled={isLoading}
            draggable={false}
        >
            {isLoading ? (
                <option value="">Loading...</option>
            ) : apiOptions.length === 0 ? (
                // Show current saved value even if no options are loaded
                parameter.value && parameter.value !== '' ? (
                    <>
                        <option value="">-- Select --</option>
                        <option value={parameter.value}>
                            {parameter.value}
                        </option>
                    </>
                ) : (
                    <option value="">-- No options available --</option>
                )
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
    );
};