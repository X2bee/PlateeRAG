'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/_common/assets/DocumentFileModal.module.scss';
import { useDocumentFileModal } from '@/app/_common/contexts/DocumentFileModalContext';
import DocumentFileModalInstance from './DocumentFileModalInstance';

const GlobalDocumentFileModal: React.FC = () => {
    const {
        sessions,
        closeModal,
        minimizeModal,
        restoreModal,
        focusSession,
        focusedSessionId,
        setOnUploadStart,
        setCurrentUploadingFiles,
    } = useDocumentFileModal();

    // 모든 세션을 배열로 변환
    const allSessions = Array.from(sessions.values());

    // 최소화된 세션들
    const minimizedSessions = allSessions.filter(session => session.isMinimized);

    // 각 세션에 업로드 시작 콜백 설정
    React.useEffect(() => {
        allSessions.forEach(session => {
            if (!session.onUploadStart) {
                setOnUploadStart(session.sessionId, (files: string[]) => {
                    setCurrentUploadingFiles(session.sessionId, files);
                });
            }
        });
    }, [allSessions.length, setOnUploadStart, setCurrentUploadingFiles]);

    // 최소화 버튼 렌더링 - 통합된 리스트 형태
    const renderMinimizedButtons = () => {
        if (minimizedSessions.length === 0) return null;

        return (
            <div className={styles.minimizedContainer}>
                <div className={styles.minimizedHeader}>
                    <span className={styles.uploadIcon}>📤</span>
                    <span className={styles.headerText}>업로드 중 ({minimizedSessions.length})</span>
                </div>
                <div className={styles.minimizedList}>
                    {minimizedSessions.map((session) => (
                        <div
                            key={session.sessionId}
                            className={styles.minimizedItem}
                            onClick={() => restoreModal(session.sessionId)}
                        >
                            <span className={styles.itemIcon}>
                                {session.isFolderUpload ? '📁' : '📄'}
                            </span>
                            <div className={styles.itemInfo}>
                                <span className={styles.itemType}>
                                    {session.isFolderUpload ? '폴더' : '파일'}
                                </span>
                                <span className={styles.itemName} title={session.currentUploadingFiles?.join(', ') || session.collection.collection_make_name}>
                                    {session.currentUploadingFiles && session.currentUploadingFiles.length > 0
                                        ? session.currentUploadingFiles.length > 1
                                            ? `${session.currentUploadingFiles[0]} 외 ${session.currentUploadingFiles.length - 1}개`
                                            : session.currentUploadingFiles[0]
                                        : session.collection.collection_make_name
                                    }
                                </span>
                                <span className={styles.itemCollection}>
                                    → {session.collection.collection_make_name}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // 모달이 없으면 null 반환
    if (allSessions.length === 0) {
        return null;
    }

    return (
        <>
            {renderMinimizedButtons()}
            {/* 모든 세션을 렌더링하되, 최소화된 것은 display:none으로 숨김 */}
            {allSessions.map((session, index) =>
                createPortal(
                    <div
                        key={session.sessionId}
                        style={{ display: session.isMinimized ? 'none' : 'block' }}
                    >
                        <DocumentFileModalInstance
                            modalSession={session}
                            onClose={() => closeModal(session.sessionId)}
                            onMinimize={() => minimizeModal(session.sessionId)}
                            onFocus={() => focusSession(session.sessionId)}
                            isFocused={focusedSessionId === session.sessionId}
                            modalIndex={index}
                        />
                    </div>,
                    document.body
                )
            )}
        </>
    );
};

export default GlobalDocumentFileModal;
