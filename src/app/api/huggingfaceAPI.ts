import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from './apiClient';

// It would be good to have a central place for these types, e.g., src/types/huggingface.ts
export interface HFResource {
    id: string;
    author?: string;
    private?: boolean;
    downloads?: number;
    [key: string]: any;
}

export interface HFModelsResponse {
    models: HFResource[];
}

export interface HFDatasetsResponse {
    datasets: HFResource[];
}

const _getHuggingFaceModels = async (): Promise<HFModelsResponse> => {
    const response = await apiClient(`${API_BASE_URL}/api/huggingface/models`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
        if (response.status === 422) {
            if (errorData.detail === 'HUGGING_FACE_USER_ID_NOT_CONFIGURED') {
                errorMessage = 'Hugging Face 사용자 ID가 설정되지 않았습니다.';
            } else if (errorData.detail === 'HUGGING_FACE_HUB_TOKEN_NOT_CONFIGURED') {
                errorMessage = 'Hugging Face 허브 토큰이 설정되지 않았습니다.';
            }
        }
        throw new Error(errorMessage);
    }
    return response.json();
};
export const getHuggingFaceModels = withErrorHandler(_getHuggingFaceModels, 'Failed to fetch Hugging Face models');

const _getHuggingFaceDatasets = async (): Promise<HFDatasetsResponse> => {
    const response = await apiClient(`${API_BASE_URL}/api/huggingface/datasets`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
        if (response.status === 422) {
             if (errorData.detail === 'HUGGING_FACE_USER_ID_NOT_CONFIGURED') {
                errorMessage = 'Hugging Face 사용자 ID가 설정되지 않았습니다.';
            } else if (errorData.detail === 'HUGGING_FACE_HUB_TOKEN_NOT_CONFIGURED') {
                errorMessage = 'Hugging Face 허브 토큰이 설정되지 않았습니다.';
            }
        }
        throw new Error(errorMessage);
    }
    return response.json();
};
export const getHuggingFaceDatasets = withErrorHandler(_getHuggingFaceDatasets, 'Failed to fetch Hugging Face datasets');

const _getAllHuggingFaceResources = async (): Promise<{ models: { success: boolean, data: any, error: string | null }, datasets: { success: boolean, data: any, error: string | null } }> => {
    const [modelsResponse, datasetsResponse] = await Promise.allSettled([
        getHuggingFaceModels(),
        getHuggingFaceDatasets()
    ]);

    return {
        models: {
            success: modelsResponse.status === 'fulfilled',
            data: modelsResponse.status === 'fulfilled' ? modelsResponse.value : null,
            error: modelsResponse.status === 'rejected' ? (modelsResponse.reason as Error).message : null
        },
        datasets: {
            success: datasetsResponse.status === 'fulfilled',
            data: datasetsResponse.status === 'fulfilled' ? datasetsResponse.value : null,
            error: datasetsResponse.status === 'rejected' ? (datasetsResponse.reason as Error).message : null
        }
    };
};
export const getAllHuggingFaceResources = withErrorHandler(_getAllHuggingFaceResources, 'Failed to fetch all Hugging Face resources');
