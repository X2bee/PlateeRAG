'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from './assets/ColumnOperationModal.module.scss';

interface ColumnOperationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyOperation: (columnName: string, operation: string) => void;
    availableColumns: string[];
}

// 컬럼 연산 적용 모달 컴포넌트
export const ColumnOperationModal: React.FC<ColumnOperationModalProps> = ({
    isOpen,
    onClose,
    onApplyOperation,
    availableColumns
}) => {
    const [selectedColumn, setSelectedColumn] = useState<string>('');
    const [operation, setOperation] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedColumn.trim()) {
            alert('컬럼을 선택해주세요.');
            return;
        }
        if (!operation.trim()) {
            alert('연산식을 입력해주세요.');
            return;
        }

        // 연산식 유효성 간단 검사
        const operationPattern = /^[+\-*/\d.]+$/;
        if (!operationPattern.test(operation.trim())) {
            alert('유효하지 않은 연산식입니다. +, -, *, /, 숫자, 소수점만 사용 가능합니다.');
            return;
        }

        onApplyOperation(selectedColumn, operation);

        // 폼 초기화
        setSelectedColumn('');
        setOperation('');
        onClose();
    };

    const handleClose = () => {
        // 폼 초기화
        setSelectedColumn('');
        setOperation('');
        onClose();
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h3>컬럼 연산 적용</h3>
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
                        <label>연산식 *</label>
                        <input
                            type="text"
                            value={operation}
                            onChange={(e) => setOperation(e.target.value)}
                            placeholder="예: +5, -3, *2, /4, *2+1"
                            className={styles.formInput}
                        />
                        <small className={styles.formHint}>
                            사용 가능한 연산자: +, -, *, /, 숫자, 소수점 (예: +5, *2.5, /3+1)
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
                        className={styles.confirmButton}
                        disabled={!selectedColumn.trim() || !operation.trim()}
                    >
                        연산 적용
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
