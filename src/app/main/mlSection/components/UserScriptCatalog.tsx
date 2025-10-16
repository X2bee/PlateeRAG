'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiCode, FiInfo, FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { mlAPI } from '@/app/_common/api/mlAPI';
import { showErrorToastKo, showSuccessToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from '@/app/main/mlSection/assets/MLTrain.module.scss';
import { createPortal } from 'react-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark as syntaxTheme } from 'react-syntax-highlighter/dist/esm/styles/prism';


interface ScriptMetadata {
    name: string;
    display_name: string;
    version: string;
    description: string;
    tags: string[];
    task: string;
}

interface UserScript {
    id: string;
    name: string;
    display_name: string;
    version: string;
    task: string;
    description: string;
    tags: string[];
    script_path: string;
    absolute_path: string;
    checksum: string;
    size_bytes: number;
    registered_at: string;
    metadata: ScriptMetadata;
}

interface UserScriptCatalogProps {
    task: string;
    selectedScripts: string[];
    onScriptSelect: (scriptName: string, version: string, selected: boolean) => void;
}

interface GroupedScripts {
    [scriptName: string]: UserScript[];
}

const UserScriptCatalog: React.FC<UserScriptCatalogProps> = ({
    task,
    selectedScripts,
    onScriptSelect,
}) => {
    const [scripts, setScripts] = useState<UserScript[]>([]);
    const [groupedScripts, setGroupedScripts] = useState<GroupedScripts>({});
    const [expandedScripts, setExpandedScripts] = useState<Set<string>>(new Set());
    const [selectedVersions, setSelectedVersions] = useState<{ [scriptName: string]: string }>({});
    const [viewingContent, setViewingContent] = useState<{ name: string; version: string } | null>(
        null,
    );
    const [scriptContent, setScriptContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [loadingContent, setLoadingContent] = useState(false);

    // 카탈로그 로드
    const loadCatalog = useCallback(async () => {
        setLoading(true);
        try {
            const response = await mlAPI.getScriptCatalog();
            const allScripts: UserScript[] = response.scripts || [];

            // task로 필터링
            const filteredScripts = allScripts.filter((script) => script.task === task);
            setScripts(filteredScripts);

            // 스크립트 이름별로 그룹화
            const grouped: GroupedScripts = {};
            filteredScripts.forEach((script) => {
                if (!grouped[script.name]) {
                    grouped[script.name] = [];
                }
                grouped[script.name].push(script);
            });

            // 각 그룹 내에서 버전별로 정렬 (최신 버전이 먼저)
            Object.keys(grouped).forEach((name) => {
                grouped[name].sort((a, b) => {
                    const versionA = a.version.split('.').map(Number);
                    const versionB = b.version.split('.').map(Number);
                    for (let i = 0; i < 3; i++) {
                        if (versionB[i] !== versionA[i]) {
                            return versionB[i] - versionA[i];
                        }
                    }
                    return 0;
                });
            });

            setGroupedScripts(grouped);

            // 각 스크립트의 최신 버전을 기본 선택
            const defaultVersions: { [scriptName: string]: string } = {};
            Object.keys(grouped).forEach((name) => {
                if (grouped[name].length > 0) {
                    defaultVersions[name] = grouped[name][0].version;
                }
            });
            setSelectedVersions(defaultVersions);

            showSuccessToastKo('사용자 스크립트 카탈로그를 불러왔습니다.');
        } catch (error: any) {
            console.error('Failed to load script catalog:', error);
            showErrorToastKo(error?.message || '카탈로그 로드에 실패했습니다.');
            setScripts([]);
            setGroupedScripts({});
        } finally {
            setLoading(false);
        }
    }, [task]);

    useEffect(() => {
        loadCatalog();
    }, [loadCatalog]);

    // 스크립트 확장/축소 토글
    const toggleExpand = (scriptName: string) => {
        setExpandedScripts((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(scriptName)) {
                newSet.delete(scriptName);
            } else {
                newSet.add(scriptName);
            }
            return newSet;
        });
    };

    // 버전 선택
    const handleVersionSelect = (scriptName: string, version: string) => {
        setSelectedVersions((prev) => ({
            ...prev,
            [scriptName]: version,
        }));
    };

    // 스크립트 컨텐츠 보기
    const viewContent = async (scriptName: string, version: string) => {
        setViewingContent({ name: scriptName, version });
        setLoadingContent(true);
        try {
            const response = await mlAPI.getScriptContent(scriptName, version);
            setScriptContent(response.content || '');
        } catch (error: any) {
            console.error('Failed to load script content:', error);
            showErrorToastKo(error?.message || '스크립트 내용을 불러오는데 실패했습니다.');
            setScriptContent('// 스크립트 내용을 불러올 수 없습니다.');
        } finally {
            setLoadingContent(false);
        }
    };

    // 모달 닫기
    const closeModal = () => {
        setViewingContent(null);
        setScriptContent('');
    };

    // 스크립트 선택/해제
    const handleScriptToggle = (scriptName: string, selected: boolean) => {
        const version = selectedVersions[scriptName];
        if (version) {
            onScriptSelect(scriptName, version, selected);
        }
    };

    // 선택된 스크립트인지 확인 (이름으로만)
    const isScriptSelected = (scriptName: string): boolean => {
        return selectedScripts.some((selected) => selected.startsWith(scriptName));
    };

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    gap: '0.5rem',
                }}
            >
                <div className={styles.spinner} style={{ width: '20px', height: '20px' }} />
                <span style={{ color: '#6b7280' }}>사용자 스크립트 불러오는 중...</span>
            </div>
        );
    }

    if (Object.keys(groupedScripts).length === 0) {
        return (
            <div
                style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6b7280',
                    border: '1px dashed #e5e7eb',
                    borderRadius: '0.5rem',
                }}
            >
                <FiCode size={32} style={{ margin: '0 auto 0.75rem' }} />
                <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    등록된 사용자 스크립트가 없습니다.
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    &quot;작업 공간 열기&quot; 버튼을 클릭하여 스크립트를 작성하고 등록하세요.
                </div>
                <button
                    type="button"
                    onClick={loadCatalog}
                    className={`${styles.button} ${styles.secondary}`}
                    style={{ marginTop: '1rem' }}
                >
                    <FiRefreshCw />
                    새로고침
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                }}
            >
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    등록된 사용자 스크립트 ({Object.keys(groupedScripts).length}개)
                </div>
                <button
                    type="button"
                    onClick={loadCatalog}
                    className={`${styles.button} ${styles.secondary}`}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                >
                    <FiRefreshCw size={12} />
                    새로고침
                </button>
            </div>

            {Object.entries(groupedScripts).map(([scriptName, versions]) => {
                const latestVersion = versions[0];
                const selectedVersion =
                    selectedVersions[scriptName] || latestVersion.version;
                const currentScript =
                    versions.find((v) => v.version === selectedVersion) || latestVersion;
                const isExpanded = expandedScripts.has(scriptName);
                const isSelected = isScriptSelected(scriptName);

                return (
                    <div
                        key={scriptName}
                        style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            overflow: 'hidden',
                            background: isSelected ? '#f0f9ff' : '#ffffff',
                        }}
                    >
                        {/* 메인 헤더 */}
                        <div
                            style={{
                                padding: '0.75rem',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleScriptToggle(scriptName, e.target.checked)}
                                className={styles.checkbox}
                                style={{ marginTop: '0.125rem' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontWeight: 500,
                                        color: '#374151',
                                        marginBottom: '0.25rem',
                                    }}
                                >
                                    {currentScript.display_name}
                                    <span
                                        style={{
                                            marginLeft: '0.5rem',
                                            padding: '0.125rem 0.25rem',
                                            background: '#0f172a',
                                            color: 'white',
                                            fontSize: '0.625rem',
                                            borderRadius: '0.25rem',
                                        }}
                                    >
                                        사용자
                                    </span>
                                    {versions.length > 1 && (
                                        <span
                                            style={{
                                                marginLeft: '0.5rem',
                                                padding: '0.125rem 0.25rem',
                                                background: '#3b82f6',
                                                color: 'white',
                                                fontSize: '0.625rem',
                                                borderRadius: '0.25rem',
                                            }}
                                        >
                                            {versions.length}개 버전
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    {currentScript.description}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {versions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => toggleExpand(scriptName)}
                                        className={`${styles.button} ${styles.secondary}`}
                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                    >
                                        {isExpanded ? (
                                            <>
                                                <FiChevronUp size={12} />
                                                접기
                                            </>
                                        ) : (
                                            <>
                                                <FiChevronDown size={12} />
                                                버전 선택
                                            </>
                                        )}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => viewContent(scriptName, selectedVersion)}
                                    className={`${styles.button} ${styles.secondary}`}
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                >
                                    <FiCode size={12} />
                                    코드 보기
                                </button>
                            </div>
                        </div>

                        {/* 버전 선택 영역 */}
                        {isExpanded && versions.length > 1 && (
                            <div
                                style={{
                                    padding: '0.75rem',
                                    background: '#f9fafb',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: '#374151',
                                        marginBottom: '0.25rem',
                                    }}
                                >
                                    버전 선택:
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                        gap: '0.5rem',
                                    }}
                                >
                                    {versions.map((version) => (
                                        <label
                                            key={version.version}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.5rem',
                                                background: '#ffffff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '0.25rem',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name={`version-${scriptName}`}
                                                checked={selectedVersion === version.version}
                                                onChange={() =>
                                                    handleVersionSelect(
                                                        scriptName,
                                                        version.version,
                                                    )
                                                }
                                                style={{ margin: 0 }}
                                            />
                                            <span>v{version.version}</span>
                                            {version.version === latestVersion.version && (
                                                <span
                                                    style={{
                                                        marginLeft: 'auto',
                                                        padding: '0.125rem 0.25rem',
                                                        background: '#10b981',
                                                        color: 'white',
                                                        fontSize: '0.625rem',
                                                        borderRadius: '0.25rem',
                                                    }}
                                                >
                                                    최신
                                                </span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 스크립트 내용 보기 모달 */}
            {viewingContent && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '2rem',
                    }}
                    onClick={closeModal}
                >
                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: '0.5rem',
                            width: '100%',
                            maxWidth: '900px',
                            maxHeight: '80vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 모달 헤더 */}
                        <div
                            style={{
                                padding: '1.5rem',
                                borderBottom: '1px solid #e5e7eb',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                                    {viewingContent.name} v{viewingContent.version}
                                </h3>
                                <p
                                    style={{
                                        margin: '0.25rem 0 0 0',
                                        fontSize: '0.875rem',
                                        color: '#6b7280',
                                    }}
                                >
                                    스크립트 내용
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '0.25rem',
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* 모달 본문 */}
                        <div
                            style={{
                                flex: 1,
                                overflow: 'auto',
                                padding: '1.5rem',
                                background: '#1e293b',
                            }}
                        >
                            {loadingContent ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '2rem',
                                        gap: '0.5rem',
                                    }}
                                >
                                    <div
                                        className={styles.spinner}
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                    <span style={{ color: '#ffffff' }}>불러오는 중...</span>
                                </div>
                            ) : (
                                <SyntaxHighlighter
                                    language="python"
                                    style={syntaxTheme}
                                    customStyle={{
                                        margin: 0,
                                        background: 'transparent',
                                        padding: 0,
                                        minHeight: '100%',
                                        fontFamily:
                                            '\'JetBrains Mono\', Consolas, Monaco, \'Courier New\', monospace',
                                        fontSize: '0.875rem',
                                        lineHeight: '1.55',
                                    }}
                                    codeTagProps={{
                                        style: {
                                            fontFamily:
                                                '\'JetBrains Mono\', Consolas, Monaco, \'Courier New\', monospace',
                                            fontSize: '0.875rem',
                                            lineHeight: '1.55',
                                        },
                                    }}
                                >
                                    {scriptContent || ' '}
                                </SyntaxHighlighter>
                            )}
                        </div>

                        {/* 모달 푸터 */}
                        <div
                            style={{
                                padding: '1rem 1.5rem',
                                borderTop: '1px solid #e5e7eb',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.5rem',
                            }}
                        >
                            <button
                                type="button"
                                onClick={closeModal}
                                className={`${styles.button} ${styles.secondary}`}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
};

export default UserScriptCatalog;
