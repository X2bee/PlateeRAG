export interface RegisteredModel {
    model_id: number;
    model_name: string;
    model_version: string | null;
    framework?: string | null;
    description?: string | null;
    input_schema?: string[] | null;
    output_schema?: string[] | null;
    metadata?: Record<string, unknown> | null;
    file_path?: string | null;
    file_size?: number | null;
    file_checksum?: string | null;
    status?: string | null;
    uploaded_by?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface UploadSuccessResponse extends RegisteredModel {
    metadata?: Record<string, unknown> | null;
}

export interface UploadResult {
    data: UploadSuccessResponse;
    rawResponse: UploadSuccessResponse;
}

export interface InferenceResultPayload {
    model: {
        id: number;
        name: string;
        version: string | null;
        framework: string | null;
    };
    result: {
        predictions: unknown;
        probabilities?: unknown;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export interface ApiError {
    status: number;
    message: string;
    details?: unknown;
}

export interface RequestContext {
    token?: string;
    endpoint: string;
}

export interface DeleteModelResponse {
    success?: boolean;
    message?: string;
    model_id?: number;
    [key: string]: unknown;
}

export interface ListModelsResponse {
    items: Array<{
        id: number;
        model_name: string;
        model_version: string | null;
        framework?: string | null;
        file_path?: string | null;
        file_size?: number | null;
        file_checksum?: string | null;
        status?: string | null;
        uploaded_by?: number | null;
        created_at?: string | null;
        updated_at?: string | null;
    }>;
    limit?: number;
    offset?: number;
}

export interface ModelDetailResponse extends RegisteredModel {
    storage_path?: string | null;
    status?: string | null;
    uploaded_by?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface SyncResponse {
    checked: number;
    removed: number;
    removed_ids?: number[];
}
