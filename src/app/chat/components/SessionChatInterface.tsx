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

    // 세션 데이터 저장
    const saveSessionToStorage = useCallback((data: SessionData) => {
        try {
            localStorage.setItem(`session-${sessionId}`, JSON.stringify(data));
        } catch (error) {
            devLog.error('Failed to save session data:', error);
        }
    }, [sessionId]);

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

    // 메시지 전송 시뮬레이션 (실제로는 API 연동)
    const simulateMessageExecution = useCallback(async (message: string) => {
        setExecuting(true);
        setError(null);

        const logId = generateInteractionId();
        setPendingLogId(logId);

        // 사용자 메시지 생성
        const userLog: IOLog = {
            log_id: logId,
            workflow_name: sessionData.workflow?.name || 'session-chat',
            workflow_id: sessionData.workflow?.id || 'default_mode',
            input_data: message,
            output_data: '', // 초기에는 빈 값
            updated_at: new Date().toISOString(),
        };

        // 즉시 사용자 메시지를 로그에 추가
        setIOLogs(prev => [...prev, userLog]);

        try {
            // 실제 AI 응답 시뮬레이션 (3초 후 응답)
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
            
            // AI 응답 생성 (실제로는 API 호출)
            const aiResponse = `안녕하세요! "${message}"에 대한 응답입니다. 

이것은 세션 ${sessionId}의 테스트 응답이며, 현재 시간은 ${new Date().toLocaleTimeString()}입니다.

실제 구현에서는 여기서 워크플로우 API를 호출하거나 기존 ChatInterface의 실행 로직을 재사용하게 됩니다.`;

            // 완료된 로그로 업데이트
            const completedLog: IOLog = {
                ...userLog,
                output_data: aiResponse,
            };

            setIOLogs(prev => 
                prev.map(log => 
                    log.log_id === logId ? completedLog : log
                )
            );

            // 세션 데이터 업데이트 및 저장
            const updatedSessionData: SessionData = {
                ...sessionData,
                messages: [...sessionData.messages, completedLog],
                lastActiveAt: new Date().toISOString(),
            };
            
            setSessionData(updatedSessionData);
            saveSessionToStorage(updatedSessionData);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
            setError(errorMessage);
            devLog.error('Message execution failed:', err);
        } finally {
            setExecuting(false);
            setPendingLogId(null);
        }
    }, [sessionData, sessionId, saveSessionToStorage]);

    // 메시지 전송 핸들러
    const handleSendMessage = useCallback((message: string) => {
        if (!message.trim() || executing) return;
        
        devLog.log('Sending message in session:', sessionId, message);
        simulateMessageExecution(message);
        
        // 스크롤을 아래로
        setTimeout(() => {
            if (messagesRef.current) {
                messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
            }
        }, 100);
    }, [sessionId, executing, simulateMessageExecution]);

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
        executing,
        setInputMessage: (message: string) => {
            chatContainerRef.current?.setInputMessage(message);
        },
        messagesRef,
        pendingLogId,
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
            if (messagesRef.current) {
                messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
            }
        },
        initialMessage: undefined,
        currentSourceInfo: state.pdfViewer.currentSourceInfo,
        user_id: undefined,
        onPDFViewerClose: handlePDFViewerClose,
        hideInputUI: false,
        error,
    }), [
        state.ui.showPDFViewer,
        state.ui.loading,
        state.ui.showAttachmentMenu,
        state.panel.split,
        state.pdfViewer.currentSourceInfo,
        actions,
        ioLogs,
        sessionData.workflow,
        executing,
        messagesRef,
        pendingLogId,
        renderMessageContent,
        formatDate,
        handleSendMessage,
        handlePDFViewerClose,
        error,
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