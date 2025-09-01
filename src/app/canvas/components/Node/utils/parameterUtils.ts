import type { Parameter, ParameterOption } from '@/app/canvas/types';
import type { ParameterType, ParameterRenderOptions } from '../types';

// Parameter type detection utilities
export const detectParameterType = (param: Parameter): ParameterType => {
    if (param.is_api && param.api_name) return 'api';
    if (param.handle_id === true) return 'handle';
    if (param.type && ['BOOL', 'BOOLEAN', 'TRUE', 'FALSE', 'bool'].includes(param.type)) return 'boolean';
    if (param.id === 'tool_name') return 'tool_name';
    if ((param as any).expandable) return 'expandable';
    return 'default';
};

// Parameter classification utilities
export const isNumberType = (type?: string): boolean => {
    if (!type) return false;
    return ['INT', 'FLOAT', 'NUMBER', 'INTEGER'].includes(type);
};

export const isBooleanType = (type?: string): boolean => {
    if (!type) return false;
    return ['BOOL', 'BOOLEAN', 'TRUE', 'FALSE', 'bool'].includes(type);
};

// Parameter filtering utilities
export const separateParameters = (parameters?: Parameter[]) => {
    const basicParameters = parameters?.filter(param => !param.optional) || [];
    const advancedParameters = parameters?.filter(param => param.optional) || [];
    const hasAdvancedParams = advancedParameters.length > 0;
    
    return { basicParameters, advancedParameters, hasAdvancedParams };
};

// Parameter rendering utilities
export const getParameterRenderOptions = (
    param: Parameter,
    nodeId: string,
    apiOptions: Record<string, ParameterOption[]>,
    loadingApiOptions: Record<string, boolean>,
    apiSingleValues: Record<string, string>,
    editingHandleParams: Record<string, boolean>
): ParameterRenderOptions => {
    const paramKey = `${nodeId}-${param.id}`;
    const isApiParam = param.is_api && !!param.api_name;
    const isHandleParam = param.handle_id === true;
    const isEditingHandle = editingHandleParams[paramKey] || false;
    
    // API-based parameter uses API options or single value, otherwise use default options
    let effectiveOptions = param.options || [];
    let isLoadingOptions = false;
    let apiSingleValue = undefined;
    
    if (isApiParam) {
        effectiveOptions = apiOptions[paramKey] || [];
        isLoadingOptions = loadingApiOptions[paramKey] || false;
        apiSingleValue = apiSingleValues[paramKey];
    }
    
    // Should render as input if API loaded single value
    const shouldRenderAsInput = isApiParam && apiSingleValue !== undefined;
    
    return {
        paramKey,
        isApiParam,
        isHandleParam,
        isEditingHandle,
        effectiveOptions,
        isLoadingOptions,
        apiSingleValue,
        shouldRenderAsInput
    };
};

// Tool name validation
export const validateToolName = (value: string): { isValid: boolean; error?: string } => {
    const validationMessage = 'Maximum 64 characters, English letters (a-z, A-Z), numbers (0-9), underscore (_)';
    
    if (value.length > 64) {
        return { isValid: false, error: validationMessage };
    }
    
    const validPattern = /^[a-zA-Z0-9_]*$/;
    if (!validPattern.test(value)) {
        return { isValid: false, error: validationMessage };
    }
    
    return { isValid: true };
};

// Process tool name value
export const processToolNameValue = (value: string): string => {
    let processedValue = value;
    
    if (processedValue.length > 64) {
        processedValue = processedValue.substring(0, 64);
    }
    
    const validPattern = /^[a-zA-Z0-9_]*$/;
    if (!validPattern.test(processedValue)) {
        processedValue = processedValue.replace(/[^a-zA-Z0-9_]/g, '');
    }
    
    return processedValue;
};

// Parameter value conversion utilities
export const convertParameterValue = (
    value: string,
    param: Parameter
): string | number | boolean => {
    // For boolean parameters, convert to actual boolean
    if (isBooleanType(param.type)) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    }
    
    // For number parameters, try to parse as number
    if (isNumberType(param.type)) {
        const numValue = parseFloat(value);
        return isNaN(numValue) ? value : numValue;
    }
    
    return value;
};

// Create new custom parameter
export const createCustomParameter = (): Parameter => {
    // Generate random 10-character suffix
    const randomSuffix = Math.random().toString(36).substring(2, 12).padEnd(10, '0');
    const uniqueId = `key_${randomSuffix}`;
    
    return {
        id: uniqueId,
        name: "**kwargs",
        type: "STR",
        value: "value",
        handle_id: true,
        is_added: true
    };
};

// Parameter display utilities
export const getParameterDisplayValue = (param: Parameter, apiSingleValue?: string): string => {
    if (param.value !== undefined && param.value !== null) {
        if (param.type === 'STR') {
            return param.value.toString();
        }
        return parseFloat(param.value.toString()).toString();
    }
    
    if (apiSingleValue !== undefined) {
        return apiSingleValue;
    }
    
    return '';
};

// Parameter placeholder utilities
export const getParameterPlaceholder = (param: Parameter, apiSingleValue?: string): string => {
    if (apiSingleValue) {
        return `Default: ${apiSingleValue}`;
    }
    return '';
};