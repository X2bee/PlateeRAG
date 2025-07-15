'use client';
import React from 'react';
import { ContentAreaProps } from './types';
import styles from '@/app/main/assets/MainPage.module.scss';

const ContentArea: React.FC<ContentAreaProps> = ({
    title,
    description,
    children,
    headerButtons,
    className = '',
}) => {
    return (
        <div className={`${styles.contentArea} ${className}`}>
            <header className={styles.contentHeader}>
                <div className={styles.headerContent}>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
                {headerButtons && (
                    <div className={styles.headerButtons}>{headerButtons}</div>
                )}
            </header>
            <div>{children}</div>
        </div>
    );
};

export default ContentArea;
