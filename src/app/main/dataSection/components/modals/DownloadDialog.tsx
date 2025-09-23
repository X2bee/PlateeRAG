'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from './assets/DownloadDialog.module.scss';

interface DownloadDialogState {
    isOpen: boolean;
    repoId: string;
    filename: string;
    split: string;
}

interface DownloadDialogProps {
    dialogState: DownloadDialogState;
    downloading: boolean;
    onClose: () => void;
    onDownload: () => void;
    onUpdateDialog: (updates: Partial<DownloadDialogState>) => void;
}

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
                <div className={styles.header}>
                    <h3>Huggingface 데이터셋 다운로드</h3>
                    <button
                        onClick={onClose}
                        className={styles.closeButton}
                        disabled={downloading}
                    >
                        <IoClose size={20} />
                    </button>
                </div>
                <div className={styles.dialogForm}>
                    <div className={styles.formGroup}>
                        <label>Repository ID *</label>
                        <input
                            type="text"
                            value={dialogState.repoId}
                            onChange={(e) => onUpdateDialog({ repoId: e.target.value })}
                            placeholder="예: squad, glue"
                            disabled={downloading}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>파일명 (선택사항)</label>
                        <input
                            type="text"
                            value={dialogState.filename}
                            onChange={(e) => onUpdateDialog({ filename: e.target.value })}
                            placeholder="특정 파일명"
                            disabled={downloading}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>데이터 분할 (선택사항)</label>
                        <input
                            type="text"
                            value={dialogState.split}
                            onChange={(e) => onUpdateDialog({ split: e.target.value })}
                            placeholder="예: train, test, validation"
                            disabled={downloading}
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
