'use client';

import React, { useState, useEffect } from 'react';
import {
    FiServer,
    FiRefreshCw,
    FiTrash2,
    FiTool,
    FiClock,
    FiActivity,
    FiPlay,
    FiAlertCircle
} from 'react-icons/fi';
import RefreshButton from '@/app/_common/icons/refresh';
import styles from '@/app/admin/assets/MCPStation.module.scss';
import {
    checkMCPHealth,
    listMCPSessions,
    deleteMCPSession,
    getMCPSessionTools,
    listMCPTools,
} from '@/app/admin/api/mcp';
import toast from 'react-hot-toast';

interface MCPSession {
    session_id: string;
    session_name?: string;
    server_type: string;
    server_command?: string;
    server_args?: string[];
    status: string;
    created_at: string;
    pid?: number;
    error_message?: string;
}

interface MCPTool {
    name: string;
    description?: string;
    inputSchema?: any;
}

interface SessionWithTools extends MCPSession {
    tools?: MCPTool[];
    toolsLoading?: boolean;
    toolsExpanded?: boolean;
}

const MCPStation: React.FC = () => {
    const [sessions, setSessions] = useState<SessionWithTools[]>([]);
    const [mcpHealthy, setMcpHealthy] = useState<boolean>(false);
    const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // MCP Station 헬스체크
    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 30000); // 30초마다 체크
        return () => clearInterval(interval);
    }, []);

    // 초기 세션 로드
    useEffect(() => {
        if (mcpHealthy) {
            loadSessions();
        }
    }, [mcpHealthy]);

    const checkHealth = async () => {
        try {
            await checkMCPHealth();
            setMcpHealthy(true);
        } catch (error) {
            console.error('MCP health check failed:', error);
            setMcpHealthy(false);
        }
    };

    const loadSessions = async () => {
        try {
            setIsLoadingSessions(true);
            const sessionList = await listMCPSessions();
            setSessions(sessionList.map((session: MCPSession) => ({
                ...session,
                tools: undefined,
                toolsLoading: false,
                toolsExpanded: false,
            })));
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to load MCP sessions:', error);
            toast.error('세션 목록 로드 실패');
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm('이 세션을 정말 삭제하시겠습니까?')) {
            return;
        }

        try {
            toast.loading('세션 삭제 중...', { id: 'delete-session' });
            await deleteMCPSession(sessionId);
            toast.success('세션이 삭제되었습니다', { id: 'delete-session' });
            await loadSessions();
        } catch (error) {
            console.error('Failed to delete session:', error);
            toast.error('세션 삭제 실패', { id: 'delete-session' });
        }
    };

    const handleToggleTools = async (sessionId: string) => {
        const session = sessions.find(s => s.session_id === sessionId);
        if (!session) return;

        // 이미 펼쳐져 있으면 접기
        if (session.toolsExpanded) {
            setSessions(sessions.map(s =>
                s.session_id === sessionId
                    ? { ...s, toolsExpanded: false }
                    : s
            ));
            return;
        }

        // 도구 목록이 없으면 로드
        if (!session.tools) {
            try {
                setSessions(sessions.map(s =>
                    s.session_id === sessionId
                        ? { ...s, toolsLoading: true }
                        : s
                ));

                const response: any = await getMCPSessionTools(sessionId);
                const tools = response.tools || [];

                setSessions(sessions.map(s =>
                    s.session_id === sessionId
                        ? {
                            ...s,
                            tools,
                            toolsLoading: false,
                            toolsExpanded: true
                        }
                        : s
                ));
            } catch (error) {
                console.error('Failed to load tools:', error);
                toast.error('도구 목록 로드 실패');
                setSessions(sessions.map(s =>
                    s.session_id === sessionId
                        ? { ...s, toolsLoading: false }
                        : s
                ));
            }
        } else {
            // 이미 로드된 도구 목록이 있으면 토글
            setSessions(sessions.map(s =>
                s.session_id === sessionId
                    ? { ...s, toolsExpanded: true }
                    : s
            ));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'running':
                return styles.statusRunning;
            case 'starting':
                return styles.statusStarting;
            case 'stopped':
            case 'error':
                return styles.statusError;
            default:
                return styles.statusDefault;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'running':
                return <FiPlay />;
            case 'error':
                return <FiAlertCircle />;
            default:
                return <FiActivity />;
        }
    };

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
        return `${days}일 전`;
    };

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <FiServer className={styles.headerIcon} />
                    <div>
                        <h2 className={styles.title}>MCP Station</h2>
                        <p className={styles.subtitle}>활성 MCP 세션 관리</p>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.statusIndicator}>
                        <span className={`${styles.statusDot} ${mcpHealthy ? styles.healthy : styles.unhealthy}`} />
                        <span className={styles.statusText}>
                            {mcpHealthy ? 'MCP Station 연결됨' : 'MCP Station 연결 안됨'}
                        </span>
                    </div>
                    <RefreshButton
                        onClick={loadSessions}
                        disabled={!mcpHealthy}
                        loading={isLoadingSessions}
                        title="세션 목록 새로고침"
                    />
                </div>
            </div>

            {/* 통계 */}
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <FiServer />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>총 세션</span>
                        <span className={styles.statValue}>{sessions.length}</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <FiActivity />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>실행 중</span>
                        <span className={styles.statValue}>
                            {sessions.filter(s => s.status === 'running').length}
                        </span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <FiClock />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statLabel}>마지막 업데이트</span>
                        <span className={styles.statValue}>
                            {lastUpdated ? formatDate(lastUpdated.toISOString()) : '-'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 세션 목록 */}
            <div className={styles.sessionsContainer}>
                {isLoadingSessions && sessions.length === 0 ? (
                    <div className={styles.loadingState}>
                        <FiRefreshCw className={styles.spinning} />
                        <p>세션 목록을 불러오는 중...</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FiServer className={styles.emptyIcon} />
                        <h3>활성 세션이 없습니다</h3>
                        <p>MCP Market에서 새로운 MCP 서버를 시작하세요</p>
                    </div>
                ) : (
                    <div className={styles.sessionsList}>
                        {sessions.map((session) => (
                            <div key={session.session_id} className={styles.sessionCard}>
                                {/* 세션 헤더 */}
                                <div className={styles.sessionHeader}>
                                    <div className={styles.sessionInfo}>
                                        <div className={styles.sessionTitle}>
                                            <FiServer />
                                            <span className={styles.sessionName}>
                                                {session.session_name || 'Unnamed Session'}
                                            </span>
                                            <span className={`${styles.statusBadge} ${getStatusColor(session.status)}`}>
                                                {getStatusIcon(session.status)}
                                                {session.status}
                                            </span>
                                        </div>
                                        <div className={styles.sessionIdRow}>
                                            <strong>Session ID:</strong>
                                            <code className={styles.sessionId}>{session.session_id}</code>
                                        </div>
                                        <div className={styles.sessionCommandRow}>
                                            <strong>Command:</strong>
                                            <code>{session.server_command} {session.server_args?.join(' ')}</code>
                                        </div>
                                        <div className={styles.sessionMeta}>
                                            <span className={styles.metaItem}>
                                                <FiServer />
                                                {session.server_type}
                                            </span>
                                            <span className={styles.metaItem}>
                                                <FiClock />
                                                {formatDate(session.created_at)}
                                            </span>
                                            {session.pid && (
                                                <span className={styles.metaItem}>
                                                    PID: {session.pid}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.sessionActions}>
                                        <button
                                            onClick={() => handleToggleTools(session.session_id)}
                                            className={styles.actionButton}
                                            title="도구 목록 보기"
                                        >
                                            <FiTool />
                                            도구 {session.tools && `(${session.tools.length})`}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSession(session.session_id)}
                                            className={`${styles.actionButton} ${styles.danger}`}
                                            title="세션 삭제"
                                        >
                                            <FiTrash2 />
                                            삭제
                                        </button>
                                    </div>
                                </div>

                                {/* 에러 메시지 */}
                                {session.error_message && (
                                    <div className={styles.errorMessage}>
                                        <FiAlertCircle />
                                        {session.error_message}
                                    </div>
                                )}

                                {/* 도구 목록 */}
                                {session.toolsExpanded && (
                                    <div className={styles.toolsContainer}>
                                        {session.toolsLoading ? (
                                            <div className={styles.toolsLoading}>
                                                <FiRefreshCw className={styles.spinning} />
                                                도구 목록 로딩 중...
                                            </div>
                                        ) : session.tools && session.tools.length > 0 ? (
                                            <div className={styles.toolsList}>
                                                <h4 className={styles.toolsTitle}>
                                                    사용 가능한 도구 ({session.tools.length}개)
                                                </h4>
                                                <div className={styles.toolsGrid}>
                                                    {session.tools.map((tool, index) => (
                                                        <div key={index} className={styles.toolCard}>
                                                            <div className={styles.toolHeader}>
                                                                <FiTool className={styles.toolIcon} />
                                                                <span className={styles.toolName}>{tool.name}</span>
                                                            </div>
                                                            {tool.description && (
                                                                <p className={styles.toolDescription}>
                                                                    {tool.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.noTools}>
                                                도구를 찾을 수 없습니다
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MCPStation;
