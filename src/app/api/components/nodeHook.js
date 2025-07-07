"use client";

import { useState, useEffect, useCallback } from 'react';
import { getNodes as apiGetNodes, exportNodes as apiExportNodes } from '@/app/api/components/nodeApi';

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
            alert('노드 목록을 성공적으로 새로고침했습니다.');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshNodes();
    }, [refreshNodes]); // refreshNodes는 useCallback으로 감싸져 있어 한번만 실행됩니다.

    return { nodes, isLoading, error, refreshNodes, exportAndRefreshNodes };
};