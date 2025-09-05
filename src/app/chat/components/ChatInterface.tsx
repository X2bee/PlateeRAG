'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { useRouter } from 'next/navigation';
import { getWorkflowIOLogs, loadWorkflow } from '@/app/api/workflow/workflowAPI';
import { loadWorkflow as loadWorkflowDeploy } from '@/app/api/workflow/workflowDeployAPI';
import { MessageRenderer } from '@/app/_common/components/chatParser/ChatParser';
import CollectionModal from '@/app/chat/components/CollectionModal';
import AIChatEditDropdown from '@/app/chat/components/AIChatEditModal/AIChatEditModal';
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
import { speakText, extractPlainText, sanitizeTextForTTS } from '@/app/_common/utils/ttsUtils';
import { showCopySuccessToastKo, showSuccessToastKo, showWarningToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';

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

    // AI 채팅 편집 드롭다운 상태
    const [showEditDropdown, setShowEditDropdown] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<{content: string, id?: string} | null>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{top: number, right: number}>({top: 0, right: 0});
    const [isReading, setIsReading] = useState(false);

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

    // AI 채팅 편집 관련 함수들
    const handleEditClick = useCallback((messageContent: string, messageId?: string, position?: { top: number; right: number }) => {
        setSelectedMessage({ content: messageContent, id: messageId });
        if (position) {
            setDropdownPosition(position);
        }
        setShowEditDropdown(true);
    }, []);

    const handleDebugClick = useCallback(() => {
        if (!selectedMessage) return;

        // 현재 메시지에 해당하는 IOLog 찾기
        const messageLog = ioLogs.find(log => log.output_data === selectedMessage.content);

        const debugInfo = {
            message_id: selectedMessage.id,
            user_input: messageLog?.input_data || 'Not found',
            ai_output: selectedMessage.content,
            log_id: messageLog?.log_id || 'Not available',
            workflow_id: messageLog?.workflow_id || workflow?.id || 'Not available',
            workflow_name: messageLog?.workflow_name || workflow?.name || 'Not available',
            updated_at: messageLog?.updated_at || 'Not available',
            log_data: messageLog || 'Log not found'
        };

        console.log('=== 디버그 정보 ===');
        console.log('메시지 ID:', debugInfo.message_id);
        console.log('사용자 입력:', debugInfo.user_input);
        console.log('AI 출력:', debugInfo.ai_output);
        console.log('Log ID:', debugInfo.log_id);
        console.log('Workflow ID:', debugInfo.workflow_id);
        console.log('Workflow Name:', debugInfo.workflow_name);
        console.log('업데이트 시간:', debugInfo.updated_at);
        console.log('전체 로그 데이터:', debugInfo.log_data);
        console.log('==================');

        // 알림으로도 표시
        alert(`디버그 정보가 콘솔에 출력되었습니다.\n\n` +
              `메시지 ID: ${debugInfo.message_id}\n` +
              `Log ID: ${debugInfo.log_id}\n` +
              `Workflow: ${debugInfo.workflow_name} (${debugInfo.workflow_id})\n\n` +
              `자세한 정보는 개발자 도구 콘솔을 확인하세요.`);

        handleCloseEditDropdown();
    }, [selectedMessage, ioLogs, workflow, workflowExecution]);

    const handleCloseEditDropdown = useCallback(() => {
        setShowEditDropdown(false);
        setSelectedMessage(null);
    }, []);

    const handleReadAloud = useCallback(async () => {
        if (!selectedMessage || isReading) return;

        setIsReading(true);

        try {
            devLog.log('Starting TTS for message:', selectedMessage.id);

            // 텍스트 전처리
            const plainText = extractPlainText(selectedMessage.content);
            const sanitizedText = sanitizeTextForTTS(plainText);

            if (!sanitizedText || sanitizedText.length < 10) {
                devLog.warn('Text is too short or empty after sanitization');
                showWarningToastKo({ message: '읽을 수 있는 텍스트가 충분하지 않습니다.' });
                return;
            }

            devLog.log('Sanitized text for TTS:', sanitizedText.substring(0, 100));

            // TTS 실행
            await speakText(sanitizedText);

            devLog.info('TTS completed successfully');

            // 드롭다운 닫기
            handleCloseEditDropdown();

        } catch (error) {
            devLog.error('TTS failed:', error);
            showErrorToastKo(error instanceof Error ? error.message : '음성 변환에 실패했습니다.');
        } finally {
            setIsReading(false);
        }
    }, [selectedMessage, isReading, handleCloseEditDropdown]);

    const handleCopyText = useCallback(() => {
        if (!selectedMessage) return;

        const plainText = extractPlainText(selectedMessage.content);
        navigator.clipboard.writeText(plainText).then(() => {
            devLog.info('Text copied to clipboard');
            showCopySuccessToastKo();
            handleCloseEditDropdown();
        }).catch((error) => {
            devLog.error('Copy failed:', error);
            showErrorToastKo('텍스트 복사에 실패했습니다.');
        });
    }, [selectedMessage, handleCloseEditDropdown]);

    // 메모이제이션된 렌더 함수들
    const renderMessageContent = useCallback((content: string, isUserMessage: boolean = false, onHeightChange?: () => void, messageId?: string) => {
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

        // messageId가 없으면 content 기반의 간단한 해시 생성
        const generateSafeId = (text: string): string => {
            let hash = 0;
            for (let i = 0; i < text.length; i++) {
                const char = text.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(36);
        };

        const finalMessageId = messageId || `msg-${generateSafeId(content)}-${Date.now()}`;

        return (
            <MessageRenderer
                mode={mode}
                content={content}
                isUserMessage={isUserMessage}
                onViewSource={handleViewSourceWithContext}
                onHeightChange={handleHeightChangeInternal}
                messageId={finalMessageId}
                timestamp={Date.now()}
                showEditButton={!isUserMessage} // AI 메시지에만 편집 버튼 표시
                onEditClick={handleEditClick}
            />
        );
    }, [handleViewSource, scrollManagement, mode, handleEditClick]);

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
                        const workflowData = await loadWorkflow(workflow.name, workflow.user_id);
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

            <AIChatEditDropdown
                isOpen={showEditDropdown}
                onClose={handleCloseEditDropdown}
                messageContent={selectedMessage?.content || ''}
                onReadAloud={handleReadAloud}
                onCopy={handleCopyText}
                position={dropdownPosition}
                isReading={isReading}
                onDebug={handleDebugClick}
            />
        </div>
    );
});

ChatInterface.displayName = 'ChatInterfaceOptimized';

export default ChatInterface;
