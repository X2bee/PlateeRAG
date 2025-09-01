'use client';
import React from 'react';
import { useUploadStatus } from '@/app/_common/contexts/UploadStatusContext';
import styles from '@/app/_common/assets/DocumentFileModal.module.scss';

const GlobalUploadMinimized: React.FC = () => {
    const { uploadStatus, clearUploadStatus } = useUploadStatus();

    if (!uploadStatus || !uploadStatus.isMinimized) {
        return null;
    }

    const activeUploads = uploadStatus.uploadProgress.filter(item => item.status === 'uploading').length;
    const totalUploads = uploadStatus.uploadProgress.length;
    const hasActiveUpload = activeUploads > 0;

    const handleClick = () => {
        // 업로드가 완료된 경우 상태 클리어
        if (!hasActiveUpload) {
            clearUploadStatus();
            return;
        }

        // 아직 업로드 중이면 DocumentFileModal을 다시 열어야 함
        // 이는 각 페이지에서 처리하도록 커스텀 이벤트 발생
        const event = new CustomEvent('reopenUploadModal', {
            detail: uploadStatus
        });
        window.dispatchEvent(event);
    };

    return (
        <div className={styles.minimizedButton} onClick={handleClick}>
            <span className={styles.uploadIcon}>📤</span>
            <span className={styles.uploadText}>
                {hasActiveUpload
                    ? `업로드 중 (${activeUploads}/${totalUploads})`
                    : `업로드 완료 (${totalUploads})`
                }
            </span>
        </div>
    );
};

export default GlobalUploadMinimized;
