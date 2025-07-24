'use client';
import React, { Suspense } from 'react';
import MainPageContent from '@/app/main/components/MainPageContent';
import AuthGuard from '@/app/_common/components/AuthGuard';
import styles from '@/app/main/assets/MainPage.module.scss';

const LoadingFallback = () => (
    <div className={styles.container}>
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
        </div>
    </div>
);

const MainPage: React.FC = () => {
    return (
        <AuthGuard fallback={<LoadingFallback />}>
            <Suspense fallback={<LoadingFallback />}>
                <MainPageContent />
            </Suspense>
        </AuthGuard>
    );
}

export default MainPage;