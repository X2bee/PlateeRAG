'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getNodes as apiGetNodes,
    exportNodes as apiExportNodes,
    refreshNodes as apiRefreshNodes
} from '@/app/api/nodeAPI';
import { toast } from 'react-hot-toast';

// Type definitions
interface Port {
    id: string;
    name: string;
    type: string;
    required?: boolean;
    multi?: boolean;
}

interface Parameter {
    id: string;
    name: string;
    value: string | number;
    type?: string;
    required?: boolean;
    optional?: boolean;
    options?: Array<{ value: string | number; label?: string }>;
    step?: number;
    min?: number;
    max?: number;
}

interface NodeData {
    id: string;
    nodeName: string;
    functionId?: string;
    inputs?: Port[];
    outputs?: Port[];
    parameters?: Parameter[];
}

interface NodeFunction {
    functionId: string;
    functionName: string;
    nodes?: NodeData[];
}

interface NodeCategory {
    categoryId: string;
    categoryName: string;
    icon: string;
    functions?: NodeFunction[];
}

interface UseNodesReturn {
    nodes: NodeCategory[];
    isLoading: boolean;
    error: string | null;
    refreshNodes: () => Promise<void>;
    exportAndRefreshNodes: () => Promise<void>;
}

/**
 * 노드 데이터를 관리하는 재사용 가능한 Custom Hook입니다.
 */
export const useNodes = (): UseNodesReturn => {
    const [nodes, setNodes] = useState<NodeCategory[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const refreshNodes = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiGetNodes();
            setNodes(data as NodeCategory[]);
        } catch (err: any) {
            const errorMessage = err?.message || '데이터를 불러오는 데 실패했습니다.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const exportAndRefreshNodes = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiRefreshNodes();
            setNodes(data as NodeCategory[]);
            toast.success('노드 목록 새로고침 완료!');
        } catch (err: any) {
            const errorMessage = err?.message || '새로고침에 실패했습니다.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshNodes();
    }, [refreshNodes]);

    return { nodes, isLoading, error, refreshNodes, exportAndRefreshNodes };
};
