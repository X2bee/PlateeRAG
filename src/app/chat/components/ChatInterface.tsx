'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { useRouter } from 'next/navigation';
import { useSidebarManager } from '@/app/_common/hooks/useSidebarManager';
import { getWorkflowIOLogs, loadWorkflow } from '@/app/api/workflowAPI';
import { loadWorkflow as loadWorkflowDeploy } from '@/app/api/workflow/workflowDeployAPI';
import { MessageRenderer } from '@/app/_common/components/ChatParser';
import CollectionModal from '@/app/chat/components/CollectionModal';
import { IOLog, ChatInterfaceProps } from './types';
import ChatHeader from './ChatHeader';
import { DeploymentModal } from './DeploymentModal';
import ChatToolsDisplay from './ChatToolsDisplay';
import { generateInteractionId } from '@/app/api/interactionAPI';
import { devLog } from '@/app/_common/utils/logger';
import { SourceInfo } from '../types/source';
import { ChatContainer, ChatContainerRef } from './ChatContainer';
import { useWorkflowExecution } from '../hooks/useWorkflowExecution';
import { useCollectionManagement } from '../hooks/useCollectionManagement';
import { useScrollManagement } from '../hooks/useScrollManagement';
import { useChatState } from '../hooks/useChatState';
import { useInputHandling } from '../hooks/useInputHandling';

interface NewChatInterfaceProps extends ChatInterfaceProps {
    onStartNewChat?: (message: string) => void;
    initialMessageToExecute?: string | null;
    user_id?: number | string;
}

const ChatInterface: React.FC<NewChatInterfaceProps> = React.memo(({
    mode,
    workflow,
    onBack,
    hideBackButton = false,
    existingChatData,
    onStartNewChat,
    initialMessageToExecute,
    user_id,
}) => {
    const router = useRouter();
    const chatContainerRef = useRef<ChatContainerRef>(null);
    const hasExecutedInitialMessage = useRef(false);
    const hasLoadedExistingChat = useRef(false);
    const messagesRef = useRef<HTMLDivElement>(null);

    // 로컬 상태 (최소화됨)
    const [ioLogs, setIOLogs] = useState<IOLog[]>([]);

    // 통합 상태 관리
    const { state, actions } = useChatState();

    // Hook 사용
    const collectionManagement = useCollectionManagement(state.ui.showCollectionModal);
    const scrollManagement = useScrollManagement({ messagesRef, executing: false });

    useSidebarManager(state.ui.showDeploymentModal || state.ui.showCollectionModal);

    // 메모이제이션된 추가 파라미터 검증 함수
    const getValidAdditionalParams = useMemo(() => {
        return () => {
            const validParams: Record<string, Record<string, any>> = {};

            Object.keys(state.workflow.additionalParams).forEach(toolId => {
                const toolParams = state.workflow.additionalParams[toolId];
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
        };
    }, [state.workflow.additionalParams]);

    const workflowExecution = useWorkflowExecution({
        workflow,
        existingChatData,
        workflowContentDetail: state.workflow.contentDetail,
        selectedCollection: collectionManagement.selectedCollection,
        getValidAdditionalParams,
        user_id,
        setIOLogs,
        scrollToBottom: scrollManagement.scrollToBottom
    });
    // 메모이제이션된 이벤트 핸들러들
    const handleViewSource = useCallback((sourceInfo: SourceInfo, messageContent?: string) => {
        const enrichedSourceInfo = scrollManagement.handleViewSource(sourceInfo, messageContent);
        actions.showPDFViewer(enrichedSourceInfo);

        setTimeout(() => {
            if (!scrollManagement.isUserScrolling) {
                scrollManagement.restoreScrollPosition();
            }
        }, 150);
    }, [scrollManagement, actions]);

    const handleSendMessage = useCallback((message: string) => {
        if (mode === 'new-default' || mode === 'new-workflow') {
            if (onStartNewChat) {
                onStartNewChat(message);
            }
        } else if (mode === 'deploy') {
            workflowExecution.executeWorkflowDeploy(undefined, message);
        } else {
            workflowExecution.executeWorkflow(undefined, message);
        }
    }, [mode, onStartNewChat, workflowExecution]);

    const handlePDFViewerClose = useCallback(() => {
        if (!scrollManagement.isUserScrolling) {
            scrollManagement.saveScrollPosition();
        }

        actions.hidePDFViewer();

        setTimeout(() => {
            if (!scrollManagement.isUserScrolling) {
                scrollManagement.restoreScrollPosition();
            }
        }, 150);
    }, [scrollManagement, actions]);

    const handlePanelResize = useCallback((size: number) => {
        scrollManagement.setIsResizing(true);
        actions.setPanelSplit(size);

        setTimeout(() => {
            scrollManagement.setIsResizing(false);
        }, 100);
    }, [scrollManagement, actions]);

    const handleAttachmentClick = useCallback(() => {
        actions.toggleAttachmentMenu();
    }, [actions]);

    const handleAttachmentOption = useCallback((option: string) => {
        console.log('Selected option:', option);
        actions.setAttachmentMenu(false);

        if (option === 'collection') {
            actions.toggleCollectionModal();
        }
    }, [actions]);

    // 메모이제이션된 렌더 함수들
    const renderMessageContent = useCallback((content: string, isUserMessage: boolean = false) => {
        if (!content) return null;

        const handleViewSourceWithContext = (sourceInfo: SourceInfo) => {
            handleViewSource(sourceInfo, content);
        };

        return (
            <MessageRenderer
                content={content}
                isUserMessage={isUserMessage}
                onViewSource={handleViewSourceWithContext}
            />
        );
    }, [handleViewSource]);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, []);

    // 메모이제이션된 값들
    const chatHeaderProps = useMemo(() => ({
        mode,
        workflow,
        ioLogs,
        onBack,
        hideBackButton,
        onDeploy: actions.toggleDeploymentModal,
    }), [mode, workflow, ioLogs, onBack, hideBackButton, actions.toggleDeploymentModal]);

    const chatToolsProps = useMemo(() => ({
        workflowContentDetail: state.workflow.contentDetail,
        additionalParams: state.workflow.additionalParams,
        onAdditionalParamsChange: actions.setAdditionalParams,
    }), [state.workflow.contentDetail, state.workflow.additionalParams, actions.setAdditionalParams]);

    const chatContainerProps = useMemo(() => ({
        showPDFViewer: state.ui.showPDFViewer,
        panelSplit: state.panel.split,
        setPanelSplit: actions.setPanelSplit,
        onPanelResize: handlePanelResize,
        mode,
        loading: state.ui.loading,
        ioLogs,
        workflow,
        executing: workflowExecution.executing,
        setInputMessage: (message: string) => {
            chatContainerRef.current?.setInputMessage(message);
        },
        messagesRef,
        pendingLogId: workflowExecution.pendingLogId,
        renderMessageContent,
        formatDate,
        selectedCollections: collectionManagement.selectedCollection,
        collectionMapping: collectionManagement.collectionMapping,
        onRemoveCollection: collectionManagement.removeCollection,
        showAttachmentMenu: state.ui.showAttachmentMenu,
        onAttachmentClick: handleAttachmentClick,
        onAttachmentOption: handleAttachmentOption,
        onSendMessage: handleSendMessage,
        initialMessage: initialMessageToExecute || undefined,
        currentSourceInfo: state.pdfViewer.currentSourceInfo,
        user_id,
        onPDFViewerClose: handlePDFViewerClose,
        error: workflowExecution.error,
    }), [
        state.ui.showPDFViewer,
        state.ui.loading,
        state.ui.showAttachmentMenu,
        state.panel.split,
        state.pdfViewer.currentSourceInfo,
        actions.setPanelSplit,
        handlePanelResize,
        mode,
        ioLogs,
        workflow,
        workflowExecution.executing,
        workflowExecution.pendingLogId,
        workflowExecution.error,
        messagesRef,
        renderMessageContent,
        formatDate,
        collectionManagement.selectedCollection,
        collectionManagement.collectionMapping,
        collectionManagement.removeCollection,
        handleAttachmentClick,
        handleAttachmentOption,
        handleSendMessage,
        initialMessageToExecute,
        user_id,
        handlePDFViewerClose,
    ]);

    const collectionModalProps = useMemo(() => ({
        isOpen: state.ui.showCollectionModal,
        onClose: actions.toggleCollectionModal,
        onSelectCollections: collectionManagement.handleCollectionsSelect,
        selectedCollections: collectionManagement.selectedCollection,
    }), [
        state.ui.showCollectionModal,
        actions.toggleCollectionModal,
        collectionManagement.handleCollectionsSelect,
        collectionManagement.selectedCollection,
    ]);

    const deploymentModalProps = useMemo(() => ({
        isOpen: state.ui.showDeploymentModal,
        onClose: actions.toggleDeploymentModal,
        workflow,
        workflowDetail: state.workflow.contentDetail,
    }), [
        state.ui.showDeploymentModal,
        actions.toggleDeploymentModal,
        workflow,
        state.workflow.contentDetail,
    ]);

    // Effects - workflow 데이터 로딩을 한 번만 실행하도록 수정
    useEffect(() => {
        if (workflow && workflow.id && workflow.id !== "default_mode" && !state.workflow.contentDetail) {
            const loadWorkflowContent = async () => {
                actions.setLoading(true);
                try {
                    if (user_id) {
                        const workflowData = await loadWorkflowDeploy(workflow.name, user_id);
                        actions.setWorkflowDetail(workflowData);
                        devLog.log('Successfully loaded workflow content detail:', workflowData);
                    } else {
                        const workflowData = await loadWorkflow(workflow.name);
                        actions.setWorkflowDetail(workflowData);
                        devLog.log('Successfully loaded workflow content detail:', workflowData);
                    }
                } catch (error) {
                    devLog.error('Failed to load workflow content detail:', error);
                } finally {
                    actions.setLoading(false);
                }
            };

            loadWorkflowContent();
        }
    }, [workflow, user_id, actions, state.workflow.contentDetail]);

    useEffect(() => {
        if (mode === 'existing' && existingChatData?.interactionId && !initialMessageToExecute && !hasLoadedExistingChat.current) {
            hasLoadedExistingChat.current = true;
            actions.setLoading(true);
            getWorkflowIOLogs(existingChatData.workflowName, existingChatData.workflowId, existingChatData.interactionId)
                .then(logs => {
                    setIOLogs((logs as any).in_out_logs || []);
                })
                .catch(err => {
                    setIOLogs([]);
                })
                .finally(() => {
                    actions.setLoading(false);
                    workflowExecution.executeWorkflow();
                });
        }
    }, [mode, existingChatData, actions, initialMessageToExecute]);

    useEffect(() => {
        if (initialMessageToExecute && !hasExecutedInitialMessage.current) {
            hasExecutedInitialMessage.current = true;
            
            if (chatContainerRef.current) {
                chatContainerRef.current.setInputMessage(initialMessageToExecute);
            }
            
            const newSearchParams = new URLSearchParams(window.location.search);
            newSearchParams.delete('initial_message');
            newSearchParams.delete('initial_message_id');
            router.replace(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false });
        }
    }, [initialMessageToExecute, router]);

    useEffect(() => {
        scrollManagement.scrollToBottom();
    }, [ioLogs, scrollManagement]);

    useEffect(() => {
        const timer = setTimeout(() => {
            scrollManagement.scrollToBottom();
        }, 100);
        return () => clearTimeout(timer);
    }, [ioLogs, scrollManagement, workflowExecution.executing]);

    return (
        <div className={styles.container}>
            <ChatHeader {...chatHeaderProps} />
            <ChatToolsDisplay {...chatToolsProps} />
            <ChatContainer ref={chatContainerRef} {...chatContainerProps} />
            <DeploymentModal {...deploymentModalProps} />
            <CollectionModal {...collectionModalProps} />
        </div>
    );
});

ChatInterface.displayName = 'ChatInterfaceOptimized';

export default ChatInterface;