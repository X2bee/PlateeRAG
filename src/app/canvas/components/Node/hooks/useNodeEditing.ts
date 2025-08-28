import { useState, useEffect } from 'react';
import type { NodeProps } from '@/app/canvas/types';
import type { UseNodeEditingReturn } from '../types';

export const useNodeEditing = (initialNodeName: string): UseNodeEditingReturn => {
    const [isEditingName, setIsEditingName] = useState<boolean>(false);
    const [editingName, setEditingName] = useState<string>(initialNodeName);

    // Sync editingName when nodeName changes
    useEffect(() => {
        setEditingName(initialNodeName);
    }, [initialNodeName]);

    const handleNameDoubleClick = (
        e: React.MouseEvent,
        nodeName: string,
        isPreview?: boolean
    ): void => {
        if (isPreview) return;
        e.stopPropagation();
        setIsEditingName(true);
        setEditingName(nodeName);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setEditingName(e.target.value);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            e.preventDefault();
        } else if (e.key === 'Escape') {
            e.preventDefault();
        }
    };

    const handleNameSubmit = (
        nodeId: string,
        nodeName: string,
        onNodeNameChange?: NodeProps['onNodeNameChange']
    ): void => {
        const trimmedName = editingName.trim();
        if (trimmedName && trimmedName !== nodeName && onNodeNameChange) {
            onNodeNameChange(nodeId, trimmedName);
        } else {
            // Restore original value if no changes or empty string
            setEditingName(nodeName);
        }
        setIsEditingName(false);
    };

    const handleNameCancel = (nodeName: string): void => {
        setEditingName(nodeName);
        setIsEditingName(false);
    };

    const handleNameBlur = (
        nodeId: string,
        nodeName: string,
        onNodeNameChange?: NodeProps['onNodeNameChange']
    ): void => {
        handleNameSubmit(nodeId, nodeName, onNodeNameChange);
    };

    return {
        isEditingName,
        editingName,
        handleNameDoubleClick,
        handleNameChange,
        handleNameKeyDown,
        handleNameSubmit,
        handleNameCancel,
        handleNameBlur
    };
};