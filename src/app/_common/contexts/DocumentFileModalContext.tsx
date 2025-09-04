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

interface DocumentFileModalContextType {
    isOpen: boolean;
    selectedCollection: Collection | null;
    isFolderUpload: boolean;
    openModal: (collection: Collection, isFolderUpload: boolean) => void;
    closeModal: () => void;
    onUploadComplete?: () => void;
    setOnUploadComplete: (callback: () => void) => void;
}

const DocumentFileModalContext = createContext<DocumentFileModalContextType | undefined>(undefined);

export const DocumentFileModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [isFolderUpload, setIsFolderUpload] = useState(false);
    const [onUploadComplete, setOnUploadComplete] = useState<(() => void) | undefined>(undefined);

    const openModal = useCallback((collection: Collection, isFolderUpload: boolean) => {
        setSelectedCollection(collection);
        setIsFolderUpload(isFolderUpload);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setSelectedCollection(null);
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
