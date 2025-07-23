'use client';
import React, { Suspense } from 'react';
import ChatPageContent from '@/app/chat/components/ChatPageContent';
import AuthGuard from '@/app/_common/components/AuthGuard';
import styles from '@/app/main/assets/MainPage.module.scss';

const LoadingFallback = () => (
    <div className={styles.container}>
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
        </div>
    </div>
);

const ChatPage: React.FC = () => {
    return (
        <AuthGuard fallback={<LoadingFallback />}>
            <Suspense fallback={<LoadingFallback />}>
                <ChatPageContent />
            </Suspense>
        </AuthGuard>
    );
};

export default ChatPage;
