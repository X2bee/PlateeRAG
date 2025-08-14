// Configuration Management Hook - Handles settings and configuration operations
import { useState, useCallback, useEffect } from 'react';
import { devLog } from '@/app/_common/utils/logger';
import {
    fetchAllConfigs,
    fetchConfigsByCategory,
    updateConfig,
    testConnection,
    refreshConfigs,
    saveConfigs,
    fetchAppConfig
} from '@/app/api/configAPI';

export interface ConfigItem {
    value: any;
    type?: string;
    description?: string;
    required?: boolean;
    sensitive?: boolean;
}

export interface ConfigData {
    [key: string]: ConfigItem;
}

export interface ConnectionTestResult {
    success: boolean;
    message: string;
    category: string;
    timestamp: string;
}

export interface ConfigStateHook {
    // Configuration State
    configs: ConfigData;
    appConfig: any;
    configsByCategory: Record<string, ConfigData>;
    
    // Loading States
    loading: boolean;
    saving: boolean;
    testing: boolean;
    refreshing: boolean;
    
    // Error States
    error: string | null;
    testError: string | null;
    
    // Success States
    saveSuccess: boolean;
    testSuccess: ConnectionTestResult | null;
    
    // State Actions
    setConfigs: (configs: ConfigData) => void;
    setAppConfig: (config: any) => void;
    setConfigsByCategory: (category: string, configs: ConfigData) => void;
    setLoading: (loading: boolean) => void;
    setSaving: (saving: boolean) => void;
    setTesting: (testing: boolean) => void;
    setRefreshing: (refreshing: boolean) => void;
    setError: (error: string | null) => void;
    setTestError: (error: string | null) => void;
    setSaveSuccess: (success: boolean) => void;
    setTestSuccess: (result: ConnectionTestResult | null) => void;
    
    // Config Operations
    loadAllConfigs: () => Promise<void>;
    loadConfigsByCategory: (category: string) => Promise<void>;
    loadAppConfig: () => Promise<void>;
    updateConfigValue: (configName: string, value: any) => Promise<void>;
    saveAllConfigs: () => Promise<void>;
    refreshAllConfigs: () => Promise<void>;
    testCategoryConnection: (category: string) => Promise<ConnectionTestResult>;
    
    // Config Utilities
    getConfigValue: (configName: string) => any;
    getConfigsByCategory: (category: string) => ConfigData;
    validateConfig: (configName: string, value: any) => boolean;
    resetConfigState: () => void;
    clearErrors: () => void;
    
    // Category Management
    getAvailableCategories: () => string[];
    getCategoryStatus: (category: string) => 'configured' | 'partial' | 'missing';
}

export interface UseConfigProps {
    autoLoad?: boolean;
    defaultCategory?: string;
    onConfigChange?: (configName: string, value: any) => void;
    onError?: (error: string) => void;
    onSuccess?: (message: string) => void;
}

export const useConfig = ({
    autoLoad = true,
    defaultCategory,
    onConfigChange,
    onError,
    onSuccess,
}: UseConfigProps = {}): ConfigStateHook => {
    
    // Configuration State
    const [configs, setConfigs] = useState<ConfigData>({});
    const [appConfig, setAppConfig] = useState<any>(null);
    const [configsByCategory, setConfigsByCategoryState] = useState<Record<string, ConfigData>>({});
    
    // Loading States
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // Error States
    const [error, setError] = useState<string | null>(null);
    const [testError, setTestError] = useState<string | null>(null);
    
    // Success States
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [testSuccess, setTestSuccess] = useState<ConnectionTestResult | null>(null);
    
    // Config Operations
    const loadAllConfigs = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);
        
        try {
            devLog.log('Loading all configurations...');
            const configData = await fetchAllConfigs();
            setConfigs(configData);
            devLog.log('All configurations loaded successfully:', Object.keys(configData).length, 'items');
            
            if (onSuccess) {
                onSuccess('Configurations loaded successfully');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load configurations';
            devLog.error('Failed to load configurations:', err);
            setError(errorMessage);
            
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    }, [onError, onSuccess]);
    
    const loadConfigsByCategory = useCallback(async (category: string): Promise<void> => {
        setLoading(true);
        setError(null);
        
        try {
            devLog.log('Loading configurations for category:', category);
            const categoryConfigs = await fetchConfigsByCategory(category);
            
            setConfigsByCategoryState(prev => ({
                ...prev,
                [category]: categoryConfigs
            }));
            
            devLog.log('Category configurations loaded successfully:', category, Object.keys(categoryConfigs).length, 'items');
            
            if (onSuccess) {
                onSuccess(`${category} configurations loaded successfully`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to load ${category} configurations`;
            devLog.error('Failed to load category configurations:', err);
            setError(errorMessage);
            
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    }, [onError, onSuccess]);
    
    const loadAppConfig = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);
        
        try {
            devLog.log('Loading app configuration...');
            const config = await fetchAppConfig();
            setAppConfig(config);
            devLog.log('App configuration loaded successfully');
            
            if (onSuccess) {
                onSuccess('App configuration loaded successfully');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load app configuration';
            devLog.error('Failed to load app configuration:', err);
            setError(errorMessage);
            
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    }, [onError, onSuccess]);
    
    const updateConfigValue = useCallback(async (configName: string, value: any): Promise<void> => {
        setSaving(true);
        setError(null);
        
        try {
            devLog.log('Updating configuration:', configName, 'with value:', value);
            const updatedConfig = await updateConfig(configName, value);
            
            // Update local state
            setConfigs(prev => ({
                ...prev,
                [configName]: updatedConfig
            }));
            
            devLog.log('Configuration updated successfully:', configName);
            
            if (onConfigChange) {
                onConfigChange(configName, value);
            }
            
            if (onSuccess) {
                onSuccess(`Configuration ${configName} updated successfully`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to update ${configName}`;
            devLog.error('Failed to update configuration:', err);
            setError(errorMessage);
            
            if (onError) {
                onError(errorMessage);
            }
            
            throw err;
        } finally {
            setSaving(false);
        }
    }, [onConfigChange, onError, onSuccess]);
    
    const saveAllConfigs = useCallback(async (): Promise<void> => {
        setSaving(true);
        setError(null);
        setSaveSuccess(false);
        
        try {
            devLog.log('Saving all configurations...');
            await saveConfigs();
            setSaveSuccess(true);
            devLog.log('All configurations saved successfully');
            
            if (onSuccess) {
                onSuccess('All configurations saved successfully');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save configurations';
            devLog.error('Failed to save configurations:', err);
            setError(errorMessage);
            
            if (onError) {
                onError(errorMessage);
            }
            
            throw err;
        } finally {
            setSaving(false);
        }
    }, [onError, onSuccess]);
    
    const refreshAllConfigs = useCallback(async (): Promise<void> => {
        setRefreshing(true);
        setError(null);
        
        try {
            devLog.log('Refreshing all configurations...');
            await refreshConfigs();
            
            // Reload configurations after refresh
            await loadAllConfigs();
            
            devLog.log('All configurations refreshed successfully');
            
            if (onSuccess) {
                onSuccess('All configurations refreshed successfully');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refresh configurations';
            devLog.error('Failed to refresh configurations:', err);
            setError(errorMessage);
            
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setRefreshing(false);
        }
    }, [loadAllConfigs, onError, onSuccess]);
    
    const testCategoryConnection = useCallback(async (category: string): Promise<ConnectionTestResult> => {
        setTesting(true);
        setTestError(null);
        setTestSuccess(null);
        
        try {
            devLog.log('Testing connection for category:', category);
            const result = await testConnection(category);
            setTestSuccess(result);
            devLog.log('Connection test completed:', category, result.success ? 'SUCCESS' : 'FAILED');
            
            if (result.success && onSuccess) {
                onSuccess(`${category} connection test successful`);
            }
            
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to test ${category} connection`;
            devLog.error('Connection test failed:', err);
            setTestError(errorMessage);
            
            if (onError) {
                onError(errorMessage);
            }
            
            // Return failed result
            const failedResult: ConnectionTestResult = {
                success: false,
                message: errorMessage,
                category,
                timestamp: new Date().toISOString()
            };
            
            return failedResult;
        } finally {
            setTesting(false);
        }
    }, [onError, onSuccess]);
    
    // Config Utilities
    const getConfigValue = useCallback((configName: string): any => {
        const config = configs[configName];
        return config ? config.value : undefined;
    }, [configs]);
    
    const getConfigsByCategory = useCallback((category: string): ConfigData => {
        return configsByCategory[category] || {};
    }, [configsByCategory]);
    
    const validateConfig = useCallback((configName: string, value: any): boolean => {
        const config = configs[configName];
        if (!config) return false;
        
        // Basic validation
        if (config.required && (value === null || value === undefined || value === '')) {
            return false;
        }
        
        // Type validation
        if (config.type) {
            switch (config.type) {
                case 'string':
                    return typeof value === 'string';
                case 'number':
                    return typeof value === 'number' && !isNaN(value);
                case 'boolean':
                    return typeof value === 'boolean';
                case 'array':
                    return Array.isArray(value);
                case 'object':
                    return typeof value === 'object' && value !== null && !Array.isArray(value);
                default:
                    return true;
            }
        }
        
        return true;
    }, [configs]);
    
    const resetConfigState = useCallback(() => {
        setConfigs({});
        setAppConfig(null);
        setConfigsByCategoryState({});
        setLoading(false);
        setSaving(false);
        setTesting(false);
        setRefreshing(false);
        setError(null);
        setTestError(null);
        setSaveSuccess(false);
        setTestSuccess(null);
        devLog.log('Configuration state reset');
    }, []);
    
    const clearErrors = useCallback(() => {
        setError(null);
        setTestError(null);
        setSaveSuccess(false);
        setTestSuccess(null);
    }, []);
    
    const setConfigsByCategory = useCallback((category: string, configs: ConfigData) => {
        setConfigsByCategoryState(prev => ({
            ...prev,
            [category]: configs
        }));
    }, []);
    
    // Category Management
    const getAvailableCategories = useCallback((): string[] => {
        const categories = new Set<string>();
        
        Object.keys(configs).forEach(configName => {
            // Extract category from config name (assumes format like "OPENAI_API_KEY", "DATABASE_HOST", etc.)
            const parts = configName.split('_');
            if (parts.length > 1) {
                categories.add(parts[0].toLowerCase());
            }
        });
        
        return Array.from(categories).sort();
    }, [configs]);
    
    const getCategoryStatus = useCallback((category: string): 'configured' | 'partial' | 'missing' => {
        const categoryConfigs = getConfigsByCategory(category);
        const configCount = Object.keys(categoryConfigs).length;
        
        if (configCount === 0) return 'missing';
        
        const configuredCount = Object.values(categoryConfigs).filter(config => 
            config.value !== null && config.value !== undefined && config.value !== ''
        ).length;
        
        if (configuredCount === configCount) return 'configured';
        if (configuredCount > 0) return 'partial';
        return 'missing';
    }, [getConfigsByCategory]);
    
    // Auto-load effect
    useEffect(() => {
        if (autoLoad) {
            loadAllConfigs();
            
            if (defaultCategory) {
                loadConfigsByCategory(defaultCategory);
            }
        }
    }, [autoLoad, defaultCategory, loadAllConfigs, loadConfigsByCategory]);
    
    return {
        // Configuration State
        configs,
        appConfig,
        configsByCategory,
        
        // Loading States
        loading,
        saving,
        testing,
        refreshing,
        
        // Error States
        error,
        testError,
        
        // Success States
        saveSuccess,
        testSuccess,
        
        // State Actions
        setConfigs,
        setAppConfig,
        setConfigsByCategory,
        setLoading,
        setSaving,
        setTesting,
        setRefreshing,
        setError,
        setTestError,
        setSaveSuccess,
        setTestSuccess,
        
        // Config Operations
        loadAllConfigs,
        loadConfigsByCategory,
        loadAppConfig,
        updateConfigValue,
        saveAllConfigs,
        refreshAllConfigs,
        testCategoryConnection,
        
        // Config Utilities
        getConfigValue,
        getConfigsByCategory,
        validateConfig,
        resetConfigState,
        clearErrors,
        
        // Category Management
        getAvailableCategories,
        getCategoryStatus,
    };
};