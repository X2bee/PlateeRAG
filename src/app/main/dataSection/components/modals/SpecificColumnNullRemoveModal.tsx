'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from './assets/SpecificColumnNullRemoveModal.module.scss';

interface SpecificColumnNullRemoveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRemoveNullRows: (columnName: string) => void;
    availableColumns: string[];
}

// 특정 컬럼 NULL 제거 모달 컴포넌트
export const SpecificColumnNullRemoveModal: React.FC<SpecificColumnNullRemoveModalProps> = ({
    isOpen,
    onClose,
    onRemoveNullRows,
    availableColumns
}) => {
    const [selectedColumn, setSelectedColumn] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedColumn.trim()) {
            alert('컬럼을 선택해주세요.');
            return;
        }

        onRemoveNullRows(selectedColumn);

        // 폼 초기화
        setSelectedColumn('');
        onClose();
    };

    const handleClose = () => {
        // 폼 초기화
        setSelectedColumn('');
        onClose();
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h3>특정 컬럼 결측치 제거</h3>
                    <button
                        onClick={handleClose}
                        className={styles.closeButton}
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                <div className={styles.dialogForm}>
                    <div className={styles.formGroup}>
                        <label>대상 컬럼 *</label>
                        <select
                            value={selectedColumn}
                            onChange={(e) => setSelectedColumn(e.target.value)}
                            className={styles.formSelect}
                        >
                            <option value="">컬럼을 선택하세요</option>
                            {availableColumns.map((column) => (
                                <option key={column} value={column}>
                                    {column}
                                </option>
                            ))}
                        </select>
                        <small className={styles.formHint}>
                            선택한 컬럼에 NULL 값이 있는 모든 행이 제거됩니다.
                        </small>
                    </div>
                </div>

                <div className={styles.dialogActions}>
                    <button
                        onClick={handleClose}
                        className={styles.cancelButton}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={styles.deleteButton}
                        disabled={!selectedColumn.trim()}
                    >
                        결측치 제거
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
