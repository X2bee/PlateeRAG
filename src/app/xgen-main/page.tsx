'use client';
import React, { Suspense } from 'react';
import AuthGuard from '@/app/_common/components/authGuard/AuthGuard';
import styles from '@/app/main/assets/MainPage.module.scss';
import XgenLayoutContent from '@/app/xgen-main/components/XgenLayoutContent';

const LoadingFallback = () => (
    <div className={styles.container}>
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
        </div>
    </div>
);

const XgenPage: React.FC = () => {
    return (
        <AuthGuard fallback={<LoadingFallback />}>
            <Suspense fallback={<LoadingFallback />}>
                <XgenLayoutContent />
            </Suspense>
        </AuthGuard>
    );
}

export default XgenPage;
