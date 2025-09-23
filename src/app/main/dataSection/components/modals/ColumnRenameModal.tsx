'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from './assets/ColumnRenameModal.module.scss';

interface ColumnRenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRenameColumn: (oldName: string, newName: string) => void;
    availableColumns: string[];
}

// 컬럼 이름 변경 모달 컴포넌트
export const ColumnRenameModal: React.FC<ColumnRenameModalProps> = ({
    isOpen,
    onClose,
    onRenameColumn,
    availableColumns
}) => {
    const [oldName, setOldName] = useState<string>('');
    const [newName, setNewName] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!oldName.trim()) {
            alert('이름을 변경할 컬럼을 선택해주세요.');
            return;
        }
        if (!newName.trim()) {
            alert('새로운 컬럼명을 입력해주세요.');
            return;
        }

        // 컬럼명 중복 체크 (자기 자신과 같은 이름인 경우는 허용)
        if (availableColumns.includes(newName.trim()) && oldName.trim() !== newName.trim()) {
            alert('이미 존재하는 컬럼명입니다. 다른 이름을 입력해주세요.');
            return;
        }

        // 같은 이름으로 변경하려는 경우 체크
        if (oldName.trim() === newName.trim()) {
            alert('기존 이름과 같은 이름으로 변경할 수 없습니다.');
            return;
        }

        onRenameColumn(oldName, newName);

        // 폼 초기화
        setOldName('');
        setNewName('');
        onClose();
    };

    const handleClose = () => {
        // 폼 초기화
        setOldName('');
        setNewName('');
        onClose();
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h3>컬럼 이름 변경</h3>
                    <button
                        onClick={handleClose}
                        className={styles.closeButton}
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                <div className={styles.dialogForm}>
                    <div className={styles.formGroup}>
                        <label>이름을 변경할 컬럼 선택 *</label>
                        <select
                            value={oldName}
                            onChange={(e) => setOldName(e.target.value)}
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
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
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
                        disabled={!oldName.trim() || !newName.trim()}
                    >
                        변경
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
