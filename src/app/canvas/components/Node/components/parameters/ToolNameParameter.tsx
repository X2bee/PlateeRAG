import React from 'react';
import styles from '@/app/canvas/assets/Node.module.scss';
import { processToolNameValue, validateToolName } from '../../utils/parameterUtils';
import { createCommonEventHandlers } from '../../utils/nodeUtils';
import type { ToolNameParameterProps } from '../../types';

export const ToolNameParameter: React.FC<ToolNameParameterProps> = ({
    id,
    parameter,
    nodeId,
    error,
    onParameterChange,
    onValidationError,
    onClearSelection,
    isPreview = false
}) => {
    const eventHandlers = createCommonEventHandlers(onClearSelection);

    const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const originalValue = e.target.value;
        const processedValue = processToolNameValue(originalValue);
        
        const validation = validateToolName(processedValue);
        
        if (originalValue !== processedValue || !validation.isValid) {
            onValidationError(validation.error || 'Invalid input');
        } else {
            onValidationError('');
        }

        const value = processedValue;
        if (value === undefined || value === null) return;

        if (typeof onParameterChange === 'function') {
            onParameterChange(nodeId, parameter.id, value);
        }
    };

    return (
        <div className={styles.inputWrapper}>
            <input
                type="text"
                value={parameter.value !== undefined && parameter.value !== null ? parameter.value.toString() : ''}
                onChange={handleValueChange}
                {...eventHandlers}
                className={`${styles.paramInput} paramInput ${error ? styles.inputError : ''}`}
                maxLength={64}
                draggable={false}
            />
            {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
    );
};