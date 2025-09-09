'use client';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

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
    init_embedding_model?: string | null;
}

interface Folder {
    id: number;
    created_at: string;
    updated_at: string;
    user_id: number;
    collection_make_name: string;
    collection_name: string;
    folder_name: string;
    parent_folder_name: string | null;
    parent_folder_id: number | null;
    is_root: boolean;
    full_path: string;
    order_index: number;
    collection_id: number;
}

interface DocumentFileModalContextType {
    isOpen: boolean;
    selectedCollection: Collection | null;
    currentFolder: Folder | null;
    isFolderUpload: boolean;
    openModal: (collection: Collection, isFolderUpload: boolean, currentFolder?: Folder | null) => void;
    closeModal: () => void;
    onUploadComplete?: () => void;
    setOnUploadComplete: (callback: () => void) => void;
}

const DocumentFileModalContext = createContext<DocumentFileModalContextType | undefined>(undefined);

export const DocumentFileModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [isFolderUpload, setIsFolderUpload] = useState(false);
    const [onUploadComplete, setOnUploadComplete] = useState<(() => void) | undefined>(undefined);

    const openModal = useCallback((collection: Collection, isFolderUpload: boolean, currentFolder?: Folder | null) => {
        setSelectedCollection(collection);
        setCurrentFolder(currentFolder || null);
        setIsFolderUpload(isFolderUpload);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setSelectedCollection(null);
        setCurrentFolder(null);
        setIsFolderUpload(false);
        setOnUploadComplete(undefined);
    }, []);

    const setUploadCompleteCallback = useCallback((callback: () => void) => {
        setOnUploadComplete(() => callback);
    }, []);

    return (
        <DocumentFileModalContext.Provider
            value={{
                isOpen,
                selectedCollection,
                currentFolder,
                isFolderUpload,
                openModal,
                closeModal,
                onUploadComplete,
                setOnUploadComplete: setUploadCompleteCallback,
            }}
        >
            {children}
        </DocumentFileModalContext.Provider>
    );
};

export const useDocumentFileModal = () => {
    const context = useContext(DocumentFileModalContext);
    if (context === undefined) {
        throw new Error('useDocumentFileModal must be used within a DocumentFileModalProvider');
    }
    return context;
};
