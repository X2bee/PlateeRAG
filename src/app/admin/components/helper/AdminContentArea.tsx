'use client';
import React from 'react';
import { AdminContentAreaProps } from '@/app/admin/components/types';
import styles from '@/app/admin/assets/AdminPage.module.scss';

const AdminContentArea: React.FC<AdminContentAreaProps> = ({
    title,
    description,
    children,
    className = '',
    headerButtons,
}) => {
    return (
        <div className={`${styles.contentArea} ${className}`}>
            <div className={styles.contentHeader}>
                <div className={styles.headerContent}>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
                {headerButtons && (
                    <div className={styles.headerButtons}>
                        {headerButtons}
                    </div>
                )}
            </div>
            {children}
        </div>
    );
};

export default AdminContentArea;
