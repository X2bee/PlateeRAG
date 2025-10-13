'use client';

import React, { useState, useEffect } from 'react';
import {
    FiArrowLeft,
    FiPackage,
    FiStar,
    FiDownload,
    FiCalendar,
    FiTag,
    FiUser,
    FiCode,
    FiExternalLink,
    FiBook,
    FiPlay,
    FiCheckCircle,
    FiGithub,
    FiServer,
    FiClock,
    FiTrash2,
    FiRefreshCw,
    FiPlus,
    FiX
} from 'react-icons/fi';
import { MCPItem } from './types';
import styles from '@/app/admin/assets/MCPDetailSection.module.scss';
import {
    createPythonMCPSession,
    createNodeMCPSession,
    getMCPSessionTools,
    listMCPSessions,
    deleteMCPSession,
} from '@/app/admin/api/mcp';
import toast from 'react-hot-toast';

interface MCPDetailSectionProps {
    item: MCPItem;
    onBack: () => void;
}

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

interface EnvVarEntry {
    id: string;
    key: string;
    value: string;
    isFromTemplate: boolean;
}

const MCPDetailSection: React.FC<MCPDetailSectionProps> = ({ item, onBack }) => {
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [activeSessions, setActiveSessions] = useState<MCPSession[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [envVarEntries, setEnvVarEntries] = useState<EnvVarEntry[]>(() => {
        // item.envVars를 초기값으로 설정
        if (item.envVars && Object.keys(item.envVars).length > 0) {
            return Object.entries(item.envVars).map(([key, value], index) => ({
                id: `env-${index}`,
                key,
                value: typeof value === 'string' ? value : '',
                isFromTemplate: true
            }));
        }
        return [];
    });

    // 세션 목록 로드
    const loadSessions = async () => {
        try {
            setIsLoadingSessions(true);
            const sessions = await listMCPSessions();

            // session_name으로 필터링 (item.name과 일치하는 세션만)
            const relatedSessions = sessions.filter((session: MCPSession) => {
                return session.session_name === item.name;
            });

            setActiveSessions(relatedSessions);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    // 컴포넌트 마운트 시 세션 목록 로드
    useEffect(() => {
        loadSessions();
    }, [item]);

    const handleAddEnvVar = () => {
        const newId = `env-${Date.now()}`;
        setEnvVarEntries(prev => [...prev, {
            id: newId,
            key: '',
            value: '',
            isFromTemplate: false
        }]);
    };

    const handleRemoveEnvVar = (id: string) => {
        setEnvVarEntries(prev => prev.filter(entry => entry.id !== id));
    };

    const handleEnvVarKeyChange = (id: string, newKey: string) => {
        setEnvVarEntries(prev => prev.map(entry =>
            entry.id === id ? { ...entry, key: newKey } : entry
        ));
    };

    const handleEnvVarValueChange = (id: string, newValue: string) => {
        setEnvVarEntries(prev => prev.map(entry =>
            entry.id === id ? { ...entry, value: newValue } : entry
        ));
    };

    const handleCreateSession = async () => {
        try {
            setIsCreatingSession(true);
            toast.loading('MCP 세션 생성 중...');

            // item에서 세션 생성 정보 가져오기
            const serverType = item.serverType || 'node';
            const serverCommand = item.serverCommand || 'npx';
            const serverArgs = item.serverArgs || [];
            const workingDir = item.workingDir || undefined;

            // envVarEntries를 객체로 변환
            const envVars: Record<string, string> = {};
            const invalidEntries: string[] = [];

            envVarEntries.forEach(entry => {
                if (!entry.key.trim()) {
                    invalidEntries.push('빈 키');
                    return;
                }
                if (entry.isFromTemplate && (!entry.value || entry.value.startsWith('<') && entry.value.endsWith('>'))) {
                    invalidEntries.push(entry.key);
                    return;
                }
                envVars[entry.key] = entry.value;
            });

            if (invalidEntries.length > 0) {
                toast.dismiss();
                toast.error(`필수 환경변수를 입력해주세요: ${invalidEntries.join(', ')}`);
                return;
            }

            let session: any;
            if (serverType === 'python') {
                session = await createPythonMCPSession(serverCommand, serverArgs, envVars, workingDir, item.name);
            } else {
                session = await createNodeMCPSession(serverCommand, serverArgs, envVars, workingDir, item.name);
            }

            toast.dismiss();
            toast.success(`MCP 세션 생성 완료: ${session.session_id}`);

            // 세션 목록 새로고침
            await loadSessions();

            // 도구 목록 조회
            try {
                const tools: any = await getMCPSessionTools(session.session_id);
                console.log('Available tools:', tools);
                toast.success(`${tools.tools?.length || 0}개의 도구 발견`);
            } catch (error) {
                console.error('Failed to get tools:', error);
            }
        } catch (error) {
            toast.dismiss();
            console.error('Failed to create MCP session:', error);
            toast.error('MCP 세션 생성 실패');
        } finally {
            setIsCreatingSession(false);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm('이 세션을 삭제하시겠습니까?')) {
            return;
        }

        try {
            toast.loading('세션 삭제 중...');
            await deleteMCPSession(sessionId);
            toast.dismiss();
            toast.success('세션이 삭제되었습니다');
            await loadSessions();
        } catch (error) {
            toast.dismiss();
            console.error('Failed to delete session:', error);
            toast.error('세션 삭제 실패');
        }
    };

    const formatRelativeTime = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        return `${diffDays}일 전`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={onBack}>
                    <FiArrowLeft />
                    <span>목록으로 돌아가기</span>
                </button>
            </div>

            {/* 메인 콘텐츠 */}
            <div className={styles.content}>
                {/* 상단 정보 카드 */}
                <div className={styles.infoCard}>
                    <div className={styles.iconWrapper}>
                        {item.iconUrl ? (
                            <img src={item.iconUrl} alt={item.name} className={styles.icon} />
                        ) : (
                            <div className={styles.iconPlaceholder}>
                                <FiPackage />
                            </div>
                        )}
                    </div>

                    <div className={styles.mainInfo}>
                        <h1 className={styles.title}>{item.name}</h1>
                        <div className={styles.author}>
                            <FiUser />
                            <span>{item.author}</span>
                        </div>
                        <p className={styles.description}>{item.description}</p>

                        {/* 메타 정보 */}
                        <div className={styles.metaRow}>
                            <div className={styles.metaItem}>
                                <FiDownload />
                                <span>{item.downloads.toLocaleString()} 다운로드</span>
                            </div>
                            <div className={styles.metaItem}>
                                <FiStar />
                                <span>{item.stars.toLocaleString()} 스타</span>
                            </div>
                            <div className={styles.metaItem}>
                                <FiTag />
                                <span>v{item.version}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <FiCalendar />
                                <span>{formatDate(item.lastUpdated)}</span>
                            </div>
                            {item.language && (
                                <div className={styles.metaItem}>
                                    <FiCode />
                                    <span>{item.language}</span>
                                </div>
                            )}
                        </div>

                        {/* 상태 뱃지 */}
                        <div className={styles.badges}>
                            <span className={`${styles.badge} ${styles[`badge${item.status}`]}`}>
                                {item.status}
                            </span>
                            <span className={styles.badge}>
                                {item.category}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 환경 변수 설정 */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <FiCode />
                            <span>환경 변수 설정</span>
                        </h2>
                        <button
                            className={styles.addButton}
                            onClick={handleAddEnvVar}
                        >
                            <FiPlus />
                            <span>환경 변수 추가</span>
                        </button>
                    </div>
                    {item.envVars && Object.keys(item.envVars).length > 0 && (
                        <p className={styles.sectionDescription}>
                            이 MCP 서버를 실행하려면 다음 환경 변수를 설정해야 합니다.
                        </p>
                    )}
                    {envVarEntries.length > 0 ? (
                        <div className={styles.envVarsTable}>
                            <div className={styles.tableHeader}>
                                <div className={styles.headerCell}>Key</div>
                                <div className={styles.headerCell}>Value</div>
                                <div className={styles.headerCellAction}></div>
                            </div>
                            <div className={styles.tableBody}>
                                {envVarEntries.map((entry) => (
                                    <div key={entry.id} className={styles.tableRow}>
                                        <div className={styles.tableCell}>
                                            <input
                                                type="text"
                                                className={`${styles.envVarInput} ${entry.isFromTemplate ? styles.disabled : ''}`}
                                                value={entry.key}
                                                onChange={(e) => handleEnvVarKeyChange(entry.id, e.target.value)}
                                                placeholder="환경 변수 이름"
                                                disabled={entry.isFromTemplate}
                                            />
                                            {entry.isFromTemplate && <span className={styles.requiredBadge}>필수</span>}
                                        </div>
                                        <div className={styles.tableCell}>
                                            <input
                                                type="text"
                                                className={styles.envVarInput}
                                                value={entry.value}
                                                onChange={(e) => handleEnvVarValueChange(entry.id, e.target.value)}
                                                placeholder="값을 입력하세요"
                                            />
                                        </div>
                                        <div className={styles.tableCellAction}>
                                            {!entry.isFromTemplate && (
                                                <button
                                                    className={styles.removeButton}
                                                    onClick={() => handleRemoveEnvVar(entry.id)}
                                                    title="환경 변수 삭제"
                                                >
                                                    <FiX />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <FiCode className={styles.emptyIcon} />
                            <p>환경 변수가 없습니다.</p>
                            <p className={styles.emptyHint}>+ 버튼을 눌러 환경 변수를 추가하세요.</p>
                        </div>
                    )}
                </div>

                {/* 액션 버튼 */}
                <div className={styles.actions}>
                    <button
                        className={styles.primaryButton}
                        onClick={handleCreateSession}
                        disabled={isCreatingSession}
                    >
                        <FiPlay />
                        <span>{isCreatingSession ? '세션 생성 중...' : 'MCP 세션 실행'}</span>
                    </button>
                    {item.repository && (
                        <a
                            href={item.repository}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.secondaryButton}
                        >
                            <FiGithub />
                            <span>소스 코드</span>
                            <FiExternalLink />
                        </a>
                    )}
                    {item.documentation && (
                        <a
                            href={item.documentation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.secondaryButton}
                        >
                            <FiBook />
                            <span>문서</span>
                            <FiExternalLink />
                        </a>
                    )}
                </div>

                {/* 기능 목록 */}
                {item.features && item.features.length > 0 && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <FiCheckCircle />
                            <span>주요 기능</span>
                        </h2>
                        <div className={styles.featuresList}>
                            {item.features.map((feature, index) => (
                                <div key={index} className={styles.featureItem}>
                                    <FiCheckCircle className={styles.featureIcon} />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 활성 세션 목록 */}
                {activeSessions.length > 0 && (
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <FiServer />
                                <span>활성 세션 ({activeSessions.length})</span>
                            </h2>
                            <button
                                className={styles.refreshButton}
                                onClick={loadSessions}
                                disabled={isLoadingSessions}
                            >
                                <FiRefreshCw className={isLoadingSessions ? styles.spinning : ''} />
                                <span>새로고침</span>
                            </button>
                        </div>
                        <div className={styles.sessionsList}>
                            {activeSessions.map((session) => (
                                <div key={session.session_id} className={styles.sessionCard}>
                                    <div className={styles.sessionHeader}>
                                        <div className={styles.sessionInfo}>
                                            <div className={styles.sessionTitle}>
                                                <FiServer />
                                                <span className={styles.sessionName}>
                                                    {session.session_name || 'Unnamed Session'}
                                                </span>
                                                <span className={`${styles.statusBadge} ${styles[`status${session.status}`]}`}>
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
                                                    {formatRelativeTime(session.created_at)}
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
                                                onClick={() => handleDeleteSession(session.session_id)}
                                                className={`${styles.actionButton} ${styles.danger}`}
                                                title="세션 삭제"
                                            >
                                                <FiTrash2 />
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 설치 정보 */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <FiCode />
                        <span>설치 정보</span>
                    </h2>
                    <div className={styles.installInfo}>
                        <div className={styles.installItem}>
                            <strong>서버 타입:</strong>
                            <code>{item.serverType || 'node'}</code>
                        </div>
                        <div className={styles.installItem}>
                            <strong>실행 명령:</strong>
                            <code>{item.serverCommand || 'npx'}</code>
                        </div>
                        {item.serverArgs && item.serverArgs.length > 0 && (
                            <div className={styles.installItem}>
                                <strong>인자:</strong>
                                <code>{item.serverArgs.join(' ')}</code>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MCPDetailSection;
