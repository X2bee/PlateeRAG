'use client';

import React, { useState, useEffect } from 'react';
import SessionChatInterface from '@/app/chat/components/SessionChatInterface';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePagesLayout } from '@/app/_common/components/PagesLayoutContent';

const SessionChatPageContent: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const layoutContext = usePagesLayout();
    
    // URL에서 세션 ID 추출
    const sessionId = searchParams.get('session') || 'default-session';

    const handleBackToMain = () => {
        if (layoutContext) {
            layoutContext.navigateToChatMode('new-chat');
        } else {
            router.push('/chat?mode=new-chat');
        }
    };

    return (
        <SessionChatInterface 
            sessionId={sessionId}
            onBack={handleBackToMain}
        />
    );
};

export default SessionChatPageContent;