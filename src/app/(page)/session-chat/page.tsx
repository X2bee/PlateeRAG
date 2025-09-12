'use client';

import React, { Suspense } from 'react';
import SessionChatPageContent from '@/app/chat/components/SessionChatPageContent';
import AuthGuard from '@/app/_common/components/authGuard/AuthGuard';
import styles from '@/app/main/assets/MainPage.module.scss';

const LoadingFallback = () => (
    <div className={styles.container}>
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
        </div>
    </div>
);

const SessionChatPage: React.FC = () => {
    return (
        <AuthGuard fallback={<LoadingFallback />}>
            <Suspense fallback={<LoadingFallback />}>
                <SessionChatPageContent />
            </Suspense>
        </AuthGuard>
    );
};

export default SessionChatPage;