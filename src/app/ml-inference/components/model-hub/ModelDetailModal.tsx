'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ModelDetailModal.module.scss';
import ModelDetailPanel from './ModelDetailPanel';
import type { ModelDetailResponse } from '../../types';

interface ModelDetailModalProps {
    isOpen: boolean;
    model: ModelDetailResponse | null;
    isLoading: boolean;
    errorMessage: string | null;
    onRefetch?: () => void;
    onClose: () => void;
}

const ModelDetailModal: React.FC<ModelDetailModalProps> = ({
    isOpen,
    model,
    isLoading,
    errorMessage,
    onRefetch,
    onClose,
}) => {
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className={styles.backdrop} role="presentation" onClick={handleBackdropClick}>
            <div className={styles.modal} role="dialog" aria-modal="true" aria-label="모델 상세 정보">
                <div className={styles.topBar}>
                    {onRefetch ? (
                        <button
                            type="button"
                            onClick={onRefetch}
                            disabled={isLoading}
                            className={styles.refreshButton}
                        >
                            {isLoading ? '새로고침 중...' : '정보 새로고침'}
                        </button>
                    ) : null}
                    <button type="button" onClick={onClose} className={styles.closeButton} aria-label="닫기">
                        ✕
                    </button>
                </div>
                <div className={styles.scrollArea}>
                    <ModelDetailPanel
                        model={model}
                        isLoading={isLoading}
                        errorMessage={errorMessage}
                        onRefetch={onRefetch}
                        showRefreshButton={false}
                        className={styles.panelReset}
                    />
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default ModelDetailModal;
