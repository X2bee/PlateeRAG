'use client';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

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

// 개별 모달 세션 정보
export interface ModalSession {
    sessionId: string;
    collection: Collection;
    currentFolder: Folder | null;
    isFolderUpload: boolean;
    isMinimized: boolean;
    isCollapsed: boolean; // 완전히 접힌 상태 (아이콘만 표시)
    onUploadComplete?: () => void;
    onUploadStart?: (files: string[]) => void; // 업로드 시작 시 파일 정보 전달
    createdAt: number;
    currentUploadingFiles?: string[]; // 현재 업로드 중인 파일 이름들
}

interface DocumentFileModalContextType {
    sessions: Map<string, ModalSession>;
    openModal: (sessionId: string, collection: Collection, isFolderUpload: boolean, currentFolder?: Folder | null) => void;
    closeModal: (sessionId: string) => void;
    minimizeModal: (sessionId: string) => void;
    restoreModal: (sessionId: string) => void;
    collapseModal: (sessionId: string) => void; // 완전히 접기
    expandModal: (sessionId: string) => void; // 펼치기 (최소화 상태로)
    setOnUploadComplete: (sessionId: string, callback: () => void) => void;
    setOnUploadStart: (sessionId: string, callback: (files: string[]) => void) => void;
    setCurrentUploadingFiles: (sessionId: string, files: string[]) => void;
    focusSession: (sessionId: string) => void;
    focusedSessionId: string | null;
}

const DocumentFileModalContext = createContext<DocumentFileModalContextType | undefined>(undefined);

const SESSIONS_STORAGE_KEY = 'document_file_modal_sessions';

export const DocumentFileModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [sessions, setSessions] = useState<Map<string, ModalSession>>(new Map());
    const [focusedSessionId, setFocusedSessionId] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    // 클라이언트 사이드에서만 실행
    useEffect(() => {
        setIsClient(true);

        // sessionStorage에서 상태 복원
        try {
            const saved = sessionStorage.getItem(SESSIONS_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as ModalSession[];
                // 배열을 Map으로 변환
                const restoredSessions = new Map<string, ModalSession>(
                    parsed.map((session: ModalSession) => [session.sessionId, session])
                );
                setSessions(restoredSessions);
            }
        } catch (error) {
            console.error('Failed to restore modal sessions:', error);
        }
    }, []);

    // sessions가 변경될 때마다 sessionStorage에 저장 (클라이언트에서만)
    useEffect(() => {
        if (!isClient) return;

        try {
            // Map을 배열로 변환하여 저장 (onUploadComplete, onUploadStart 콜백은 제외)
            const sessionsArray = Array.from(sessions.values()).map(session => ({
                sessionId: session.sessionId,
                collection: session.collection,
                currentFolder: session.currentFolder,
                isFolderUpload: session.isFolderUpload,
                isMinimized: session.isMinimized,
                isCollapsed: session.isCollapsed || false,
                createdAt: session.createdAt,
                currentUploadingFiles: session.currentUploadingFiles,
                // onUploadComplete, onUploadStart는 함수이므로 저장하지 않음
            }));

            if (sessionsArray.length > 0) {
                sessionStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessionsArray));
            } else {
                sessionStorage.removeItem(SESSIONS_STORAGE_KEY);
            }
        } catch (error) {
            console.error('Failed to save modal sessions:', error);
        }
    }, [sessions, isClient]);

    const openModal = useCallback((sessionId: string, collection: Collection, isFolderUpload: boolean, currentFolder?: Folder | null): void => {
        const newSession: ModalSession = {
            sessionId,
            collection,
            currentFolder: currentFolder || null,
            isFolderUpload,
            isMinimized: false,
            isCollapsed: false,
            createdAt: Date.now(),
        };

        setSessions(prev => {
            const updated = new Map(prev);
            updated.set(sessionId, newSession);
            return updated;
        });

        setFocusedSessionId(sessionId);
    }, []);

    const closeModal = useCallback((sessionId: string) => {
        setSessions(prev => {
            const updated = new Map(prev);
            updated.delete(sessionId);
            return updated;
        });

        // 해당 세션의 sessionStorage 데이터도 삭제 (클라이언트에서만)
        if (isClient) {
            try {
                sessionStorage.removeItem(`global_upload_state_${sessionId}`);
            } catch (error) {
                console.error('Failed to remove session storage:', error);
            }
        }

        // 포커스된 세션이 닫히면 다음 세션에 포커스
        setFocusedSessionId(prevFocused => {
            if (prevFocused === sessionId) {
                const remainingSessions = Array.from(sessions.keys()).filter(id => id !== sessionId);
                return remainingSessions.length > 0 ? remainingSessions[remainingSessions.length - 1] : null;
            }
            return prevFocused;
        });
    }, [sessions, isClient]);

    const minimizeModal = useCallback((sessionId: string) => {
        setSessions(prev => {
            const updated = new Map(prev);
            const session = updated.get(sessionId);
            if (session) {
                updated.set(sessionId, { ...session, isMinimized: true });
            }
            return updated;
        });
    }, []);

    const restoreModal = useCallback((sessionId: string) => {
        setSessions(prev => {
            const updated = new Map(prev);
            const session = updated.get(sessionId);
            if (session) {
                updated.set(sessionId, { ...session, isMinimized: false, isCollapsed: false });
            }
            return updated;
        });
        setFocusedSessionId(sessionId);
    }, []);

    const collapseModal = useCallback((sessionId: string) => {
        setSessions(prev => {
            const updated = new Map(prev);
            const session = updated.get(sessionId);
            if (session) {
                updated.set(sessionId, { ...session, isCollapsed: true });
            }
            return updated;
        });
    }, []);

    const expandModal = useCallback((sessionId: string) => {
        setSessions(prev => {
            const updated = new Map(prev);
            const session = updated.get(sessionId);
            if (session) {
                updated.set(sessionId, { ...session, isCollapsed: false });
            }
            return updated;
        });
    }, []);

    const setOnUploadComplete = useCallback((sessionId: string, callback: () => void) => {
        setSessions(prev => {
            const updated = new Map(prev);
            const session = updated.get(sessionId);
            if (session) {
                updated.set(sessionId, { ...session, onUploadComplete: callback });
            }
            return updated;
        });
    }, []);

    const setOnUploadStart = useCallback((sessionId: string, callback: (files: string[]) => void) => {
        setSessions(prev => {
            const updated = new Map(prev);
            const session = updated.get(sessionId);
            if (session) {
                updated.set(sessionId, { ...session, onUploadStart: callback });
            }
            return updated;
        });
    }, []);

    const setCurrentUploadingFiles = useCallback((sessionId: string, files: string[]) => {
        setSessions(prev => {
            const updated = new Map(prev);
            const session = updated.get(sessionId);
            if (session) {
                updated.set(sessionId, { ...session, currentUploadingFiles: files });
            }
            return updated;
        });
    }, []);

    const focusSession = useCallback((sessionId: string) => {
        setFocusedSessionId(sessionId);
    }, []);

    return (
        <DocumentFileModalContext.Provider
            value={{
                sessions,
                openModal,
                closeModal,
                minimizeModal,
                restoreModal,
                collapseModal,
                expandModal,
                setOnUploadComplete,
                setOnUploadStart,
                setCurrentUploadingFiles,
                focusSession,
                focusedSessionId,
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
