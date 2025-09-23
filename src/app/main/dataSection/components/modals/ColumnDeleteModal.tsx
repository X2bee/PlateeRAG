'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from './assets/ColumnDeleteModal.module.scss';

interface ColumnDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeleteMultipleColumns: (columnNames: string[]) => void;
    availableColumns: string[];
}

// 컬럼 삭제 모달 컴포넌트
export const ColumnDeleteModal: React.FC<ColumnDeleteModalProps> = ({
    isOpen,
    onClose,
    onDeleteMultipleColumns,
    availableColumns
}) => {
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

    if (!isOpen) return null;

    const handleMultipleDelete = () => {
        if (selectedColumns.length === 0) {
            return;
        }
        onDeleteMultipleColumns(selectedColumns);
        setSelectedColumns([]);
        onClose();
    };

    const toggleColumnSelection = (columnName: string) => {
        setSelectedColumns(prev =>
            prev.includes(columnName)
                ? prev.filter(col => col !== columnName)
                : [...prev, columnName]
        );
    };

    const selectAllColumns = () => {
        if (selectedColumns.length === availableColumns.length) {
            setSelectedColumns([]);
        } else {
            setSelectedColumns([...availableColumns]);
        }
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h3>컬럼 삭제</h3>
                    <button
                        onClick={onClose}
                        className={styles.closeButton}
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.controlsHeader}>
                        <p>삭제할 컬럼을 선택해주세요:</p>
                        <button
                            onClick={selectAllColumns}
                            className={styles.selectAllButton}
                        >
                            {selectedColumns.length === availableColumns.length ? '모두 해제' : '모두 선택'}
                        </button>
                    </div>

                    <div className={styles.columnDeleteGrid}>
                        {availableColumns.map((columnName) => (
                            <div key={columnName} className={styles.columnDeleteItem}>
                                <label className={styles.columnDeleteLabel}>
                                    <input
                                        type="checkbox"
                                        checked={selectedColumns.includes(columnName)}
                                        onChange={() => toggleColumnSelection(columnName)}
                                        className={styles.columnDeleteCheckbox}
                                    />
                                    <span className={styles.columnDeleteName}>{columnName}</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.dialogActions}>
                    <button
                        onClick={onClose}
                        className={styles.cancelButton}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleMultipleDelete}
                        className={styles.deleteButton}
                        disabled={selectedColumns.length === 0}
                    >
                        선택된 {selectedColumns.length}개 컬럼 삭제
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
