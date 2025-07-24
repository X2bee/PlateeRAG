import React, { Suspense } from 'react';
import PagesLayoutContent from '@/app/_common/components/PagesLayoutContent';
import styles from '@/app/main/assets/MainPage.module.scss';

const LoadingFallback = () => (
    <div className={styles.container}>
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
        </div>
    </div>
);

export default function PagesLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <PagesLayoutContent>{children}</PagesLayoutContent>
        </Suspense>
    );
}