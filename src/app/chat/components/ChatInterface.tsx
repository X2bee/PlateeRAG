'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { useRouter } from 'next/navigation';
import { getWorkflowIOLogs, loadWorkflow } from '@/app/api/workflow/workflowAPI';
import { loadWorkflow as loadWorkflowDeploy } from '@/app/api/workflow/workflowDeployAPI';
import { MessageRenderer } from '@/app/_common/components/chatParser/ChatParser';
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

interface NewChatInterfaceProps extends ChatInterfaceProps {
    onStartNewChat?: (message: string) => void;
    initialMessageToExecute?: string | null;
    user_id?: number | string;
    hideInputUI?: boolean; // 새로 추가된 prop
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
    hideInputUI = false, // 새로 추가된 prop
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
        scrollManagement.scrollToBottom();
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
        actions.setAttachmentMenu(false);

        if (option === 'collection') {
            actions.toggleCollectionModal();
        }
    }, [actions]);

    // 메모이제이션된 렌더 함수들
    const renderMessageContent = useCallback((content: string, isUserMessage: boolean = false, onHeightChange?: () => void) => {
        if (!content) return null;

        const handleViewSourceWithContext = (sourceInfo: SourceInfo) => {
            handleViewSource(sourceInfo, content);
        };

        const handleHeightChangeInternal = () => {
            if (onHeightChange) {
                onHeightChange();
            }
            // LaTeX 렌더링으로 인한 높이 변화 시 스크롤 위치 조정
            if (messagesRef.current && !scrollManagement.isUserScrolling) {
                setTimeout(() => {
                    scrollManagement.scrollToBottom();
                }, 50);
            }
        };

        return (
            <MessageRenderer
                mode={mode}
                content={content}
                isUserMessage={isUserMessage}
                onViewSource={handleViewSourceWithContext}
                onHeightChange={handleHeightChangeInternal}
            />
        );
    }, [handleViewSource, scrollManagement]);

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
        mode: mode,
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
        onShiftEnter: scrollManagement.scrollToBottom,
        initialMessage: initialMessageToExecute || undefined,
        currentSourceInfo: state.pdfViewer.currentSourceInfo,
        user_id,
        onPDFViewerClose: handlePDFViewerClose,
        error: workflowExecution.error,
        hideInputUI, // 새로 추가된 prop 전달
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
        scrollManagement.scrollToBottom,
        initialMessageToExecute,
        user_id,
        handlePDFViewerClose,
        hideInputUI, // dependency에도 추가
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

    useEffect(() => {
        if (workflow && workflow.id && workflow.id !== "default_mode") {
            const loadWorkflowContent = async () => {
                if (user_id) {
                    try {
                        const workflowData = await loadWorkflowDeploy(workflow.name, user_id);
                        actions.setWorkflowDetail(workflowData);
                        localStorage.setItem('workflowContentDetail', JSON.stringify(workflowData));
                        devLog.log('Successfully loaded workflow content detail:', workflowData);
                    } catch (error) {
                        devLog.error('Failed to load workflow content detail:', error);
                    }
                } else {
                    try {
                        const workflowData = await loadWorkflow(workflow.name);
                        actions.setWorkflowDetail(workflowData);
                        localStorage.setItem('workflowContentDetail', JSON.stringify(workflowData));
                        devLog.log('Successfully loaded workflow content detail:', workflowData);
                    } catch (error) {
                        devLog.error('Failed to load workflow content detail:', error);
                    }
                }
            };

            actions.setLoading(true);
            loadWorkflowContent();
            actions.setLoading(false);
        }
    }, [workflow, user_id]);

    useEffect(() => {
        if (mode === 'existing' && existingChatData?.interactionId && !initialMessageToExecute && !hasLoadedExistingChat.current) {
            hasLoadedExistingChat.current = true;
            const message = chatContainerRef.current?.getInputMessage();
            chatContainerRef.current?.clearInputMessage();
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
                    workflowExecution.executeWorkflow(undefined, message);
                });
        }
    }, [mode, existingChatData, actions, initialMessageToExecute, workflowExecution]);

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
    }, [initialMessageToExecute, router, handleSendMessage]);

    useEffect(() => {
        // 새 메시지가 추가되었을 때만 자동 스크롤 (사용자가 위로 스크롤하지 않은 경우)
        const lastLog = ioLogs[ioLogs.length - 1];
        if (lastLog && lastLog.output_data) {
            const timer = setTimeout(() => {
                scrollManagement.scrollToBottom();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [ioLogs.length, scrollManagement]);

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
