'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/admin/assets/AdminGroupContent.module.scss';

interface Group {
    group_name: string;
    available: boolean;
    available_sections: string[];
}

interface AdminGroupPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    group: Group | null;
    onGroupChange: (group: Group) => void;
    onUpdate: () => void;
    availableSectionOptions: string[];
}

const AdminGroupPermissionModal: React.FC<AdminGroupPermissionModalProps> = ({
    isOpen,
    onClose,
    group,
    onGroupChange,
    onUpdate,
    availableSectionOptions,
}) => {
    if (!isOpen || !group) return null;

    const handleSectionToggle = (section: string) => {
        const currentSections = group.available_sections || [];
        const newSections = currentSections.includes(section)
            ? currentSections.filter(s => s !== section)
            : [...currentSections, section];

        onGroupChange({
            ...group,
            available_sections: newSections
        });
    };

    const handleAvailableToggle = () => {
        onGroupChange({
            ...group,
            available: !group.available
        });
    };

    return createPortal(
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <h3>권한 변경 - {group.group_name}</h3>

                <div className={styles.formGroup}>
                    <button
                        type="button"
                        className={`${styles.statusToggleButton} ${
                            group.available
                                ? styles.statusToggleActive
                                : styles.statusToggleInactive
                        }`}
                        onClick={handleAvailableToggle}
                    >
                        {group.available ? '활성화 상태입니다.' : '비활성화 상태입니다.'}
                    </button>
                </div>

                <div className={styles.formGroup}>
                    <label>사용 가능한 섹션</label>
                    <div className={styles.sectionGrid}>
                        {availableSectionOptions.map((section) => (
                            <button
                                key={section}
                                type="button"
                                className={`${styles.sectionButton} ${
                                    group.available_sections?.includes(section)
                                        ? styles.sectionButtonActive
                                        : styles.sectionButtonInactive
                                }`}
                                onClick={() => handleSectionToggle(section)}
                            >
                                {section}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button
                        onClick={onClose}
                        className={styles.cancelButton}
                    >
                        취소
                    </button>
                    <button
                        onClick={onUpdate}
                        className={styles.createButton}
                    >
                        권한 업데이트
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AdminGroupPermissionModal;
