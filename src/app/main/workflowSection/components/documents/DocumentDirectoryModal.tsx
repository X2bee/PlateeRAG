'use client';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/main/workflowSection/assets/Documents.module.scss';
import { createFolder } from '@/app/api/rag/folderAPI';
import { Collection, Folder } from '@/app/main/workflowSection/types/index';

interface DocumentDirectoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCollection: Collection | null;
    currentFolder: Folder | null;
    folderPath: Folder[];
    onSuccess: () => void;
}

const DocumentDirectoryModal: React.FC<DocumentDirectoryModalProps> = ({
    isOpen,
    onClose,
    selectedCollection,
    currentFolder,
    folderPath,
    onSuccess
}) => {
    const [newFolderName, setNewFolderName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateFolder = async () => {
        if (!selectedCollection || !newFolderName.trim()) return;

        try {
            setLoading(true);
            setError(null);

            await createFolder(
                newFolderName.trim(),
                selectedCollection.id,
                currentFolder?.id || null,
                currentFolder?.folder_name || null
            );

            setNewFolderName('');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create folder:', error);
            setError('폴더 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setNewFolderName('');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>새 폴더 생성</h3>
                    <button
                        onClick={handleClose}
                        className={styles.modalCloseButton}
                    >
                        ×
                    </button>
                </div>

                <div className={styles.modalContent}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.modalField}>
                        <label>폴더 이름</label>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="폴더 이름을 입력하세요"
                            className={styles.modalInput}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && newFolderName.trim()) {
                                    handleCreateFolder();
                                }
                            }}
                        />
                    </div>

                    {currentFolder && (
                        <div className={styles.modalField}>
                            <label>생성 위치</label>
                            <div className={styles.modalInfo}>
                                {folderPath.map((folder, index) => (
                                    <span key={folder.id}>
                                        {index > 0 && ' / '}
                                        {folder.folder_name}
                                    </span>
                                ))}
                                {folderPath.length === 0 && selectedCollection?.collection_make_name}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.modalActions}>
                    <button
                        onClick={handleClose}
                        className={`${styles.button} ${styles.secondary}`}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleCreateFolder}
                        disabled={!newFolderName.trim() || loading}
                        className={`${styles.button} ${styles.primary}`}
                    >
                        {loading ? '생성 중...' : '생성'}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default DocumentDirectoryModal;
