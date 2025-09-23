'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import UploadModelSection from './components/UploadModelSection';
import InferenceConsole from './components/InferenceConsole';
import ModelRegistryPanel from './components/ModelRegistryPanel';
import DeleteModelDialog from './components/DeleteModelDialog';
import ModelDetailPanel from './components/ModelDetailPanel';
import styles from './MlInferencePage.module.scss';
import type {
    ApiError,
    DeleteModelResponse,
    ModelDetailResponse,
    RegisteredModel,
    UploadSuccessResponse,
    ListModelsResponse,
    SyncResponse,
} from './types';
import { apiClient } from '@/app/_common/api/helper/apiClient';
import { API_BASE_URL } from '@/app/config.js';

const joinUrl = (baseUrl: string, path: string) => {
    const trimmed = baseUrl.trim();
    if (!trimmed) {
        return path;
    }

    const normalizedBase = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
};

const normalizeModelResponse = (payload: UploadSuccessResponse): RegisteredModel => {
    const normalizeSchema = (schema: unknown): string[] | null => {
        if (!schema) {
            return null;
        }
        if (Array.isArray(schema)) {
            return schema.map(item => String(item));
        }
        return null;
    };

    return {
        model_id: payload.model_id,
        model_name: payload.model_name,
        model_version: payload.model_version ?? null,
        framework: payload.framework ?? null,
        description: payload.description ?? null,
        input_schema: normalizeSchema(payload.input_schema),
        output_schema: normalizeSchema(payload.output_schema),
        metadata: payload.metadata ?? null,
        file_path: payload.file_path ?? null,
        file_size: payload.file_size ?? null,
        file_checksum: payload.file_checksum ?? null,
    };
};

const MlInferencePage: React.FC = () => {
    const [baseUrl, setBaseUrl] = useState(API_BASE_URL ?? '');
    const [models, setModels] = useState<RegisteredModel[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
    const [deleteCandidate, setDeleteCandidate] = useState<RegisteredModel | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [modelDetail, setModelDetail] = useState<ModelDetailResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);

    const uploadEndpoint = useMemo(() => joinUrl(baseUrl, '/api/models/upload'), [baseUrl]);
    const inferenceEndpoint = useMemo(() => joinUrl(baseUrl, '/api/models/infer'), [baseUrl]);

    const handleModelInserted = (response: UploadSuccessResponse) => {
        const normalized = normalizeModelResponse(response);
        setModels(prev => {
            const filtered = prev.filter(item => item.model_id !== normalized.model_id);
            return [normalized, ...filtered];
        });
        setSelectedModelId(normalized.model_id);
        // 새 모델 정보를 목록과 상세 패널에서 최신 상태로 유지
        setModelDetail(normalized);
    };

    const mapListItemToRegisteredModel = useCallback((item: ListModelsResponse['items'][number]): RegisteredModel => ({
        model_id: item.id,
        model_name: item.model_name,
        model_version: item.model_version ?? null,
        framework: item.framework ?? null,
        description: null,
        input_schema: null,
        output_schema: null,
        metadata: null,
        file_path: item.file_path ?? null,
        file_size: item.file_size ?? null,
        file_checksum: item.file_checksum ?? null,
        status: item.status ?? null,
        uploaded_by: item.uploaded_by ?? null,
        created_at: item.created_at ?? null,
        updated_at: item.updated_at ?? null,
    }), []);

    const fetchModelsFromServer = useCallback(async () => {
        setIsLoadingList(true);
        setListError(null);
        setSyncMessage(null);
        setSyncError(null);

        try {
            const response = await apiClient(joinUrl(baseUrl, '/api/models?limit=100&offset=0'), {
                method: 'GET',
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: (payload as ApiError | null)?.message || '모델 목록을 불러오는데 실패했습니다.',
                    details: payload,
                } as ApiError;
            }

            const listPayload = payload as ListModelsResponse;
            const updatedModels = listPayload.items?.map(mapListItemToRegisteredModel) ?? [];

            setModels(updatedModels);

            if (updatedModels.length === 0) {
                setSelectedModelId(null);
                setModelDetail(null);
            } else if (selectedModelId && !updatedModels.some(model => model.model_id === selectedModelId)) {
                setSelectedModelId(null);
                setModelDetail(null);
            }
        } catch (error) {
            const apiError: ApiError =
                error instanceof Error
                    ? { status: 0, message: error.message }
                    : (error as ApiError);
            setListError(apiError.message);
        } finally {
            setIsLoadingList(false);
        }
    }, [baseUrl, mapListItemToRegisteredModel, selectedModelId]);

    const fetchModelDetail = useCallback(async (modelId: number, silent = false) => {
        if (!silent) {
            setDetailLoading(true);
            setDetailError(null);
        }

        try {
            const response = await apiClient(joinUrl(baseUrl, `/api/models/${modelId}`), {
                method: 'GET',
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: (payload as ApiError | null)?.message || '모델 상세 정보를 가져오지 못했습니다.',
                    details: payload,
                } as ApiError;
            }

            const detailPayload = payload as ModelDetailResponse;
            setModelDetail(detailPayload);

            // 목록에 있는 동일 모델 데이터도 최신화
            setModels(prev => {
                const exists = prev.some(model => model.model_id === detailPayload.model_id);
                if (!exists) {
                    return prev;
                }
                return prev.map(model =>
                    model.model_id === detailPayload.model_id
                        ? {
                            ...model,
                            ...detailPayload,
                        }
                        : model
                );
            });
        } catch (error) {
            const apiError: ApiError =
                error instanceof Error
                    ? { status: 0, message: error.message }
                    : (error as ApiError);
            setDetailError(apiError.message);
        } finally {
            if (!silent) {
                setDetailLoading(false);
            }
        }
    }, [baseUrl]);

    const requestDeleteModel = async (modelId: number) => {
        const response = await apiClient(joinUrl(baseUrl, `/api/models/${modelId}`), {
            method: 'DELETE',
        });

        let payload: unknown = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        if (!response.ok) {
            throw {
                status: response.status,
                message: (payload as ApiError | null)?.message || '모델 삭제에 실패했습니다.',
                details: payload,
            } as ApiError;
        }

        return (payload ?? null) as DeleteModelResponse | null;
    };

    const handleDeleteRequest = (model: RegisteredModel) => {
        setDeleteCandidate(model);
        setDeleteError(null);
    };

    const handleConfirmDelete = async () => {
        if (!deleteCandidate) {
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);

        try {
            await requestDeleteModel(deleteCandidate.model_id);
            setModels(prev => prev.filter(model => model.model_id !== deleteCandidate.model_id));
            setDeleteCandidate(null);
            setSelectedModelId(prev => (prev === deleteCandidate.model_id ? null : prev));
            setModelDetail(null);
            await fetchModelsFromServer();
        } catch (error) {
            const apiError: ApiError =
                error instanceof Error
                    ? { status: 0, message: error.message }
                    : (error as ApiError);
            setDeleteError(apiError.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        if (isDeleting) {
            return;
        }
        setDeleteCandidate(null);
        setDeleteError(null);
    };

    const handleSelectModel = useCallback((modelId: number) => {
        setSelectedModelId(modelId);
    }, []);

    const handleSyncArtifacts = useCallback(async () => {
        setSyncError(null);
        setSyncMessage(null);
        setIsSyncing(true);

        try {
            const response = await apiClient(joinUrl(baseUrl, '/api/models/sync'), {
                method: 'POST',
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: (payload as ApiError | null)?.message || '아티팩트 동기화에 실패했습니다.',
                    details: payload,
                } as ApiError;
            }

            const syncPayload = payload as SyncResponse;
            setSyncMessage(`검사 ${syncPayload.checked}개 / 제거 ${syncPayload.removed}개`);

            await fetchModelsFromServer();
        } catch (error) {
            const apiError: ApiError =
                error instanceof Error
                    ? { status: 0, message: error.message }
                    : (error as ApiError);
            setSyncError(apiError.message);
        } finally {
            setIsSyncing(false);
        }
    }, [baseUrl, fetchModelsFromServer]);

    useEffect(() => {
        if (!selectedModelId) {
            setModelDetail(null);
            setDetailError(null);
            setDetailLoading(false);
            return;
        }

        setDetailLoading(true);
        setDetailError(null);
        setModelDetail(null);
        fetchModelDetail(selectedModelId, true).finally(() => {
            setDetailLoading(false);
        });
    }, [fetchModelDetail, selectedModelId]);

    useEffect(() => {
        // 베이스 URL이 변경되면 기존 상태 초기화
        setListError(null);
        setSyncError(null);
        setSyncMessage(null);
    }, [baseUrl]);

    return (
        <main className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <h1>Machine Learning Inference</h1>
                    <p>백엔드 모델 업로드 및 추론 API를 검증하기 위한 독립형 테스트 콘솔입니다. 기존 워크플로우와 격리되어 동작합니다.</p>
                </div>
                <span className={styles.statusBadge}>Beta Sandbox</span>
            </header>

            <section className={styles.connectionPanel}>
                <div className={styles.connectionField}>
                    <label htmlFor="ml-inference-base-url">Backend Base URL</label>
                    <input
                        id="ml-inference-base-url"
                        type="text"
                        value={baseUrl}
                        onChange={event => setBaseUrl(event.target.value)}
                        placeholder="예: http://localhost:8000"
                    />
                    <small>기본값은 환경 변수로 설정된 API_CONFIG.BASE_URL입니다.</small>
                </div>
                <div className={styles.actionsRow}>
                    <button type="button" onClick={fetchModelsFromServer} disabled={isLoadingList}>
                        {isLoadingList ? '목록 불러오는 중...' : '모델 목록 불러오기'}
                    </button>
                    <button type="button" onClick={handleSyncArtifacts} disabled={isSyncing || isLoadingList}>
                        {isSyncing ? '동기화 중...' : '아티팩트 동기화'}
                    </button>
                </div>
                <div className={styles.statusColumn}>
                    {listError ? <p className={styles.statusError}>목록 오류: {listError}</p> : null}
                    {syncError ? <p className={styles.statusError}>동기화 오류: {syncError}</p> : null}
                    {syncMessage ? <p className={styles.statusInfo}>{syncMessage}</p> : null}
                </div>
            </section>

            <div className={styles.grid}>
                <div className={styles.leftColumn}>
                    <UploadModelSection
                        request={{ endpoint: uploadEndpoint }}
                        onUploadSuccess={handleModelInserted}
                    />
                    <ModelRegistryPanel
                        models={models}
                        selectedModelId={selectedModelId}
                        onSelect={handleSelectModel}
                        onDelete={handleDeleteRequest}
                    />
                </div>
                <div className={styles.rightColumn}>
                    <ModelDetailPanel
                        model={modelDetail}
                        isLoading={detailLoading}
                        errorMessage={detailError}
                        onRefetch={selectedModelId ? () => fetchModelDetail(selectedModelId) : undefined}
                    />
                    <InferenceConsole
                        request={{ endpoint: inferenceEndpoint }}
                        models={models}
                        selectedModelId={selectedModelId}
                        onSelectModel={setSelectedModelId}
                    />
                </div>
            </div>

            {deleteCandidate ? (
                <DeleteModelDialog
                    model={deleteCandidate}
                    isDeleting={isDeleting}
                    errorMessage={deleteError}
                    onCancel={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                />
            ) : null}
        </main>
    );
};

export default MlInferencePage;
