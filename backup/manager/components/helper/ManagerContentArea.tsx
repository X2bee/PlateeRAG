'use client';
import React from 'react';
import { ManagerContentAreaProps } from '@/app/manager/components/types';
import styles from '@/app/manager/assets/ManagerPage.module.scss';

const ManagerContentArea: React.FC<ManagerContentAreaProps> = ({
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

export default ManagerContentArea;
