'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/app/main/components/Sidebar';
import ChatContent from '@/app/chat/components/ChatContent';
import ChatHistory from '@/app/chat/components/ChatHistory';
import CurrentChatInterface from '@/app/chat/components/CurrentChatInterface';
import { getSidebarItems, createItemClickHandler } from '@/app/_common/components/sidebarConfig';
import styles from '@/app/main/assets/MainPage.module.scss';

const ChatPageContent: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeMode, setActiveMode] = useState<'new-chat' | 'chat-history' | 'current-chat'>('chat-history');
    const sidebarItems = getSidebarItems();
    
    // URL 파라미터 확인해서 기존 채팅 모드인지 확인
    useEffect(() => {
        const mode = searchParams.get('mode');
        const interactionId = searchParams.get('interaction_id');
        
        if (mode === 'current') {
            // 현재 채팅 모드로 이동
            setActiveMode('current-chat');
        } else if (mode === 'existing' && interactionId) {
            // 기존 채팅 계속하기 모드 - ChatContent로 이동
            setActiveMode('new-chat');
        } else {
            // 기본적으로 채팅 히스토리 표시
            setActiveMode('chat-history');
        }
    }, [searchParams]);
    
    // 채팅 모드 변경 핸들러
    const handleChatModeClick = (mode: string) => {
        if (mode === 'new-chat' || mode === 'chat-history' || mode === 'current-chat') {
            setActiveMode(mode);
        } else {
            // 다른 메뉴 아이템들은 기존 핸들러 사용
            const handleItemClick = createItemClickHandler(router);
            handleItemClick(mode);
        }
    };

    // 채팅 선택 처리
    const handleChatSelect = (executionMeta: any) => {
        // 선택된 채팅을 현재 채팅으로 설정 후 current-chat 모드로 전환
        console.log('Selected chat:', executionMeta);
        setActiveMode('current-chat');
    };

    const renderContent = () => {
        switch (activeMode) {
            case 'new-chat':
                return <ChatContent />;
            case 'chat-history':
                return <ChatHistory onSelectChat={handleChatSelect} />;
            case 'current-chat':
                return <CurrentChatInterface />;
            default:
                return <ChatContent />;
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar 
                items={sidebarItems} 
                activeItem={activeMode}
                onItemClick={handleChatModeClick}
                initialChatExpanded={true}
                initialSettingExpanded={false}
            />
            <main className={styles.mainContent}>
                {renderContent()}
            </main>
        </div>
    );
};

const ChatPage: React.FC = () => {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <ChatPageContent />
        </Suspense>
    );
};

export default ChatPage;
