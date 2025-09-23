'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from './assets/ColumnValueReplaceModal.module.scss';

interface ColumnValueReplaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReplaceValues: (columnName: string, oldValue: string, newValue: string) => void;
    availableColumns: string[];
}

// 컬럼 값 교체 모달 컴포넌트
export const ColumnValueReplaceModal: React.FC<ColumnValueReplaceModalProps> = ({
    isOpen,
    onClose,
    onReplaceValues,
    availableColumns
}) => {
    const [selectedColumn, setSelectedColumn] = useState<string>('');
    const [oldValue, setOldValue] = useState<string>('');
    const [newValue, setNewValue] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedColumn.trim()) {
            alert('컬럼을 선택해주세요.');
            return;
        }
        if (oldValue.trim() === '') {
            alert('기존 값을 입력해주세요.');
            return;
        }
        if (newValue.trim() === '') {
            alert('새로운 값을 입력해주세요.');
            return;
        }

        onReplaceValues(selectedColumn, oldValue, newValue);

        // 폼 초기화
        setSelectedColumn('');
        setOldValue('');
        setNewValue('');
        onClose();
    };

    const handleClose = () => {
        // 폼 초기화
        setSelectedColumn('');
        setOldValue('');
        setNewValue('');
        onClose();
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h3>컬럼 값 교체</h3>
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
                    </div>

                    <div className={styles.formGroup}>
                        <label>기존 값 *</label>
                        <input
                            type="text"
                            value={oldValue}
                            onChange={(e) => setOldValue(e.target.value)}
                            placeholder="교체할 기존 값을 입력하세요"
                            className={styles.formInput}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>새로운 값 *</label>
                        <input
                            type="text"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            placeholder="새로운 값을 입력하세요"
                            className={styles.formInput}
                        />
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
                        className={styles.confirmButton}
                        disabled={!selectedColumn.trim() || oldValue.trim() === '' || newValue.trim() === ''}
                    >
                        값 교체
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
