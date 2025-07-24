'use client';

import React, { useState, useEffect } from 'react';
import ChatHistory from '@/app/chat/components/ChatHistory';
import CurrentChatInterface from '@/app/chat/components/CurrentChatInterface';
import ChatContent from '@/app/chat/components/ChatContent';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePagesLayout } from '@/app/_common/components/PagesLayoutContent';

const ChatPage: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const layoutContext = usePagesLayout();
    const [activeSection, setActiveSection] = useState<string>('new-chat');

    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode && ['new-chat', 'current-chat', 'chat-history'].includes(mode)) {
            setActiveSection(mode);
        } else {
            setActiveSection('new-chat'); // 기본값 설정
        }
    }, [searchParams]);

    const handleChatSelect = () => {
        if (layoutContext) {
            layoutContext.navigateToChatMode('current-chat');
        } else {
            router.replace('/chat?mode=current-chat');
        }
    };

    const handleChatStarted = () => {
        if (layoutContext) {
            layoutContext.navigateToChatMode('current-chat');
        } else {
            router.replace('/chat?mode=current-chat');
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'new-chat':
                return <ChatContent onChatStarted={handleChatStarted} />;
            case 'current-chat':
                return <CurrentChatInterface />;
            case 'chat-history':
                return <ChatHistory onSelectChat={handleChatSelect} />;
            default:
                return <ChatContent onChatStarted={handleChatStarted} />;
        }
    };

    return <>{renderContent()}</>;
};

export default ChatPage;