'use client';
import React, { Suspense } from 'react';
import AuthGuard from '@/app/_common/components/AuthGuard';
import styles from '@/app/main/assets/MainPage.module.scss';
import ModelPageContent from '@/app/model/components/ModelPageContent';

const LoadingFallback = () => (
    <div className={styles.container}>
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
        </div>
    </div>
);

const ModelPage: React.FC = () => {
    return (
        <AuthGuard fallback={<LoadingFallback />}>
            <Suspense fallback={<LoadingFallback />}>
                <ModelPageContent />
            </Suspense>
        </AuthGuard>
    );
}

export default ModelPage;