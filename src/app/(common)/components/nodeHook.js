'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getNodes as apiGetNodes,
    exportNodes as apiExportNodes,
} from '@/app/api/nodeAPI';
import { toast } from 'react-hot-toast';

/**
 * 노드 데이터를 관리하는 재사용 가능한 Custom Hook입니다.
 * @returns {{
 * nodes: Array<Object>,
 * isLoading: boolean,
 * error: string|null,
 * refreshNodes: () => Promise<void>,
 * exportAndRefreshNodes: () => Promise<void>
 * }}
 */
export const useNodes = () => {
    const [nodes, setNodes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshNodes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiGetNodes();
            setNodes(data);
        } catch (err) {
            setError(err.message);
            toast.error(err.message || '데이터를 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const exportAndRefreshNodes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiExportNodes();
            setNodes(data);
            toast.success('노드 목록 새로고침 완료!');
        } catch (err) {
            setError(err.message);
            toast.error(err.message || '새로고침에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshNodes();
    }, [refreshNodes]);

    return { nodes, isLoading, error, refreshNodes, exportAndRefreshNodes };
};
