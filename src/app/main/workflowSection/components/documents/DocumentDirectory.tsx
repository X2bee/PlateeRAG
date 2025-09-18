'use client';
import { deleteDocumentFromCollection } from '@/app/_common/api/rag/retrievalAPI';
import { deleteFolder } from '@/app/_common/api/rag/folderAPI';
import {
    showDeleteConfirmToastKo,
    showDeleteSuccessToastKo,
    showDeleteErrorToastKo
} from '@/app/_common/utils/toastUtilsKo';
import { Collection, DocumentInCollection, Folder } from '@/app/main/workflowSection/types/index';

/**
 * 폴더와 하위 모든 문서를 삭제하는 함수
 */
export const deleteDirectoryWithDocuments = async (
    folder: Folder,
    collection: Collection,
    documentsInCollection: DocumentInCollection[]
): Promise<boolean> => {
    try {
        // 1. 폴더 경로에 포함된 모든 문서 찾기
        const documentsToDelete = documentsInCollection.filter(doc => {
            const docDirectoryPath = doc.metadata?.directory_full_path || '';
            // folder.full_path로 시작하는 모든 문서 (하위 폴더 포함)
            return docDirectoryPath.startsWith(folder.full_path);
        });

        // 2. 모든 문서 삭제
        for (const doc of documentsToDelete) {
            await deleteDocumentFromCollection(collection.collection_name, doc.document_id);
        }

        // 3. 폴더 정보 삭제
        await deleteFolder(folder.full_path, collection.id);

        return true;
    } catch (error) {
        console.error('Failed to delete directory with documents:', error);
        throw error;
    }
};

/**
 * 폴더 삭제 확인 및 실행 함수
 */
export const handleDeleteFolderRequest = (
    folder: Folder,
    collection: Collection,
    documentsInCollection: DocumentInCollection[],
    onSuccess: () => void
) => {
    // 삭제될 문서 수 계산
    const documentsToDelete = documentsInCollection.filter(doc => {
        const docDirectoryPath = doc.metadata?.directory_full_path || '';
        return docDirectoryPath.startsWith(folder.full_path);
    });

    const documentCount = documentsToDelete.length;

    showDeleteConfirmToastKo({
        title: '폴더 삭제 확인',
        message: `'${folder.folder_name}' 폴더를 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 폴더에 포함된 모든 문서(${documentCount}개)가 삭제됩니다.`,
        itemName: folder.folder_name,
        onConfirm: async () => {
            try {
                await deleteDirectoryWithDocuments(folder, collection, documentsInCollection);

                showDeleteSuccessToastKo({
                    itemName: folder.folder_name,
                    itemType: '폴더',
                });

                onSuccess();
            } catch (error) {
                console.error('Failed to delete folder:', error);
                showDeleteErrorToastKo({
                    itemName: folder.folder_name,
                    itemType: '폴더',
                    error: error instanceof Error ? error : 'Unknown error',
                });
            }
        },
        confirmText: '삭제',
        cancelText: '취소',
    });
};
