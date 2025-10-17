'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { showSuccessToastKo } from '@/app/_common/utils/toastUtilsKo';
import { apiClient } from '@/app/_common/api/helper/apiClient';
import { API_BASE_URL } from '@/app/config.js';
import type {
    ApiError,
    DeleteModelResponse,
    ListModelsResponse,
    ModelDetailResponse,
    RegisteredModel,
    StageChangeResult,
    StageUpdateRequest,
    SyncResponse,
    UploadSuccessResponse,
} from '../types';
import { normalizeMlflowStage } from '../utils/stageUtils';

const joinUrl = (baseUrl: string, path: string) => {
    const trimmed = baseUrl.trim();
    if (!trimmed) {
        return path;
    }

    const normalizedBase = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
};

const stripWrapperTokens = (value: string) => {
    return value
        .replace(/^\s+|\s+$/g, '')
        // eslint-disable-next-line no-useless-escape
        .replace(/^[`"'\[{\(]+/, '')
        // eslint-disable-next-line no-useless-escape
        .replace(/[`"'\]}\),]+$/g, '')
        .replace(/^,+|,+$/g, '')
        .replace(/\\"/g, '"');
};

const flattenValues = (input: unknown): string[] => {
    if (!input) {
        return [];
    }

    if (Array.isArray(input)) {
        return input.flatMap(item => flattenValues(item));
    }

    if (typeof input === 'object') {
        return Object.values(input as Record<string, unknown>).flatMap(value => flattenValues(value));
    }

    const stringValue = String(input);
    const cleaned = stripWrapperTokens(stringValue);
    if (!cleaned) {
        return [];
    }

    return cleaned.split(',').map(token => stripWrapperTokens(token)).filter(token => token.length > 0);
};

const normalizeSchema = (schema: unknown): string[] | null => {
    if (!schema) {
        return null;
    }

    if (Array.isArray(schema)) {
        const normalized = flattenValues(schema);
        return normalized.length > 0 ? normalized : null;
    }

    if (typeof schema === 'string') {
        const trimmed = schema.trim();
        if (!trimmed) {
            return null;
        }

        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                const normalized = flattenValues(parsed);
                return normalized.length > 0 ? normalized : null;
            }
            if (parsed && typeof parsed === 'object') {
                const values = Object.values(parsed as Record<string, unknown>);
                const normalized = flattenValues(values);
                return normalized.length > 0 ? normalized : null;
            }
            if (parsed !== null && parsed !== undefined) {
                const tokens = flattenValues(parsed);
                if (tokens.length > 0) {
                    return tokens;
                }
                const normalized = stripWrapperTokens(String(parsed));
                return normalized ? [normalized] : null;
            }
        } catch {
            const inline = trimmed.replace(/^\{|\}$/g, '').replace(/^\[|\]$/g, '');
            const tokens = inline
                .split(',')
                .map(token => stripWrapperTokens(token))
                .filter(token => token.length > 0);
            return tokens.length > 0 ? tokens : null;
        }

        const normalized = stripWrapperTokens(trimmed);
        return normalized ? [normalized] : null;
    }

    if (typeof schema === 'object') {
        const values = Object.values(schema as Record<string, unknown>);
        const normalized = flattenValues(values);
        return normalized.length > 0 ? normalized : null;
    }

    return null;
};

interface DeleteState {
    model: RegisteredModel | null;
    isDeleting: boolean;
    error: string | null;
    errorCode: string | null;
}

interface MlModelWorkspaceContextValue {
    baseUrl: string;
    uploadEndpoint: string;
    inferenceEndpoint: string;
    models: RegisteredModel[];
    selectedModelId: number | null;
    setSelectedModelId: React.Dispatch<React.SetStateAction<number | null>>;
    handleModelInserted: (response: UploadSuccessResponse) => void;
    fetchModels: () => Promise<void>;
    isLoadingList: boolean;
    listError: string | null;
    modelDetail: ModelDetailResponse | null;
    detailLoading: boolean;
    detailError: string | null;
    fetchModelDetail: (modelId: number, options?: { silent?: boolean }) => Promise<ModelDetailResponse | null>;
    changeModelStage: (modelId: number, request: StageUpdateRequest) => Promise<StageChangeResult>;
    openDeleteDialog: (model: RegisteredModel) => void;
    stageDialogModel: RegisteredModel | null;
    openStageDialog: (model: RegisteredModel) => void;
    closeStageDialog: () => void;
    cancelDelete: () => void;
    confirmDelete: () => Promise<void>;
    deleteState: DeleteState;
    syncArtifacts: () => Promise<void>;
    isSyncing: boolean;
    syncMessage: string | null;
    syncError: string | null;
}

const MlModelWorkspaceContext = createContext<MlModelWorkspaceContextValue | null>(null);

export const useMlModelWorkspace = () => {
    const context = useContext(MlModelWorkspaceContext);
    if (!context) {
        throw new Error('useMlModelWorkspace must be used within MlModelWorkspaceProvider');
    }
    return context;
};

export const MlModelWorkspaceProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const baseUrl = API_BASE_URL ?? '';
    const uploadEndpoint = useMemo(() => joinUrl(baseUrl, '/api/models/upload'), [baseUrl]);
    const inferenceEndpoint = useMemo(() => joinUrl(baseUrl, '/api/models/infer'), [baseUrl]);

    const [models, setModels] = useState<RegisteredModel[]>([]);
    const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
    const selectedModelIdRef = useRef<number | null>(null);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [modelDetail, setModelDetail] = useState<ModelDetailResponse | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [deleteState, setDeleteState] = useState<DeleteState>({ model: null, isDeleting: false, error: null, errorCode: null });
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [stageDialogModel, setStageDialogModel] = useState<RegisteredModel | null>(null);

    const openStageDialog = useCallback((model: RegisteredModel) => {
        setStageDialogModel(model);
    }, []);

    const closeStageDialog = useCallback(() => {
        setStageDialogModel(null);
    }, []);

    const mapListItemToRegisteredModel = useCallback((item: ListModelsResponse['items'][number]): RegisteredModel => ({
        model_id: item.id,
        model_name: item.model_name,
        model_version: item.model_version ?? null,
        framework: item.framework ?? null,
        description: null,
        input_schema: null,
        output_schema: null,
        metadata: null,
        mlflow_metadata: item.mlflow_metadata ?? null,
        file_path: item.file_path ?? null,
        file_size: item.file_size ?? null,
        file_checksum: item.file_checksum ?? null,
        status: item.status ?? null,
        uploaded_by: item.uploaded_by ?? null,
        created_at: item.created_at ?? null,
        updated_at: item.updated_at ?? null,
    }), []);

    const handleModelInserted = useCallback((response: UploadSuccessResponse) => {
        const normalized: RegisteredModel = {
            model_id: response.model_id,
            model_name: response.model_name,
            model_version: response.model_version ?? null,
            framework: response.framework ?? null,
            description: response.description ?? null,
            input_schema: normalizeSchema(response.input_schema ?? null),
            output_schema: normalizeSchema(response.output_schema ?? null),
            metadata: response.metadata ?? null,
            mlflow_metadata: response.mlflow_metadata ?? null,
            file_path: response.file_path ?? null,
            file_size: response.file_size ?? null,
            file_checksum: response.file_checksum ?? null,
            status: response.status ?? null,
            uploaded_by: response.uploaded_by ?? null,
            created_at: response.created_at ?? null,
            updated_at: response.updated_at ?? null,
        };

        setModels(prev => {
            const filtered = prev.filter(item => item.model_id !== normalized.model_id);
            return [normalized, ...filtered];
        });
        setSelectedModelId(normalized.model_id);
        setModelDetail(normalized as ModelDetailResponse);
    }, []);

    const fetchModels = useCallback(async () => {
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

            const currentSelectedId = selectedModelIdRef.current;

            if (updatedModels.length === 0) {
                setSelectedModelId(null);
                setModelDetail(null);
            } else if (currentSelectedId && !updatedModels.some(model => model.model_id === currentSelectedId)) {
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
    }, [baseUrl, mapListItemToRegisteredModel]);

    const fetchModelDetail = useCallback(async (modelId: number, options?: { silent?: boolean }) => {
        if (!options?.silent) {
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
            const normalizedDetail: ModelDetailResponse = {
                ...detailPayload,
                input_schema: normalizeSchema(detailPayload.input_schema ?? null),
                output_schema: normalizeSchema(detailPayload.output_schema ?? null),
            };
            setModelDetail(normalizedDetail);

            setModels(prev => {
                const exists = prev.some(model => model.model_id === detailPayload.model_id);
                if (!exists) {
                    return prev;
                }
                return prev.map(model =>
                    model.model_id === detailPayload.model_id
                        ? {
                            ...model,
                            ...normalizedDetail,
                        }
                        : model
                );
            });

            return normalizedDetail;
        } catch (error) {
            const apiError: ApiError =
                error instanceof Error
                    ? { status: 0, message: error.message }
                    : (error as ApiError);
            setDetailError(apiError.message);
            return null;
        } finally {
            if (!options?.silent) {
                setDetailLoading(false);
            }
        }
    }, [baseUrl]);

    const changeModelStage = useCallback(async (modelId: number, requestBody: StageUpdateRequest): Promise<StageChangeResult> => {
        try {
            const response = await apiClient(joinUrl(baseUrl, `/api/models/${modelId}/stage`), {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: (payload as ApiError | null)?.message || '스테이지를 변경하지 못했습니다.',
                    details: payload,
                } as ApiError;
            }

            const detailPayload = (payload ?? null) as ModelDetailResponse & { previous_stage?: string | null } | null;
            if (!detailPayload) {
                throw {
                    status: response.status,
                    message: '스테이지 변경 응답이 올바르지 않습니다.',
                } as ApiError;
            }

            const normalizedDetail: ModelDetailResponse = {
                ...detailPayload,
                input_schema: normalizeSchema(detailPayload.input_schema ?? null),
                output_schema: normalizeSchema(detailPayload.output_schema ?? null),
            };

            setModelDetail(prev => (prev && prev.model_id === normalizedDetail.model_id ? normalizedDetail : prev));

            setModels(prev => {
                const exists = prev.some(model => model.model_id === normalizedDetail.model_id);
                if (!exists) {
                    return prev;
                }
                return prev.map(model => (model.model_id === normalizedDetail.model_id ? {
                    ...model,
                    ...normalizedDetail,
                } : model));
            });

            const previousStageRaw = (detailPayload as { previous_stage?: string | null }).previous_stage ?? null;
            const previousStage = previousStageRaw == null ? null : normalizeMlflowStage(previousStageRaw);

            return {
                detail: normalizedDetail,
                previousStage,
            };
        } catch (error) {
            const apiError: ApiError =
                error instanceof Error && 'status' in error
                    ? (error as ApiError)
                    : error instanceof Error
                        ? { status: 0, message: error.message }
                        : (error as ApiError);
            throw apiError;
        }
    }, [baseUrl]);

    const performDelete = useCallback(async (modelId: number) => {
        const response = await apiClient(joinUrl(baseUrl, `/api/models/${modelId}`), {
            method: 'DELETE',
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            throw {
                status: response.status,
                message: (payload as { message?: string } | null)?.message || '모델 삭제에 실패했습니다.',
                code: (payload as { message?: string; code?: string } | null)?.message
                    ?? (payload as { code?: string } | null)?.code
                    ?? undefined,
                details: payload,
            } as ApiError;
        }

        return (payload ?? null) as DeleteModelResponse | null;
    }, [baseUrl]);

    const confirmDelete = useCallback(async () => {
        if (!deleteState.model) {
            return;
        }
        const targetModel = deleteState.model;
        setDeleteState(prev => ({ ...prev, isDeleting: true, error: null, errorCode: null }));
        try {
            await performDelete(targetModel.model_id);
            setModels(prev => prev.filter(model => model.model_id !== targetModel.model_id));
            setDeleteState({ model: null, isDeleting: false, error: null, errorCode: null });
            setSelectedModelId(prev => (prev === targetModel.model_id ? null : prev));
            setModelDetail(prev => (prev && prev.model_id === targetModel.model_id ? null : prev));
            showSuccessToastKo('모델이 삭제되었습니다.');
            await fetchModels();
        } catch (error) {
            const apiError: ApiError =
                error && typeof error === 'object' && 'status' in (error as Record<string, unknown>)
                    ? (error as ApiError)
                    : { status: 0, message: (error as Error | null)?.message ?? '모델 삭제에 실패했습니다.' };

            const code = apiError.code ?? apiError.message ?? '';
            const normalizedCode = typeof code === 'string' ? code.toUpperCase() : '';

            if (apiError.status === 404) {
                showSuccessToastKo('이미 삭제된 모델입니다. 목록을 새로고칩니다.');
                setDeleteState({ model: null, isDeleting: false, error: null, errorCode: null });
                setModels(prev => prev.filter(model => model.model_id !== targetModel.model_id));
                setSelectedModelId(prev => (prev === targetModel.model_id ? null : prev));
                setModelDetail(prev => (prev && prev.model_id === targetModel.model_id ? null : prev));
                await fetchModels();
                return;
            }

            let message = apiError.message || '모델 삭제에 실패했습니다.';

            if (apiError.status === 400 && normalizedCode === 'MODEL_STAGE_DELETE_BLOCKED') {
                message = '현재 모델은 Production 스테이지입니다. 스테이지를 변경한 후 삭제할 수 있습니다.';
            } else if (apiError.status === 502) {
                message = 'MLflow 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
            }

            setDeleteState(prev => ({ ...prev, isDeleting: false, error: message, errorCode: normalizedCode || null }));
        }
    }, [deleteState.model, performDelete, fetchModels]);

    const openDeleteDialog = useCallback((model: RegisteredModel) => {
        setDeleteState({ model, isDeleting: false, error: null, errorCode: null });
    }, []);

    const cancelDelete = useCallback(() => {
        if (deleteState.isDeleting) {
            return;
        }
        setDeleteState({ model: null, isDeleting: false, error: null, errorCode: null });
    }, [deleteState.isDeleting]);

    const syncArtifacts = useCallback(async () => {
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

            await fetchModels();
        } catch (error) {
            const apiError: ApiError =
                error instanceof Error
                    ? { status: 0, message: error.message }
                    : (error as ApiError);
            setSyncError(apiError.message);
        } finally {
            setIsSyncing(false);
        }
    }, [baseUrl, fetchModels]);

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
        fetchModelDetail(selectedModelId, { silent: true }).finally(() => {
            setDetailLoading(false);
        });
    }, [fetchModelDetail, selectedModelId]);

    const contextValue = useMemo<MlModelWorkspaceContextValue>(() => ({
        baseUrl,
        uploadEndpoint,
        inferenceEndpoint,
        models,
        selectedModelId,
        setSelectedModelId,
        handleModelInserted,
        fetchModels,
        isLoadingList,
        listError,
        modelDetail,
        detailLoading,
        detailError,
        fetchModelDetail,
        changeModelStage,
        openDeleteDialog,
        cancelDelete,
        confirmDelete,
        deleteState,
        stageDialogModel,
        openStageDialog,
        closeStageDialog,
        syncArtifacts,
        isSyncing,
        syncMessage,
        syncError,
    }), [
        baseUrl,
        uploadEndpoint,
        inferenceEndpoint,
        models,
        selectedModelId,
        handleModelInserted,
        fetchModels,
        isLoadingList,
        listError,
        modelDetail,
        detailLoading,
        detailError,
        fetchModelDetail,
        changeModelStage,
        openDeleteDialog,
        cancelDelete,
        confirmDelete,
        deleteState,
        stageDialogModel,
        openStageDialog,
        closeStageDialog,
        syncArtifacts,
        isSyncing,
        syncMessage,
        syncError,
    ]);

    useEffect(() => {
        selectedModelIdRef.current = selectedModelId;
    }, [selectedModelId]);

    useEffect(() => {
        fetchModels().catch(() => {
            // 오류는 이미 상태로 관리됨
        });
    }, [fetchModels]);

    return (
        <MlModelWorkspaceContext.Provider value={contextValue}>
            {children}
        </MlModelWorkspaceContext.Provider>
    );
};

export { joinUrl, normalizeSchema };
