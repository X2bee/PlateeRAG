'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiPlus, FiTrash2, FiX, FiSave, FiRefreshCw, FiEdit3 } from 'react-icons/fi';
import styles from '@/app/main/workflowSection/assets/LocalMcpSettingsModal.module.scss';
import {
    RegisteredLocalMcpServer,
    loadRegisteredLocalMcpServers,
    registerLocalMcpServer,
    removeLocalMcpServer,
} from '@/app/_common/mcp/localMcpRegistry';
import { showErrorToastKo, showSuccessToastKo } from '@/app/_common/utils/toastUtilsKo';

interface LocalMcpSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onServersChange?: (servers: RegisteredLocalMcpServer[]) => void;
}

interface HeaderRow {
    id: string;
    key: string;
    value: string;
}

interface FormState {
    name: string;
    description: string;
    endpoint: string;
    meta: string;
    headers: HeaderRow[];
}

const defaultFormState: FormState = {
    name: '',
    description: '',
    endpoint: '',
    meta: '',
    headers: [],
};

const parseMeta = (meta: string) => {
    if (!meta.trim()) return undefined;
    try {
        return JSON.parse(meta);
    } catch {
        throw new Error('메타데이터는 유효한 JSON 형식이어야 합니다.');
    }
};

const buildHeadersObject = (rows: HeaderRow[]) => {
    const headers: Record<string, string> = {};
    rows.forEach(({ key, value }) => {
        const headerKey = key.trim();
        if (!headerKey) return;
        headers[headerKey] = value.trim();
    });
    return Object.keys(headers).length > 0 ? headers : undefined;
};

const headersFromObject = (headers?: Record<string, string>): HeaderRow[] => {
    if (!headers) return [];
    return Object.entries(headers).map(([key, value]) => ({
        id: `${key}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        key,
        value,
    }));
};

const LocalMcpSettingsModal: React.FC<LocalMcpSettingsModalProps> = ({ isOpen, onClose, onServersChange }) => {
    const [servers, setServers] = useState<RegisteredLocalMcpServer[]>([]);
    const [formState, setFormState] = useState<FormState>(defaultFormState);
    const [editingServerName, setEditingServerName] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const resetForm = useCallback(() => {
        setFormState(defaultFormState);
        setEditingServerName(null);
    }, []);

    const loadServers = useCallback(() => {
        const registered = loadRegisteredLocalMcpServers();
        setServers(registered);
        return registered;
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const registered = loadServers();

        // Preserve editing server when reopening modal
        if (editingServerName) {
            const editing = registered.find((server) => server.name === editingServerName);
            if (editing) {
                setFormState({
                    name: editing.name,
                    description: editing.description ?? '',
                    endpoint: editing.endpoint,
                    meta: editing.meta ? JSON.stringify(editing.meta, null, 2) : '',
                    headers: headersFromObject(editing.headers),
                });
            } else {
                resetForm();
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, loadServers, editingServerName, onClose, resetForm]);

    const handleOverlayClick = (event: React.MouseEvent) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    const startEditingServer = (server: RegisteredLocalMcpServer) => {
        setEditingServerName(server.name);
        setFormState({
            name: server.name,
            description: server.description ?? '',
            endpoint: server.endpoint,
            meta: server.meta ? JSON.stringify(server.meta, null, 2) : '',
            headers: headersFromObject(server.headers),
        });
    };

    const handleAddHeaderRow = () => {
        setFormState((prev) => ({
            ...prev,
            headers: [
                ...prev.headers,
                {
                    id: `header-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    key: '',
                    value: '',
                },
            ],
        }));
    };

    const handleUpdateHeaderRow = (id: string, field: keyof HeaderRow, value: string) => {
        setFormState((prev) => ({
            ...prev,
            headers: prev.headers.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
        }));
    };

    const handleRemoveHeaderRow = (id: string) => {
        setFormState((prev) => ({
            ...prev,
            headers: prev.headers.filter((row) => row.id !== id),
        }));
    };

    const handleInputChange = (field: keyof FormState, value: string) => {
        setFormState((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const validateForm = useCallback((state: FormState) => {
        if (!state.name.trim()) {
            throw new Error('서버 이름을 입력해 주세요.');
        }
        if (!state.endpoint.trim()) {
            throw new Error('서버 엔드포인트를 입력해 주세요.');
        }
        try {
            new URL(state.endpoint);
        } catch {
            throw new Error('엔드포인트는 유효한 URL이어야 합니다.');
        }
        // Disallow duplicate names when creating new server
        if (editingServerName === null) {
            const duplicate = servers.find((server) => server.name === state.name.trim());
            if (duplicate) {
                throw new Error('이미 존재하는 서버 이름입니다. 다른 이름을 사용해주세요.');
            }
        } else if (editingServerName && editingServerName !== state.name.trim()) {
            const duplicate = servers.find((server) => server.name === state.name.trim());
            if (duplicate) {
                throw new Error('해당 이름의 서버가 이미 존재합니다.');
            }
        }
    }, [editingServerName, servers]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (saving) return;

        try {
            validateForm(formState);
            const meta = parseMeta(formState.meta);
            const headers = buildHeadersObject(formState.headers);

            const newServer: RegisteredLocalMcpServer = {
                name: formState.name.trim(),
                description: formState.description.trim() || undefined,
                endpoint: formState.endpoint.trim(),
                meta,
                headers,
            };

            setSaving(true);
            // If the user changed the name while editing, remove the previous entry first
            if (editingServerName && editingServerName !== newServer.name) {
                removeLocalMcpServer(editingServerName);
            }

            const updatedServers = registerLocalMcpServer(newServer);
            setServers(updatedServers);
            setEditingServerName(newServer.name);
            showSuccessToastKo('로컬 MCP 서버가 저장되었습니다.');
            onServersChange?.(updatedServers);
        } catch (error) {
            showErrorToastKo(error instanceof Error ? error.message : '서버 저장 중 오류가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteServer = (serverName: string) => {
        if (!window.confirm('선택한 MCP 서버를 삭제하시겠습니까?')) {
            return;
        }
        const updatedServers = removeLocalMcpServer(serverName);
        setServers(updatedServers);
        if (editingServerName === serverName) {
            resetForm();
        }
        showSuccessToastKo('로컬 MCP 서버가 삭제되었습니다.');
        onServersChange?.(updatedServers);
    };

    const defaultServerName = useMemo(() => servers[0]?.name ?? null, [servers]);
    const titleId = useMemo(
        () => `local-mcp-settings-title-${Math.random().toString(36).slice(2, 10)}`,
        [],
    );

    const handleOverlayKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClose();
        }
    };

    const modalContent = (
        <div
            className={styles.modalOverlay}
            onClick={handleOverlayClick}
            onKeyDown={handleOverlayKeyDown}
            tabIndex={0}
            role="button"
            aria-label="배경을 클릭하거나 Enter 키를 눌러 모달을 닫습니다."
        >
            <div
                className={styles.modalContainer}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <div className={styles.modalHeader}>
                    <div>
                        <h2 id={titleId}>로컬 MCP 설정</h2>
                        <p>브라우저가 프록시할 로컬 MCP 서버 정보를 관리합니다.</p>
                    </div>
                    <button className={styles.iconButton} onClick={onClose} aria-label="닫기">
                        <FiX />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <section className={styles.sidebar}>
                        <div className={styles.sidebarHeader}>
                            <h3>등록된 서버</h3>
                            <button
                                className={styles.textButton}
                                onClick={() => {
                                    resetForm();
                                }}
                            >
                                <FiPlus />
                                새 서버
                            </button>
                        </div>
                        <ul className={styles.serverList}>
                            {servers.map((server) => (
                                <li
                                    key={server.name}
                                    className={`${styles.serverItem} ${
                                        editingServerName === server.name ? styles.active : ''
                                    }`}
                                >
                                    <button
                                        className={styles.serverInfo}
                                        onClick={() => startEditingServer(server)}
                                        type="button"
                                    >
                                        <div className={styles.serverNameRow}>
                                            <span className={styles.serverName}>{server.name}</span>
                                            {defaultServerName === server.name && (
                                                <span className={styles.defaultBadge}>기본</span>
                                            )}
                                        </div>
                                        <span className={styles.serverEndpoint}>{server.endpoint}</span>
                                        {server.description && (
                                            <span className={styles.serverDescription}>{server.description}</span>
                                        )}
                                    </button>
                                    <div className={styles.serverActions}>
                                        <button
                                            className={styles.iconButton}
                                            onClick={() => startEditingServer(server)}
                                            aria-label={`${server.name} 편집`}
                                        >
                                            <FiEdit3 />
                                        </button>
                                        <button
                                            className={styles.iconButtonDanger}
                                            onClick={() => handleDeleteServer(server.name)}
                                            aria-label={`${server.name} 삭제`}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </li>
                            ))}
                            {servers.length === 0 && (
                                <li className={styles.emptyState}>
                                    <p>등록된 로컬 MCP 서버가 없습니다. 새 서버를 추가해 주세요.</p>
                                </li>
                            )}
                        </ul>
                    </section>

                    <section className={styles.formSection}>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formHeader}>
                                <h3>{editingServerName ? '서버 편집' : '새 서버 추가'}</h3>
                                {editingServerName && (
                                    <span className={styles.editingBadge}>{editingServerName} 편집 중</span>
                                )}
                            </div>
                            <div className={styles.formGrid}>
                                <label className={styles.formField}>
                                    <span>서버 이름 *</span>
                                    <input
                                        type="text"
                                        value={formState.name}
                                        onChange={(event) => handleInputChange('name', event.target.value)}
                                        placeholder="예: local-python"
                                    />
                                </label>
                                <label className={styles.formField}>
                                    <span>설명</span>
                                    <input
                                        type="text"
                                        value={formState.description}
                                        onChange={(event) => handleInputChange('description', event.target.value)}
                                        placeholder="서버 설명 (선택 사항)"
                                    />
                                </label>
                                <label className={styles.formFieldWide}>
                                    <span>엔드포인트 URL *</span>
                                    <input
                                        type="url"
                                        value={formState.endpoint}
                                        onChange={(event) => handleInputChange('endpoint', event.target.value)}
                                        placeholder="http://127.0.0.1:4637/mcp"
                                    />
                                </label>
                                <label className={styles.formFieldWide}>
                                    <span>메타데이터 (JSON)</span>
                                    <textarea
                                        value={formState.meta}
                                        onChange={(event) => handleInputChange('meta', event.target.value)}
                                        placeholder='{"version": "0.1.0"}'
                                        rows={4}
                                    />
                                </label>
                            </div>

                            <div className={styles.headersSection}>
                                <div className={styles.sectionTitle}>
                                    <h4>추가 헤더</h4>
                                    <button
                                        type="button"
                                        className={styles.textButton}
                                        onClick={handleAddHeaderRow}
                                    >
                                        <FiPlus />
                                        헤더 추가
                                    </button>
                                </div>
                                {formState.headers.length === 0 ? (
                                    <p className={styles.helperText}>필요한 경우 인증 토큰 등 추가 헤더를 입력하세요.</p>
                                ) : (
                                    <div className={styles.headersList}>
                                        {formState.headers.map((row) => (
                                            <div key={row.id} className={styles.headerRow}>
                                                <input
                                                    type="text"
                                                    value={row.key}
                                                    onChange={(event) =>
                                                        handleUpdateHeaderRow(row.id, 'key', event.target.value)
                                                    }
                                                    placeholder="Header 이름"
                                                />
                                                <input
                                                    type="text"
                                                    value={row.value}
                                                    onChange={(event) =>
                                                        handleUpdateHeaderRow(row.id, 'value', event.target.value)
                                                    }
                                                    placeholder="Header 값"
                                                />
                                                <button
                                                    type="button"
                                                    className={styles.iconButtonDanger}
                                                    onClick={() => handleRemoveHeaderRow(row.id)}
                                                    aria-label="헤더 삭제"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    onClick={() => {
                                        resetForm();
                                    }}
                                >
                                    <FiRefreshCw />
                                    새로 작성
                                </button>
                                <div className={styles.footerActions}>
                                    <button
                                        type="button"
                                        className={styles.secondaryButton}
                                        onClick={onClose}
                                    >
                                        닫기
                                    </button>
                                    <button type="submit" className={styles.primaryButton} disabled={saving}>
                                        <FiSave />
                                        {saving ? '저장 중...' : '저장'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );

    if (!isOpen) {
        return null;
    }

    return createPortal(modalContent, document.body);
};

export default LocalMcpSettingsModal;
