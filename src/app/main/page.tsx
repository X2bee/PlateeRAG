'use client';
import React, { Suspense } from 'react';
import MainPageContent from '@/app/main/components/MainPageContent';
import styles from '@/app/main/assets/MainPage.module.scss';

const LoadingFallback = () => (
    <div className={styles.container}>
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading...</p>
        </div>
    </div>
);

const MainPage: React.FC = () => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <MainPageContent />
        </Suspense>
    );
};

export default MainPage;
