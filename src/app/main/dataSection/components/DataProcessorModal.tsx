'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from '@/app/main/dataSection/assets/DataProcessorModal.module.scss';

interface DataTableRow {
    [key: string]: any;
}

interface DownloadDialogState {
    isOpen: boolean;
    repoId: string;
    filename: string;
    split: string;
}

interface ColumnInfoModalProps {
    isOpen: boolean;
    columnInfo: string | object | null;
    onClose: () => void;
}

interface DownloadDialogProps {
    dialogState: DownloadDialogState;
    downloading: boolean;
    onClose: () => void;
    onDownload: () => void;
    onUpdateDialog: (updates: Partial<DownloadDialogState>) => void;
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
            <div className={styles.dialog} style={{ maxWidth: '800px', maxHeight: '80vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>컬럼 정보</h3>
                    <button
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '0.25rem',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <IoClose size={20} />
                    </button>
                </div>
                <div style={{ overflow: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
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

// 다운로드 다이얼로그 컴포넌트
export const DownloadDialog: React.FC<DownloadDialogProps> = ({
    dialogState,
    downloading,
    onClose,
    onDownload,
    onUpdateDialog
}) => {
    if (!dialogState.isOpen) return null;

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <h3>Huggingface 데이터셋 다운로드</h3>
                <div className={styles.dialogForm}>
                    <div className={styles.formGroup}>
                        <label>Repository ID *</label>
                        <input
                            type="text"
                            value={dialogState.repoId}
                            onChange={(e) => onUpdateDialog({ repoId: e.target.value })}
                            placeholder="예: squad, glue"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>파일명 (선택사항)</label>
                        <input
                            type="text"
                            value={dialogState.filename}
                            onChange={(e) => onUpdateDialog({ filename: e.target.value })}
                            placeholder="특정 파일명"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>데이터 분할 (선택사항)</label>
                        <input
                            type="text"
                            value={dialogState.split}
                            onChange={(e) => onUpdateDialog({ split: e.target.value })}
                            placeholder="예: train, test, validation"
                        />
                    </div>
                </div>
                <div className={styles.dialogActions}>
                    <button
                        onClick={onClose}
                        className={styles.cancelButton}
                        disabled={downloading}
                    >
                        취소
                    </button>
                    <button
                        onClick={onDownload}
                        className={styles.confirmButton}
                        disabled={downloading || !dialogState.repoId.trim()}
                    >
                        {downloading ? '다운로드 중...' : '다운로드'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
