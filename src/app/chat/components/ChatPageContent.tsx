'use client';

import React, { useState, useEffect } from 'react';
import ChatHistory from '@/app/chat/components/ChatHistory';
import CurrentChatInterface from '@/app/chat/components/CurrentChatInterface';
import ChatContent from '@/app/chat/components/ChatContent';
import { useSearchParams } from 'next/navigation';

const ChatPage: React.FC = () => {
    const searchParams = useSearchParams();
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
        setActiveSection('current-chat');
    };

    const handleChatStarted = () => {
        setActiveSection('current-chat');
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