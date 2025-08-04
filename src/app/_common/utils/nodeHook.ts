'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getNodes as apiGetNodes,
    exportNodes as apiExportNodes,
    refreshNodes as apiRefreshNodes
} from '@/app/api/nodeAPI';
import { toast } from 'react-hot-toast';
import { devLog } from '@/app/_common/utils/logger';

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
    is_api?: boolean;
    api_name?: string;
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
    isInitialized: boolean;
}

/**
 * 노드 데이터를 관리하는 재사용 가능한 Custom Hook입니다.
 * Canvas 페이지 레벨에서 한 번만 초기화되어 중복 API 호출을 방지합니다.
 */
export const useNodes = (): UseNodesReturn => {
    const [nodes, setNodes] = useState<NodeCategory[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [initializationInProgress, setInitializationInProgress] = useState<boolean>(false);

    const refreshNodes = useCallback(async (): Promise<void> => {
        if (initializationInProgress) {
            devLog.log('Node refresh already in progress, skipping...');
            return;
        }

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
    }, [initializationInProgress]);

    const exportAndRefreshNodes = useCallback(async (): Promise<void> => {
        // 이미 초기화가 진행 중이거나 완료된 경우 중복 호출 방지
        if (initializationInProgress) {
            devLog.log('Node initialization already in progress, skipping...');
            return;
        }

        if (isInitialized) {
            devLog.log('Nodes already initialized, performing refresh only...');
            setIsLoading(true);
            setError(null);
            try {
                // 이미 초기화된 경우에는 refresh → get 순서로 실행
                await apiRefreshNodes();
                const data = await apiGetNodes();
                setNodes(data as NodeCategory[]);
                toast.success('노드 목록 새로고침 완료!');
            } catch (err: any) {
                const errorMessage = err?.message || '새로고침에 실패했습니다.';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // 최초 초기화인 경우
        setInitializationInProgress(true);
        setIsLoading(true);
        setError(null);

        try {
            devLog.log('Starting initial node initialization: refresh → get');

            // 1단계: refresh 수행 (우선 처리)
            devLog.log('Step 1: Refreshing nodes...');
            await apiRefreshNodes();
            devLog.log('Step 1 completed: Node refresh successful');

            // 2단계: refresh 성공 후 nodes 데이터 가져오기
            devLog.log('Step 2: Fetching updated nodes...');
            const data = await apiGetNodes();
            setNodes(data as NodeCategory[]);
            setIsInitialized(true);
            devLog.log('Step 2 completed: Initial node initialization successful');

        } catch (err: any) {
            const errorMessage = err?.message || '초기화에 실패했습니다.';
            setError(errorMessage);
            toast.error(errorMessage);
            devLog.error('Node initialization failed:', err);
        } finally {
            setIsLoading(false);
            setInitializationInProgress(false);
        }
    }, [isInitialized, initializationInProgress]);

    // 초기 로드 시에는 exportAndRefreshNodes만 호출 (중복 방지)
    useEffect(() => {
        if (!isInitialized && !initializationInProgress) {
            devLog.log('Starting useNodes initialization...');
            exportAndRefreshNodes();
        }
    }, []); // 빈 배열로 설정하여 최초 마운트 시에만 실행

    return { nodes, isLoading, error, refreshNodes, exportAndRefreshNodes, isInitialized };
};
