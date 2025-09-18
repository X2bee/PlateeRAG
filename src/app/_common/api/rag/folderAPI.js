// RAG Folder API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * 새로운 폴더를 생성하는 함수
 * @param {string} folderName - 폴더 이름
 * @param {number} parentCollectionId - 부모 컬렉션 ID
 * @param {number|null} parentFolderId - 부모 폴더 ID (선택사항)
 * @param {string|null} parentFolderName - 부모 폴더 이름 (선택사항)
 * @returns {Promise<Object>} 폴더 생성 결과
 */
export const createFolder = async (folderName, parentCollectionId, parentFolderId = null, parentFolderName = null) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/folder/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                folder_name: folderName,
                parent_collection_id: parentCollectionId,
                parent_folder_id: parentFolderId,
                parent_folder_name: parentFolderName,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Folder created successfully:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to create folder:', error);
        throw error;
    }
};

/**
 * 폴더를 삭제하는 함수
 * @param {string} folderPath - 삭제할 폴더의 full_path
 * @param {number} collectionId - 컬렉션 ID
 * @returns {Promise<Object>} 폴더 삭제 결과
 */
export const deleteFolder = async (folderPath, collectionId) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/folder/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                folder_path: folderPath,
                collection_id: collectionId,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Folder deleted successfully:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to delete folder:', error);
        throw error;
    }
};
