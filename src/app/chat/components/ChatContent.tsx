import React, { useState } from 'react';
import styles from '@/app/chat/assets/ChatContent.module.scss';
import { LuWorkflow } from "react-icons/lu";
import { IoChatbubblesOutline } from "react-icons/io5";
import WorkflowSelection from './WorkflowSelection';

const ChatContent: React.FC = () => {
    const [currentView, setCurrentView] = useState<'welcome' | 'workflow'>('welcome');

    const handleWorkflowSelect = (workflow: any) => {
        // 워크플로우 선택 후 로직 (나중에 구현)
        console.log('Selected workflow:', workflow);
    };

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
