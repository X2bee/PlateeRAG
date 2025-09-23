'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose, IoAdd, IoTrash } from 'react-icons/io5';
import styles from './assets/ColumnFormatModal.module.scss';

interface ColumnFormatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFormatColumns: (columnNames: string[], template: string, newColumn: string) => void;
    availableColumns: string[];
}

// 컬럼 문자열 포맷팅 모달 컴포넌트
export const ColumnFormatModal: React.FC<ColumnFormatModalProps> = ({
    isOpen,
    onClose,
    onFormatColumns,
    availableColumns
}) => {
    const [selectedColumns, setSelectedColumns] = useState<string[]>(['']);
    const [template, setTemplate] = useState<string>('');
    const [newColumn, setNewColumn] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        // 빈 컬럼 제거
        const validColumns = selectedColumns.filter(col => col.trim() !== '');

        if (validColumns.length === 0) {
            alert('최소 하나의 컬럼을 선택해주세요.');
            return;
        }
        if (!template.trim()) {
            alert('문자열 템플릿을 입력해주세요.');
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

        onFormatColumns(validColumns, template, newColumn);

        // 폼 초기화
        setSelectedColumns(['']);
        setTemplate('');
        setNewColumn('');
        onClose();
    };

    const handleClose = () => {
        // 폼 초기화
        setSelectedColumns(['']);
        setTemplate('');
        setNewColumn('');
        onClose();
    };

    const addColumnSlot = () => {
        setSelectedColumns([...selectedColumns, '']);
    };

    const removeColumnSlot = (index: number) => {
        if (selectedColumns.length > 1) {
            setSelectedColumns(selectedColumns.filter((_, i) => i !== index));
        }
    };

    const updateColumnSlot = (index: number, value: string) => {
        const newColumns = [...selectedColumns];
        newColumns[index] = value;
        setSelectedColumns(newColumns);
    };

    const generateTemplateExample = () => {
        const validColumns = selectedColumns.filter(col => col.trim() !== '');
        if (validColumns.length === 0) return '';

        const placeholders = validColumns.map((_, index) => `{col${index + 1}}`).join('_');
        return `예: ${placeholders}`;
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h3>컬럼 문자열 포맷팅</h3>
                    <button
                        onClick={handleClose}
                        className={styles.closeButton}
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                <div className={styles.dialogForm}>
                    <div className={styles.formGroup}>
                        <label>사용할 컬럼들 *</label>
                        <div className={styles.columnsList}>
                            {selectedColumns.map((column, index) => (
                                <div key={index} className={styles.columnRow}>
                                    <select
                                        value={column}
                                        onChange={(e) => updateColumnSlot(index, e.target.value)}
                                        className={styles.formSelect}
                                    >
                                        <option value="">컬럼을 선택하세요</option>
                                        {availableColumns.map((col) => (
                                            <option key={col} value={col}>
                                                {col}
                                            </option>
                                        ))}
                                    </select>
                                    <div className={styles.columnActions}>
                                        {selectedColumns.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeColumnSlot(index)}
                                                className={styles.removeColumnButton}
                                                title="컬럼 제거"
                                            >
                                                <IoTrash size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addColumnSlot}
                                className={styles.addColumnButton}
                            >
                                <IoAdd size={16} />
                                컬럼 추가
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>문자열 템플릿 *</label>
                        <input
                            type="text"
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            placeholder="예: {col1}_데이터_{col2}"
                            className={styles.formInput}
                        />
                        <small className={styles.formHint}>
                            {generateTemplateExample() || '컬럼을 선택하면 템플릿 예시가 표시됩니다.'}
                            <br />
                            {'{col1}, {col2} 형태로 컬럼 순서대로 참조됩니다.'}
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
                        disabled={selectedColumns.filter(col => col.trim() !== '').length === 0 || !template.trim() || !newColumn.trim()}
                    >
                        포맷팅 실행
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
