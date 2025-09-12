'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    FiPlus, 
    FiTrash2, 
    FiEdit2, 
    FiCopy, 
    FiDownload, 
    FiUpload,
    FiMessageSquare,
    FiClock,
    FiSearch,
    FiX
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { SessionManager as SM, SessionListItem } from '../utils/sessionManager';
import { showSuccessToastKo, showErrorToastKo, showWarningToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from '../assets/SessionManager.module.scss';

interface SessionManagerProps {
    isOpen: boolean;
    onClose: () => void;
    currentSessionId?: string;
}

const SessionManager: React.FC<SessionManagerProps> = ({
    isOpen,
    onClose,
    currentSessionId
}) => {
    const router = useRouter();
    const [sessions, setSessions] = useState<SessionListItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingSession, setEditingSession] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    // 세션 목록 로드
    const loadSessions = useCallback(() => {
        setSessions(SM.getAllSessions());
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadSessions();
        }
    }, [isOpen, loadSessions]);

    // 검색 필터링
    const filteredSessions = sessions.filter(session => 
        session.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 새 세션 생성
    const handleCreateSession = useCallback(() => {
        const newSession = SM.createNewSession();
        loadSessions();
        router.push(`/session-chat?session=${newSession.sessionId}`);
        onClose();
        showSuccessToastKo('새 세션이 생성되었습니다.');
    }, [loadSessions, router, onClose]);

    // 세션 선택
    const handleSelectSession = useCallback((sessionId: string) => {
        router.push(`/session-chat?session=${sessionId}`);
        onClose();
    }, [router, onClose]);

    // 세션 삭제
    const handleDeleteSession = useCallback((sessionId: string, sessionName: string) => {
        if (window.confirm(`"${sessionName}" 세션을 삭제하시겠습니까?`)) {
            const success = SM.deleteSession(sessionId);
            if (success) {
                loadSessions();
                showSuccessToastKo('세션이 삭제되었습니다.');
                
                // 현재 세션이 삭제되면 메인 페이지로 이동
                if (currentSessionId === sessionId) {
                    router.push('/chat?mode=new-chat');
                    onClose();
                }
            } else {
                showErrorToastKo('세션 삭제에 실패했습니다.');
            }
        }
    }, [loadSessions, router, onClose, currentSessionId]);

    // 세션 이름 수정 시작
    const handleStartEdit = useCallback((sessionId: string, currentName: string) => {
        setEditingSession(sessionId);
        setEditingName(currentName);
    }, []);

    // 세션 이름 수정 완료
    const handleFinishEdit = useCallback(() => {
        if (editingSession && editingName.trim()) {
            const success = SM.renameSession(editingSession, editingName.trim());
            if (success) {
                loadSessions();
                showSuccessToastKo('세션 이름이 변경되었습니다.');
            } else {
                showErrorToastKo('세션 이름 변경에 실패했습니다.');
            }
        }
        setEditingSession(null);
        setEditingName('');
    }, [editingSession, editingName, loadSessions]);

    // 세션 복사
    const handleDuplicateSession = useCallback((sessionId: string) => {
        const duplicated = SM.duplicateSession(sessionId);
        if (duplicated) {
            loadSessions();
            showSuccessToastKo('세션이 복사되었습니다.');
        } else {
            showErrorToastKo('세션 복사에 실패했습니다.');
        }
    }, [loadSessions]);

    // 세션 내보내기
    const handleExportSession = useCallback((sessionId: string, sessionName: string) => {
        const exportData = SM.exportSession(sessionId);
        if (exportData) {
            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${sessionName.replace(/[^a-z0-9]/gi, '_')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showSuccessToastKo('세션이 내보내기되었습니다.');
        } else {
            showErrorToastKo('세션 내보내기에 실패했습니다.');
        }
    }, []);

    // 세션 가져오기
    const handleImportSession = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const success = SM.importSession(content);
                    if (success) {
                        loadSessions();
                        showSuccessToastKo('세션이 가져와졌습니다.');
                    } else {
                        showErrorToastKo('잘못된 세션 파일입니다.');
                    }
                } catch (error) {
                    showErrorToastKo('세션 파일을 읽을 수 없습니다.');
                }
            };
            reader.readAsText(file);
        }
        // 파일 입력 초기화
        event.target.value = '';
    }, [loadSessions]);

    // 전체 세션 삭제
    const handleClearAllSessions = useCallback(() => {
        if (window.confirm('모든 세션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            const success = SM.clearAllSessions();
            if (success) {
                loadSessions();
                router.push('/chat?mode=new-chat');
                onClose();
                showSuccessToastKo('모든 세션이 삭제되었습니다.');
            } else {
                showErrorToastKo('세션 삭제에 실패했습니다.');
            }
        }
    }, [loadSessions, router, onClose]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        return date.toLocaleDateString();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>세션 관리</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <FiX />
                    </button>
                </div>

                <div className={styles.toolbar}>
                    <div className={styles.searchBox}>
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="세션 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className={styles.toolbarActions}>
                        <button onClick={handleCreateSession} className={styles.primaryButton}>
                            <FiPlus /> 새 세션
                        </button>
                        <label className={styles.fileButton}>
                            <FiUpload />
                            가져오기
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportSession}
                                style={{ display: 'none' }}
                            />
                        </label>
                        <button 
                            onClick={handleClearAllSessions} 
                            className={styles.dangerButton}
                            disabled={sessions.length === 0}
                        >
                            전체 삭제
                        </button>
                    </div>
                </div>

                <div className={styles.sessionList}>
                    {filteredSessions.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FiMessageSquare size={48} />
                            <h3>세션이 없습니다</h3>
                            <p>새 세션을 만들어 채팅을 시작해보세요.</p>
                        </div>
                    ) : (
                        filteredSessions.map((session) => (
                            <div 
                                key={session.sessionId} 
                                className={`${styles.sessionCard} ${
                                    currentSessionId === session.sessionId ? styles.current : ''
                                }`}
                            >
                                <div 
                                    className={styles.sessionInfo}
                                    onClick={() => handleSelectSession(session.sessionId)}
                                >
                                    <div className={styles.sessionHeader}>
                                        {editingSession === session.sessionId ? (
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onBlur={handleFinishEdit}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleFinishEdit();
                                                    if (e.key === 'Escape') {
                                                        setEditingSession(null);
                                                        setEditingName('');
                                                    }
                                                }}
                                                autoFocus
                                                className={styles.editInput}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <h3>{session.sessionName}</h3>
                                        )}
                                        <div className={styles.sessionMeta}>
                                            <span><FiMessageSquare /> {session.messageCount}</span>
                                            <span><FiClock /> {formatDate(session.lastActiveAt)}</span>
                                        </div>
                                    </div>
                                    {session.lastMessage && (
                                        <p className={styles.lastMessage}>{session.lastMessage}</p>
                                    )}
                                </div>

                                <div className={styles.sessionActions}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEdit(session.sessionId, session.sessionName);
                                        }}
                                        title="이름 변경"
                                        className={styles.actionButton}
                                    >
                                        <FiEdit2 />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDuplicateSession(session.sessionId);
                                        }}
                                        title="복사"
                                        className={styles.actionButton}
                                    >
                                        <FiCopy />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleExportSession(session.sessionId, session.sessionName);
                                        }}
                                        title="내보내기"
                                        className={styles.actionButton}
                                    >
                                        <FiDownload />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSession(session.sessionId, session.sessionName);
                                        }}
                                        title="삭제"
                                        className={`${styles.actionButton} ${styles.dangerAction}`}
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SessionManager;