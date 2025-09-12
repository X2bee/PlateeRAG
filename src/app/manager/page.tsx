'use client';
import React, { Suspense } from 'react';
import ManagerPageContent from '@/app/manager/components/ManagerPageContent';
import styles from '@/app/manager/assets/ManagerPage.module.scss';

const LoadingFallback = () => (
    <div className={styles.container}>
        <div className={styles.loadingContainer}>
            {/* <div className={styles.spinner}></div> */}
        </div>
    </div>
);

const ManagerPage: React.FC = () => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ManagerPageContent />
        </Suspense>
    );
}

export default ManagerPage;
