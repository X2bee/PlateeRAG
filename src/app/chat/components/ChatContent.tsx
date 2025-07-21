import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '@/app/chat/assets/ChatContent.module.scss';
import { LuWorkflow } from "react-icons/lu";
import { IoChatbubblesOutline } from "react-icons/io5";
import WorkflowSelection from './WorkflowSelection';
import ChatInterface from './ChatInterface';

interface ChatContentProps {
    onChatStarted?: () => void; // 채팅 시작 후 호출될 콜백
}

const ChatContentInner: React.FC<ChatContentProps> = ({ onChatStarted }) => {
    const searchParams = useSearchParams();
    const [currentView, setCurrentView] = useState<'welcome' | 'workflow' | 'newChat' | 'existingChat' | 'defaultChat'>('welcome');
    const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
    const [existingChatData, setExistingChatData] = useState<any>(null);

    // URL 파라미터에서 기존 채팅 정보 확인
    useEffect(() => {
        const mode = searchParams.get('mode');
        const interactionId = searchParams.get('interaction_id');
        const workflowId = searchParams.get('workflow_id');
        const workflowName = searchParams.get('workflow_name');

        if (mode === 'existing' && interactionId && workflowId && workflowName) {
            const existingWorkflow = {
                id: workflowId,
                name: workflowName,
                filename: workflowName,
                author: 'Unknown',
                nodeCount: 0,
                status: 'active' as const,
            };
            
            setExistingChatData({
                interactionId,
                workflowId,
                workflowName,
            });
            
            setSelectedWorkflow(existingWorkflow);
            setCurrentView('existingChat');
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

    const getChatMode = () => {
        if (currentView === 'existingChat' && selectedWorkflow) return 'existing';
        if (currentView === 'newChat'&& selectedWorkflow) return 'new-workflow';
        if (currentView === 'defaultChat') return 'new-default';
        return null;
    };

    const chatMode = getChatMode();

    if (chatMode) {
        return (
            <div className="h-full">
            {chatMode && (
                <ChatInterface
                    key={chatMode === 'existing' ? existingChatData?.interactionId : chatMode}
                    mode={chatMode}
                    workflow={selectedWorkflow}
                    existingChatData={chatMode === 'existing' ? existingChatData : undefined}
                    onChatStarted={chatMode === 'existing' ? undefined : onChatStarted}
                    onBack={currentView === 'defaultChat' ? () => setCurrentView('welcome') : () => setCurrentView('workflow')}
                />
            )}
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
                    <p>AI와 대화하며 궁금한  물어보세요.</p>
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

const ChatContent: React.FC<ChatContentProps> = ({ onChatStarted }) => {
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
