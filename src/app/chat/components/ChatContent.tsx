import React, { useState } from 'react';
import styles from '@/app/chat/assets/ChatContent.module.scss';
import { LuWorkflow } from "react-icons/lu";
import { IoChatbubblesOutline } from "react-icons/io5";
import WorkflowSelection from './WorkflowSelection';
import ChatInterface from './ChatInterface';

const ChatContent: React.FC = () => {
    const [currentView, setCurrentView] = useState<'welcome' | 'workflow' | 'chat'>('welcome');
    const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);

    const handleWorkflowSelect = (workflow: any) => {
        setSelectedWorkflow(workflow);
        setCurrentView('chat');
    };

    // 채팅 화면
    if (currentView === 'chat' && selectedWorkflow) {
        return (
            <div className={styles.chatContainer}>
                <div className={styles.workflowSection}>
                    <ChatInterface 
                        workflow={selectedWorkflow}
                        onBack={() => setCurrentView('workflow')}
                    />
                </div>
            </div>
        );
    }

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
                        <button className={styles.chatButton}>
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

export default ChatContent;
