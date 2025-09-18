'use client';
import React from 'react';
import {
    FiDatabase,
    FiSettings,
    FiTrash2,
    FiBarChart,
    FiUsers,
} from 'react-icons/fi';
import styles from '@/app/main/workflowSection/assets/Documents.module.scss';
import { Collection, CollectionFilter } from '@/app/main/workflowSection/types/index';

interface DocumentCollectionsSectionProps {
    collections: Collection[];
    collectionFilter: CollectionFilter;
    loading: boolean;
    userId?: number;
    onSelectCollection: (collection: Collection) => void;
    onEditCollection: (collection: Collection) => void;
    onDeleteCollection: (collection: Collection) => void;
}

const DocumentCollectionsSection: React.FC<DocumentCollectionsSectionProps> = ({
    collections,
    collectionFilter,
    loading,
    userId,
    onSelectCollection,
    onEditCollection,
    onDeleteCollection,
}) => {
    // 컬렉션 필터링
    const getFilteredCollections = () => {
        switch (collectionFilter) {
            case 'personal':
                return collections.filter(collection => !collection.is_shared || collection.is_shared === null);
            case 'shared':
                return collections.filter(collection => collection.is_shared === true);
            case 'all':
            default:
                return collections;
        }
    };

    return (
        <div className={styles.collectionListContainer}>
            {loading ? (
                <div className={styles.loading}>로딩 중...</div>
            ) : (
                <div className={styles.collectionGrid}>
                    {getFilteredCollections().map((collection) => (
                        <div
                            key={collection.collection_name}
                            className={styles.collectionCard}
                            onClick={() => onSelectCollection(collection)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.collectionIcon}>
                                    <FiDatabase />
                                </div>
                                <div className={`${styles.status} ${collection.is_shared ? styles.statusShared : styles.statusPersonal}`}>
                                    {collection.is_shared ? '공유' : '개인'}
                                </div>
                            </div>

                            <div className={styles.cardContent}>
                                <h3 className={styles.collectionName}>{collection.collection_make_name}</h3>
                                {collection.description && (
                                    <p className={styles.collectionDescription}>
                                        {collection.description}
                                    </p>
                                )}
                                <div className={styles.collectionMeta}>
                                    {collection.vector_size !== undefined && (
                                        <div className={styles.metaItem}>
                                            <FiBarChart />
                                            <span>Vector Size: {collection.vector_size}</span>
                                        </div>
                                    )}
                                    {collection.share_group && (
                                        <div className={styles.metaItem}>
                                            <FiUsers />
                                            <span>조직: {collection.share_group}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {collection.user_id === userId ? (
                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.actionButton}
                                        title="컬렉션 설정"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditCollection(collection);
                                        }}
                                    >
                                        <FiSettings />
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.danger}`}
                                        title="컬렉션 삭제"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteCollection(collection);
                                        }}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.cardMessage}>
                                    공유받은 컬렉션은 편집이 불가능합니다.
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentCollectionsSection;
