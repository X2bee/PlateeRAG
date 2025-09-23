'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from './assets/ColumnCopyModal.module.scss';

interface ColumnCopyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCopyColumn: (sourceColumn: string, newColumn: string) => void;
    availableColumns: string[];
}

// 컬럼 복사 모달 컴포넌트
export const ColumnCopyModal: React.FC<ColumnCopyModalProps> = ({
    isOpen,
    onClose,
    onCopyColumn,
    availableColumns
}) => {
    const [sourceColumn, setSourceColumn] = useState<string>('');
    const [newColumn, setNewColumn] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!sourceColumn.trim()) {
            alert('복사할 컬럼을 선택해주세요.');
            return;
        }
        if (!newColumn.trim()) {
            alert('새로운 컬럼명을 입력해주세요.');
            return;
        }

        // 컬럼명 중복 체크
        if (availableColumns.includes(newColumn.trim())) {
            alert('이미 존재하는 컬럼명입니다. 다른 이름을 입력해주세요.');
            return;
        }

        onCopyColumn(sourceColumn, newColumn);

        // 폼 초기화
        setSourceColumn('');
        setNewColumn('');
        onClose();
    };

    const handleClose = () => {
        // 폼 초기화
        setSourceColumn('');
        setNewColumn('');
        onClose();
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h3>컬럼 복사</h3>
                    <button
                        onClick={handleClose}
                        className={styles.closeButton}
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                <div className={styles.dialogForm}>
                    <div className={styles.formGroup}>
                        <label>복사할 컬럼 선택 *</label>
                        <select
                            value={sourceColumn}
                            onChange={(e) => setSourceColumn(e.target.value)}
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
                        <label>새로운 컬럼명 *</label>
                        <input
                            type="text"
                            value={newColumn}
                            onChange={(e) => setNewColumn(e.target.value)}
                            placeholder="새로운 컬럼명을 입력하세요"
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
                        disabled={!sourceColumn.trim() || !newColumn.trim()}
                    >
                        복사
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
