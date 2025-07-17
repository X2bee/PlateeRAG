'use client';
import React, { Suspense } from 'react';
import ChatPageContent from '@/app/chat/components/ChatPageContent';
import styles from '@/app/main/assets/MainPage.module.scss';

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
