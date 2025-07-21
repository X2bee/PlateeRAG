'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/_common/components/Sidebar';
import ChatHistory from '@/app/chat/components/ChatHistory';
import CurrentChatInterface from '@/app/chat/components/CurrentChatInterface';
import ChatContent from '@/app/chat/components/ChatContent';
import { getChatSidebarItems, getSettingSidebarItems, createItemClickHandler } from '@/app/_common/components/sidebarConfig';
import styles from '@/app/main/assets/MainPage.module.scss';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const ChatPageContent: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [activeSection, setActiveSection] = useState<string>('new-chat');
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        const mode = searchParams.get('mode');
        const interactionId = searchParams.get('interaction_id');
        
        if (mode === 'current') {
            setActiveSection('current-chat');
        } else if (mode === 'existing' && interactionId) {
            setActiveSection('new-chat');
        } else if (mode === 'history') {
            setActiveSection('chat-history');
        } else {
            // localStorage에서 저장된 activeChatSection 확인
            const savedActiveChatSection = localStorage.getItem('activeChatSection');
            if (savedActiveChatSection && ['new-chat', 'current-chat', 'chat-history'].includes(savedActiveChatSection)) {
                setActiveSection(savedActiveChatSection);
                localStorage.removeItem('activeChatSection');
            }
            // 일반적인 activeSection도 확인 (기존 호환성 유지)
            else {
                const savedActiveSection = localStorage.getItem('activeSection');
                if (savedActiveSection && ['new-chat', 'current-chat', 'chat-history'].includes(savedActiveSection)) {
                    setActiveSection(savedActiveSection);
                    localStorage.removeItem('activeSection');
                }
            }
        }
        setInitialLoad(false);
    }, [searchParams]);

    useEffect(() => {
        if (!initialLoad) {
            const currentParams = new URLSearchParams(searchParams.toString());
            if (currentParams.has('mode') || currentParams.has('interaction_id')) {
                router.replace(pathname);
            }
        }
    }, [activeSection, initialLoad, pathname, router, searchParams]);

    const handleSidebarItemClick = (id: string) => {
        // 채팅 관련 아이템인지 확인
        const chatItems = ['new-chat', 'current-chat', 'chat-history'];
        if (chatItems.includes(id)) {
            setActiveSection(id);
        } else {
            // 다른 섹션으로 이동 (localStorage에 저장 후 /main으로 이동)
            const handleItemClick = createItemClickHandler(router);
            handleItemClick(id);
        }
    };

    const handleChatSelect = (executionMeta: any) => {
        console.log('Selected chat:', executionMeta);
        setActiveSection('current-chat');
    };

    const handleChatStarted = () => {
        // 채팅 시작 후 current-chat으로 전환
        setActiveSection('current-chat');
    };

    const settingSidebarItems = getSettingSidebarItems();
    const chatSidebarItems = getChatSidebarItems();

    const renderContent = () => {
        switch (activeSection) {
            case 'new-chat':
                return <ChatContent onChatStarted={handleChatStarted} />
            case 'current-chat':
                return <CurrentChatInterface />;
            case 'chat-history':
                return <ChatHistory onSelectChat={handleChatSelect} />
            default:
                return <ChatContent onChatStarted={handleChatStarted} />
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar
                items={settingSidebarItems}
                chatItems={chatSidebarItems}
                activeItem={activeSection}
                onItemClick={handleSidebarItemClick}
                initialChatExpanded={true}
                initialSettingExpanded={false}
            />
            <main className={styles.mainContent}>{renderContent()}</main>
        </div>
    );
};

export default ChatPageContent;
