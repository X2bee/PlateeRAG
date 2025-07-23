'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/_common/components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import ChatHistory from '@/app/chat/components/ChatHistory';
import CurrentChatInterface from '@/app/chat/components/CurrentChatInterface';
import ChatContent from '@/app/chat/components/ChatContent';
import { getChatSidebarItems, getSettingSidebarItems, createItemClickHandler } from '@/app/_common/components/sidebarConfig';
import styles from '@/app/main/assets/MainPage.module.scss';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FiChevronRight } from 'react-icons/fi';

const ChatPageContent: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
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

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleChatSelect = (executionMeta: any) => {
        console.log('Selected chat:', executionMeta);
        setActiveSection('current-chat');
    };

    const handleChatStarted = () => {
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
            <AnimatePresence>
                {isSidebarOpen ? (
                    <Sidebar 
                    key="sidebar-panel" 
                    isOpen={isSidebarOpen}
                    onToggle={toggleSidebar}
                    items={settingSidebarItems}
                    chatItems={chatSidebarItems}
                    activeItem={activeSection}
                    onItemClick={handleSidebarItemClick}
                    initialChatExpanded={true}
                    initialSettingExpanded={false}/>
                ) : (
                    <motion.button
                        key="sidebar-open-button"
                        onClick={toggleSidebar}
                        className={styles.openOnlyBtn}
                        initial={{ opacity: 0 }} // 열기 버튼도 페이드인 효과 추가
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <FiChevronRight />
                    </motion.button>
                )}
            </AnimatePresence>
            <main className={`${styles.mainContent} ${!isSidebarOpen ? styles.mainContentPushed  : ''}` }>
                {renderContent()}</main>
        </div>
    );
};

export default ChatPageContent;
