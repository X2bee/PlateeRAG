'use client';
import React, { Suspense } from 'react';
import AdminPageContent from '@/app/admin/components/AdminPageContent';
import AdminAuthGuard from '@/app/admin/components/AdminAuthGuard';
import styles from '@/app/admin/assets/AdminPage.module.scss';

const LoadingFallback = () => (
    <div className={styles.container}>
        <div className={styles.loadingContainer}>
            {/* <div className={styles.spinner}></div> */}
        </div>
    </div>
);

const AdminPage: React.FC = () => {
    return (
        <AdminAuthGuard fallback={<LoadingFallback />}>
            <Suspense fallback={<LoadingFallback />}>
                <AdminPageContent />
            </Suspense>
        </AdminAuthGuard>
    );
}

export default AdminPage;
