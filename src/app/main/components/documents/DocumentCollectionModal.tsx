'use client';
import React, { useState } from 'react';
import styles from '@/app/main/assets/DocumentCollectionModal.module.scss';
import { createCollection, isValidCollectionName, deleteCollection } from '@/app/api/rag/retrievalAPI';

interface Collection {
    id: number;
    collection_name: string;
    collection_make_name: string;
    vector_size?: number;
    points_count?: number;
    description?: string;
    registered_at: string;
    updated_at: string;
    created_at: string;
    user_id: number;
    is_shared?: boolean | null;
    share_group?: string | null;
    share_permissions?: string | null;
}

interface DocumentCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCollectionCreated?: () => void;
    mode?: 'create' | 'delete';
    collectionToDelete?: Collection | null;
    onCollectionDeleted?: () => void;
}

const DocumentCollectionModal: React.FC<DocumentCollectionModalProps> = ({
    isOpen,
    onClose,
    onCollectionCreated,
    mode = 'create',
    collectionToDelete,
    onCollectionDeleted
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

    const handleDeleteCollection = async () => {
        if (!collectionToDelete) return;

        try {
            setLoading(true);
            setError(null);
            await deleteCollection(collectionToDelete.collection_name);
            onCollectionDeleted?.();
            onClose();
        } catch (err) {
            setError('컬렉션 삭제에 실패했습니다.');
            console.error('Failed to delete collection:', err);
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

    return (
        <div className={styles.modalBackdrop} onClick={handleClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {mode === 'create' ? (
                    <>
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
                    </>
                ) : (
                    <>
                        <h3>컬렉션 삭제 확인</h3>
                        {error && <div className={styles.error}>{error}</div>}
                        <p>
                            '<strong>{collectionToDelete?.collection_make_name}</strong>' 컬렉션을 정말로 삭제하시겠습니까?<br />
                            이 작업은 되돌릴 수 없으며, 컬렉션에 포함된 모든 문서가 삭제됩니다.
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                onClick={handleClose}
                                className={`${styles.button} ${styles.secondary}`}
                                disabled={loading}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDeleteCollection}
                                className={`${styles.button} ${styles.danger}`}
                                disabled={loading}
                            >
                                {loading ? '삭제 중...' : '삭제'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DocumentCollectionModal;
