'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from '@/app/main/chatSection/assets/ChatInterface.module.scss';
import { useRouter } from 'next/navigation';
import { getWorkflowIOLogs, loadWorkflow, rateWorkflowIOLog } from '@/app/_common/api/workflow/workflowAPI';
import { loadWorkflow as loadWorkflowDeploy } from '@/app/_common/api/workflow/workflowDeployAPI';
import { MessageRenderer } from '@/app/_common/components/chatParser/ChatParser';
import CollectionModal from '@/app/main/chatSection/components/CollectionModal';
import AIChatEditDropdown from '@/app/main/chatSection/components/AIChatEditModal/AIChatEditModal';
import { IOLog, ChatInterfaceProps } from './types';
import ChatHeader from './ChatHeader';
import { DeploymentModal } from './DeploymentModal';
import ChatToolsDisplay from './ChatToolsDisplay';
import { generateInteractionId } from '@/app/_common/api/interactionAPI';
import { devLog } from '@/app/_common/utils/logger';
import { SourceInfo } from '../types/source';
import { ChatContainer, ChatContainerRef } from './ChatContainer';
import { useWorkflowExecution } from '../hooks/useWorkflowExecution';
import { useCollectionManagement } from '../hooks/useCollectionManagement';
import { useScrollManagement } from '../hooks/useScrollManagement';
import { useChatState } from '../hooks/useChatState';
import { speakText, extractPlainText, sanitizeTextForTTS } from '@/app/_common/utils/ttsUtils';
import { showCopySuccessToastKo, showSuccessToastKo, showWarningToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import { getTTSSimpleStatus } from '@/app/_common/api/ttsAPI';
import { defaultConfig } from 'next/dist/server/config-shared';

interface TTSSimpleStatusResponse {
    available: boolean;
    provider: string | null;
    model: string | null;
    api_key_configured?: boolean;
    error?: string;
}

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
    const [ttsAvailable, setTtsAvailable] = useState(true); // TTS 사용 가능 여부

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

    const handleRatingButtonClick = useCallback(() => {
        // 별점 평가 UI만 표시 - 디버그 정보는 제거
    }, []);

    const handleRatingClick = useCallback(async (rating: number) => {
        console.log('=== 별점 평가 시작 ===');
        console.log('평가 점수:', rating);
        console.log('메시지 ID:', selectedMessage?.id);
        console.log('메시지 내용:', selectedMessage?.content);

        try {
            // 현재 메시지에 해당하는 IOLog 찾기
            const messageLog = ioLogs.find(log => log.output_data === selectedMessage?.content);

            if (messageLog && workflow) {
                let ioId = (messageLog as any)?.io_id;

                // io_id가 없으면 API에서 최신 정보를 가져와서 찾기
                if (!ioId) {
                    try {
                        console.log('io_id가 없어서 API에서 최신 정보 가져오는 중...');

                        let interactionId = existingChatData?.interactionId;
                        if (!interactionId) {
                            const recentLog = ioLogs[ioLogs.length - 1];
                            if (recentLog) {
                                interactionId = `${recentLog.workflow_name}_${Date.now()}`;
                            }
                        }

                        if (interactionId) {
                            const latestLogs = await getWorkflowIOLogs(
                                workflow.name,
                                workflow.id,
                                interactionId
                            );

                            if (latestLogs && (latestLogs as any).in_out_logs) {
                                const matchingLog = (latestLogs as any).in_out_logs.find(
                                    (log: any) => log.output_data === selectedMessage?.content
                                );

                                if (matchingLog) {
                                    ioId = matchingLog.io_id;
                                    console.log('API에서 io_id 찾음:', ioId);
                                }
                            }
                        }
                    } catch (fetchError) {
                        console.error('최신 로그 가져오기 실패:', fetchError);
                    }
                }

                if (ioId) {
                    // 별점 평가 API 호출
                    console.log('별점 평가 API 호출 중...');
                    console.log('Parameters:', {
                        IOID: ioId,
                        workflowName: workflow.name,
                        workflowId: workflow.id,
                        interactionId: existingChatData?.interactionId || 'default',
                        rating: rating
                    });

                    const result = await rateWorkflowIOLog(
                        ioId,
                        workflow.name,
                        workflow.id,
                        existingChatData?.interactionId || 'default',
                        rating
                    );

                    console.log('별점 평가 성공:', result);
                    showSuccessToastKo(`${rating}점으로 평가가 완료되었습니다.`);
                } else {
                    console.error('io_id를 찾을 수 없습니다.');
                    showErrorToastKo('평가 처리 중 오류가 발생했습니다. (io_id 없음)');
                }
            } else {
                console.error('메시지 로그 또는 워크플로우 정보가 없습니다.');
                showErrorToastKo('평가 처리 중 오류가 발생했습니다. (로그 정보 없음)');
            }
        } catch (error) {
            console.error('별점 평가 중 오류:', error);
            showErrorToastKo('평가 처리 중 오류가 발생했습니다.');
        }

        console.log('==================');
        handleCloseEditDropdown();
    }, [selectedMessage, ioLogs, workflow, existingChatData]);    const handleCloseEditDropdown = useCallback(() => {
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
        streaming: workflowExecution.streaming,
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
        onCancelStreaming: workflowExecution.cancelStreaming,
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
        workflowExecution.streaming,
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
        workflowExecution.cancelStreaming,
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
                if (mode === 'deploy' && user_id) {
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

    // TTS 상태 확인
    useEffect(() => {
        const checkTtsStatus = async () => {
            try {
                const data = await getTTSSimpleStatus() as TTSSimpleStatusResponse;
                setTtsAvailable(data.available);
            } catch (error) {
                // 네트워크 에러 시 비활성화
                setTtsAvailable(false);
            }
        };

        checkTtsStatus();
    }, []);

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
                onDebug={handleRatingButtonClick}
                onRating={handleRatingClick}
                ttsAvailable={ttsAvailable}
            />
        </div>
    );
});

ChatInterface.displayName = 'ChatInterfaceOptimized';

export default ChatInterface;
