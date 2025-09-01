'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UploadProgress {
    fileName: string;
    status: 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
}

interface UploadStatus {
    isMinimized: boolean;
    uploadProgress: UploadProgress[];
    collectionName: string | null;
    chunkSize: number;
    overlapSize: number;
    processType: string;
    isFolderUpload: boolean;
    startTime: number;
}

interface UploadStatusContextType {
    uploadStatus: UploadStatus | null;
    setUploadStatus: (status: UploadStatus | null) => void;
    clearUploadStatus: () => void;
    updateProgress: (progress: UploadProgress[]) => void;
    hasActiveUpload: () => boolean;
}

const UploadStatusContext = createContext<UploadStatusContextType | undefined>(undefined);

const STORAGE_KEY = 'upload_status';
const UPLOAD_TIMEOUT = 24 * 60 * 60 * 1000; // 24시간

export const UploadStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [uploadStatus, setUploadStatusState] = useState<UploadStatus | null>(null);

    // localStorage에서 상태 복원
    useEffect(() => {
        const savedStatus = localStorage.getItem(STORAGE_KEY);
        if (savedStatus) {
            try {
                const parsed: UploadStatus = JSON.parse(savedStatus);

                // 24시간이 지난 상태는 무시
                if (Date.now() - parsed.startTime < UPLOAD_TIMEOUT) {
                    setUploadStatusState(parsed);
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            } catch (error) {
                console.error('Failed to parse upload status from localStorage:', error);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    // 상태가 변경될 때마다 localStorage에 저장
    useEffect(() => {
        if (uploadStatus) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(uploadStatus));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [uploadStatus]);

    const setUploadStatus = (status: UploadStatus | null) => {
        setUploadStatusState(status);
    };

    const clearUploadStatus = () => {
        setUploadStatusState(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    const updateProgress = (progress: UploadProgress[]) => {
        if (uploadStatus) {
            setUploadStatusState({
                ...uploadStatus,
                uploadProgress: progress
            });
        }
    };

    const hasActiveUpload = () => {
        return uploadStatus?.uploadProgress.some(item => item.status === 'uploading') || false;
    };

    return (
        <UploadStatusContext.Provider
            value={{
                uploadStatus,
                setUploadStatus,
                clearUploadStatus,
                updateProgress,
                hasActiveUpload
            }}
        >
            {children}
        </UploadStatusContext.Provider>
    );
};

export const useUploadStatus = () => {
    const context = useContext(UploadStatusContext);
    if (context === undefined) {
        throw new Error('useUploadStatus must be used within an UploadStatusProvider');
    }
    return context;
};
