'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from './assets/ColumnCalculationModal.module.scss';

interface ColumnCalculationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCalculateColumns: (col1: string, col2: string, operation: string, newColumn: string) => void;
    availableColumns: string[];
}

// 컬럼 연산 모달 컴포넌트
export const ColumnCalculationModal: React.FC<ColumnCalculationModalProps> = ({
    isOpen,
    onClose,
    onCalculateColumns,
    availableColumns
}) => {
    const [col1, setCol1] = useState<string>('');
    const [col2, setCol2] = useState<string>('');
    const [operation, setOperation] = useState<string>('+');
    const [newColumn, setNewColumn] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!col1.trim()) {
            alert('첫 번째 컬럼을 선택해주세요.');
            return;
        }
        if (!col2.trim()) {
            alert('두 번째 컬럼을 선택해주세요.');
            return;
        }
        if (!operation.trim()) {
            alert('연산자를 선택해주세요.');
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

        onCalculateColumns(col1, col2, operation, newColumn);

        // 폼 초기화
        setCol1('');
        setCol2('');
        setOperation('+');
        setNewColumn('');
        onClose();
    };

    const handleClose = () => {
        // 폼 초기화
        setCol1('');
        setCol2('');
        setOperation('+');
        setNewColumn('');
        onClose();
    };

    const generateExpressionExample = () => {
        const col1Name = col1 || 'column1';
        const col2Name = col2 || 'column2';
        return `${col1Name} ${operation} ${col2Name}`;
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h3>컬럼 연산</h3>
                    <button
                        onClick={handleClose}
                        className={styles.closeButton}
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                <div className={styles.dialogForm}>
                    <div className={styles.formGroup}>
                        <label>첫 번째 컬럼 *</label>
                        <select
                            value={col1}
                            onChange={(e) => setCol1(e.target.value)}
                            className={styles.formSelect}
                        >
                            <option value="">컬럼을 선택하세요</option>
                            {availableColumns.map((col) => (
                                <option key={col} value={col}>
                                    {col}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>연산자 *</label>
                        <div className={styles.operatorButtons}>
                            {['+', '-', '*', '/'].map((op) => (
                                <button
                                    key={op}
                                    type="button"
                                    onClick={() => setOperation(op)}
                                    className={`${styles.operatorBtn} ${operation === op ? styles.active : ''}`}
                                >
                                    {op === '+' ? '+' : op === '-' ? '-' : op === '*' ? '×' : '÷'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>두 번째 컬럼 *</label>
                        <select
                            value={col2}
                            onChange={(e) => setCol2(e.target.value)}
                            className={styles.formSelect}
                        >
                            <option value="">컬럼을 선택하세요</option>
                            {availableColumns.map((col) => (
                                <option key={col} value={col}>
                                    {col}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>연산 미리보기</label>
                        <div className={styles.previewBox}>
                            {generateExpressionExample()}
                        </div>
                        <small className={styles.formHint}>
                            선택한 컬럼들과 연산자로 수행될 연산입니다.
                        </small>
                    </div>

                    <div className={styles.formGroup}>
                        <label>새로운 컬럼명 *</label>
                        <input
                            type="text"
                            value={newColumn}
                            onChange={(e) => setNewColumn(e.target.value)}
                            placeholder="생성될 컬럼명을 입력하세요"
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
                        disabled={!col1.trim() || !col2.trim() || !operation.trim() || !newColumn.trim()}
                    >
                        연산 실행
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
