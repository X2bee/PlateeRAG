import React, { useState, useEffect } from 'react';
import styles from '@/app/canvas/assets/NodeModal.module.scss';

interface NodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (value: string) => void;
    parameterName: string;
    initialValue: string;
}

const NodeModal: React.FC<NodeModalProps> = ({
    isOpen,
    onClose,
    onSave,
    parameterName,
    initialValue
}) => {
    const [value, setValue] = useState<string>(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue, isOpen]);

    const handleSave = () => {
        onSave(value);
        onClose();
    };

    const handleCancel = () => {
        setValue(initialValue);
        onClose();
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h3>Edit {parameterName}</h3>
                    <button
                        className={styles.closeButton}
                        onClick={handleCancel}
                        type="button"
                    >
                        ×
                    </button>
                </div>
                <div className={styles.modalBody}>
                    <textarea
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        onDragStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDrag={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDragEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        draggable={false}
                        className={styles.textarea}
                        placeholder={`Enter ${parameterName}...`}
                        autoFocus
                    />
                </div>
                <div className={styles.modalFooter}>
                    <button
                        className={styles.cancelButton}
                        onClick={handleCancel}
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        type="button"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NodeModal;
