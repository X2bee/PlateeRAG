import React from 'react';
import { FiBookmark, FiX } from 'react-icons/fi';
import styles from '../../assets/ChatInterface.module.scss';

interface CollectionDisplayProps {
    selectedCollections: string[];
    collectionMapping: { [key: string]: string };
    onRemoveCollection: (index: number) => void;
}

const CollectionDisplay: React.FC<CollectionDisplayProps> = React.memo(({
    selectedCollections,
    collectionMapping,
    onRemoveCollection,
}) => {
    if (selectedCollections.length === 0) {
        return null;
    }

    return (
        <div className={styles.collectionsDisplayArea}>
            <div className={styles.collectionsLabel}>
                <FiBookmark className={styles.labelIcon} />
                <span>선택된 컬렉션</span>
            </div>
            <div className={styles.selectedCollections}>
                {selectedCollections.map((collection, index) => (
                    <div key={index} className={styles.selectedCollection}>
                        <FiBookmark className={styles.collectionIcon} />
                        <span className={styles.collectionName}>
                            {collectionMapping[collection] || collection}
                        </span>
                        <button
                            className={styles.removeCollectionButton}
                            onClick={() => onRemoveCollection(index)}
                            title="컬렉션 해제"
                        >
                            <FiX />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
});

CollectionDisplay.displayName = 'CollectionDisplay';

export { CollectionDisplay };
export type { CollectionDisplayProps };