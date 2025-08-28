import React from 'react';
import { LuRefreshCw } from 'react-icons/lu';
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
    onRefreshOptions,
    onClearSelection
}) => {
    const eventHandlers = createCommonEventHandlers(onClearSelection);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        devLog.log('=== API Parameter Change ===');
        devLog.log('Parameter:', parameter.name, 'Previous value:', parameter.value, 'New value:', e.target.value);
        devLog.log('Available options:', apiOptions);

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

    // Single value input
    if (apiSingleValue !== undefined) {
        return (
            <input
                type="text"
                value={parameter.value !== undefined && parameter.value !== null ? parameter.value.toString() : (apiSingleValue || '')}
                onChange={handleValueChange}
                {...eventHandlers}
                className={`${styles.paramInput} paramInput`}
                placeholder={apiSingleValue ? `Default: ${apiSingleValue}` : ''}
                draggable={false}
            />
        );
    }

    // Dropdown with refresh button
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
            <button
                className={`${styles.refreshButton} ${isLoading ? styles.loading : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onRefreshOptions();
                }}
                disabled={isLoading}
                title="Refresh options"
                type="button"
            >
                <LuRefreshCw />
            </button>
        </div>
    );
};