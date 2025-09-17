import { useState, useEffect } from 'react';
import { fetchParameterOptions } from '@/app/api/parameterApi';
import { devLog } from '@/app/_common/utils/logger';
import type { Parameter, ParameterOption } from '@/app/canvas/types';
import type { UseApiParametersReturn } from '../types';

export const useApiParameters = (
    nodeDataId: string,
    nodeId: string,
    parameters?: Parameter[],
    onParameterChange?: (nodeId: string, paramId: string, value: string | number | boolean, skipHistory?: boolean) => void
): UseApiParametersReturn => {
    const [apiOptions, setApiOptions] = useState<Record<string, ParameterOption[]>>({});
    const [loadingApiOptions, setLoadingApiOptions] = useState<Record<string, boolean>>({});
    const [apiSingleValues, setApiSingleValues] = useState<Record<string, string>>({});

    const loadApiOptions = async (param: Parameter, nodeId: string) => {
        if (!param.is_api || !param.api_name || !nodeDataId) return;

        const paramKey = `${nodeId}-${param.id}`;

        // Skip if already loading, has options, or has single value
        if (loadingApiOptions[paramKey] || apiOptions[paramKey] || apiSingleValues[paramKey]) return;

        setLoadingApiOptions(prev => ({ ...prev, [paramKey]: true }));

        try {
            const options = await fetchParameterOptions(nodeDataId, param.api_name);

            // Check if it's a single value (first option has isSingleValue true)
            if (options.length === 1 && options[0].isSingleValue) {
                const singleValue = String(options[0].value);
                setApiSingleValues(prev => ({ ...prev, [paramKey]: singleValue }));

                if ((param.value === undefined || param.value === null || param.value === '') && onParameterChange) {
                    // API에서 받아온 값이므로 히스토리에 기록하지 않음
                    onParameterChange(nodeId, param.id, singleValue, true);
                }

                devLog.log('Single value loaded for parameter (skipHistory: true):', param.name, 'value:', singleValue);
            } else {
                // Array options case
                setApiOptions(prev => ({ ...prev, [paramKey]: options }));
                devLog.log('Options loaded for parameter:', param.name, 'count:', options.length);
            }
        } catch (error) {
            devLog.error('Error loading API options for parameter:', param.name, error);
        } finally {
            setLoadingApiOptions(prev => ({ ...prev, [paramKey]: false }));
        }
    };

    const refreshApiOptions = async (param: Parameter, nodeId: string) => {
        if (!param.is_api || !param.api_name || !nodeDataId) return;

        const paramKey = `${nodeId}-${param.id}`;

        // Skip if already loading
        if (loadingApiOptions[paramKey]) return;

        setLoadingApiOptions(prev => ({ ...prev, [paramKey]: true }));

        try {
            // Clear existing options and single values before reloading
            setApiOptions(prev => {
                const newOptions = { ...prev };
                delete newOptions[paramKey];
                return newOptions;
            });

            setApiSingleValues(prev => {
                const newValues = { ...prev };
                delete newValues[paramKey];
                return newValues;
            });

            const options = await fetchParameterOptions(nodeDataId, param.api_name);

            // Check if it's a single value (first option has isSingleValue true)
            if (options.length === 1 && options[0].isSingleValue) {
                const singleValue = String(options[0].value);
                setApiSingleValues(prev => ({ ...prev, [paramKey]: singleValue }));

                // Update parameter value to new API value (refresh는 API 호출이므로 히스토리에 기록하지 않음)
                if (onParameterChange) {
                    onParameterChange(nodeId, param.id, singleValue, true);
                }

                devLog.log('Single value refreshed for parameter (skipHistory: true):', param.name, 'value:', singleValue);
            } else {
                // Array options case
                setApiOptions(prev => ({ ...prev, [paramKey]: options }));
                devLog.log('Options refreshed for parameter:', param.name, 'count:', options.length);
            }
        } catch (error) {
            devLog.error('Error refreshing API options for parameter:', param.name, error);
        } finally {
            setLoadingApiOptions(prev => ({ ...prev, [paramKey]: false }));
        }
    };

    // Load API options on component mount for API parameters
    useEffect(() => {
        if (!parameters || !nodeDataId) return;

        parameters.forEach(param => {
            if (param.is_api && param.api_name) {
                loadApiOptions(param, nodeDataId);
            }
        });
    }, [parameters, nodeDataId]);

    return {
        apiOptions,
        loadingApiOptions,
        apiSingleValues,
        loadApiOptions,
        refreshApiOptions
    };
};
