'use client';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/main/workflowSection/assets/DocumentCollectionModal.module.scss';
import { createCollection, isValidCollectionName } from '@/app/_common/api/rag/retrievalAPI';

interface DocumentCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCollectionCreated?: () => void;
}

const DocumentCollectionModal: React.FC<DocumentCollectionModalProps> = ({
    isOpen,
    onClose,
    onCollectionCreated
}) => {
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionDescription, setNewCollectionDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateCollection = async () => {
        if (!isValidCollectionName(newCollectionName)) {
            setError('컬렉션 이름은 한글, 영문, 숫자, 밑줄(_), 하이픈(-)만 사용할 수 있습니다.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await createCollection(
                newCollectionName,
                "Cosine",
                newCollectionDescription || undefined
            );
            setNewCollectionName('');
            setNewCollectionDescription('');
            onCollectionCreated?.();
            onClose();
        } catch (err) {
            setError('컬렉션 생성에 실패했습니다.');
            console.error('Failed to create collection:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setNewCollectionName('');
        setNewCollectionDescription('');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.modalBackdrop} onClick={handleClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3>새 컬렉션 생성</h3>
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles.formGroup}>
                    <label>컬렉션 이름 *</label>
                    <input
                        type="text"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        placeholder="예: project_documents"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label>설명 (선택사항)</label>
                    <textarea
                        value={newCollectionDescription}
                        onChange={(e) => setNewCollectionDescription(e.target.value)}
                        placeholder="컬렉션에 대한 간단한 설명을 입력하세요."
                    />
                </div>
                <div className={styles.modalActions}>
                    <button
                        onClick={handleClose}
                        className={`${styles.button} ${styles.secondary}`}
                        disabled={loading}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleCreateCollection}
                        className={`${styles.button} ${styles.primary}`}
                        disabled={loading}
                    >
                        {loading ? '생성 중...' : '생성'}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default DocumentCollectionModal;
