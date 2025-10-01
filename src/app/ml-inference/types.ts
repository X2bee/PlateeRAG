export interface MlflowAdditionalMetadata {
    artifact_uri?: string | null;
    stage?: string | null;
    status?: string | null;
    source?: string | null;
    tags?: Record<string, unknown> | null;
    creation_timestamp?: number | null;
    creation_timestamp_iso?: string | null;
    last_updated_timestamp?: number | null;
    last_updated_timestamp_iso?: string | null;
    run_link?: string | null;
    [key: string]: unknown;
}

export interface MlflowMetadata {
    tracking_uri?: string | null;
    model_uri?: string | null;
    run_id?: string | null;
    model_version?: string | null;
    registered_model_name?: string | null;
    load_flavor?: string | null;
    artifact_path?: string | null;
    additional_metadata?: MlflowAdditionalMetadata | null;
    [key: string]: unknown;
}

export interface RegisteredModel {
    model_id: number;
    model_name: string;
    model_version: string | null;
    framework?: string | null;
    description?: string | null;
    input_schema?: string[] | null;
    output_schema?: string[] | null;
    metadata?: Record<string, unknown> | null;
    mlflow_metadata?: MlflowMetadata | null;
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
        mlflow_metadata?: MlflowMetadata | null;
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
