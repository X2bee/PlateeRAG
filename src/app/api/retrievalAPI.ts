import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from './apiClient';

// It would be good to have a central place for these types, e.g., src/types/retrieval.ts
export interface Collection {
    name: string;
    // Add other properties from the API response
    [key: string]: any;
}

export interface Document {
    id: string;
    // Add other properties from the API response
    [key: string]: any;
}

const _listCollections = async (): Promise<Collection[]> => {
    const response = await apiClient(`${API_BASE_URL}/api/retrieval/collections`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const listCollections = withErrorHandler(_listCollections, 'Failed to list collections');

const _createCollection = async (collectionMakeName: string, distance: string = 'Cosine', description: string | null = null, metadata: object | null = null): Promise<Collection> => {
    const response = await apiClient(`${API_BASE_URL}/api/retrieval/collections`, {
        method: 'POST',
        body: JSON.stringify({ collection_make_name: collectionMakeName, distance, description, metadata }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const createCollection = withErrorHandler(_createCollection, 'Failed to create collection');

const _deleteCollection = async (collectionName: string): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/retrieval/collections`, {
        method: 'DELETE',
        body: JSON.stringify({ collection_name: collectionName }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const deleteCollection = withErrorHandler(_deleteCollection, 'Failed to delete collection');

const _getCollectionInfo = async (collectionName: string): Promise<Collection> => {
    const response = await apiClient(`${API_BASE_URL}/api/retrieval/collections/${collectionName}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const getCollectionInfo = withErrorHandler(_getCollectionInfo, 'Failed to fetch collection info');

const _uploadDocument = async (file: File, collectionName: string, chunkSize: number = 1000, chunkOverlap: number = 200, metadata: object | null = null): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collection_name', collectionName);
    formData.append('chunk_size', chunkSize.toString());
    formData.append('chunk_overlap', chunkOverlap.toString());
    if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
    }

    // apiClient cannot be used for FormData, use fetch directly
    const response = await fetch(`${API_BASE_URL}/api/retrieval/documents/upload`, {
        method: 'POST',
        body: formData,
        // Headers should not be set for FormData, browser will do it
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const uploadDocument = withErrorHandler(_uploadDocument, 'Failed to upload document');

const _searchDocuments = async (collectionName: string, queryText: string, limit: number = 5, scoreThreshold: number = 0.7, filter: object | null = null): Promise<Document[]> => {
    const response = await apiClient(`${API_BASE_URL}/api/retrieval/documents/search`, {
        method: 'POST',
        body: JSON.stringify({ collection_name: collectionName, query_text: queryText, limit, score_threshold: scoreThreshold, filter }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const searchDocuments = withErrorHandler(_searchDocuments, 'Failed to search documents');

const _listDocumentsInCollection = async (collectionName: string): Promise<Document[]> => {
    const response = await apiClient(`${API_BASE_URL}/api/retrieval/collections/${collectionName}/documents`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const listDocumentsInCollection = withErrorHandler(_listDocumentsInCollection, 'Failed to list documents in collection');

const _deleteDocumentFromCollection = async (collectionName: string, documentId: string): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/retrieval/collections/${collectionName}/documents/${documentId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const deleteDocumentFromCollection = withErrorHandler(_deleteDocumentFromCollection, 'Failed to delete document from collection');
