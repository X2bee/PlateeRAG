// Chat API Hook - Handles all chat-related API operations
import { useCallback, useRef } from 'react';
import { devLog } from '@/app/_common/utils/logger';
import { 
    executeWorkflowById, 
    executeWorkflowByIdStream,
    executeWorkflowByIdDeploy,
    executeWorkflowByIdStreamDeploy,
    getWorkflowIOLogs,
    loadWorkflow 
} from '@/app/api/workflow';
import { generateInteractionId, normalizeWorkflowName } from '@/app/api/interactionAPI';
import { isStreamingWorkflowFromWorkflow } from '@/app/_common/utils/isStreamingWorkflow';
import type { WorkflowData } from '@/app/canvas/types';
import type { IOLog } from '@/app/chat/components/types';

export interface ExecuteWorkflowParams {
    workflowName: string;
    workflowId: string;
    inputData: string;
    selectedCollections?: string[];
    additionalParams?: Record<string, Record<string, any>> | null;
    isDeploy?: boolean;
    user_id?: number | string | null;
    interactionId?: string;
}

export interface StreamingCallbacks {
    onData: (content: string) => void;
    onEnd: () => void;
    onError: (error: Error) => void;
}

export interface ChatAPIHook {
    // Workflow Execution
    executeWorkflow: (params: ExecuteWorkflowParams) => Promise<any>;
    executeWorkflowStreaming: (params: ExecuteWorkflowParams & StreamingCallbacks) => Promise<void>;
    
    // Workflow Loading
    loadWorkflowData: (workflowId: string, isDeploy?: boolean, user_id?: number | string | null) => Promise<WorkflowData>;
    
    // IO Logs
    loadIOLogs: (workflowName: string, workflowId: string, interactionId?: string) => Promise<IOLog[]>;
    
    // Utilities
    determineExecutionMode: (workflow: WorkflowData | null) => 'streaming' | 'normal';
    generateInteractionId: (prefix?: string) => string;
    normalizeWorkflowName: (name: string) => string;
    
    // State
    isExecuting: boolean;
    setIsExecuting: (executing: boolean) => void;
}

interface UseChatAPIProps {
    onExecutionStart?: () => void;
    onExecutionEnd?: () => void;
    onExecutionError?: (error: string) => void;
    onStreamingData?: (data: string) => void;
}

export const useChatAPI = ({
    onExecutionStart,
    onExecutionEnd,
    onExecutionError,
    onStreamingData,
}: UseChatAPIProps = {}): ChatAPIHook => {
    
    const isExecutingRef = useRef(false);
    
    const setIsExecuting = useCallback((executing: boolean) => {
        isExecutingRef.current = executing;
        if (executing && onExecutionStart) {
            onExecutionStart();
        } else if (!executing && onExecutionEnd) {
            onExecutionEnd();
        }
    }, [onExecutionStart, onExecutionEnd]);
    
    // Workflow Execution
    const executeWorkflow = useCallback(async (params: ExecuteWorkflowParams): Promise<any> => {
        const {
            workflowName,
            workflowId,
            inputData,
            selectedCollections = null,
            additionalParams = null,
            isDeploy = false,
            user_id = null,
            interactionId = 'default'
        } = params;
        
        setIsExecuting(true);
        
        try {
            devLog.log('Executing workflow:', {
                workflowName,
                workflowId,
                inputData: inputData.substring(0, 100) + '...',
                selectedCollections,
                isDeploy,
                user_id
            });
            
            let result;
            
            if (isDeploy) {
                result = await executeWorkflowByIdDeploy(
                    workflowName,
                    workflowId,
                    inputData,
                    interactionId,
                    selectedCollections,
                    user_id,
                    additionalParams
                );
            } else {
                result = await executeWorkflowById(
                    workflowName,
                    workflowId,
                    inputData,
                    interactionId,
                    selectedCollections,
                    additionalParams
                );
            }
            
            devLog.log('Workflow execution completed:', result);
            return result;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            devLog.error('Workflow execution failed:', error);
            
            if (onExecutionError) {
                onExecutionError(errorMessage);
            }
            
            throw error;
        } finally {
            setIsExecuting(false);
        }
    }, [setIsExecuting, onExecutionError]);
    
    const executeWorkflowStreaming = useCallback(async (params: ExecuteWorkflowParams & StreamingCallbacks): Promise<void> => {
        const {
            workflowName,
            workflowId,
            inputData,
            selectedCollections = null,
            additionalParams = null,
            isDeploy = false,
            user_id = null,
            interactionId = 'default',
            onData,
            onEnd,
            onError
        } = params;
        
        setIsExecuting(true);
        
        try {
            devLog.log('Executing workflow (streaming):', {
                workflowName,
                workflowId,
                inputData: inputData.substring(0, 100) + '...',
                selectedCollections,
                isDeploy,
                user_id
            });
            
            const enhancedOnData = (content: string) => {
                if (onStreamingData) {
                    onStreamingData(content);
                }
                onData(content);
            };
            
            const enhancedOnEnd = () => {
                setIsExecuting(false);
                onEnd();
            };
            
            const enhancedOnError = (error: Error) => {
                setIsExecuting(false);
                if (onExecutionError) {
                    onExecutionError(error.message);
                }
                onError(error);
            };
            
            if (isDeploy) {
                await executeWorkflowByIdStreamDeploy({
                    workflowName,
                    workflowId,
                    inputData,
                    interactionId,
                    selectedCollections,
                    user_id,
                    additional_params: additionalParams,
                    onData: enhancedOnData,
                    onEnd: enhancedOnEnd,
                    onError: enhancedOnError
                });
            } else {
                await executeWorkflowByIdStream({
                    workflowName,
                    workflowId,
                    inputData,
                    interactionId,
                    selectedCollections,
                    additional_params: additionalParams,
                    onData: enhancedOnData,
                    onEnd: enhancedOnEnd,
                    onError: enhancedOnError
                });
            }
            
        } catch (error) {
            setIsExecuting(false);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            devLog.error('Streaming workflow execution failed:', error);
            
            if (onExecutionError) {
                onExecutionError(errorMessage);
            }
            
            throw error;
        }
    }, [setIsExecuting, onExecutionError, onStreamingData]);
    
    // Workflow Loading
    const loadWorkflowData = useCallback(async (
        workflowId: string, 
        isDeploy = false, 
        user_id: number | string | null = null
    ): Promise<WorkflowData> => {
        try {
            devLog.log('Loading workflow data:', workflowId, isDeploy ? '(deploy)' : '(normal)');
            
            const workflowData = await loadWorkflow(workflowId, isDeploy, user_id);
            
            devLog.log('Workflow data loaded successfully');
            return workflowData;
            
        } catch (error) {
            devLog.error('Failed to load workflow data:', error);
            throw error;
        }
    }, []);
    
    // IO Logs
    const loadIOLogs = useCallback(async (
        workflowName: string, 
        workflowId: string, 
        interactionId = 'default'
    ): Promise<IOLog[]> => {
        try {
            devLog.log('Loading IO logs:', workflowName, workflowId, interactionId);
            
            const logs = await getWorkflowIOLogs(workflowName, workflowId, interactionId);
            
            devLog.log('IO logs loaded:', logs?.length || 0, 'entries');
            return logs || [];
            
        } catch (error) {
            devLog.error('Failed to load IO logs:', error);
            return [];
        }
    }, []);
    
    // Utilities
    const determineExecutionMode = useCallback((workflow: WorkflowData | null): 'streaming' | 'normal' => {
        if (!workflow) return 'normal';
        
        try {
            return isStreamingWorkflowFromWorkflow(workflow) ? 'streaming' : 'normal';
        } catch (error) {
            devLog.warn('Failed to determine streaming mode, defaulting to normal:', error);
            return 'normal';
        }
    }, []);
    
    return {
        // Workflow Execution
        executeWorkflow,
        executeWorkflowStreaming,
        
        // Workflow Loading
        loadWorkflowData,
        
        // IO Logs
        loadIOLogs,
        
        // Utilities
        determineExecutionMode,
        generateInteractionId,
        normalizeWorkflowName,
        
        // State
        isExecuting: isExecutingRef.current,
        setIsExecuting,
    };
};