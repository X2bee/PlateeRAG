'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from './assets/ColumnInfoModal.module.scss';

interface ColumnInfoModalProps {
    isOpen: boolean;
    columnInfo: string | object | null;
    onClose: () => void;
}

// 컬럼 정보 포매팅 함수
const formatColumnInfo = (columnInfo: string | object): React.ReactNode => {
    if (typeof columnInfo === 'string') {
        return columnInfo;
    }

    if (typeof columnInfo === 'object' && columnInfo !== null) {
        try {
            const columnData = columnInfo as Record<string, any>;
            return (
                <div className={styles.columnInfoGrid}>
                    {Object.entries(columnData).map(([key, value]) => (
                        <div key={key} className={styles.columnInfoItem}>
                            <span className={styles.columnName}>{key}:</span>
                            <span className={styles.columnType}>
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        } catch (error) {
            return JSON.stringify(columnInfo, null, 2);
        }
    }

    return 'N/A';
};

// 컬럼 정보 모달 컴포넌트
export const ColumnInfoModal: React.FC<ColumnInfoModalProps> = ({
    isOpen,
    columnInfo,
    onClose
}) => {
    if (!isOpen || !columnInfo) return null;

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h3>컬럼 정보</h3>
                    <button
                        onClick={onClose}
                        className={styles.closeButton}
                    >
                        <IoClose size={20} />
                    </button>
                </div>
                <div className={styles.content}>
                    {formatColumnInfo(columnInfo)}
                </div>
                <div className={styles.dialogActions}>
                    <button
                        onClick={onClose}
                        className={styles.confirmButton}
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
