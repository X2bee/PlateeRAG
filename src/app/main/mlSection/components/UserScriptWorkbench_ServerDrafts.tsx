'use client';

import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FiAlertTriangle,
    FiCheckCircle,
    FiDownload,
    FiPlay,
    FiRotateCcw,
    FiSave,
    FiUploadCloud,
    FiRefreshCw,
    FiCopy,
} from 'react-icons/fi';
import styles from '@/app/main/mlSection/assets/UserScriptWorkbench.module.scss';
import { mlAPI } from '@/app/_common/api/mlAPI';
import { showErrorToastKo, showSuccessToastKo, showWarningToastKo } from '@/app/_common/utils/toastUtilsKo';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark as syntaxTheme } from 'react-syntax-highlighter/dist/esm/styles/prism';

type MessageLevel = 'info' | 'warning' | 'error';

interface ValidationMessage {
    level: MessageLevel;
    message: string;
    code?: string;
}

interface ScriptValidationResponse {
    is_valid: boolean;
    messages: ValidationMessage[];
    metadata?: {
        name?: string;
        display_name?: string;
        version?: string;
        task?: string;
        tags?: string[];
    };
}

interface ScriptRunPayload {
    stdout?: string | string[];
    stderr?: string | string[];
    result?: {
        metrics?: Record<string, number>;
        warnings?: string[];
        errors?: string[];
    };
    duration_seconds?: number;
    started_at?: string;
    finished_at?: string;
}

interface ScriptRegisterResponse {
    catalog_entry?: {
        name: string;
        display_name?: string;
        tags?: string[];
        script_path: string;
        version?: string;
        task?: string;
        description?: string;
    };
    message?: string;
}

interface UserScriptRunConfig {
    dataset_uri: string;
    target_column: string;
    feature_columns: string[];
    artifact_dir: string;
    random_seed: number;
}

// 서버에서 받는 드래프트 형식
interface ServerDraft {
    id: string;
    name: string;
    script_path: string;
    content: string;
    task: string;
    run_config: UserScriptRunConfig;
    created_at: string;
    updated_at: string;
    last_validation_status?: string | null;
    last_validation_at?: string | null;
}

// 목록 조회용 간소화된 형식
interface ServerDraftListItem {
    id: string;
    name: string;
    script_path: string;
    task: string;
    created_at: string;
    updated_at: string;
    last_validation_status?: string | null;
}

interface ValidationCache {
    script: string;
    timestamp: string;
    response: ScriptValidationResponse;
}

interface ClientScriptAnalysis {
    errors: string[];
    warnings: string[];
    restrictedImports: string[];
}

interface UserScriptWorkbenchProps {
    task: string;
    onCatalogEntry?: (entry: ScriptRegisterResponse['catalog_entry']) => void;
    onRefreshCatalog?: () => Promise<void> | void;
}

type StepStatus = 'idle' | 'done' | 'warning' | 'error';

const AUTOSAVE_KEY = 'plateerag:user-script-autosave';
const LAST_VALIDATION_KEY = 'plateerag:user-script-last-validation';
const BLOCKLISTED_IMPORTS = ['os', 'subprocess', 'shutil', 'socket'];

// 드래프트 저장 모드: 'server'가 기본값
const DRAFT_STORAGE_MODE: 'server' | 'local' = 'server';

const getDefaultRunConfig = (): UserScriptRunConfig => ({
    dataset_uri: '',
    target_column: '',
    feature_columns: [],
    artifact_dir: '/tmp/user-scripts/artifacts',
    random_seed: 42,
});

const computeDefaultScriptPath = (task: string) => `/tmp/user_scripts/${task || 'custom'}_user.py`;

const getDefaultScriptTemplate = (task: string) => `"""User Script Template
Task: ${task}

This template mirrors the backend expectations in xgenml.core.user_scripts.base
and xgenml.models.user_script.
"""

from typing import Any, Dict

from xgenml.core.user_scripts.base import UserScriptMetadata, UserScriptRunConfig, UserScriptResult

USER_SCRIPT_METADATA = UserScriptMetadata(
    name="${task}_user_model",
    display_name="${task.toUpperCase()} 사용자 정의 모델",
    version="0.1.0",
    description="Customize this description to explain what the script does.",
    tags=["user_script"],
    task="${task}",
)


def train(config: UserScriptRunConfig) -> UserScriptResult:
    """Implement your model training logic here."""
    dataset_uri = config.dataset_uri
    target_column = config.target_column
    features = config.feature_columns

    # TODO: Load data and train your model

    result = UserScriptResult(
        stdout=["Training completed successfully."],
        stderr=[],
        metrics={
            "accuracy": 0.0,
        },
        warnings=[],
        errors=[],
        artifacts=[],
    )
    return result
`;

const analyzeScript = (script: string): ClientScriptAnalysis => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const restrictedImports: string[] = [];

    if (!script.includes('USER_SCRIPT_METADATA')) {
        errors.push('USER_SCRIPT_METADATA 블록이 존재하지 않습니다.');
    }

    const trainMatch = /def\s+train\s*\(([^)]*)\)/.exec(script);
    if (!trainMatch) {
        errors.push('train(config) 함수를 정의해야 합니다.');
    } else {
        const params = trainMatch[1].split(',').map((p) => p.trim()).filter(Boolean);
        if (params.length !== 1) {
            errors.push('train 함수는 단일 인자(config)만 받아야 합니다.');
        }
    }

    BLOCKLISTED_IMPORTS.forEach((module) => {
        const regex = new RegExp(`(^|\\s)import\\s+${module}(\\s|$)`);
        const fromRegex = new RegExp(`(^|\\s)from\\s+${module}\\s+import\\s+`);
        if (regex.test(script) || fromRegex.test(script)) {
            restrictedImports.push(module);
        }
    });

    if (restrictedImports.length > 0) {
        warnings.push(`제한된 모듈 사용 감지: ${restrictedImports.join(', ')}`);
    }

    if (/open\s*\(/.test(script)) {
        warnings.push('파일 시스템 접근 함수 open()이 감지되었습니다. 필요한 경우에만 사용하세요.');
    }

    if (/subprocess\.|Popen\(/.test(script)) {
        warnings.push('subprocess 호출이 감지되었습니다. 샌드박스에서 제한될 수 있습니다.');
    }

    if (/requests\.|urllib\.|http\.client/.test(script)) {
        warnings.push('네트워크 호출 패턴이 감지되었습니다. 보안 정책을 확인하세요.');
    }

    return { errors, warnings, restrictedImports };
};

const computeSuggestedVersion = (currentVersion: string, bump: 'major' | 'minor' | 'patch'): string => {
    const parts = currentVersion.split('.').map((part) => parseInt(part, 10));
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
        return currentVersion;
    }
    let [major, minor, patch] = parts;
    switch (bump) {
        case 'major':
            major += 1;
            minor = 0;
            patch = 0;
            break;
        case 'minor':
            minor += 1;
            patch = 0;
            break;
        default:
            patch += 1;
    }
    return `${major}.${minor}.${patch}`;
};

const replaceVersionInScript = (script: string, newVersion: string): string => {
    return script.replace(/version\s*=\s*["'](\d+\.\d+\.\d+)["']/, `version="${newVersion}"`);
};

const extractCurrentVersion = (script: string): string | null => {
    const match = script.match(/version\s*=\s*["'](\d+\.\d+\.\d+)["']/);
    return match ? match[1] : null;
};

const groupMessagesByLevel = (messages: ValidationMessage[] | undefined) => {
    const grouped: Record<MessageLevel, ValidationMessage[]> = {
        info: [],
        warning: [],
        error: [],
    };
    (messages || []).forEach((message) => {
        const level = message.level || 'info';
        grouped[level].push(message);
    });
    return grouped;
};

const formatTimestamp = (value: string | null | undefined) => {
    if (!value) return '';
    try {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString();
    } catch {
        return '';
    }
};

const normalizeStream = (stream?: string | string[]) => {
    if (!stream) {
        return '';
    }
    if (Array.isArray(stream)) {
        return stream.join('\n');
    }
    return stream;
};

const UserScriptWorkbench: React.FC<UserScriptWorkbenchProps> = ({
    task,
    onCatalogEntry,
    onRefreshCatalog,
}) => {
    const [scriptContent, setScriptContent] = useState('');
    const [scriptPath, setScriptPath] = useState('');
    const [runConfig, setRunConfig] = useState<UserScriptRunConfig>(getDefaultRunConfig);
    const [featureColumnsText, setFeatureColumnsText] = useState('');
    const [drafts, setDrafts] = useState<ServerDraftListItem[]>([]);
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
    const [draftName, setDraftName] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);

    const [validationResult, setValidationResult] = useState<ScriptValidationResponse | null>(null);
    const [lastValidationCache, setLastValidationCache] = useState<ValidationCache | null>(null);
    const [executeResult, setExecuteResult] = useState<ScriptRunPayload | null>(null);
    const [catalogEntry, setCatalogEntry] =
        useState<ScriptRegisterResponse['catalog_entry'] | null>(null);

    const [isValidating, setIsValidating] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [selectedBump, setSelectedBump] = useState<'patch' | 'minor' | 'major'>('patch');
    const [ackWarnings, setAckWarnings] = useState(false);

    // 드래프트 관련 로딩 상태
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isDeletingDraft, setIsDeletingDraft] = useState(false);

    const autosaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const editorRef = useRef<HTMLTextAreaElement | null>(null);
    const editorHighlightRef = useRef<HTMLDivElement | null>(null);

    const syncEditorScroll = useCallback(() => {
        if (!editorRef.current || !editorHighlightRef.current) {
            return;
        }
        editorHighlightRef.current.scrollTop = editorRef.current.scrollTop;
        editorHighlightRef.current.scrollLeft = editorRef.current.scrollLeft;
    }, []);

    const defaultTemplate = useMemo(() => getDefaultScriptTemplate(task), [task]);
    const defaultPath = useMemo(() => computeDefaultScriptPath(task), [task]);

    // 서버에서 드래프트 목록 가져오기
    const loadDraftsFromServer = useCallback(async () => {
        if (DRAFT_STORAGE_MODE !== 'server') return;

        setIsLoadingDrafts(true);
        try {
            const response = await mlAPI.listDrafts({
                task,
                limit: 100,
                sort: 'updated_at',
                order: 'desc',
            });
            setDrafts(response.drafts || []);
        } catch (error: any) {
            console.error('Failed to load drafts from server:', error);
            showWarningToastKo({
                message: '드래프트 목록을 불러오는 데 실패했습니다.',
                duration: 3000,
            });
        } finally {
            setIsLoadingDrafts(false);
        }
    }, [task]);

    useEffect(() => {
        if (typeof window === 'undefined' || isInitialized) {
            return;
        }

        let initialScript = defaultTemplate;
        let initialPath = defaultPath;
        let initialRunConfig = getDefaultRunConfig();

        // 자동 저장된 내용 불러오기 (로컬)
        try {
            const storedAutosave = localStorage.getItem(AUTOSAVE_KEY);
            if (storedAutosave) {
                const parsed = JSON.parse(storedAutosave);
                initialScript = parsed.content || defaultTemplate;
                initialPath = parsed.scriptPath || defaultPath;
                initialRunConfig = {
                    ...initialRunConfig,
                    ...(parsed.runConfig || {}),
                    feature_columns: Array.isArray(parsed.runConfig?.feature_columns)
                        ? parsed.runConfig.feature_columns
                        : [],
                };
            }
        } catch (error) {
            console.warn('Failed to load autosaved script:', error);
        }

        // 검증 캐시 불러오기 (로컬)
        try {
            const storedValidation = localStorage.getItem(LAST_VALIDATION_KEY);
            if (storedValidation) {
                const parsed: ValidationCache = JSON.parse(storedValidation);
                setLastValidationCache(parsed);
            }
        } catch (error) {
            console.warn('Failed to load validation cache:', error);
        }

        setScriptContent(initialScript);
        setScriptPath(initialPath);
        setRunConfig(initialRunConfig);
        setFeatureColumnsText((initialRunConfig.feature_columns || []).join(', '));
        setIsInitialized(true);

        // 서버에서 드래프트 목록 불러오기
        if (DRAFT_STORAGE_MODE === 'server') {
            loadDraftsFromServer();
        }
    }, [defaultPath, defaultTemplate, isInitialized, loadDraftsFromServer]);

    // 자동 저장 (로컬)
    useEffect(() => {
        if (!isInitialized || typeof window === 'undefined') {
            return;
        }
        if (autosaveTimeout.current) {
            clearTimeout(autosaveTimeout.current);
        }
        autosaveTimeout.current = setTimeout(() => {
            const payload = {
                content: scriptContent,
                scriptPath,
                runConfig,
            };
            try {
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
            } catch (error) {
                console.warn('Failed to store autosave draft:', error);
            }
        }, 400);

        return () => {
            if (autosaveTimeout.current) {
                clearTimeout(autosaveTimeout.current);
            }
        };
    }, [isInitialized, runConfig, scriptContent, scriptPath]);

    useEffect(() => {
        setFeatureColumnsText((runConfig.feature_columns || []).join(', '));
    }, [runConfig.feature_columns]);

    useEffect(() => {
        setAckWarnings(false);
    }, [scriptContent]);

    useEffect(() => {
        syncEditorScroll();
    }, [scriptContent, syncEditorScroll]);

    const handleScriptChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setScriptContent(event.target.value);
        syncEditorScroll();
    };

    const handleEditorScroll = () => {
        syncEditorScroll();
    };

    const handleFeatureColumnsBlur = () => {
        const columns = featureColumnsText
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        setRunConfig((prev) => ({
            ...prev,
            feature_columns: columns,
        }));
    };

    const clientAnalysis = useMemo(() => analyzeScript(scriptContent), [scriptContent]);
    const groupedMessages = useMemo(
        () => groupMessagesByLevel(validationResult?.messages),
        [validationResult],
    );
    const hasValidationErrors = groupedMessages.error.length > 0;
    const hasValidationWarnings = groupedMessages.warning.length > 0;
    const hasClientErrors = clientAnalysis.errors.length > 0;
    const hasClientWarnings = clientAnalysis.warnings.length > 0;
    const executeWarnings = executeResult?.result?.warnings || [];
    const executeErrors = executeResult?.result?.errors || [];

    const lastValidationScript = lastValidationCache?.script;
    const validationStale =
        lastValidationScript !== undefined && lastValidationScript !== scriptContent;

    const validationStatusLabel = useMemo(() => {
        if (!validationResult) return '검증 전';
        if (validationResult.is_valid) {
            return validationStale ? '검증 통과 (스크립트 수정됨)' : '검증 통과';
        }
        return '검증 실패';
    }, [validationResult, validationStale]);

    const validationStatusTone = useMemo(() => {
        if (!validationResult) return 'idle';
        if (hasValidationErrors || hasClientErrors) return 'error';
        if (validationResult.is_valid && !validationStale) return 'success';
        return 'warning';
    }, [hasClientErrors, hasValidationErrors, validationResult, validationStale]);

    const requiresWarningAck =
        hasValidationWarnings || hasClientWarnings || (executeWarnings?.length ?? 0) > 0;

    const scriptFilename = useMemo(() => {
        if (!scriptPath) return 'user_script.py';
        const segments = scriptPath.split('/');
        return segments.pop() || 'user_script.py';
    }, [scriptPath]);

    // 서버에 드래프트 저장
    const handleSaveDraft = async () => {
        const name =
            draftName.trim() ||
            scriptFilename.replace('.py', '') ||
            `사용자 스크립트 ${drafts.length + 1}`;

        setIsSavingDraft(true);
        try {
            if (activeDraftId) {
                // 기존 드래프트 수정
                await mlAPI.updateDraft(activeDraftId, {
                    name,
                    script_path: scriptPath,
                    content: scriptContent,
                    run_config: {
                        ...runConfig,
                        feature_columns: [...runConfig.feature_columns],
                    },
                });
                showSuccessToastKo('드래프트가 업데이트되었습니다.');
            } else {
                // 새 드래프트 생성
                const newDraft: ServerDraft = await mlAPI.createDraft({
                    name,
                    script_path: scriptPath,
                    content: scriptContent,
                    task,
                    run_config: {
                        ...runConfig,
                        feature_columns: [...runConfig.feature_columns],
                    },
                });
                setActiveDraftId(newDraft.id);
                setDraftName(newDraft.name);
                showSuccessToastKo('드래프트가 저장되었습니다.');
            }

            // 드래프트 목록 새로고침
            await loadDraftsFromServer();
        } catch (error: any) {
            console.error('Failed to save draft:', error);
            showErrorToastKo(error?.message || '드래프트 저장에 실패했습니다.');
        } finally {
            setIsSavingDraft(false);
        }
    };

    // 서버에서 드래프트 불러오기
    const handleDraftSelect = async (event: ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        if (!value) {
            return;
        }

        try {
            const draft: ServerDraft = await mlAPI.getDraft(value);
            setActiveDraftId(draft.id);
            setDraftName(draft.name);
            setScriptContent(draft.content);
            setScriptPath(draft.script_path);
            setRunConfig({
                ...draft.run_config,
                feature_columns: [...(draft.run_config.feature_columns || [])],
            });
            setExecuteResult(null);
            setValidationResult(null);
            showSuccessToastKo(`드래프트 "${draft.name}" 로드 완료`);
        } catch (error: any) {
            console.error('Failed to load draft:', error);
            showErrorToastKo(error?.message || '드래프트를 불러오는 데 실패했습니다.');
        }
    };

    // 서버에서 드래프트 삭제
    const handleDraftDelete = async () => {
        if (!activeDraftId) {
            showWarningToastKo({
                message: '삭제할 드래프트를 먼저 선택하세요.',
                duration: 3000,
            });
            return;
        }

        const draft = drafts.find((item) => item.id === activeDraftId);
        if (draft && !window.confirm(`"${draft.name}" 드래프트를 삭제할까요?`)) {
            return;
        }

        setIsDeletingDraft(true);
        try {
            await mlAPI.deleteDraft(activeDraftId);
            setActiveDraftId(null);
            setDraftName('');
            showSuccessToastKo('드래프트가 삭제되었습니다.');

            // 드래프트 목록 새로고침
            await loadDraftsFromServer();
        } catch (error: any) {
            console.error('Failed to delete draft:', error);
            showErrorToastKo(error?.message || '드래프트 삭제에 실패했습니다.');
        } finally {
            setIsDeletingDraft(false);
        }
    };

    // 드래프트 복제
    const handleDraftClone = async () => {
        if (!activeDraftId) {
            showWarningToastKo({
                message: '복제할 드래프트를 먼저 선택하세요.',
                duration: 3000,
            });
            return;
        }

        try {
            const clonedDraft: ServerDraft = await mlAPI.cloneDraft(activeDraftId);
            setActiveDraftId(clonedDraft.id);
            setDraftName(clonedDraft.name);
            setScriptContent(clonedDraft.content);
            setScriptPath(clonedDraft.script_path);
            setRunConfig({
                ...clonedDraft.run_config,
                feature_columns: [...(clonedDraft.run_config.feature_columns || [])],
            });
            showSuccessToastKo(`드래프트 "${clonedDraft.name}"가 복제되었습니다.`);

            // 드래프트 목록 새로고침
            await loadDraftsFromServer();
        } catch (error: any) {
            console.error('Failed to clone draft:', error);
            showErrorToastKo(error?.message || '드래프트 복제에 실패했습니다.');
        }
    };

    const handleResetTemplate = () => {
        setScriptContent(defaultTemplate);
        setScriptPath(defaultPath);
        setRunConfig(getDefaultRunConfig());
        setFeatureColumnsText('');
        setValidationResult(null);
        setExecuteResult(null);
        setAckWarnings(false);
        showSuccessToastKo('템플릿이 초기화되었습니다.');
    };

    const handleUploadScript = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            setScriptContent(text);
            setScriptPath(`/tmp/user_scripts/${file.name}`);
            setDraftName(file.name.replace('.py', ''));
            showSuccessToastKo('스크립트를 업로드했습니다.');
        } catch (error) {
            console.error('Failed to read uploaded script:', error);
            showErrorToastKo('스크립트 파일을 읽는 데 실패했습니다.');
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDownloadScript = () => {
        try {
            const blob = new Blob([scriptContent], { type: 'text/x-python;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = scriptFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showSuccessToastKo('스크립트 다운로드를 시작했습니다.');
        } catch (error) {
            console.error('Failed to download script:', error);
            showErrorToastKo('스크립트 다운로드에 실패했습니다.');
        }
    };

    const handleValidateScript = async () => {
        if (!scriptPath.trim()) {
            showErrorToastKo('스크립트 경로를 입력하세요.');
            return;
        }
        if (hasClientErrors) {
            showErrorToastKo('로컬 검증 오류를 먼저 해결해주세요.');
            return;
        }
        setIsValidating(true);
        try {
            const payload = {
                script_path: scriptPath,
                content: scriptContent,
            };
            const response: ScriptValidationResponse = await mlAPI.validateUserScript(payload);
            setValidationResult(response);
            if (response.is_valid) {
                const cache: ValidationCache = {
                    script: scriptContent,
                    timestamp: new Date().toISOString(),
                    response,
                };
                setLastValidationCache(cache);
                try {
                    localStorage.setItem(LAST_VALIDATION_KEY, JSON.stringify(cache));
                } catch (error) {
                    console.warn('Failed to cache validation result:', error);
                }
                showSuccessToastKo('백엔드 검증을 통과했습니다.');
            } else {
                showWarningToastKo({
                    message: '백엔드 검증에서 경고 또는 오류가 감지되었습니다.',
                    duration: 4000,
                });
            }
        } catch (error: any) {
            console.error('Script validation failed', error);
            const message = error?.message || '스크립트 검증에 실패했습니다.';
            showErrorToastKo(message);
        } finally {
            setIsValidating(false);
        }
    };

    const handleExecuteScript = async () => {
        if (!scriptPath.trim()) {
            showErrorToastKo('스크립트 경로를 입력하세요.');
            return;
        }
        if (hasClientErrors) {
            showErrorToastKo('로컬 검증 오류를 먼저 해결해주세요.');
            return;
        }
        const normalizedRunConfig: UserScriptRunConfig = {
            ...runConfig,
            feature_columns: [...runConfig.feature_columns],
        };
        setIsExecuting(true);
        try {
            const payload = {
                script_path: scriptPath,
                run_config: normalizedRunConfig,
                content: scriptContent,
            };
            const response: ScriptRunPayload = await mlAPI.executeUserScript(payload);
            setExecuteResult(response);
            showSuccessToastKo('테스트 실행이 완료되었습니다.');
        } catch (error: any) {
            console.error('Script execution failed', error);
            const message = error?.message || '테스트 실행에 실패했습니다.';
            showErrorToastKo(message);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleRegisterScript = async () => {
        if (!validationResult || !validationResult.is_valid) {
            showErrorToastKo('백엔드 검증을 먼저 통과해주세요.');
            return;
        }
        if (hasClientErrors) {
            showErrorToastKo('로컬 검증 오류를 먼저 해결해주세요.');
            return;
        }
        if (requiresWarningAck && !ackWarnings) {
            showWarningToastKo({
                message: '경고를 확인하고 등록 진행에 동의해주세요.',
                duration: 4000,
            });
            return;
        }
        setIsRegistering(true);
        try {
            const payload = {
                script_path: scriptPath,
                content: scriptContent,
            };
            const response: ScriptRegisterResponse = await mlAPI.registerUserScript(payload);
            if (response.catalog_entry) {
                setCatalogEntry(response.catalog_entry);
                onCatalogEntry?.(response.catalog_entry);
            }
            await onRefreshCatalog?.();
            showSuccessToastKo('사용자 스크립트가 등록되었습니다.');
        } catch (error: any) {
            console.error('Script registration failed', error);
            const message = error?.message || '스크립트 등록에 실패했습니다.';
            showErrorToastKo(message);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleApplyVersionSuggestion = () => {
        const currentVersion = extractCurrentVersion(scriptContent);
        if (!currentVersion) {
            showWarningToastKo({
                message: 'version="x.y.z" 형식을 찾을 수 없습니다.',
                duration: 3500,
            });
            return;
        }
        const nextVersion = computeSuggestedVersion(currentVersion, selectedBump);
        if (nextVersion === currentVersion) {
            showWarningToastKo({
                message: '새 버전을 계산할 수 없습니다.',
                duration: 3000,
            });
            return;
        }
        setScriptContent((prev) => replaceVersionInScript(prev, nextVersion));
        showSuccessToastKo(`버전을 ${nextVersion}로 업데이트했습니다.`);
    };

    const renderMessages = (messages: ValidationMessage[], level: MessageLevel) => {
        if (!messages.length) return null;
        return (
            <div className={`${styles.messageGroup} ${styles[level]}`}>
                <div className={styles.messageGroupHeader}>
                    <FiAlertTriangle />
                    <span>
                        {level === 'error'
                            ? '오류'
                            : level === 'warning'
                                ? '경고'
                                : '정보'}
                    </span>
                </div>
                <ul>
                    {messages.map((message, index) => (
                        <li key={`${message.message}-${index}`}>
                            {message.message}
                            {message.code ? (
                                <span className={styles.messageCode}>{message.code}</span>
                            ) : null}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const validationToneClass =
        validationStatusTone === 'success'
            ? styles.statusSuccess
            : validationStatusTone === 'error'
                ? styles.statusError
                : validationStatusTone === 'warning'
                    ? styles.statusWarning
                    : styles.statusIdle;

    const stdoutText = normalizeStream(executeResult?.stdout);
    const stderrText = normalizeStream(executeResult?.stderr);

    const localStatus: StepStatus = hasClientErrors
        ? 'error'
        : scriptContent.trim().length > 0
            ? hasClientWarnings
                ? 'warning'
                : 'done'
            : 'idle';
    const backendStatus: StepStatus = !validationResult
        ? 'idle'
        : hasValidationErrors
            ? 'error'
            : validationStale || hasValidationWarnings
                ? 'warning'
                : 'done';
    const testStatus: StepStatus = !executeResult
        ? 'idle'
        : executeErrors.length > 0
            ? 'error'
            : executeWarnings.length > 0
                ? 'warning'
                : 'done';
    const registerStatus: StepStatus = catalogEntry
        ? 'done'
        : hasClientErrors || hasValidationErrors
            ? 'error'
            : requiresWarningAck && !ackWarnings
                ? 'warning'
                : validationResult?.is_valid
                    ? 'idle'
                    : 'idle';

    const progressSteps: Array<{
        key: string;
        title: string;
        description: string;
        status: StepStatus;
    }> = [
        {
            key: 'author',
            title: '작성 · 로컬 검사',
            description: '템플릿 편집, 메타데이터 & import 규칙 확인',
            status: localStatus,
        },
        {
            key: 'validate',
            title: '백엔드 검증',
            description: '/api/scripts/validate 호출로 계약 확인',
            status: backendStatus,
        },
        {
            key: 'test',
            title: '샌드박스 테스트',
            description: '/api/scripts/execute 로 출력·지표 확인',
            status: testStatus,
        },
        {
            key: 'register',
            title: '카탈로그 등록',
            description: '/api/scripts/register 로 배포',
            status: registerStatus,
        },
    ];

    const getStepStatusClass = (status: StepStatus) => {
        switch (status) {
            case 'done':
                return styles.stepDone;
            case 'warning':
                return styles.stepWarning;
            case 'error':
                return styles.stepError;
            default:
                return styles.stepIdle;
        }
    };

    return (
        <div className={styles.workbench}>
            <header className={styles.header}>
                <div>
                    <h3 className={styles.title}>사용자 정의 스크립트</h3>
                    <p className={styles.description}>
                        사용자 스크립트를 작성하고 검증/테스트 후 모델 카탈로그에 등록합니다.
                        아래 편집기는 백엔드의 사용자 스크립트 계약을 반영한 템플릿을 제공합니다.
                    </p>
                </div>
            </header>

            <div className={styles.progressTrack}>
                {progressSteps.map((step, index) => (
                    <div
                        key={step.key}
                        className={`${styles.progressStep} ${getStepStatusClass(step.status)}`}
                    >
                        <div className={styles.stepIndex}>{index + 1}</div>
                        <div className={styles.stepBody}>
                            <span className={styles.stepTitle}>{step.title}</span>
                            <span className={styles.stepDescription}>{step.description}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.pathSection}>
                <div className={styles.pathHeader}>
                    <label htmlFor="user-script-path">스크립트 경로</label>
                    <span className={styles.pathHint}>
                        저장 위치를 확인하고 검증·테스트를 순서대로 실행하세요.
                    </span>
                </div>
                <input
                    id="user-script-path"
                    type="text"
                    value={scriptPath}
                    onChange={(event) => setScriptPath(event.target.value)}
                    placeholder={defaultPath}
                    className={styles.inputControl}
                />
                <div className={styles.pathMeta}>
                    <span>파일명: {scriptFilename}</span>
                    {lastValidationCache?.timestamp && (
                        <span>마지막 성공 검증 {formatTimestamp(lastValidationCache.timestamp)}</span>
                    )}
                </div>
                <div className={styles.primaryActions}>
                    <button
                        type="button"
                        className={`${styles.button} ${styles.primaryButton}`}
                        onClick={handleValidateScript}
                        disabled={isValidating || hasClientErrors}
                    >
                        {isValidating ? '검증 중...' : '백엔드 검증'}
                    </button>
                    <button
                        type="button"
                        className={`${styles.button} ${styles.secondaryButton}`}
                        onClick={handleExecuteScript}
                        disabled={isExecuting || hasClientErrors}
                    >
                        <FiPlay />
                        {isExecuting ? '테스트 실행 중...' : '테스트 실행'}
                    </button>
                </div>
            </div>

            <div className={styles.utilityRow}>
                <button
                    type="button"
                    className={`${styles.button} ${styles.ghostButton}`}
                    onClick={handleDownloadScript}
                >
                    <FiDownload />
                    다운로드
                </button>
                <label className={`${styles.button} ${styles.ghostButton}`}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".py,text/x-python"
                        hidden
                        onChange={handleUploadScript}
                    />
                    <FiUploadCloud />
                    업로드
                </label>
                <button
                    type="button"
                    className={`${styles.button} ${styles.ghostButton}`}
                    onClick={handleResetTemplate}
                >
                    <FiRotateCcw />
                    템플릿 초기화
                </button>
            </div>

            <section className={`${styles.card} ${styles.editorCard}`}>
                <div className={styles.cardHeader}>
                    <div>
                        <h4>스크립트 편집기</h4>
                        <p>base.py와 user_script 계약에 맞춰 필수 구조를 유지하세요.</p>
                    </div>
                </div>
                <div className={styles.editorContainer}>
                    <div
                        ref={editorHighlightRef}
                        className={styles.editorHighlight}
                        aria-hidden="true"
                    >
                        <SyntaxHighlighter
                            language="python"
                            style={syntaxTheme}
                            customStyle={{
                                margin: 0,
                                background: 'transparent',
                                padding: 0,
                                minHeight: '100%',
                                fontFamily:
                                    "'JetBrains Mono', Consolas, Monaco, 'Courier New', monospace",
                                fontSize: '0.875rem',
                                lineHeight: '1.55',
                            }}
                            codeTagProps={{
                                style: {
                                    fontFamily:
                                        "'JetBrains Mono', Consolas, Monaco, 'Courier New', monospace",
                                    fontSize: '0.875rem',
                                    lineHeight: '1.55',
                                },
                            }}
                        >
                            {scriptContent || ' '}
                        </SyntaxHighlighter>
                    </div>
                    <textarea
                        ref={editorRef}
                        className={styles.editorInput}
                        value={scriptContent}
                        onChange={handleScriptChange}
                        onScroll={handleEditorScroll}
                        spellCheck={false}
                        wrap="off"
                    />
                </div>
                <div className={styles.editorFooter}>
                    <div className={styles.editorMetaRow}>
                        <span>
                            길이: {scriptContent.length.toLocaleString()} chars ·{' '}
                            {scriptContent.split('\n').length.toLocaleString()} lines
                        </span>
                    </div>
                    {clientAnalysis.restrictedImports.length > 0 && (
                        <span className={styles.restricted}>
                            제한 모듈: {clientAnalysis.restrictedImports.join(', ')}
                        </span>
                    )}
                </div>
            </section>

            <div className={styles.workspaceGrid}>
                <div className={styles.mainColumn}>
                    <section className={`${styles.card} ${styles.draftCard}`}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h4>드래프트 관리 (서버 저장)</h4>
                                <p>서버에 드래프트를 저장하고 필요할 때 불러옵니다.</p>
                            </div>
                            <span className={styles.cardHint}>변경 사항은 로컬에 자동 임시 저장됩니다.</span>
                        </div>
                        <div className={styles.draftGrid}>
                            <label>
                                <span>저장된 드래프트</span>
                                <select
                                    value={activeDraftId || ''}
                                    onChange={handleDraftSelect}
                                    className={styles.inputControl}
                                    disabled={isLoadingDrafts}
                                >
                                    <option value="">
                                        {isLoadingDrafts ? '불러오는 중...' : '드래프트 선택'}
                                    </option>
                                    {drafts.map((draft) => (
                                        <option key={draft.id} value={draft.id}>
                                            {draft.name} · {formatTimestamp(draft.updated_at)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                <span>드래프트 이름</span>
                                <input
                                    type="text"
                                    value={draftName}
                                    onChange={(event) => setDraftName(event.target.value)}
                                    placeholder="예: my-forecasting-script"
                                    className={styles.inputControl}
                                />
                            </label>
                        </div>
                        <div className={styles.cardActions}>
                            <button
                                type="button"
                                className={`${styles.button} ${styles.secondaryButton}`}
                                onClick={handleSaveDraft}
                                disabled={isSavingDraft}
                            >
                                <FiSave />
                                {isSavingDraft
                                    ? '저장 중...'
                                    : activeDraftId
                                        ? '드래프트 업데이트'
                                        : '드래프트 저장'}
                            </button>
                            <button
                                type="button"
                                className={`${styles.button} ${styles.ghostButton}`}
                                onClick={handleDraftClone}
                                disabled={!activeDraftId}
                            >
                                <FiCopy />
                                복제
                            </button>
                            <button
                                type="button"
                                className={`${styles.button} ${styles.ghostButton}`}
                                onClick={handleDraftDelete}
                                disabled={isDeletingDraft || !activeDraftId}
                            >
                                {isDeletingDraft ? '삭제 중...' : '삭제'}
                            </button>
                            <button
                                type="button"
                                className={`${styles.button} ${styles.ghostButton}`}
                                onClick={loadDraftsFromServer}
                                disabled={isLoadingDrafts}
                            >
                                <FiRefreshCw />
                                {isLoadingDrafts ? '새로고침 중...' : '새로고침'}
                            </button>
                        </div>
                    </section>

                    <section className={`${styles.card} ${styles.messageCard}`}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h4>검증 메시지</h4>
                                <p>로컬 분석과 백엔드 응답을 종합적으로 확인하세요.</p>
                            </div>
                            <span className={`${styles.validationBadge} ${validationToneClass}`}>
                                <FiCheckCircle />
                                {validationStatusLabel}
                            </span>
                        </div>
                        {validationResult?.is_valid && validationStale && (
                            <p className={styles.note}>
                                최근에 스크립트를 수정했습니다. 등록 전에 검증을 다시 실행하세요.
                            </p>
                        )}
                        {clientAnalysis.errors.length === 0 &&
                        clientAnalysis.warnings.length === 0 &&
                        groupedMessages.error.length === 0 &&
                        groupedMessages.warning.length === 0 &&
                        groupedMessages.info.length === 0 ? (
                            <p className={styles.emptyState}>
                                아직 표기할 메시지가 없습니다. 검증을 수행하거나 템플릿을 수정하세요.
                            </p>
                        ) : (
                            <>
                                {clientAnalysis.errors.length > 0 && (
                                    <div className={`${styles.messageGroup} ${styles.error}`}>
                                        <div className={styles.messageGroupHeader}>
                                            <FiAlertTriangle />
                                            <span>로컬 검증 오류</span>
                                        </div>
                                        <ul>
                                            {clientAnalysis.errors.map((message) => (
                                                <li key={message}>{message}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {clientAnalysis.warnings.length > 0 && (
                                    <div className={`${styles.messageGroup} ${styles.warning}`}>
                                        <div className={styles.messageGroupHeader}>
                                            <FiAlertTriangle />
                                            <span>로컬 경고</span>
                                        </div>
                                        <ul>
                                            {clientAnalysis.warnings.map((warning) => (
                                                <li key={warning}>{warning}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {renderMessages(groupedMessages.error, 'error')}
                                {renderMessages(groupedMessages.warning, 'warning')}
                                {renderMessages(groupedMessages.info, 'info')}
                            </>
                        )}
                    </section>
                </div>

                <div className={styles.sideColumn}>
                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h4>테스트 실행 설정</h4>
                                <p>샌드박스 실행에 사용할 config를 채우고 재사용하세요.</p>
                            </div>
                        </div>
                        <div className={styles.formGrid}>
                            <label>
                                <span>데이터셋 URI</span>
                                <input
                                    type="text"
                                    value={runConfig.dataset_uri}
                                    onChange={(event) =>
                                        setRunConfig((prev) => ({
                                            ...prev,
                                            dataset_uri: event.target.value,
                                        }))
                                    }
                                    placeholder="s3://, mlflow:// 형식 등"
                                    className={styles.inputControl}
                                />
                            </label>
                            <label>
                                <span>타깃 컬럼</span>
                                <input
                                    type="text"
                                    value={runConfig.target_column}
                                    onChange={(event) =>
                                        setRunConfig((prev) => ({
                                            ...prev,
                                            target_column: event.target.value,
                                        }))
                                    }
                                    placeholder="예: label"
                                    className={styles.inputControl}
                                />
                            </label>
                            <label className={styles.featureInput}>
                                <span>피처 컬럼 (쉼표 구분)</span>
                                <input
                                    type="text"
                                    value={featureColumnsText}
                                    onChange={(event) => setFeatureColumnsText(event.target.value)}
                                    onBlur={handleFeatureColumnsBlur}
                                    placeholder="예: feature_1, feature_2"
                                    className={styles.inputControl}
                                />
                            </label>
                            <label>
                                <span>아티팩트 디렉터리</span>
                                <input
                                    type="text"
                                    value={runConfig.artifact_dir}
                                    onChange={(event) =>
                                        setRunConfig((prev) => ({
                                            ...prev,
                                            artifact_dir: event.target.value,
                                        }))
                                    }
                                    placeholder="/tmp/user-scripts/artifacts"
                                    className={styles.inputControl}
                                />
                            </label>
                            <label>
                                <span>랜덤 시드</span>
                                <input
                                    type="number"
                                    value={runConfig.random_seed}
                                    onChange={(event) =>
                                        setRunConfig((prev) => ({
                                            ...prev,
                                            random_seed: Number(event.target.value) || 0,
                                        }))
                                    }
                                    className={styles.inputControl}
                                />
                            </label>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h4>샌드박스 결과</h4>
                                <p>stdout/stderr와 정규화 metrics를 확인하세요.</p>
                            </div>
                        </div>
                        {executeResult ? (
                            <div className={styles.resultBody}>
                                {executeResult.duration_seconds !== undefined && (
                                    <p className={styles.resultMeta}>
                                        실행 시간{' '}
                                        {executeResult.duration_seconds
                                            ? `${executeResult.duration_seconds.toFixed(2)}초`
                                            : '측정되지 않음'}
                                    </p>
                                )}
                                {executeWarnings.length > 0 && (
                                    <div className={`${styles.messageGroup} ${styles.warning}`}>
                                        <div className={styles.messageGroupHeader}>
                                            <FiAlertTriangle />
                                            <span>실행 경고</span>
                                        </div>
                                        <ul>
                                            {executeWarnings.map((warning) => (
                                                <li key={warning}>{warning}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {executeErrors.length > 0 && (
                                    <div className={`${styles.messageGroup} ${styles.error}`}>
                                        <div className={styles.messageGroupHeader}>
                                            <FiAlertTriangle />
                                            <span>실행 오류</span>
                                        </div>
                                        <ul>
                                            {executeErrors.map((error) => (
                                                <li key={error}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {executeResult.result?.metrics && (
                                    <div className={styles.metricsBlock}>
                                        <table>
                                            <tbody>
                                                {Object.entries(executeResult.result.metrics).map(
                                                    ([key, value]) => (
                                                        <tr key={key}>
                                                            <th>{key}</th>
                                                            <td>{Number(value).toFixed(4)}</td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                {stdoutText && (
                                    <div className={styles.consoleBlock}>
                                        <h6>stdout</h6>
                                        <pre>{stdoutText}</pre>
                                    </div>
                                )}
                                {stderrText && (
                                    <div className={styles.consoleBlock}>
                                        <h6>stderr</h6>
                                        <pre>{stderrText}</pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                아직 테스트 실행 기록이 없습니다. config를 채우고 실행해보세요.
                            </div>
                        )}
                    </section>

                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h4>버전 제안</h4>
                                <p>변경 범위를 선택해 SemVer 버전을 추천합니다.</p>
                            </div>
                        </div>
                        <div className={styles.versionControls}>
                            <div className={styles.versionOptions}>
                                <label>
                                    <input
                                        type="radio"
                                        value="patch"
                                        checked={selectedBump === 'patch'}
                                        onChange={() => setSelectedBump('patch')}
                                    />
                                    수정 (Patch)
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        value="minor"
                                        checked={selectedBump === 'minor'}
                                        onChange={() => setSelectedBump('minor')}
                                    />
                                    기능 추가 (Minor)
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        value="major"
                                        checked={selectedBump === 'major'}
                                        onChange={() => setSelectedBump('major')}
                                    />
                                    호환성 변경 (Major)
                                </label>
                            </div>
                            <button
                                type="button"
                                className={`${styles.button} ${styles.secondaryButton}`}
                                onClick={handleApplyVersionSuggestion}
                            >
                                버전 제안 적용
                            </button>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h4>등록</h4>
                                <p>검증과 테스트를 마치고 모델 카탈로그를 갱신하세요.</p>
                            </div>
                        </div>
                        <div className={styles.registerBody}>
                            {requiresWarningAck && (
                                <label className={styles.checkboxLine}>
                                    <input
                                        type="checkbox"
                                        checked={ackWarnings}
                                        onChange={(event) => setAckWarnings(event.target.checked)}
                                    />
                                    경고 사항을 확인했고 등록에 동의합니다.
                                </label>
                            )}
                            <button
                                type="button"
                                className={`${styles.button} ${styles.primaryButton}`}
                                onClick={handleRegisterScript}
                                disabled={
                                    isRegistering ||
                                    !validationResult ||
                                    !validationResult.is_valid ||
                                    hasValidationErrors ||
                                    hasClientErrors ||
                                    (requiresWarningAck && !ackWarnings)
                                }
                            >
                                {isRegistering ? '등록 중...' : '스크립트 등록'}
                            </button>
                            {!catalogEntry && (
                                <ul className={styles.registerChecklist}>
                                    <li>
                                        {validationResult?.is_valid
                                            ? '✅ 백엔드 검증 통과'
                                            : '⏳ 백엔드 검증 필요'}
                                    </li>
                                    <li>
                                        {executeResult
                                            ? executeErrors.length > 0
                                                ? '⚠️ 실행 오류 해결 필요'
                                                : '✅ 최신 테스트 실행 완료'
                                            : '⏳ 테스트 실행 (선택)'}
                                    </li>
                                </ul>
                            )}
                        </div>
                        {catalogEntry && (
                            <div className={styles.catalogSummary}>
                                <h5>등록된 스크립트</h5>
                                <dl>
                                    <dt>이름</dt>
                                    <dd>{catalogEntry.display_name || catalogEntry.name}</dd>
                                    <dt>버전</dt>
                                    <dd>{catalogEntry.version || '미지정'}</dd>
                                    <dt>스크립트 경로</dt>
                                    <dd>{catalogEntry.script_path}</dd>
                                    {catalogEntry.tags?.length ? (
                                        <>
                                            <dt>태그</dt>
                                            <dd>{catalogEntry.tags.join(', ')}</dd>
                                        </>
                                    ) : null}
                                </dl>
                            </div>
                        )}
                    </section>

                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div>
                                <h4>스키마 참고</h4>
                                <p>필수 객체 구조를 빠르게 확인하세요.</p>
                            </div>
                        </div>
                        <div className={styles.schemaList}>
                            <details>
                                <summary>UserScriptMetadata</summary>
                                <pre className={styles.schema}>
{`{
  "name": "my_script",
  "display_name": "My Custom Script",
  "version": "0.1.0",
  "description": "설명",
  "tags": ["user_script"],
  "task": "${task}"
}`}
                                </pre>
                            </details>
                            <details>
                                <summary>UserScriptRunConfig</summary>
                                <pre className={styles.schema}>
{`{
  "dataset_uri": "mlflow://runs/12345",
  "target_column": "label",
  "feature_columns": ["f1", "f2"],
  "artifact_dir": "/tmp/user-scripts/artifacts",
  "random_seed": 42
}`}
                                </pre>
                            </details>
                            <details>
                                <summary>UserScriptResult</summary>
                                <pre className={styles.schema}>
{`{
  "stdout": ["Training completed"],
  "stderr": [],
  "metrics": {"accuracy": 0.0},
  "warnings": [],
  "errors": [],
  "artifacts": []
}`}
                                </pre>
                            </details>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default UserScriptWorkbench;
