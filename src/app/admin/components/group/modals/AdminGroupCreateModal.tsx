'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/admin/assets/AdminGroupContent.module.scss';

interface AdminGroupCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupName: string;
    onGroupNameChange: (name: string) => void;
    onCreate: () => void;
}

const AdminGroupCreateModal: React.FC<AdminGroupCreateModalProps> = ({
    isOpen,
    onClose,
    groupName,
    onGroupNameChange,
    onCreate,
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <h3>새 조직 생성</h3>
                <div className={styles.formGroup}>
                    <label>조직명 *</label>
                    <input
                        type="text"
                        value={groupName}
                        onChange={(e) => onGroupNameChange(e.target.value)}
                        placeholder="조직명을 입력하세요"
                        className={styles.formInput}
                    />
                </div>
                <div className={styles.modalActions}>
                    <button
                        onClick={onClose}
                        className={styles.cancelButton}
                    >
                        취소
                    </button>
                    <button
                        onClick={onCreate}
                        className={styles.createButton}
                    >
                        생성
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AdminGroupCreateModal;
