'use client';
import React, { useState, useEffect, useMemo } from 'react';
import ChatInterface from './ChatInterface';
import { FiMessageSquare } from 'react-icons/fi';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import chatContentStyles from '@/app/chat/assets/ChatContent.module.scss';
import { useSearchParams } from 'next/navigation';
import { generateInteractionId } from '@/app/api/interactionAPI';

interface CurrentChatInterfaceProps {
    onBack?: () => void;
}

const CurrentChatInterface: React.FC<CurrentChatInterfaceProps> = ({ onBack }) => {
    const [currentChatData, setCurrentChatData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();

    const initialMessageToExecute = useMemo(() => searchParams.get('initial_message'), [searchParams]);

    useEffect(() => {
        setLoading(true);
        const savedDataString = localStorage.getItem('currentChatData');

        if (savedDataString) {
            try {
                setCurrentChatData(JSON.parse(savedDataString));
            } catch (error) {
                console.error('Failed to parse current chat data, clearing storage.', error);
                localStorage.removeItem('currentChatData');
                setCurrentChatData(null);
            }
            setLoading(false);
            return;
        }

        const workflowIdFromUrl = searchParams.get('workflowId');
        const workflowNameFromUrl = searchParams.get('workflowName');
        const isStartingNewChat = workflowIdFromUrl && workflowNameFromUrl;

        if (isStartingNewChat) {
            const newChatData = {
                workflowId: workflowIdFromUrl,
                workflowName: workflowNameFromUrl,
                interactionId: generateInteractionId(),
                startedAt: new Date().toISOString(),
            };
            localStorage.setItem('currentChatData', JSON.stringify(newChatData));
            setCurrentChatData(newChatData);
        } else {
            setCurrentChatData(null);
        }

        setLoading(false);
    }, [searchParams]);

    // Hook들은 항상 같은 순서로 호출되어야 함
    const workflow = useMemo(() => {
        if (!currentChatData) return null;
        return {
            id: currentChatData.workflowId,
            name: currentChatData.workflowName,
            filename: currentChatData.workflowName,
            author: 'Unknown',
            nodeCount: 0,
            status: 'active' as const,
        };
    }, [currentChatData]);

    const existingChatData = useMemo(() => {
        if (!currentChatData) return null;
        return {
            interactionId: currentChatData.interactionId,
            workflowId: currentChatData.workflowId,
            workflowName: currentChatData.workflowName,
        };
    }, [currentChatData]);

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

   if (!currentChatData || !workflow ) {
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

    return (
        <div className={chatContentStyles.chatContainer}>
            <div className={chatContentStyles.workflowSection}>
                <ChatInterface
                    mode="existing"
                    workflow={workflow}
                    existingChatData={existingChatData}
                    hideBackButton={true}
                    onBack={onBack || (() => { })}
                    initialMessageToExecute={initialMessageToExecute}
                />
            </div>
        </div>
    );
};

export default CurrentChatInterface;
