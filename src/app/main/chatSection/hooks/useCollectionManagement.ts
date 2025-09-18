import { useState, useEffect, useCallback } from 'react';
import { devLog } from '@/app/_common/utils/logger';

interface CollectionData {
    collections: string[];
    mapping: { [key: string]: string };
    selectedAt: string;
    isMultiple: boolean;
}

interface UseCollectionManagementReturn {
    selectedCollection: string[];
    selectedCollectionMakeName: string | null;
    collectionMapping: { [key: string]: string };
    setSelectedCollection: React.Dispatch<React.SetStateAction<string[]>>;
    setSelectedCollectionMakeName: React.Dispatch<React.SetStateAction<string | null>>;
    setCollectionMapping: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    handleCollectionsSelect: (collections: string[], mapping?: { [key: string]: string }) => void;
    removeCollection: (index: number) => void;
    checkSelectedCollection: () => void;
}

export const useCollectionManagement = (
    showCollectionModal: boolean
): UseCollectionManagementReturn => {
    const [selectedCollection, setSelectedCollection] = useState<string[]>([]);
    const [selectedCollectionMakeName, setSelectedCollectionMakeName] = useState<string | null>(null);
    const [collectionMapping, setCollectionMapping] = useState<{ [key: string]: string }>({});

    // localStorage에서 컬렉션 정보 로드
    const checkSelectedCollection = useCallback(() => {
        try {
            // 다중 선택 데이터를 먼저 확인
            const storedMultipleCollections = localStorage.getItem('selectedCollections');
            if (storedMultipleCollections) {
                const multipleData = JSON.parse(storedMultipleCollections);
                if (multipleData.isMultiple && Array.isArray(multipleData.collections)) {
                    setSelectedCollection(multipleData.collections);
                    setCollectionMapping(multipleData.mapping || {});
                    setSelectedCollectionMakeName(multipleData.collections[0]); // 첫 번째를 대표로 표시

                    devLog.log('Loaded multiple collections from localStorage:', {
                        collections: multipleData.collections,
                        mapping: multipleData.mapping,
                        count: multipleData.collections.length
                    });
                    return;
                }
            }

            // 기존 단일 선택 데이터 확인 (호환성)
            const storedCollection = localStorage.getItem('selectedCollection');
            if (storedCollection) {
                const collectionData = JSON.parse(storedCollection);
                setSelectedCollection([collectionData.name]);
                setCollectionMapping({ [collectionData.name]: collectionData.make_name });
                setSelectedCollectionMakeName(collectionData.make_name);

                devLog.log('Loaded single collection from localStorage (legacy):', {
                    collection: collectionData.name,
                    makeName: collectionData.make_name
                });
            } else {
                setSelectedCollection([]);
                setCollectionMapping({});
                setSelectedCollectionMakeName(null);

                devLog.log('No collections found in localStorage');
            }
        } catch (err) {
            console.error('Failed to load selected collection:', err);
            setSelectedCollection([]);
            setCollectionMapping({});
            setSelectedCollectionMakeName(null);
        }
    }, []);

    // 컬렉션 선택 처리
    const handleCollectionsSelect = useCallback((collections: string[], mapping: { [key: string]: string } = {}) => {
        devLog.log('Collections selected from modal:', {
            selectedCollections: collections,
            count: collections.length,
            previousSelections: selectedCollection,
            mapping
        });

        setSelectedCollection(collections);
        setCollectionMapping(mapping);

        // 선택된 컬렉션들을 localStorage에 배열로 저장
        if (collections.length > 0) {
            // 다중 선택 데이터를 저장 (매핑 정보 포함)
            const multipleCollectionsData: CollectionData = {
                collections: collections,
                mapping: mapping,
                selectedAt: new Date().toISOString(),
                isMultiple: true
            };
            localStorage.setItem('selectedCollections', JSON.stringify(multipleCollectionsData));

            // 기존 호환성을 위해 첫 번째 컬렉션을 단일 선택 형태로도 저장
            const firstCollection = collections[0];
            const firstMakeName = mapping[firstCollection] || firstCollection;
            localStorage.setItem('selectedCollection', JSON.stringify({
                name: firstCollection,
                make_name: firstMakeName,
                selectedAt: new Date().toISOString()
            }));
            setSelectedCollectionMakeName(firstMakeName);

            devLog.log('Collections saved to localStorage:', {
                multipleData: multipleCollectionsData,
                singleCompatibility: firstCollection
            });
        } else {
            // 선택 해제
            localStorage.removeItem('selectedCollections');
            localStorage.removeItem('selectedCollection');
            setSelectedCollectionMakeName(null);
            setCollectionMapping({});

            devLog.log('All collections cleared from localStorage');
        }
    }, [selectedCollection]);

    // 개별 컬렉션 제거
    const removeCollection = useCallback((index: number) => {
        const removedCollection = selectedCollection[index];
        const updatedCollections = selectedCollection.filter((_, i) => i !== index);

        devLog.log('Removing individual collection:', {
            removedCollection,
            previousCollections: selectedCollection,
            updatedCollections,
            remainingCount: updatedCollections.length
        });

        setSelectedCollection(updatedCollections);

        // 매핑에서도 제거된 컬렉션 정보 삭제
        const updatedMapping = { ...collectionMapping };
        delete updatedMapping[removedCollection];
        setCollectionMapping(updatedMapping);

        if (updatedCollections.length === 0) {
            // 모든 컬렉션이 제거된 경우
            localStorage.removeItem('selectedCollections');
            localStorage.removeItem('selectedCollection');
            setSelectedCollectionMakeName(null);
            devLog.log('All collections removed from localStorage');
        } else {
            // 일부 컬렉션이 남아있는 경우
            const multipleCollectionsData: CollectionData = {
                collections: updatedCollections,
                mapping: updatedMapping,
                selectedAt: new Date().toISOString(),
                isMultiple: true
            };
            localStorage.setItem('selectedCollections', JSON.stringify(multipleCollectionsData));

            // 첫 번째 컬렉션을 단일 선택 형태로도 저장 (호환성)
            const firstCollection = updatedCollections[0];
            const firstMakeName = updatedMapping[firstCollection] || firstCollection;
            localStorage.setItem('selectedCollection', JSON.stringify({
                name: firstCollection,
                make_name: firstMakeName,
                selectedAt: new Date().toISOString()
            }));
            setSelectedCollectionMakeName(firstMakeName);

            devLog.log('Updated collections in localStorage:', multipleCollectionsData);
        }
    }, [selectedCollection, collectionMapping]);

    // 모달이 닫힐 때 컬렉션 정보 확인
    useEffect(() => {
        if (!showCollectionModal) {
            checkSelectedCollection();
        }
    }, [showCollectionModal, checkSelectedCollection]);

    return {
        selectedCollection,
        selectedCollectionMakeName,
        collectionMapping,
        setSelectedCollection,
        setSelectedCollectionMakeName,
        setCollectionMapping,
        handleCollectionsSelect,
        removeCollection,
        checkSelectedCollection
    };
};