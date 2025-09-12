'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { useRouter } from 'next/navigation';
import { MessageRenderer } from '@/app/_common/components/chatParser/ChatParser';
import { IOLog } from './types';
import ChatHeader from './ChatHeader';
import { generateInteractionId } from '@/app/api/interactionAPI';
import { devLog } from '@/app/_common/utils/logger';
import { SourceInfo } from '../types/source';
import { ChatContainer, ChatContainerRef } from './ChatContainer';
import { useChatState } from '../hooks/useChatState';
import { useSessionWorkflowExecution } from '../hooks/useSessionWorkflowExecution';
import { speakText, extractPlainText, sanitizeTextForTTS } from '@/app/_common/utils/ttsUtils';
import { showCopySuccessToastKo, showSuccessToastKo, showWarningToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';

interface SessionChatInterfaceProps {
    sessionId: string;
    onBack: () => void;
}

// 세션 데이터 타입 정의
interface SessionData {
    sessionId: string;
    messages: IOLog[];
    workflow?: any;
    createdAt: string;
    lastActiveAt: string;
    interactionId?: string;
}

// 기본 워크플로우 설정 (일반 채팅용)
const DEFAULT_WORKFLOW = {
    id: "default_mode",
    name: "일반 채팅",
    description: "기본 대화 모드",
    author: "system",
    nodeCount: 0,
    status: 'active' as const,
};

const SessionChatInterface: React.FC<SessionChatInterfaceProps> = ({
    sessionId,
    onBack,
}) => {
    const router = useRouter();
    const chatContainerRef = useRef<ChatContainerRef>(null);
    const messagesRef = useRef<HTMLDivElement>(null);

    // 세션 상태
    const [sessionData, setSessionData] = useState<SessionData>({
        sessionId,
        messages: [],
        workflow: DEFAULT_WORKFLOW,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
    });

    // 로컬 상태
    const [ioLogs, setIOLogs] = useState<IOLog[]>([]);

    // 통합 상태 관리
    const { state, actions } = useChatState();

    // 스크롤 관리
    const scrollToBottom = useCallback(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, []);

    // 워크플로우 실행 훅
    const workflowExecution = useSessionWorkflowExecution({
        sessionId,
        sessionData,
        setSessionData,
        setIOLogs,
        scrollToBottom,
        saveSessionToStorage: (data: SessionData) => {
            try {
                localStorage.setItem(`session-${sessionId}`, JSON.stringify(data));
            } catch (error) {
                devLog.error('Failed to save session data:', error);
            }
        }
    });

    // 세션 데이터 로드
    const loadSessionFromStorage = useCallback((): SessionData | null => {
        try {
            const data = localStorage.getItem(`session-${sessionId}`);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            devLog.error('Failed to load session data:', error);
        }
        return null;
    }, [sessionId]);


    // 메시지 전송 핸들러
    const handleSendMessage = useCallback((message: string) => {
        if (!message.trim() || workflowExecution.executing) return;
        
        devLog.log('Sending message in session:', sessionId, message);
        workflowExecution.executeWorkflow(message);
        
        // 스크롤을 아래로
        setTimeout(() => {
            scrollToBottom();
        }, 100);
    }, [sessionId, workflowExecution, scrollToBottom]);

    // 소스 뷰 핸들러 (기존과 동일)
    const handleViewSource = useCallback((sourceInfo: SourceInfo, messageContent?: string) => {
        actions.showPDFViewer(sourceInfo);
    }, [actions]);

    // PDF 뷰어 닫기 핸들러
    const handlePDFViewerClose = useCallback(() => {
        actions.hidePDFViewer();
    }, [actions]);

    // 메시지 렌더링
    const renderMessageContent = useCallback((content: string, isUserMessage: boolean = false, onHeightChange?: () => void, messageId?: string) => {
        if (!content) return null;

        const handleViewSourceWithContext = (sourceInfo: SourceInfo) => {
            handleViewSource(sourceInfo, content);
        };

        // messageId 생성
        const generateSafeId = (text: string): string => {
            let hash = 0;
            for (let i = 0; i < text.length; i++) {
                const char = text.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(36);
        };

        const finalMessageId = messageId || `session-msg-${generateSafeId(content)}-${Date.now()}`;

        return (
            <MessageRenderer
                mode="new-default"
                content={content}
                isUserMessage={isUserMessage}
                onViewSource={handleViewSourceWithContext}
                onHeightChange={onHeightChange}
                messageId={finalMessageId}
                timestamp={Date.now()}
                showEditButton={false} // 세션 채팅에서는 편집 기능 비활성화
                onEditClick={() => {}}
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

    // 세션 데이터 초기화
    useEffect(() => {
        const savedSession = loadSessionFromStorage();
        if (savedSession) {
            setSessionData(savedSession);
            setIOLogs(savedSession.messages);
            devLog.log('Loaded session data:', savedSession);
        } else {
            devLog.log('No existing session data, using defaults');
        }
    }, [loadSessionFromStorage]);

    // ChatHeader props
    const chatHeaderProps = useMemo(() => ({
        mode: 'new-default' as const,
        workflow: sessionData.workflow || DEFAULT_WORKFLOW,
        ioLogs,
        onBack,
        hideBackButton: false,
    }), [sessionData.workflow, ioLogs, onBack]);

    // ChatContainer props
    const chatContainerProps = useMemo(() => ({
        showPDFViewer: state.ui.showPDFViewer,
        panelSplit: state.panel.split,
        setPanelSplit: actions.setPanelSplit,
        onPanelResize: (size: number) => actions.setPanelSplit(size),
        mode: 'new-default' as const,
        loading: state.ui.loading,
        ioLogs,
        workflow: sessionData.workflow || DEFAULT_WORKFLOW,
        executing: workflowExecution.executing,
        setInputMessage: (message: string) => {
            chatContainerRef.current?.setInputMessage(message);
        },
        messagesRef,
        pendingLogId: workflowExecution.pendingLogId,
        renderMessageContent,
        formatDate,
        selectedCollections: [],
        collectionMapping: {},
        onRemoveCollection: () => {},
        showAttachmentMenu: state.ui.showAttachmentMenu,
        onAttachmentClick: actions.toggleAttachmentMenu,
        onAttachmentOption: (option: string) => {
            actions.setAttachmentMenu(false);
            if (option === 'collection') {
                actions.toggleCollectionModal();
            }
        },
        onSendMessage: handleSendMessage,
        onShiftEnter: () => {
            scrollToBottom();
        },
        initialMessage: undefined,
        currentSourceInfo: state.pdfViewer.currentSourceInfo,
        user_id: undefined,
        onPDFViewerClose: handlePDFViewerClose,
        hideInputUI: false,
        error: workflowExecution.error,
    }), [
        state.ui.showPDFViewer,
        state.ui.loading,
        state.ui.showAttachmentMenu,
        state.panel.split,
        state.pdfViewer.currentSourceInfo,
        actions,
        ioLogs,
        sessionData.workflow,
        workflowExecution.executing,
        workflowExecution.pendingLogId,
        workflowExecution.error,
        messagesRef,
        renderMessageContent,
        formatDate,
        handleSendMessage,
        handlePDFViewerClose,
        scrollToBottom,
    ]);

    return (
        <div className={styles.container}>
            <ChatHeader {...chatHeaderProps} />
            <div className={styles.sessionInfo}>
                <span>세션 ID: {sessionId}</span>
                <span>메시지 수: {ioLogs.length}</span>
                {sessionData.lastActiveAt && (
                    <span>마지막 활동: {formatDate(sessionData.lastActiveAt)}</span>
                )}
            </div>
            <ChatContainer ref={chatContainerRef} {...chatContainerProps} />
        </div>
    );
};

export default SessionChatInterface;