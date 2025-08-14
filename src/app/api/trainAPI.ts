import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { apiClient } from './apiClient';
import { API_BASE_URL } from '@/app/config';

// It would be beneficial to move this to a central types/training.ts file
export interface TrainingParams {
    number_gpu?: number;
    project_name?: string;
    training_method?: string;
    model_load_method?: string;
    dataset_load_method?: string;
    hugging_face_user_id?: string;
    hugging_face_token?: string;
    mlflow_url?: string;
    mlflow_run_id?: string;
    minio_url?: string;
    minio_access_key?: string;
    minio_secret_key?: string;
    [key: string]: any; // Allow other params
}

export interface MLflowParams {
    mlflow_url?: string;
    mlflow_exp_id?: string;
    mlflow_run_id?: string;
}

export interface VastInstanceOptions {
    offer_id?: string;
    offer_info?: any;
    hf_hub_token?: string;
    template_name?: 'budget' | 'high_performance' | 'research';
    auto_destroy?: boolean;
    vllm_config?: any;
}

const _startTraining = async (params: TrainingParams): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/train/start`, {
        method: 'POST',
        body: JSON.stringify(params),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Training start failed: ${response.statusText}`);
    }
    return response.json();
};
export const startTraining = withErrorHandler(_startTraining, 'Error starting training');

const _getMLflow = async (params: MLflowParams = {}): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/train/mlflow`, {
        method: 'POST',
        body: JSON.stringify(params),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Get MLflow info failed: ${response.statusText}`);
    }
    return response.json();
};
export const getMLflow = withErrorHandler(_getMLflow, 'Error getting MLflow info');

const _getTrainingStatus = async (jobId: string): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/train/status/${jobId}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Get training status failed: ${response.statusText}`);
    }
    return response.json();
};
export const getTrainingStatus = withErrorHandler(_getTrainingStatus, 'Error getting training status');

const _getAllTrainingJobs = async (): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/train/jobs`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Get training jobs failed: ${response.statusText}`);
    }
    return response.json();
};
export const getAllTrainingJobs = withErrorHandler(_getAllTrainingJobs, 'Error getting all training jobs');

const _stopTraining = async (jobId: string): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/train/stop/${jobId}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Stop training failed: ${response.statusText}`);
    }
    return response.json();
};
export const stopTraining = withErrorHandler(_stopTraining, 'Error stopping training');

const _createTrainVastInstance = async (options: VastInstanceOptions = {}): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/train/instances`, {
        method: 'POST',
        body: JSON.stringify(options),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const createTrainVastInstance = withErrorHandler(_createTrainVastInstance, 'Failed to create vast instance for training');
