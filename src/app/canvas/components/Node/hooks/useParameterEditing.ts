import { useState } from 'react';
import type { Parameter } from '@/app/canvas/types';
import type { NodeProps } from '@/app/canvas/types';
import type { UseParameterEditingReturn } from '../types';

export const useParameterEditing = (): UseParameterEditingReturn => {
    const [editingHandleParams, setEditingHandleParams] = useState<Record<string, boolean>>({});
    const [editingHandleValues, setEditingHandleValues] = useState<Record<string, string>>({});

    const handleHandleParamClick = (param: Parameter, nodeId: string): void => {
        if (!param.handle_id) return;

        const paramKey = `${nodeId}-${param.id}`;
        setEditingHandleParams(prev => ({ ...prev, [paramKey]: true }));
        setEditingHandleValues(prev => ({
            ...prev,
            [paramKey]: (param.name && param.name.toString().trim()) || ""
        }));
    };

    const handleHandleParamChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        param: Parameter,
        nodeId: string
    ): void => {
        const paramKey = `${nodeId}-${param.id}`;
        setEditingHandleValues(prev => ({ ...prev, [paramKey]: e.target.value }));
    };

    const handleHandleParamKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        param: Parameter
    ): void => {
        if (e.key === 'Enter') {
            e.preventDefault();
        } else if (e.key === 'Escape') {
            e.preventDefault();
        }
        e.stopPropagation();
    };

    const handleHandleParamSubmit = (
        param: Parameter,
        nodeId: string,
        onParameterNameChange?: NodeProps['onParameterNameChange']
    ): void => {
        const paramKey = `${nodeId}-${param.id}`;
        const trimmedValue = editingHandleValues[paramKey]?.trim() || '';
        const finalValue = trimmedValue; // Don't use param.id as fallback

        if (finalValue !== param.name && onParameterNameChange) {
            // Change name (both id and name)
            onParameterNameChange(nodeId, param.id, finalValue);
        }

        setEditingHandleParams(prev => ({ ...prev, [paramKey]: false }));
    };

    const handleHandleParamCancel = (param: Parameter, nodeId: string): void => {
        const paramKey = `${nodeId}-${param.id}`;
        setEditingHandleValues(prev => ({
            ...prev,
            [paramKey]: (param.name && param.name.toString().trim()) || ""
        }));
        setEditingHandleParams(prev => ({ ...prev, [paramKey]: false }));
    };

    const handleHandleParamBlur = (
        param: Parameter,
        nodeId: string,
        onParameterNameChange?: NodeProps['onParameterNameChange']
    ): void => {
        handleHandleParamSubmit(param, nodeId, onParameterNameChange);
    };

    return {
        editingHandleParams,
        editingHandleValues,
        handleHandleParamClick,
        handleHandleParamChange,
        handleHandleParamKeyDown,
        handleHandleParamSubmit,
        handleHandleParamCancel,
        handleHandleParamBlur
    };
};
