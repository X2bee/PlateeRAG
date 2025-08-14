// Chat State Management Hook - Handles all chat-related state and operations
import { useState, useCallback, useRef, useEffect } from 'react';
import { devLog } from '@/app/_common/utils/logger';
import { generateInteractionId } from '@/app/api/interactionAPI';
import type { IOLog } from '@/app/chat/components/types';
import type { WorkflowData } from '@/app/canvas/types';

export interface ChatMessage {
    id: string;
    content: string;
    type: 'user' | 'assistant' | 'system';
    timestamp: Date;
    isStreaming?: boolean;
}

export interface ChatStateHook {
    // Message State
    ioLogs: IOLog[];
    messages: ChatMessage[];
    inputMessage: string;
    pendingLogId: string | null;
    
    // Execution State
    loading: boolean;
    executing: boolean;
    error: string | null;
    
    // UI State
    showAttachmentMenu: boolean;
    showCollectionModal: boolean;
    showDeploymentModal: boolean;
    
    // Collection State
    selectedCollection: string[];
    selectedCollectionMakeName: string | null;
    collectionMapping: { [key: string]: string };
    
    // Workflow State
    workflowContentDetail: WorkflowData | null;
    additionalParams: Record<string, Record<string, any>>;
    
    // State Actions
    setIOLogs: (logs: IOLog[] | ((prev: IOLog[]) => IOLog[])) => void;
    setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
    setInputMessage: (message: string) => void;
    setPendingLogId: (id: string | null) => void;
    
    // Execution Actions
    setLoading: (loading: boolean) => void;
    setExecuting: (executing: boolean) => void;
    setError: (error: string | null) => void;
    
    // UI Actions
    setShowAttachmentMenu: (show: boolean) => void;
    setShowCollectionModal: (show: boolean) => void;
    setShowDeploymentModal: (show: boolean) => void;
    
    // Collection Actions
    setSelectedCollection: (collections: string[]) => void;
    setSelectedCollectionMakeName: (name: string | null) => void;
    setCollectionMapping: (mapping: { [key: string]: string }) => void;
    
    // Workflow Actions
    setWorkflowContentDetail: (detail: WorkflowData | null) => void;
    setAdditionalParams: (params: Record<string, Record<string, any>>) => void;
    
    // Message Operations
    addMessage: (content: string, type: 'user' | 'assistant' | 'system', isStreaming?: boolean) => string;
    updateMessage: (id: string, content: string, isStreaming?: boolean) => void;
    clearMessages: () => void;
    
    // IOLog Operations
    addIOLog: (log: Omit<IOLog, 'id'>) => string;
    updateIOLog: (id: string, updates: Partial<IOLog>) => void;
    clearIOLogs: () => void;
    
    // Streaming Operations
    startStreaming: (messageId: string) => void;
    appendToStream: (messageId: string, content: string) => void;
    endStreaming: (messageId: string) => void;
    
    // Utility Functions
    scrollToBottom: () => void;
    getValidAdditionalParams: () => Record<string, Record<string, any>> | null;
    resetChatState: () => void;
    
    // Refs
    messagesRef: React.RefObject<HTMLDivElement>;
    attachmentButtonRef: React.RefObject<HTMLDivElement>;
}

export const useChat = (): ChatStateHook => {
    // Message State
    const [ioLogs, setIOLogs] = useState<IOLog[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);
    
    // Execution State
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // UI State
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [showDeploymentModal, setShowDeploymentModal] = useState(false);
    
    // Collection State
    const [selectedCollection, setSelectedCollection] = useState<string[]>([]);
    const [selectedCollectionMakeName, setSelectedCollectionMakeName] = useState<string | null>(null);
    const [collectionMapping, setCollectionMapping] = useState<{ [key: string]: string }>({});
    
    // Workflow State
    const [workflowContentDetail, setWorkflowContentDetail] = useState<WorkflowData | null>(null);
    const [additionalParams, setAdditionalParams] = useState<Record<string, Record<string, any>>>({});
    
    // Refs
    const messagesRef = useRef<HTMLDivElement>(null);
    const attachmentButtonRef = useRef<HTMLDivElement>(null);
    
    // Message Operations
    const addMessage = useCallback((content: string, type: 'user' | 'assistant' | 'system', isStreaming = false): string => {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newMessage: ChatMessage = {
            id: messageId,
            content,
            type,
            timestamp: new Date(),
            isStreaming
        };
        
        setMessages(prev => [...prev, newMessage]);
        devLog.log('Message added:', messageId, type);
        return messageId;
    }, []);
    
    const updateMessage = useCallback((id: string, content: string, isStreaming?: boolean) => {
        setMessages(prev => prev.map(msg => 
            msg.id === id 
                ? { ...msg, content, isStreaming: isStreaming ?? msg.isStreaming }
                : msg
        ));
    }, []);
    
    const clearMessages = useCallback(() => {
        setMessages([]);
        devLog.log('Messages cleared');
    }, []);
    
    // IOLog Operations
    const addIOLog = useCallback((log: Omit<IOLog, 'id'>): string => {
        const logId = generateInteractionId('log');
        const newLog: IOLog = {
            id: logId,
            ...log
        };
        
        setIOLogs(prev => [...prev, newLog]);
        devLog.log('IOLog added:', logId);
        return logId;
    }, []);
    
    const updateIOLog = useCallback((id: string, updates: Partial<IOLog>) => {
        setIOLogs(prev => prev.map(log => 
            log.id === id ? { ...log, ...updates } : log
        ));
    }, []);
    
    const clearIOLogs = useCallback(() => {
        setIOLogs([]);
        devLog.log('IOLogs cleared');
    }, []);
    
    // Streaming Operations
    const startStreaming = useCallback((messageId: string) => {
        updateMessage(messageId, '', true);
        devLog.log('Streaming started for message:', messageId);
    }, [updateMessage]);
    
    const appendToStream = useCallback((messageId: string, content: string) => {
        setMessages(prev => prev.map(msg => 
            msg.id === messageId 
                ? { ...msg, content: msg.content + content }
                : msg
        ));
    }, []);
    
    const endStreaming = useCallback((messageId: string) => {
        updateMessage(messageId, undefined as any, false);
        devLog.log('Streaming ended for message:', messageId);
    }, [updateMessage]);
    
    // Utility Functions
    const scrollToBottom = useCallback(() => {
        if (messagesRef.current) {
            const scrollElement = messagesRef.current;
            scrollElement.scrollTop = scrollElement.scrollHeight;
            
            // Additional scroll with requestAnimationFrame for DOM updates
            requestAnimationFrame(() => {
                scrollElement.scrollTop = scrollElement.scrollHeight;
            });
        }
    }, []);
    
    const getValidAdditionalParams = useCallback(() => {
        const validParams: Record<string, Record<string, any>> = {};
        
        Object.keys(additionalParams).forEach(toolId => {
            const toolParams = additionalParams[toolId];
            if (toolParams && typeof toolParams === 'object') {
                const validToolParams: Record<string, any> = {};
                
                Object.keys(toolParams).forEach(paramKey => {
                    const paramValue = toolParams[paramKey];
                    if (paramValue !== null && paramValue !== '' && paramValue !== undefined) {
                        validToolParams[paramKey] = paramValue;
                    }
                });
                
                if (Object.keys(validToolParams).length > 0) {
                    validParams[toolId] = validToolParams;
                }
            }
        });
        
        return Object.keys(validParams).length > 0 ? validParams : null;
    }, [additionalParams]);
    
    const resetChatState = useCallback(() => {
        setMessages([]);
        setIOLogs([]);
        setInputMessage('');
        setPendingLogId(null);
        setLoading(false);
        setExecuting(false);
        setError(null);
        setShowAttachmentMenu(false);
        setShowCollectionModal(false);
        setShowDeploymentModal(false);
        setSelectedCollection([]);
        setSelectedCollectionMakeName(null);
        setCollectionMapping({});
        setWorkflowContentDetail(null);
        setAdditionalParams({});
        devLog.log('Chat state reset');
    }, []);
    
    // Auto-scroll effect
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);
    
    return {
        // Message State
        ioLogs,
        messages,
        inputMessage,
        pendingLogId,
        
        // Execution State
        loading,
        executing,
        error,
        
        // UI State
        showAttachmentMenu,
        showCollectionModal,
        showDeploymentModal,
        
        // Collection State
        selectedCollection,
        selectedCollectionMakeName,
        collectionMapping,
        
        // Workflow State
        workflowContentDetail,
        additionalParams,
        
        // State Actions
        setIOLogs,
        setMessages,
        setInputMessage,
        setPendingLogId,
        
        // Execution Actions
        setLoading,
        setExecuting,
        setError,
        
        // UI Actions
        setShowAttachmentMenu,
        setShowCollectionModal,
        setShowDeploymentModal,
        
        // Collection Actions
        setSelectedCollection,
        setSelectedCollectionMakeName,
        setCollectionMapping,
        
        // Workflow Actions
        setWorkflowContentDetail,
        setAdditionalParams,
        
        // Message Operations
        addMessage,
        updateMessage,
        clearMessages,
        
        // IOLog Operations
        addIOLog,
        updateIOLog,
        clearIOLogs,
        
        // Streaming Operations
        startStreaming,
        appendToStream,
        endStreaming,
        
        // Utility Functions
        scrollToBottom,
        getValidAdditionalParams,
        resetChatState,
        
        // Refs
        messagesRef,
        attachmentButtonRef,
    };
};