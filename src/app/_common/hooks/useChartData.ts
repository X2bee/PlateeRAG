// Chart Data Management Hook - Handles chart data loading and management
import { useState, useCallback, useEffect, useRef } from 'react';
import { devLog } from '@/app/_common/utils/logger';
import {
    getWorkflowPerformance,
    getWorkflowNodeCounts,
    getPieChartData,
    getBarChartData,
    getLineChartData,
    getAllChartData,
} from '@/app/api/workflow';

export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
    percentage?: number;
}

export interface PieChartData {
    data: ChartDataPoint[];
    total: number;
    title?: string;
}

export interface BarChartData {
    data: ChartDataPoint[];
    maxValue: number;
    title?: string;
}

export interface LineChartDataPoint {
    x: string | number;
    y: number;
    timestamp?: string;
}

export interface LineChartData {
    data: LineChartDataPoint[];
    title?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
}

export interface PerformanceData {
    executionTime: number;
    memoryUsage: number;
    cpuUsage: number;
    timestamp: string;
    status: 'success' | 'error' | 'warning';
}

export interface NodeCountData {
    nodeId: string;
    nodeName: string;
    count: number;
    percentage: number;
}

export interface ChartDataState {
    pie: PieChartData | null;
    bar: BarChartData | null;
    line: LineChartData | null;
    performance: PerformanceData | null;
    nodeCounts: NodeCountData[] | null;
}

export interface ChartLoadingState {
    pie: boolean;
    bar: boolean;
    line: boolean;
    performance: boolean;
    nodeCounts: boolean;
    all: boolean;
}

export interface ChartErrorState {
    pie: string | null;
    bar: string | null;
    line: string | null;
    performance: string | null;
    nodeCounts: string | null;
    all: string | null;
}

export type ChartType = 'pie' | 'bar' | 'line' | 'performance' | 'nodeCounts';

export interface ChartDataHook {
    // Chart Data State
    chartData: ChartDataState;
    
    // Loading States
    loading: ChartLoadingState;
    
    // Error States
    errors: ChartErrorState;
    
    // Refresh State
    lastRefresh: Date | null;
    autoRefresh: boolean;
    refreshInterval: number; // in milliseconds
    
    // Data Loading Operations
    loadPieChartData: (workflowName: string, workflowId: string, limit?: number) => Promise<void>;
    loadBarChartData: (workflowName: string, workflowId: string, limit?: number) => Promise<void>;
    loadLineChartData: (workflowName: string, workflowId: string, limit?: number) => Promise<void>;
    loadPerformanceData: (workflowName: string, workflowId: string) => Promise<void>;
    loadNodeCountsData: (workflowName: string, workflowId: string) => Promise<void>;
    loadAllChartData: (workflowName: string, workflowId: string, limit?: number) => Promise<void>;
    
    // Chart Type Specific Loading
    loadChartData: (chartType: ChartType, workflowName: string, workflowId: string, limit?: number) => Promise<void>;
    
    // Refresh Operations
    refreshChartData: (chartType: ChartType, workflowName: string, workflowId: string, limit?: number) => Promise<void>;
    refreshAllCharts: (workflowName: string, workflowId: string, limit?: number) => Promise<void>;
    
    // Auto-refresh Management
    startAutoRefresh: (workflowName: string, workflowId: string, limit?: number) => void;
    stopAutoRefresh: () => void;
    setAutoRefreshInterval: (interval: number) => void;
    setAutoRefresh: (enabled: boolean) => void;
    
    // State Management
    setChartData: (chartType: ChartType, data: any) => void;
    setLoading: (chartType: ChartType | 'all', loading: boolean) => void;
    setError: (chartType: ChartType | 'all', error: string | null) => void;
    clearErrors: (chartType?: ChartType) => void;
    clearChartData: (chartType?: ChartType) => void;
    
    // Utility Functions
    isChartLoading: (chartType: ChartType) => boolean;
    hasChartError: (chartType: ChartType) => boolean;
    getChartError: (chartType: ChartType) => string | null;
    hasChartData: (chartType: ChartType) => boolean;
    resetChartState: () => void;
    
    // Data Transformation Utilities
    transformToChartFormat: (data: any, chartType: ChartType) => any;
    formatChartData: (data: any, chartType: ChartType) => any;
}

export interface UseChartDataProps {
    autoLoad?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
    defaultWorkflowName?: string;
    defaultWorkflowId?: string;
    defaultLimit?: number;
    onDataLoad?: (chartType: ChartType, data: any) => void;
    onError?: (chartType: ChartType, error: string) => void;
    onRefresh?: (chartType: ChartType) => void;
}

export const useChartData = ({
    autoLoad = false,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds default
    defaultWorkflowName,
    defaultWorkflowId,
    defaultLimit = 100,
    onDataLoad,
    onError,
    onRefresh,
}: UseChartDataProps = {}): ChartDataHook => {
    
    // Chart Data State
    const [chartData, setChartDataState] = useState<ChartDataState>({
        pie: null,
        bar: null,
        line: null,
        performance: null,
        nodeCounts: null,
    });
    
    // Loading States
    const [loading, setLoadingState] = useState<ChartLoadingState>({
        pie: false,
        bar: false,
        line: false,
        performance: false,
        nodeCounts: false,
        all: false,
    });
    
    // Error States
    const [errors, setErrorsState] = useState<ChartErrorState>({
        pie: null,
        bar: null,
        line: null,
        performance: null,
        nodeCounts: null,
        all: null,
    });
    
    // Refresh State
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(refreshInterval);
    
    // Auto-refresh timer ref
    const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoRefreshParamsRef = useRef<{
        workflowName: string;
        workflowId: string;
        limit?: number;
    } | null>(null);
    
    // Data Loading Operations
    const loadPieChartData = useCallback(async (
        workflowName: string, 
        workflowId: string, 
        limit: number = defaultLimit
    ): Promise<void> => {
        setLoading('pie', true);
        setError('pie', null);
        
        try {
            devLog.log('Loading pie chart data:', workflowName, workflowId, 'limit:', limit);
            const data = await getPieChartData(workflowName, workflowId, limit);
            
            const formattedData = formatChartData(data, 'pie');
            setChartData('pie', formattedData);
            
            devLog.log('Pie chart data loaded successfully');
            
            if (onDataLoad) {
                onDataLoad('pie', formattedData);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load pie chart data';
            devLog.error('Failed to load pie chart data:', err);
            setError('pie', errorMessage);
            
            if (onError) {
                onError('pie', errorMessage);
            }
            
            throw err;
        } finally {
            setLoading('pie', false);
        }
    }, [defaultLimit, onDataLoad, onError]);
    
    const loadBarChartData = useCallback(async (
        workflowName: string, 
        workflowId: string, 
        limit: number = defaultLimit
    ): Promise<void> => {
        setLoading('bar', true);
        setError('bar', null);
        
        try {
            devLog.log('Loading bar chart data:', workflowName, workflowId, 'limit:', limit);
            const data = await getBarChartData(workflowName, workflowId, limit);
            
            const formattedData = formatChartData(data, 'bar');
            setChartData('bar', formattedData);
            
            devLog.log('Bar chart data loaded successfully');
            
            if (onDataLoad) {
                onDataLoad('bar', formattedData);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load bar chart data';
            devLog.error('Failed to load bar chart data:', err);
            setError('bar', errorMessage);
            
            if (onError) {
                onError('bar', errorMessage);
            }
            
            throw err;
        } finally {
            setLoading('bar', false);
        }
    }, [defaultLimit, onDataLoad, onError]);
    
    const loadLineChartData = useCallback(async (
        workflowName: string, 
        workflowId: string, 
        limit: number = defaultLimit
    ): Promise<void> => {
        setLoading('line', true);
        setError('line', null);
        
        try {
            devLog.log('Loading line chart data:', workflowName, workflowId, 'limit:', limit);
            const data = await getLineChartData(workflowName, workflowId, limit);
            
            const formattedData = formatChartData(data, 'line');
            setChartData('line', formattedData);
            
            devLog.log('Line chart data loaded successfully');
            
            if (onDataLoad) {
                onDataLoad('line', formattedData);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load line chart data';
            devLog.error('Failed to load line chart data:', err);
            setError('line', errorMessage);
            
            if (onError) {
                onError('line', errorMessage);
            }
            
            throw err;
        } finally {
            setLoading('line', false);
        }
    }, [defaultLimit, onDataLoad, onError]);
    
    const loadPerformanceData = useCallback(async (
        workflowName: string, 
        workflowId: string
    ): Promise<void> => {
        setLoading('performance', true);
        setError('performance', null);
        
        try {
            devLog.log('Loading performance data:', workflowName, workflowId);
            const data = await getWorkflowPerformance(workflowName, workflowId);
            
            const formattedData = formatChartData(data, 'performance');
            setChartData('performance', formattedData);
            
            devLog.log('Performance data loaded successfully');
            
            if (onDataLoad) {
                onDataLoad('performance', formattedData);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load performance data';
            devLog.error('Failed to load performance data:', err);
            setError('performance', errorMessage);
            
            if (onError) {
                onError('performance', errorMessage);
            }
            
            throw err;
        } finally {
            setLoading('performance', false);
        }
    }, [onDataLoad, onError]);
    
    const loadNodeCountsData = useCallback(async (
        workflowName: string, 
        workflowId: string
    ): Promise<void> => {
        setLoading('nodeCounts', true);
        setError('nodeCounts', null);
        
        try {
            devLog.log('Loading node counts data:', workflowName, workflowId);
            const data = await getWorkflowNodeCounts(workflowName, workflowId);
            
            const formattedData = formatChartData(data, 'nodeCounts');
            setChartData('nodeCounts', formattedData);
            
            devLog.log('Node counts data loaded successfully');
            
            if (onDataLoad) {
                onDataLoad('nodeCounts', formattedData);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load node counts data';
            devLog.error('Failed to load node counts data:', err);
            setError('nodeCounts', errorMessage);
            
            if (onError) {
                onError('nodeCounts', errorMessage);
            }
            
            throw err;
        } finally {
            setLoading('nodeCounts', false);
        }
    }, [onDataLoad, onError]);
    
    const loadAllChartData = useCallback(async (
        workflowName: string, 
        workflowId: string, 
        limit: number = defaultLimit
    ): Promise<void> => {
        setLoading('all', true);
        setError('all', null);
        
        try {
            devLog.log('Loading all chart data:', workflowName, workflowId, 'limit:', limit);
            const data = await getAllChartData(workflowName, workflowId, limit);
            
            // Format and set each chart data type
            if (data.pie) {
                const formattedPie = formatChartData(data.pie, 'pie');
                setChartData('pie', formattedPie);
            }
            
            if (data.bar) {
                const formattedBar = formatChartData(data.bar, 'bar');
                setChartData('bar', formattedBar);
            }
            
            if (data.line) {
                const formattedLine = formatChartData(data.line, 'line');
                setChartData('line', formattedLine);
            }
            
            if (data.nodeCounts) {
                const formattedNodeCounts = formatChartData(data.nodeCounts, 'nodeCounts');
                setChartData('nodeCounts', formattedNodeCounts);
            }
            
            setLastRefresh(new Date());
            devLog.log('All chart data loaded successfully');
            
            // Trigger callbacks for each loaded chart type
            if (onDataLoad) {
                if (data.pie) onDataLoad('pie', formatChartData(data.pie, 'pie'));
                if (data.bar) onDataLoad('bar', formatChartData(data.bar, 'bar'));
                if (data.line) onDataLoad('line', formatChartData(data.line, 'line'));
                if (data.nodeCounts) onDataLoad('nodeCounts', formatChartData(data.nodeCounts, 'nodeCounts'));
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load chart data';
            devLog.error('Failed to load all chart data:', err);
            setError('all', errorMessage);
            
            if (onError) {
                onError('pie', errorMessage);
                onError('bar', errorMessage);
                onError('line', errorMessage);
                onError('nodeCounts', errorMessage);
            }
            
            throw err;
        } finally {
            setLoading('all', false);
        }
    }, [defaultLimit, onDataLoad, onError]);
    
    // Chart Type Specific Loading
    const loadChartData = useCallback(async (
        chartType: ChartType, 
        workflowName: string, 
        workflowId: string, 
        limit: number = defaultLimit
    ): Promise<void> => {
        switch (chartType) {
            case 'pie':
                return loadPieChartData(workflowName, workflowId, limit);
            case 'bar':
                return loadBarChartData(workflowName, workflowId, limit);
            case 'line':
                return loadLineChartData(workflowName, workflowId, limit);
            case 'performance':
                return loadPerformanceData(workflowName, workflowId);
            case 'nodeCounts':
                return loadNodeCountsData(workflowName, workflowId);
            default:
                throw new Error(`Unknown chart type: ${chartType}`);
        }
    }, [
        defaultLimit, 
        loadPieChartData, 
        loadBarChartData, 
        loadLineChartData, 
        loadPerformanceData, 
        loadNodeCountsData
    ]);
    
    // Refresh Operations
    const refreshChartData = useCallback(async (
        chartType: ChartType, 
        workflowName: string, 
        workflowId: string, 
        limit: number = defaultLimit
    ): Promise<void> => {
        devLog.log('Refreshing chart data:', chartType);
        await loadChartData(chartType, workflowName, workflowId, limit);
        
        if (onRefresh) {
            onRefresh(chartType);
        }
    }, [loadChartData, defaultLimit, onRefresh]);
    
    const refreshAllCharts = useCallback(async (
        workflowName: string, 
        workflowId: string, 
        limit: number = defaultLimit
    ): Promise<void> => {
        devLog.log('Refreshing all charts');
        await loadAllChartData(workflowName, workflowId, limit);
        
        if (onRefresh) {
            onRefresh('pie');
            onRefresh('bar');
            onRefresh('line');
            onRefresh('performance');
            onRefresh('nodeCounts');
        }
    }, [loadAllChartData, defaultLimit, onRefresh]);
    
    // Auto-refresh Management
    const startAutoRefresh = useCallback((
        workflowName: string, 
        workflowId: string, 
        limit: number = defaultLimit
    ) => {
        devLog.log('Starting auto-refresh for charts:', autoRefreshInterval + 'ms');
        
        // Store parameters for auto-refresh
        autoRefreshParamsRef.current = { workflowName, workflowId, limit };
        
        // Clear existing timer
        if (autoRefreshTimerRef.current) {
            clearInterval(autoRefreshTimerRef.current);
        }
        
        // Start new timer
        autoRefreshTimerRef.current = setInterval(() => {
            if (autoRefreshParamsRef.current) {
                const { workflowName, workflowId, limit } = autoRefreshParamsRef.current;
                refreshAllCharts(workflowName, workflowId, limit || defaultLimit)
                    .catch(err => devLog.error('Auto-refresh failed:', err));
            }
        }, autoRefreshInterval);
        
        setAutoRefreshEnabled(true);
    }, [autoRefreshInterval, refreshAllCharts, defaultLimit]);
    
    const stopAutoRefresh = useCallback(() => {
        devLog.log('Stopping auto-refresh for charts');
        
        if (autoRefreshTimerRef.current) {
            clearInterval(autoRefreshTimerRef.current);
            autoRefreshTimerRef.current = null;
        }
        
        autoRefreshParamsRef.current = null;
        setAutoRefreshEnabled(false);
    }, []);
    
    const setAutoRefreshIntervalValue = useCallback((interval: number) => {
        setAutoRefreshInterval(interval);
        
        // Restart auto-refresh with new interval if currently active
        if (autoRefreshTimerRef.current && autoRefreshParamsRef.current) {
            const params = autoRefreshParamsRef.current;
            stopAutoRefresh();
            startAutoRefresh(params.workflowName, params.workflowId, params.limit);
        }
    }, [startAutoRefresh, stopAutoRefresh]);
    
    const setAutoRefresh = useCallback((enabled: boolean) => {
        if (enabled && !autoRefreshEnabled && autoRefreshParamsRef.current) {
            const params = autoRefreshParamsRef.current;
            startAutoRefresh(params.workflowName, params.workflowId, params.limit);
        } else if (!enabled && autoRefreshEnabled) {
            stopAutoRefresh();
        }
    }, [autoRefreshEnabled, startAutoRefresh, stopAutoRefresh]);
    
    // State Management
    const setChartData = useCallback((chartType: ChartType, data: any) => {
        setChartDataState(prev => ({
            ...prev,
            [chartType]: data
        }));
    }, []);
    
    const setLoading = useCallback((chartType: ChartType | 'all', loading: boolean) => {
        setLoadingState(prev => ({
            ...prev,
            [chartType]: loading
        }));
    }, []);
    
    const setError = useCallback((chartType: ChartType | 'all', error: string | null) => {
        setErrorsState(prev => ({
            ...prev,
            [chartType]: error
        }));
    }, []);
    
    const clearErrors = useCallback((chartType?: ChartType) => {
        if (chartType) {
            setError(chartType, null);
        } else {
            setErrorsState({
                pie: null,
                bar: null,
                line: null,
                performance: null,
                nodeCounts: null,
                all: null,
            });
        }
    }, [setError]);
    
    const clearChartData = useCallback((chartType?: ChartType) => {
        if (chartType) {
            setChartData(chartType, null);
        } else {
            setChartDataState({
                pie: null,
                bar: null,
                line: null,
                performance: null,
                nodeCounts: null,
            });
        }
    }, [setChartData]);
    
    // Utility Functions
    const isChartLoading = useCallback((chartType: ChartType): boolean => {
        return loading[chartType] || loading.all;
    }, [loading]);
    
    const hasChartError = useCallback((chartType: ChartType): boolean => {
        return !!(errors[chartType] || errors.all);
    }, [errors]);
    
    const getChartError = useCallback((chartType: ChartType): string | null => {
        return errors[chartType] || errors.all || null;
    }, [errors]);
    
    const hasChartData = useCallback((chartType: ChartType): boolean => {
        return chartData[chartType] !== null;
    }, [chartData]);
    
    const resetChartState = useCallback(() => {
        setChartDataState({
            pie: null,
            bar: null,
            line: null,
            performance: null,
            nodeCounts: null,
        });
        setLoadingState({
            pie: false,
            bar: false,
            line: false,
            performance: false,
            nodeCounts: false,
            all: false,
        });
        setErrorsState({
            pie: null,
            bar: null,
            line: null,
            performance: null,
            nodeCounts: null,
            all: null,
        });
        setLastRefresh(null);
        stopAutoRefresh();
        
        devLog.log('Chart state reset');
    }, [stopAutoRefresh]);
    
    // Data Transformation Utilities
    const transformToChartFormat = useCallback((data: any, chartType: ChartType): any => {
        // This is a placeholder - implement based on your API response format
        return data;
    }, []);
    
    const formatChartData = useCallback((data: any, chartType: ChartType): any => {
        if (!data) return null;
        
        switch (chartType) {
            case 'pie':
                return {
                    data: Array.isArray(data) ? data : data.data || [],
                    total: data.total || 0,
                    title: data.title || 'Pie Chart'
                } as PieChartData;
                
            case 'bar':
                return {
                    data: Array.isArray(data) ? data : data.data || [],
                    maxValue: data.maxValue || 0,
                    title: data.title || 'Bar Chart'
                } as BarChartData;
                
            case 'line':
                return {
                    data: Array.isArray(data) ? data : data.data || [],
                    title: data.title || 'Line Chart',
                    xAxisLabel: data.xAxisLabel || 'X',
                    yAxisLabel: data.yAxisLabel || 'Y'
                } as LineChartData;
                
            case 'performance':
                return data as PerformanceData;
                
            case 'nodeCounts':
                return Array.isArray(data) ? data : data.data || [] as NodeCountData[];
                
            default:
                return data;
        }
    }, []);
    
    // Auto-load effect
    useEffect(() => {
        if (autoLoad && defaultWorkflowName && defaultWorkflowId) {
            loadAllChartData(defaultWorkflowName, defaultWorkflowId, defaultLimit)
                .catch(err => devLog.error('Auto-load failed:', err));
        }
    }, [autoLoad, defaultWorkflowName, defaultWorkflowId, defaultLimit, loadAllChartData]);
    
    // Auto-refresh effect
    useEffect(() => {
        if (autoRefreshEnabled && defaultWorkflowName && defaultWorkflowId) {
            startAutoRefresh(defaultWorkflowName, defaultWorkflowId, defaultLimit);
        }
        
        return () => {
            stopAutoRefresh();
        };
    }, [autoRefreshEnabled, defaultWorkflowName, defaultWorkflowId, defaultLimit, startAutoRefresh, stopAutoRefresh]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAutoRefresh();
        };
    }, [stopAutoRefresh]);
    
    return {
        // Chart Data State
        chartData,
        
        // Loading States
        loading,
        
        // Error States
        errors,
        
        // Refresh State
        lastRefresh,
        autoRefresh: autoRefreshEnabled,
        refreshInterval: autoRefreshInterval,
        
        // Data Loading Operations
        loadPieChartData,
        loadBarChartData,
        loadLineChartData,
        loadPerformanceData,
        loadNodeCountsData,
        loadAllChartData,
        
        // Chart Type Specific Loading
        loadChartData,
        
        // Refresh Operations
        refreshChartData,
        refreshAllCharts,
        
        // Auto-refresh Management
        startAutoRefresh,
        stopAutoRefresh,
        setAutoRefreshInterval: setAutoRefreshIntervalValue,
        setAutoRefresh,
        
        // State Management
        setChartData,
        setLoading,
        setError,
        clearErrors,
        clearChartData,
        
        // Utility Functions
        isChartLoading,
        hasChartError,
        getChartError,
        hasChartData,
        resetChartState,
        
        // Data Transformation Utilities
        transformToChartFormat,
        formatChartData,
    };
};