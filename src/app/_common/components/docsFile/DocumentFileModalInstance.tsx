'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from '@/app/_common/assets/DocumentFileModal.module.scss';
import {
    uploadDocumentSSE,
    getSessionStatus,
    cancelSession,
    deleteSession
} from '@/app/_common/api/rag/retrievalAPI';
import { getEmbeddingConfigStatus } from '@/app/_common/api/rag/embeddingAPI';
import { ModalSession } from '@/app/_common/contexts/DocumentFileModalContext';

interface UploadProgress {
    fileName: string;
    status: 'uploading' | 'success' | 'error';
    error?: string;
    session?: string;
    totalChunks?: number;
    processedChunks?: number;
    llmMetadataProcessing?: boolean;
    llmProcessedChunks?: number;
    currentStage?: 'calculating' | 'llm_processing' | 'embedding' | 'complete';
}

interface SSEEventData {
    event: string;
    session: string;
    filename?: string;
    file_size?: number;
    total_chunks?: number;
    chunk_index?: number;
    result?: any;
    message?: string;
    error?: string;
}

interface EmbeddingConfig {
    client_initialized: boolean;
    client_available: boolean;
    provider_info: {
        provider: string;
        model: string;
        dimension: number;
        api_key_configured: boolean;
        available: boolean;
    };
}

interface SessionStatus {
    session_id: string;
    user_id: number;
    filename: string;
    collection_name: string;
    status: 'initializing' | 'processing' | 'completed' | 'error' | 'cancelled';
    created_at: string;
    updated_at: string;
    result?: any;
    error?: string;
}

interface DocumentFileModalInstanceProps {
    modalSession: ModalSession;
    onClose: () => void;
    onMinimize: () => void;
    onFocus: () => void;
    isFocused: boolean;
    modalIndex: number;
}

const DocumentFileModalInstance: React.FC<DocumentFileModalInstanceProps> = ({
    modalSession,
    onClose,
    onMinimize,
    onFocus,
    isFocused,
    modalIndex,
}) => {
    const { sessionId, collection: selectedCollection, currentFolder, isFolderUpload, onUploadComplete } = modalSession;

    const [chunkSize, setChunkSize] = useState(4000);
    const [overlapSize, setOverlapSize] = useState(1000);
    const [processType, setProcessType] = useState<string>('text');
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);

    // Embedding 관련 상태
    const [embeddingConfig, setEmbeddingConfig] = useState<EmbeddingConfig | null>(null);
    const [embeddingLoading, setEmbeddingLoading] = useState(true);
    const [dimensionMismatch, setDimensionMismatch] = useState(false);
    const [modelMismatch, setModelMismatch] = useState(false);
    const [ignoreDimensionMismatch, setIgnoreDimensionMismatch] = useState(false);
    const [ignoreModelMismatch, setIgnoreModelMismatch] = useState(false);

    // 세션별 관리 - ReadableStream reader 관리
    const [uploadSessions, setUploadSessions] = useState<Map<string, { reader: ReadableStreamDefaultReader, controller: AbortController }>>(new Map());
    const [isClient, setIsClient] = useState(false);

    // 세션 상태 폴링을 위한 ref
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const uploadSessionIdsRef = useRef<Set<string>>(new Set());

    // 세션 스토리지 키 - 세션별로 고유
    const STORAGE_KEY = `global_upload_state_${sessionId}`;

    // 클라이언트 사이드 확인
    useEffect(() => {
        setIsClient(true);
    }, []);

    // 세션 상태 폴링 함수
    const pollSessionStatus = useCallback(async () => {
        const sessionIds = Array.from(uploadSessionIdsRef.current);
        if (sessionIds.length === 0) return;

        for (const uploadSessionId of sessionIds) {
            try {
                const status = await getSessionStatus(uploadSessionId) as SessionStatus;

                // 서버에서 세션 상태 확인
                if (status.status === 'completed') {
                    setUploadProgress(prev => prev.map(item =>
                        item.session === uploadSessionId && item.status === 'uploading'
                            ? { ...item, status: 'success', currentStage: 'complete' }
                            : item
                    ));
                    uploadSessionIdsRef.current.delete(uploadSessionId);

                    // 백엔드 세션 삭제
                    await deleteSession(uploadSessionId).catch(err =>
                        console.error('Failed to delete completed session:', err)
                    );
                } else if (status.status === 'error' || status.status === 'cancelled') {
                    setUploadProgress(prev => prev.map(item =>
                        item.session === uploadSessionId && item.status === 'uploading'
                            ? {
                                ...item,
                                status: 'error',
                                error: status.error || '업로드 실패',
                                currentStage: undefined
                              }
                            : item
                    ));
                    uploadSessionIdsRef.current.delete(uploadSessionId);

                    // 백엔드 세션 삭제
                    await deleteSession(uploadSessionId).catch(err =>
                        console.error('Failed to delete failed session:', err)
                    );
                }
            } catch (error: any) {
                console.error(`Failed to poll session ${uploadSessionId}:`, error);

                // 세션 상태 조회 실패 시 해당 세션을 에러 처리
                setUploadProgress(prev => prev.map(item =>
                    item.session === uploadSessionId && item.status === 'uploading'
                        ? {
                            ...item,
                            status: 'error',
                            error: error?.response?.status === 403 ? '세션 권한 없음 (403)' : '세션 조회 실패',
                            currentStage: undefined
                          }
                        : item
                ));
                uploadSessionIdsRef.current.delete(uploadSessionId);

                // 백엔드 세션 삭제 시도
                try {
                    await deleteSession(uploadSessionId);
                } catch (deleteErr) {
                    console.error(`Failed to delete failed session ${uploadSessionId}:`, deleteErr);
                }
            }
        }

        // 모든 세션이 완료되면 폴링 중지
        if (uploadSessionIdsRef.current.size === 0 && pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    // 폴링 시작/중지 관리
    useEffect(() => {
        if (loading && uploadSessionIdsRef.current.size > 0 && !pollingIntervalRef.current) {
            // 5초마다 세션 상태 확인
            pollingIntervalRef.current = setInterval(pollSessionStatus, 5000);
        }

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [loading, pollSessionStatus]);

    // 컴포넌트 unmount 시 모든 연결 정리
    useEffect(() => {
        return () => {
            // 폴링 중지
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }

            // 컴포넌트가 unmount될 때 모든 진행 중인 업로드 취소
            uploadSessions.forEach(({ reader, controller }, session) => {
                try {
                    reader.cancel();
                    controller.abort();
                } catch (err) {
                    console.error(`Failed to abort upload session ${session} on unmount:`, err);
                }
            });

            // 백엔드 세션들도 취소 요청
            const sessionIds = Array.from(uploadSessionIdsRef.current);
            sessionIds.forEach(async (sessionId) => {
                try {
                    await cancelSession(sessionId);
                    await deleteSession(sessionId);
                } catch (err) {
                    console.error(`Failed to cancel/delete backend session ${sessionId}:`, err);
                }
            });
            uploadSessionIdsRef.current.clear();
        };
    }, [uploadSessions]);

    // 컴포넌트 마운트 시 저장된 상태 복원 (클라이언트에서만)
    useEffect(() => {
        if (!isClient) return;

        const restoreAndValidateSessions = async () => {
            try {
                const savedState = sessionStorage.getItem(STORAGE_KEY);
                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    if (parsed.uploadProgress && parsed.uploadProgress.length > 0) {
                        // 업로드 중인 세션들의 ID 수집
                        const uploadingSessions = parsed.uploadProgress
                            .filter((item: UploadProgress) => item.status === 'uploading' && item.session)
                            .map((item: UploadProgress) => item.session as string);

                        // 백엔드 세션 검증
                        const validatedProgress = [...parsed.uploadProgress];
                        let hasInvalidSessions = false;

                        for (let i = 0; i < validatedProgress.length; i++) {
                            const item = validatedProgress[i];

                            // uploading 상태이고 세션 ID가 있는 경우에만 검증
                            if (item.status === 'uploading' && item.session) {
                                try {
                                    const status = await getSessionStatus(item.session) as SessionStatus;

                                    // 백엔드 세션 상태에 따라 업데이트
                                    if (status.status === 'completed') {
                                        validatedProgress[i] = {
                                            ...item,
                                            status: 'success',
                                            currentStage: 'complete'
                                        };
                                        // 백엔드 세션 삭제
                                        await deleteSession(item.session).catch(err =>
                                            console.error('Failed to delete completed session:', err)
                                        );
                                    } else if (status.status === 'error' || status.status === 'cancelled') {
                                        validatedProgress[i] = {
                                            ...item,
                                            status: 'error',
                                            error: status.error || '업로드 실패 (세션 만료)',
                                            currentStage: undefined
                                        };
                                        hasInvalidSessions = true;
                                        // 백엔드 세션 삭제
                                        await deleteSession(item.session).catch(err =>
                                            console.error('Failed to delete failed session:', err)
                                        );
                                    } else if (status.status === 'processing') {
                                        // 여전히 진행 중 - 세션 ID 추적에 추가
                                        uploadSessionIdsRef.current.add(item.session);
                                    }
                                } catch (error: any) {
                                    // 백엔드 세션 조회 실패 - 세션이 만료되었거나 삭제됨
                                    console.error(`Failed to validate session ${item.session}:`, error);
                                    validatedProgress[i] = {
                                        ...item,
                                        status: 'error',
                                        error: error?.response?.status === 403 ? '세션 권한 없음 (403)' : '세션이 만료되었습니다',
                                        currentStage: undefined
                                    };
                                    hasInvalidSessions = true;
                                }
                            }
                        }

                        // 검증된 상태로 업데이트
                        setUploadProgress(validatedProgress);
                        setChunkSize(parsed.chunkSize || 4000);
                        setOverlapSize(parsed.overlapSize || 1000);
                        setProcessType(parsed.processType || 'text');

                        // 업로드 중인 항목이 있으면 loading 상태
                        const hasUploading = validatedProgress.some((item: UploadProgress) => item.status === 'uploading');
                        setLoading(hasUploading);

                        // isCompleted 상태 복원 및 처리
                        const savedIsCompleted = parsed.isCompleted !== undefined ? parsed.isCompleted : false;
                        const allCompleted = validatedProgress.every(
                            (item: UploadProgress) => item.status === 'success' || item.status === 'error'
                        );

                        if (savedIsCompleted || (allCompleted && !hasUploading)) {
                            setIsCompleted(true);

                            // 성공한 항목이 있으면 업로드 완료 콜백 호출
                            const hasSuccess = validatedProgress.some((item: UploadProgress) => item.status === 'success');
                            if (hasSuccess && onUploadComplete) {
                                setTimeout(() => {
                                    onUploadComplete();
                                }, 0);
                            }

                            // 3초 후 자동 닫기
                            setTimeout(() => {
                                // 세션 정리
                                try {
                                    sessionStorage.removeItem(STORAGE_KEY);
                                } catch (e) {
                                    console.error('Failed to remove session storage:', e);
                                }
                                onClose();
                            }, 3000);
                        } else if (hasInvalidSessions) {
                            // 만료된 세션이 있으면 사용자에게 알림
                            setError('일부 업로드 세션이 만료되었습니다.');
                        }

                        // 검증된 상태를 저장
                        if (validatedProgress.length > 0) {
                            const stateToSave = {
                                uploadProgress: validatedProgress,
                                chunkSize: parsed.chunkSize || 4000,
                                overlapSize: parsed.overlapSize || 1000,
                                processType: parsed.processType || 'text',
                                isCompleted: allCompleted,
                                timestamp: Date.now()
                            };
                            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to restore upload state:', error);
                try {
                    sessionStorage.removeItem(STORAGE_KEY);
                } catch (e) {
                    // Ignore
                }
            }
        };

        restoreAndValidateSessions();
    }, [STORAGE_KEY, isClient, onUploadComplete, onClose]);

    // Embedding 설정 로드
    useEffect(() => {
        const loadEmbeddingConfig = async () => {
            try {
                setEmbeddingLoading(true);
                const config = await getEmbeddingConfigStatus() as EmbeddingConfig;
                setEmbeddingConfig(config);

                // 차원 불일치 체크
                if (selectedCollection && config.provider_info.dimension !== selectedCollection.vector_size) {
                    setDimensionMismatch(true);
                } else {
                    setDimensionMismatch(false);
                }

                // 모델 불일치 체크
                if (selectedCollection && selectedCollection.init_embedding_model &&
                    config.provider_info.model !== selectedCollection.init_embedding_model) {
                    setModelMismatch(true);
                } else {
                    setModelMismatch(false);
                }
            } catch (error) {
                setError('Embedding 설정을 불러오는데 실패했습니다.');
            } finally {
                setEmbeddingLoading(false);
            }
        };

        loadEmbeddingConfig();
    }, [selectedCollection]);

    // 상태 변경 시 세션 스토리지에 저장 (클라이언트에서만)
    useEffect(() => {
        if (!isClient) return;

        try {
            if (uploadProgress.length > 0) {
                const stateToSave = {
                    uploadProgress,
                    chunkSize,
                    overlapSize,
                    processType,
                    isCompleted,
                    timestamp: Date.now()
                };
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
            } else {
                sessionStorage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
            console.error('Failed to save upload state:', error);
        }
    }, [uploadProgress, chunkSize, overlapSize, processType, isCompleted, STORAGE_KEY, isClient]);

    const resetModal = useCallback(() => {
        // 폴링 중지
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        // 모든 진행 중인 업로드 취소
        uploadSessions.forEach(({ reader, controller }, session) => {
            try {
                reader.cancel();
                controller.abort();
            } catch (err) {
                console.error(`Failed to abort upload session ${session}:`, err);
            }
        });
        setUploadSessions(new Map());

        // 백엔드 세션들도 취소 및 삭제
        const sessionIds = Array.from(uploadSessionIdsRef.current);
        sessionIds.forEach(async (sessionId) => {
            try {
                await cancelSession(sessionId);
                await deleteSession(sessionId);
            } catch (err) {
                console.error(`Failed to cancel/delete backend session ${sessionId}:`, err);
            }
        });
        uploadSessionIdsRef.current.clear();

        setChunkSize(4000);
        setOverlapSize(1000);
        setProcessType('text');
        setUploadProgress([]);
        setError(null);
        setIsCompleted(false);
        setLoading(false);

        if (isClient) {
            try {
                sessionStorage.removeItem(STORAGE_KEY);
            } catch (error) {
                console.error('Failed to remove session storage:', error);
            }
        }
    }, [uploadSessions, STORAGE_KEY, isClient]);

    const handleClose = useCallback(() => {
        // 업로드 중이면 최소화
        if (loading && uploadProgress.some(item => item.status === 'uploading')) {
            onMinimize();
        } else {
            // 완료되었으면 완전히 초기화하고 닫기
            resetModal();
            onClose();
        }
    }, [loading, uploadProgress, onClose, onMinimize, resetModal]);

    const handleMinimize = useCallback(() => {
        // 최소화는 경고 없이 바로 실행
        onMinimize();
    }, [onMinimize]);

    const handleFileUpload = async (files: FileList, isFolder: boolean = false) => {
        if (!selectedCollection) {
            setError('컬렉션을 먼저 선택해주세요.');
            return;
        }

        // 차원 불일치 체크
        if (dimensionMismatch && !ignoreDimensionMismatch) {
            setError('벡터 차원이 일치하지 않습니다. 설정을 확인하거나 "차원 불일치 무시" 옵션을 체크해주세요.');
            return;
        }

        // 모델 불일치 체크
        if (modelMismatch && !ignoreModelMismatch) {
            setError('임베딩 모델이 일치하지 않습니다. 설정을 확인하거나 "모델 불일치 무시" 옵션을 체크해주세요.');
            return;
        }

        const fileArray = Array.from(files);
        const initialProgress: UploadProgress[] = fileArray.map(file => ({
            fileName: file.name,
            status: 'uploading',
            currentStage: 'calculating',
            totalChunks: 0,
            processedChunks: 0
        }));

        setUploadProgress(initialProgress);
        setLoading(true);
        setError(null);

        // 세션 맵 초기화
        const newSessions = new Map<string, { reader: ReadableStreamDefaultReader, controller: AbortController }>();
        setUploadSessions(newSessions);

        try {
            // 모든 파일 업로드 (폴더/단일 공통)
            for (let index = 0; index < fileArray.length; index++) {
                const file = fileArray[index];

                try {
                    const relativePath = file.webkitRelativePath || file.name;
                    const folderPath = relativePath.substring(0, relativePath.lastIndexOf('/')) || '';

                    const metadata = isFolder ? {
                        upload_type: 'folder',
                        folder_path: folderPath,
                        directory_full_path: currentFolder?.full_path || `/${selectedCollection.collection_make_name}`,
                        relative_path: relativePath,
                        original_name: file.name,
                        current_index: index + 1,
                        total_files: fileArray.length,
                        process_type: processType
                    } : {
                        upload_type: 'single',
                        directory_full_path: currentFolder?.full_path || `/${selectedCollection.collection_make_name}`,
                        process_type: processType
                    };

                    // SSE 업로드 시작 - 모달 sessionId를 그대로 사용
                    console.log('📤 Calling uploadDocumentSSE with sessionId:', sessionId);
                    const uploadPromise = uploadDocumentSSE(
                        file,
                        selectedCollection.collection_name,
                        chunkSize,
                        overlapSize,
                        metadata,
                        processType,
                        (eventData: SSEEventData) => {
                            // SSE 이벤트 처리
                            const uploadSessionId = eventData.session;

                            // 세션 ID 추적
                            if (!uploadSessionIdsRef.current.has(uploadSessionId)) {
                                uploadSessionIdsRef.current.add(uploadSessionId);
                            }

                            setUploadProgress(prev => prev.map((item, idx) => {
                                if (idx === index && item.session === uploadSessionId) {
                                    switch (eventData.event) {
                                        case 'start':
                                            return { ...item, session: uploadSessionId, currentStage: 'calculating' };
                                        case 'total_chunks':
                                            return { ...item, totalChunks: eventData.total_chunks, currentStage: 'calculating' };
                                        case 'llm_metadata_start':
                                            return {
                                                ...item,
                                                llmMetadataProcessing: true,
                                                llmProcessedChunks: 0,
                                                totalChunks: eventData.total_chunks,
                                                currentStage: 'llm_processing'
                                            };
                                        case 'llm_chunk_processed':
                                            return {
                                                ...item,
                                                llmProcessedChunks: (item.llmProcessedChunks || 0) + 1,
                                                currentStage: 'llm_processing'
                                            };
                                        case 'llm_metadata_complete':
                                            return {
                                                ...item,
                                                llmMetadataProcessing: false,
                                                currentStage: 'embedding'
                                            };
                                        case 'llm_metadata_error':
                                            return {
                                                ...item,
                                                llmMetadataProcessing: false,
                                                currentStage: 'embedding'
                                            };
                                        case 'chunk_processed':
                                            return {
                                                ...item,
                                                processedChunks: (item.processedChunks || 0) + 1,
                                                currentStage: 'embedding'
                                            };
                                        default:
                                            return item;
                                    }
                                } else if (idx === index && !item.session) {
                                    // 세션이 아직 설정되지 않은 경우
                                    uploadSessionIdsRef.current.add(uploadSessionId);
                                    return { ...item, session: uploadSessionId };
                                }
                                return item;
                            }));
                        },
                        sessionId  // 모달 sessionId를 SSE 업로드에 전달
                    );

                    // 성공
                    const result = await uploadPromise;

                    setUploadProgress(prev => prev.map((item, idx) =>
                        idx === index ? { ...item, status: 'success' as const, currentStage: 'complete' } : item
                    ));

                    // 세션 추적에서 제거
                    if (result.session) {
                        uploadSessionIdsRef.current.delete(result.session);

                        // 백엔드 세션 삭제
                        await deleteSession(result.session).catch(err =>
                            console.error('Failed to delete completed session:', err)
                        );
                    }

                    // 세션 정리
                    if (result.session && newSessions.has(result.session)) {
                        const sessionData = newSessions.get(result.session);
                        if (sessionData) {
                            try {
                                sessionData.reader.cancel();
                            } catch (e) {
                                console.error('Failed to cancel reader:', e);
                            }
                        }
                        newSessions.delete(result.session);
                        setUploadSessions(new Map(newSessions));
                    }

                } catch (error) {
                    // 에러 발생 시 해당 파일의 세션 정리 및 상태 업데이트
                    const errorMessage = error instanceof Error ? error.message : '업로드 실패';
                    console.error(`Failed to upload file ${file.name}:`, error);

                    setUploadProgress(prev => prev.map((item, idx) => {
                        if (idx === index) {
                            const session = item.session;

                            // 세션 추적에서 제거
                            if (session) {
                                uploadSessionIdsRef.current.delete(session);

                                // 백엔드 세션 취소 및 삭제
                                cancelSession(session)
                                    .then(() => deleteSession(session))
                                    .catch(err =>
                                        console.error('Failed to cancel/delete failed session:', err)
                                    );
                            }

                            if (session && newSessions.has(session)) {
                                const sessionData = newSessions.get(session);
                                if (sessionData) {
                                    try {
                                        sessionData.reader.cancel();
                                        sessionData.controller.abort();
                                    } catch (e) {
                                        console.error('Failed to abort session:', e);
                                    }
                                }
                                newSessions.delete(session);
                                setUploadSessions(new Map(newSessions));
                            }

                            return {
                                ...item,
                                status: 'error' as const,
                                error: errorMessage,
                                currentStage: undefined
                            };
                        }
                        return item;
                    }));
                }                // 다음 파일로 진행 전 잠시 대기
                if (index < fileArray.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        } catch (error) {
            console.error('Upload process failed:', error);
            setError('업로드 처리 중 오류가 발생했습니다.');

            // 모든 남은 세션 정리
            newSessions.forEach(({ reader, controller }, session) => {
                try {
                    reader.cancel();
                    controller.abort();
                } catch (e) {
                    console.error(`Failed to abort session ${session}:`, e);
                }
            });
            newSessions.clear();
            setUploadSessions(new Map());

            // 백엔드 세션들도 취소 및 삭제
            const sessionIds = Array.from(uploadSessionIdsRef.current);
            sessionIds.forEach(async (sessionId) => {
                try {
                    await cancelSession(sessionId);
                    await deleteSession(sessionId);
                } catch (err) {
                    console.error(`Failed to cancel/delete backend session ${sessionId}:`, err);
                }
            });
            uploadSessionIdsRef.current.clear();
        } finally {
            setLoading(false);
        }

        // 업로드 완료 확인
        setTimeout(() => {
            setUploadProgress(currentProgress => {
                const allCompleted = currentProgress.every(item => item.status !== 'uploading');

                if (allCompleted) {
                    const hasSuccess = currentProgress.some(item => item.status === 'success');
                    const hasError = currentProgress.some(item => item.status === 'error');

                    setIsCompleted(true);

                    // 성공한 항목이 있으면 콜백 호출 (문서 목록 갱신)
                    if (hasSuccess) {
                        setTimeout(() => {
                            if (onUploadComplete) {
                                onUploadComplete();
                            }
                        }, 0);
                    }

                    // 남은 백엔드 세션들 정리 (혹시 모를 경우 대비)
                    const remainingSessions = Array.from(uploadSessionIdsRef.current);
                    if (remainingSessions.length > 0) {
                        console.warn('Cleaning up remaining sessions:', remainingSessions);
                        remainingSessions.forEach(async (sessionId) => {
                            try {
                                await deleteSession(sessionId);
                            } catch (err) {
                                console.error(`Failed to delete remaining session ${sessionId}:`, err);
                            }
                        });
                        uploadSessionIdsRef.current.clear();
                    }

                    // 3초 후 자동 닫기
                    setTimeout(() => {
                        resetModal();
                        onClose();
                    }, 3000);
                }

                return currentProgress;
            });
        }, 500);
    };

    const handleConfirmChunkSettings = () => {
        const input = document.createElement('input');
        input.type = 'file';

        if (isFolderUpload) {
            input.webkitdirectory = true;
            input.multiple = true;
        }

        input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) handleFileUpload(files, isFolderUpload);
        };
        input.click();
    };

    // 모달 위치 계산 - cascade 레이아웃
    const getModalStyle = (): React.CSSProperties => {
        const offset = modalIndex * 30; // 각 모달마다 30px씩 offset
        return {
            transform: `translate(${offset}px, ${offset}px)`,
            zIndex: isFocused ? 1002 + modalIndex : 1000 + modalIndex,
        };
    };

    return (
        <div
            className={styles.modalBackdrop}
            onClick={handleClose}
            style={{ zIndex: isFocused ? 1002 + modalIndex : 1000 + modalIndex }}
        >
            <div
                className={`${styles.modalContent} ${styles.wideModal}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onFocus();
                }}
                style={getModalStyle()}
            >
                <div className={styles.modalHeader}>
                    <h3>{isFolderUpload ? '폴더 업로드 설정' : '단일 파일 업로드 설정'}</h3>
                    <div className={styles.collectionInfo}>
                        <span>컬렉션: {selectedCollection?.collection_make_name}</span>
                        <span>폴더 경로: {currentFolder?.full_path || `/${selectedCollection?.collection_make_name}`}</span>
                    </div>
                </div>

                <div className={styles.modalBody}>
                    {/* 왼쪽: Embedding 정보 */}
                    <div className={styles.leftPanel}>
                        <div className={styles.embeddingInfo}>
                            <h4>현재 Embedding 설정</h4>
                            {embeddingLoading ? (
                                <div className={styles.loadingText}>설정 로드 중...</div>
                            ) : embeddingConfig ? (
                                <div className={styles.embeddingDetails}>
                                    <div className={styles.infoRow}>
                                        <label>Provider:</label>
                                        <span className={styles.providerName}>
                                            {embeddingConfig.provider_info.provider}
                                        </span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <label>Embedding Model:</label>
                                        <span className={`${styles.modelName} ${modelMismatch ? styles.mismatch : ''}`}>
                                            {embeddingConfig.provider_info.model}
                                        </span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <label>Dimension:</label>
                                        <span className={`${styles.dimension} ${dimensionMismatch ? styles.mismatch : ''}`}>
                                            {embeddingConfig.provider_info.dimension}
                                        </span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <label>Embedding Model (Collection):</label>
                                        <span className={`${styles.modelName} ${modelMismatch ? styles.mismatch : ''}`}>
                                            {selectedCollection?.init_embedding_model || 'N/A'}
                                        </span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <label>Dimension (Collection):</label>
                                        <span className={`${styles.dimension} ${dimensionMismatch ? styles.mismatch : ''}`}>
                                            {selectedCollection?.vector_size || 'N/A'}
                                        </span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <label>상태:</label>
                                        <span className={`${styles.status} ${embeddingConfig.client_available && embeddingConfig.provider_info.available ? styles.available : styles.unavailable}`}>
                                            {embeddingConfig.client_available && embeddingConfig.provider_info.available ? '✅ 사용 가능' : '❌ 사용 불가'}
                                        </span>
                                    </div>

                                    {/* 차원 불일치 경고 */}
                                    {dimensionMismatch && (
                                        <div className={styles.warningSection}>
                                            <div className={styles.warningMessage}>
                                                벡터 차원이 일치하지 않습니다!
                                                <br />
                                                Model: {embeddingConfig.provider_info.dimension} 차원
                                                <br />
                                                Collection: {selectedCollection?.vector_size} 차원
                                            </div>
                                            <label className={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={ignoreDimensionMismatch}
                                                    onChange={(e) => setIgnoreDimensionMismatch(e.target.checked)}
                                                />
                                                차원 불일치 무시하고 실행
                                            </label>
                                        </div>
                                    )}

                                    {/* 모델 불일치 경고 */}
                                    {modelMismatch && (
                                        <div className={styles.warningSection}>
                                            <div className={styles.warningMessage}>
                                                임베딩 모델이 일치하지 않습니다!
                                                <br />
                                                현재 Model: {embeddingConfig.provider_info.model}
                                                <br />
                                                Collection 초기 Model: {selectedCollection?.init_embedding_model}
                                            </div>
                                            <label className={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={ignoreModelMismatch}
                                                    onChange={(e) => setIgnoreModelMismatch(e.target.checked)}
                                                />
                                                모델 불일치 무시하고 실행
                                            </label>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.errorText}>설정을 불러올 수 없습니다.</div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽: 업로드 설정 및 진행상태 */}
                    <div className={styles.rightPanel}>
                        {error && <div className={styles.error}>{error}</div>}

                        {/* 업로드 완료 메시지 */}
                        {isCompleted && (
                            <div className={styles.completedMessage}>
                                {uploadProgress.every(item => item.status === 'success') ? (
                                    <>
                                        <span className={styles.completedIcon}>✅</span>
                                        <span>업로드가 완료되었습니다! 3초 후에 자동으로 닫힙니다.</span>
                                    </>
                                ) : uploadProgress.every(item => item.status === 'error') ? (
                                    <>
                                        <span className={styles.completedIcon}>❌</span>
                                        <span>모든 파일 업로드가 실패했습니다. 3초 후에 자동으로 닫힙니다.</span>
                                    </>
                                ) : (
                                    <>
                                        <span className={styles.completedIcon}>⚠️</span>
                                        <span>업로드가 완료되었습니다 (일부 실패). 3초 후에 자동으로 닫힙니다.</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* 업로드 진행 상태 - uploadProgress가 있으면 표시 (복원된 상태 포함) */}
                        {uploadProgress.length > 0 && (
                            <div className={styles.uploadProgressContainer}>
                                <div className={styles.progressHeader}>
                                    <h4>업로드 진행 상태</h4>
                                    <div className={styles.progressSummary}>
                                        <span className={styles.totalCount}>
                                            총 {uploadProgress.length}개 파일
                                        </span>
                                        <span className={styles.successCount}>
                                            성공: {uploadProgress.filter(item => item.status === 'success').length}
                                        </span>
                                        <span className={styles.errorCount}>
                                            실패: {uploadProgress.filter(item => item.status === 'error').length}
                                        </span>
                                        <span className={styles.uploadingCount}>
                                            진행 중: {uploadProgress.filter(item => item.status === 'uploading').length}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.progressList}>
                                    {uploadProgress.map((item, index) => (
                                        <div key={index} className={`${styles.progressItem} ${styles[item.status]}`}>
                                            <div className={styles.fileInfo}>
                                                <span className={styles.fileName} title={item.fileName}>
                                                    {item.fileName}
                                                </span>
                                                {item.status === 'uploading' && (
                                                    <span className={styles.progressPercent}>
                                                        {item.currentStage === 'calculating' && !item.totalChunks && '청크 수 계산 중...'}
                                                        {item.currentStage === 'calculating' && item.totalChunks && `총 ${item.totalChunks}개 청크 처리 중...`}
                                                        {item.currentStage === 'llm_processing' && `LLM 메타데이터 생성 중 (${item.llmProcessedChunks || 0}/${item.totalChunks})`}
                                                        {item.currentStage === 'embedding' && `임베딩 처리 중 (${item.processedChunks || 0}/${item.totalChunks})`}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.progressStatus}>
                                                {item.status === 'uploading' && item.totalChunks && (
                                                    <>
                                                        <div className={styles.progressBar}>
                                                            <div
                                                                className={styles.progressFill}
                                                                style={{
                                                                    width: item.currentStage === 'llm_processing'
                                                                        ? `${(item.llmProcessedChunks || 0) / item.totalChunks * 100}%`
                                                                        : item.currentStage === 'embedding'
                                                                        ? `${(item.processedChunks || 0) / item.totalChunks * 100}%`
                                                                        : '0%'
                                                                }}
                                                            ></div>
                                                        </div>
                                                        {item.session && (
                                                            <span className={styles.sessionInfo} title={item.session}>
                                                                세션: {item.session.substring(0, 8)}...
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                                <span className={`${styles.statusText} ${styles[item.status]}`}>
                                                    {item.status === 'uploading' && '📤 업로드 중...'}
                                                    {item.status === 'success' && '✅ 완료'}
                                                    {item.status === 'error' && `❌ ${item.error || '실패'}`}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 청크 설정 */}
                        <div className={styles.formGroup}>
                            <label>청크 사이즈</label>
                            <input
                                type="number"
                                value={chunkSize}
                                onChange={(e) => setChunkSize(Number(e.target.value))}
                                placeholder="4000"
                                min="100"
                                max="65000"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>오버랩 사이즈</label>
                            <input
                                type="number"
                                value={overlapSize}
                                onChange={(e) => setOverlapSize(Number(e.target.value))}
                                placeholder="1000"
                                min="0"
                                max="65000"
                            />
                        </div>

                        {/* 처리 방식 선택 */}
                        <div className={styles.formGroup}>
                            <label>문서 처리 방식 (PDF/DOCX 파일에만 적용)</label>
                            <select
                                value={processType}
                                onChange={(e) => setProcessType(e.target.value)}
                                className={styles.selectInput}
                            >
                                <option value="text">텍스트 추출 (PDF/DOCX 공통)</option>
                                <option value="ocr">OCR 처리 (PDF/DOCX 공통)</option>
                                <option value="html">HTML 변환 (DOCX 전용)</option>
                                <option value="html_pdf_ocr">HTML+PDF OCR (DOCX 전용)</option>
                            </select>
                            <div className={styles.helpText}>
                                <small>
                                    • <strong>자동 선택:</strong> 시스템이 최적의 방식을 자동으로 선택<br />
                                    • <strong>텍스트 추출:</strong> OCR 없이 기계적 텍스트 추출만 사용<br />
                                    • <strong>OCR 처리:</strong> 이미지 OCR을 강제로 사용<br />
                                    • <strong>HTML 변환:</strong> DOCX를 HTML로 변환 후 처리 (DOCX만)<br />
                                    • <strong>HTML+PDF OCR:</strong> HTML 참조 + PDF OCR 복합 방식 (DOCX만)
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.modalActions}>
                    <button
                        onClick={handleClose}
                        className={`${styles.button} ${styles.secondary}`}
                    >
                        {loading && uploadProgress.some(item => item.status === 'uploading') ? '최소화' : '닫기'}
                    </button>
                    <button
                        onClick={handleConfirmChunkSettings}
                        className={`${styles.button} ${styles.primary}`}
                        disabled={loading || (dimensionMismatch && !ignoreDimensionMismatch) || (modelMismatch && !ignoreModelMismatch) || !embeddingConfig?.client_available}
                    >
                        {loading ? '업로드 중...' : '설정 완료'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentFileModalInstance;
