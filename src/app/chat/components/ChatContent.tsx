import React from 'react';
import styles from '@/app/chat/assets/ChatContent.module.scss';
import { LuWorkflow } from "react-icons/lu";
import { IoChatbubblesOutline } from "react-icons/io5";

const ChatContent: React.FC = () => {
    return (
        <div className={styles.chatContainer}>
            <div className={styles.welcomeSection}>
                <div className={styles.welcomeContent}>
                    <h1>채팅을 시작하세요! 🚀</h1>
                    <p>AI와 대화하며 궁금한  물어보세요.</p>
                    <div className={styles.buttonContainer}>
                        <button className={styles.workflowButton}>
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
