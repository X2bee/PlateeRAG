import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from '@/app/main/chatSection/assets/ChatContent.module.scss';
import { LuWorkflow } from "react-icons/lu";
import { IoChatbubblesOutline } from "react-icons/io5";
import WorkflowSelection from './WorkflowSelection';
import ChatInterface from './ChatInterface';
import { normalizeWorkflowName } from '@/app/api/interactionAPI';

interface ChatContentProps {
    onChatStarted?: () => void; // 채팅 시작 후 호출될 콜백
}

const ChatContentInner: React.FC<ChatContentProps> = ({ onChatStarted}) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [currentView, setCurrentView] = useState<'welcome' | 'workflow' | 'newChat' | 'existingChat' | 'defaultChat'>('welcome');
    const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
    const [existingChatData, setExistingChatData] = useState<any>(null);

    // URL 파라미터에서 기존 채팅 정보 확인
    useEffect(() => {
        const mode = searchParams.get('mode');
        const interactionId = searchParams.get('interaction_id');
        const workflowId = searchParams.get('workflow_id');
        const workflowName = searchParams.get('workflow_name');

        // handleExecute에서 전달된 워크플로우 정보 확인
        const executeWorkflowId = searchParams.get('workflowId');
        const executeWorkflowName = searchParams.get('workflowName');
        const executeUserId = searchParams.get('user_id');

        if (mode === 'existing' && interactionId && workflowId && workflowName) {
            const existingWorkflow = {
                id: workflowId,
                name: workflowName,
                filename: workflowName,
                author: 'Unknown',
                nodeCount: 0,
                status: 'active' as const,
                user_id: executeUserId ? parseInt(executeUserId) : 0,
            };

            setExistingChatData({
                interactionId,
                workflowId,
                workflowName,
            });

            setSelectedWorkflow(existingWorkflow);
            setCurrentView('existingChat');
        } else if (mode === 'new-chat' && executeWorkflowId && executeWorkflowName) {
            // 워크플로우 실행 모드: URL 파라미터에서 받은 워크플로우를 자동 선택
            const selectedWorkflowFromExecute = {
                id: executeWorkflowId,
                name: decodeURIComponent(executeWorkflowName),
                filename: decodeURIComponent(executeWorkflowName),
                author: 'AI-LAB',
                nodeCount: 0,
                status: 'active' as const,
                user_id: executeUserId ? parseInt(executeUserId) : 0,
            };

            setSelectedWorkflow(selectedWorkflowFromExecute);
            setCurrentView('newChat');
        }
    }, [searchParams]);

    const handleWorkflowSelect = (workflow: any) => {
        setSelectedWorkflow(workflow);
        setCurrentView('newChat');
    };

    const handleDefaultChatStart = () => {
        setSelectedWorkflow({
            id: 'default_mode',
            name: 'default_mode',
            filename: 'default_chat',
            author: 'System',
            nodeCount: 1,
            status: 'active' as const,
        });
        setCurrentView('defaultChat');
    };

    const handleStartNewChat = useCallback((message: string) => {
        if (!selectedWorkflow || !message.trim()) return;

        // 중복 호출 방지를 위한 debounce 처리
        const debounceKey = `new-chat-${selectedWorkflow.id}-${Date.now()}`;
        if ((window as any)[debounceKey]) return;
        (window as any)[debounceKey] = true;

        // 500ms 후 debounce 키 제거
        setTimeout(() => {
            delete (window as any)[debounceKey];
        }, 500);

        localStorage.removeItem('currentChatData');

        // user_id가 있으면 localStorage에 저장
        if (selectedWorkflow.user_id) {
            localStorage.setItem('currentWorkflowUserId', selectedWorkflow.user_id.toString());
        }

        const params = new URLSearchParams();
        params.set('mode', 'current-chat');
        params.set('workflowId', selectedWorkflow.id);
        params.set('workflowName', normalizeWorkflowName(selectedWorkflow.name));

        // URL 길이 제한 체크 (일반적으로 2000자 이하 권장)
        const maxUrlLength = 1500; // 안전 마진 포함
        const baseUrl = `/chat?mode=current-chat&workflowId=${selectedWorkflow.id}&workflowName=${normalizeWorkflowName(selectedWorkflow.name)}&initial_message=`;

        if (baseUrl.length + encodeURIComponent(message).length > maxUrlLength) {
            // 메시지가 너무 길면 localStorage에 저장하고 ID만 전달
            const messageId = `initial_msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            localStorage.setItem(messageId, message);
            params.set('initial_message_id', messageId);
        } else {
            params.set('initial_message', message);
        }

        const finalUrl = `/chat?${params.toString()}`;
        router.replace(finalUrl);

    }, [selectedWorkflow, router]);

    const getChatMode = () => {
        if (currentView === 'existingChat' && selectedWorkflow) return 'existing';
        if (currentView === 'newChat' && selectedWorkflow) return 'new-workflow';
        if (currentView === 'defaultChat') return 'new-default';
        return null;
    };

    const chatMode = getChatMode();

    if (chatMode) {
        return (
            <div className={styles.chatContainer}>
                <div className={styles.workflowSection}>
                    {chatMode && (
                        <ChatInterface
                            key={chatMode === 'existing' ? existingChatData?.interactionId : selectedWorkflow.id}
                            mode={chatMode}
                            workflow={selectedWorkflow}
                            existingChatData={chatMode === 'existing' ? existingChatData : undefined}
                            onStartNewChat={handleStartNewChat}
                            onBack={currentView === 'defaultChat' ? () => setCurrentView('welcome') : () => setCurrentView('workflow')}
                        />
                    )}
                </div>
            </div>
        );
    };

// 워크플로우 선택 화면
if (currentView === 'workflow') {
    return (
        <div className={styles.chatContainer}>
            <div className={styles.workflowSection}>
                <WorkflowSelection
                    onBack={() => setCurrentView('welcome')}
                    onSelectWorkflow={handleWorkflowSelect}
                />
            </div>
        </div>
    );
}

// 웰컴 화면
return (
    <div className={styles.chatContainer}>
        <div className={styles.welcomeSection}>
            <div className={styles.welcomeContent}>
                <h1>채팅을 시작하세요! 🚀</h1>
                <p>당신만의 AI와 대화해보세요.</p>
                <div className={styles.buttonContainer}>
                    <button
                        className={styles.workflowButton}
                        onClick={() => setCurrentView('workflow')}
                    >
                        <LuWorkflow />
                        <h3>Workflow 선택</h3>
                        <p>정해진 워크플로우로 시작하기</p>
                    </button>
                    <button
                        className={styles.chatButton}
                        onClick={handleDefaultChatStart}
                    >
                        <IoChatbubblesOutline />
                        <h3>일반 채팅 시작</h3>
                        <p>자유롭게 대화하기</p>
                    </button>
                </div>
            </div>
        </div>
    </div>
);
};

const ChatContent: React.FC<ChatContentProps> = ({ onChatStarted}) => {
    return (
        <Suspense fallback={
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading chat...</p>
            </div>
        }>
            <ChatContentInner onChatStarted={onChatStarted} />
        </Suspense>
    );
};

export default ChatContent;
