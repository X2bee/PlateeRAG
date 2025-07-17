'use client';
import React, { useState, useEffect } from 'react';
import ChatInterface from './ChatInterface';
import { FiMessageSquare } from 'react-icons/fi';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import chatContentStyles from '@/app/chat/assets/ChatContent.module.scss';

interface CurrentChatInterfaceProps {
    onBack?: () => void;
}

const CurrentChatInterface: React.FC<CurrentChatInterfaceProps> = ({ onBack }) => {
    const [currentChatData, setCurrentChatData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // localStorage에서 현재 채팅 정보 가져오기
        const savedChatData = localStorage.getItem('currentChatData');
        if (savedChatData) {
            try {
                const chatData = JSON.parse(savedChatData);
                setCurrentChatData(chatData);
            } catch (error) {
                console.error('Failed to parse current chat data:', error);
            }
        }
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className={chatContentStyles.chatContainer}>
                <div className={chatContentStyles.workflowSection}>
                    <div className={styles.container}>
                        <div className={styles.loadingState}>
                            <div className={styles.loadingSpinner}></div>
                            <p>현재 채팅을 불러오는 중...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentChatData) {
        return (
            <div className={chatContentStyles.chatContainer}>
                <div className={chatContentStyles.workflowSection}>
                    <div className={styles.container}>
                        <div className={styles.emptyState}>
                            <FiMessageSquare className={styles.emptyIcon} />
                            <h3>진행 중인 채팅이 없습니다</h3>
                            <p>새로운 채팅을 시작해보세요!</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 현재 채팅 데이터로 워크플로우 객체 생성
    const workflow = {
        id: currentChatData.workflowId,
        name: currentChatData.workflowName,
        filename: currentChatData.workflowName,
        author: 'Unknown',
        nodeCount: 0,
        status: 'active' as const,
    };

    const existingChatData = {
        interactionId: currentChatData.interactionId,
        workflowId: currentChatData.workflowId,
        workflowName: currentChatData.workflowName,
    };

    return (
        <div className={chatContentStyles.chatContainer}>
            <div className={chatContentStyles.workflowSection}>
                <ChatInterface
                    workflow={workflow}
                    existingChatData={existingChatData}
                    onBack={onBack || (() => {})}
                />
            </div>
        </div>
    );
};

export default CurrentChatInterface;
