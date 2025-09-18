import React, { useCallback, useRef } from 'react';
import type { Parameter } from '@/app/canvas/types';
import { devLog } from '@/app/_common/utils/logger';
import { isNumberType, getParameterDisplayValue } from '../../utils/parameterUtils';
import styles from '@/app/canvas/assets/Node.module.scss';
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

    // 디바운싱을 위한 ref
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastValueRef = useRef<string | number | boolean | null>(null);

    const handleValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

            // 같은 값이면 처리하지 않음
            if (lastValueRef.current === value) {
                devLog.log('Same value, skipping update');
                return;
            }

            // 이전 타이머가 있으면 취소
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // 디바운스: 200ms 후에 실제 업데이트 실행
            debounceTimerRef.current = setTimeout(() => {
                devLog.log('Calling onParameterChange after debounce...');
                if (typeof onParameterChange === 'function') {
                    onParameterChange(nodeId, parameter.id, value);
                    lastValueRef.current = value;
                    devLog.log('onParameterChange completed successfully');
                } else {
                    devLog.error('onParameterChange is not a function');
                }
                debounceTimerRef.current = null;
            }, 200);

        } catch (error) {
            devLog.error('Error in handleValueChange:', error);
        }
        devLog.log('=== End Default Parameter Change ===');
    }, [nodeId, parameter.id, onParameterChange]);

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
