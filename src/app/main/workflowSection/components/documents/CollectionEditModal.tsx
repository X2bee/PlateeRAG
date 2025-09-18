'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/main/workflowSection/assets/CollectionEditModal.module.scss';
import { updateCollection } from '@/app/_common/api/rag/retrievalAPI';
import { getGroupAvailableGroups } from '@/app/_common/api/authAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { Collection, CollectionEditModalProps } from '@/app/main/workflowSection/types/index';

const CollectionEditModal: React.FC<CollectionEditModalProps> = ({
    collection,
    isOpen,
    onClose,
    onUpdate
}) => {
    const { user } = useAuth();
    const [isShared, setIsShared] = useState<boolean>(false);
    const [shareGroup, setShareGroup] = useState<string>('');
    const [availableGroups, setAvailableGroups] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 컬렉션 정보로 폼 초기화
    useEffect(() => {
        if (collection) {
            setIsShared(collection.is_shared === true);
            setShareGroup(collection.share_group || '');
        }
    }, [collection]);

    // 사용 가능한 그룹 목록 로드
    useEffect(() => {
        const loadAvailableGroups = async () => {
            if (user && isOpen) {
                try {
                    const response = await getGroupAvailableGroups(user.user_id) as { available_groups: string[] };
                    if (response.available_groups && response.available_groups.length > 0) {
                        setAvailableGroups(response.available_groups);
                    } else {
                        setAvailableGroups([]);
                    }
                } catch (error) {
                    console.error('Failed to load available groups:', error);
                    setAvailableGroups([]);
                }
            }
        };

        loadAvailableGroups();
    }, [user, isOpen]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            const updateDict = {
                is_shared: isShared,
                share_group: isShared ? shareGroup || null : null
            };

            await updateCollection(collection.collection_name, updateDict);

            // 업데이트된 컬렉션 정보를 부모 컴포넌트에 전달
            const updatedCollection = {
                ...collection,
                is_shared: isShared,
                share_group: isShared ? shareGroup || null : null
            };

            onUpdate(updatedCollection);
            onClose();
        } catch (err) {
            setError('컬렉션 업데이트에 실패했습니다.');
            console.error('Failed to update collection:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h3>컬렉션 설정 편집</h3>

                <div className={styles.formGroup}>
                    <label>컬렉션 이름</label>
                    <input
                        type="text"
                        value={collection.collection_make_name}
                        disabled
                        className={styles.disabledInput}
                    />
                    <small>컬렉션 이름은 변경할 수 없습니다.</small>
                </div>

                <div className={styles.formGroup}>
                    <label>컬렉션 공유</label>
                    <button
                        type="button"
                        className={`${styles.toggleButton} ${isShared ? styles.active : ''}`}
                        onClick={() => setIsShared(!isShared)}
                        disabled={loading}
                    >
                        {isShared ? '공유 중' : '비공개'}
                    </button>
                </div>

                {isShared && (
                    <div className={styles.formGroup}>
                        <label>공유 그룹</label>
                        {availableGroups.length > 0 ? (
                            <select
                                value={shareGroup}
                                onChange={(e) => setShareGroup(e.target.value)}
                                disabled={loading}
                            >
                                <option value="">그룹을 선택하세요</option>
                                {availableGroups.map((group, index) => (
                                    <option key={index} value={group}>
                                        {group}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <select disabled>
                                <option>소속된 조직이 없습니다.</option>
                            </select>
                        )}
                        <small>
                            {availableGroups.length > 0
                                ? "공유 그룹을 지정하지 않으면 공유되지 않습니다."
                                : "그룹에 소속되어야 특정 그룹과 공유할 수 있습니다."
                            }
                        </small>
                    </div>
                )}

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.modalActions}>
                    <button
                        onClick={onClose}
                        className={`${styles.button} ${styles.secondary}`}
                        disabled={loading}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`${styles.button} ${styles.primary}`}
                        disabled={loading}
                    >
                        {loading ? '업데이트 중...' : '업데이트'}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default CollectionEditModal;
