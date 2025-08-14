import { devLog } from '@/app/_common/utils/logger';
import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/api/apiClient';

// It would be good to have a central place for these types, e.g., src/types/evaluation.ts
export interface TaskGroup { 
    // Define structure based on task.json
    [key: string]: any; 
}

export interface MinioItem {
    // Define structure for items from Minio
    [key: string]: any;
}

export interface DatasetInfo {
    // Define structure for dataset info
    [key: string]: any;
}

export interface EvalResult {
    job_id: string;
    status: 'running' | 'completed' | 'failed';
    [key: string]: any;
}

export interface EvalResultsCollection {
    [jobId: string]: EvalResult;
}


/**
 * 평가 API 호출 함수들을 관리하는 클래스
 */
export class EvaluationAPI {
  static buildParams(params: Record<string, any>): string {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlParams.append(key, value.toString());
      }
    });
    return urlParams.toString();
  }

  static async loadTaskGroups(): Promise<TaskGroup> {
    const response = await fetch('/task.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  static async loadMinioItems(type: 'model' | 'dataset'): Promise<MinioItem[]> {
    const bucketName = type === 'model' 
      ? process.env.NEXT_PUBLIC_MINIO_MODEL_BUCKET 
      : process.env.NEXT_PUBLIC_MINIO_DATA_BUCKET;
    
    const params = this.buildParams({
      bucket_name: bucketName,
      // ... other params
    });

    const response = await apiClient(`${API_BASE_URL}/api/loader/minio/subfolders?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const responseData = await response.json();
    return (responseData.status === "success" && Array.isArray(responseData.data)) ? responseData.data : [];
  }

  static async fetchDatasetInfo(datasetName: string): Promise<DatasetInfo[]> {
      const params = this.buildParams({ dataset_name: datasetName, /* ... */ });
      const response = await apiClient(`${API_BASE_URL}/api/loader/minio/dataset/info?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseData = await response.json();
      // Parsing logic remains, but with types it would be safer
      if (responseData.status === "success" && responseData.data?.default) {
        const fetchedInfo = responseData.data;
        const splitKeys = Object.keys(fetchedInfo.default);
        if (splitKeys.length > 0) {
          const columnSourceKey = splitKeys.includes('train') ? 'train' : splitKeys[0];
          const columnSource = fetchedInfo.default[columnSourceKey];
          if (Array.isArray(columnSource) && columnSource.length > 0) {
            return columnSource;
          }
        }
      }
      return [];
  }

  static async loadEvalResults(): Promise<EvalResultsCollection> {
    const response = await apiClient(`${API_BASE_URL}/api/eval`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const jobs: EvalResultsCollection = {};
    Object.keys(data).forEach(jobId => {
      const jobData = data[jobId];
      jobData.job_id = jobId;
      jobs[jobId] = jobData;
    });
    return jobs;
  }

  static async runEvaluation(requestBody: any): Promise<any> {
    const response = await apiClient(`${API_BASE_URL}/api/eval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '평가 실행에 실패했습니다');
    }
    return response.json();
  }

  static async getEvaluationDetails(jobId: string): Promise<EvalResult> {
    const response = await apiClient(`${API_BASE_URL}/api/eval/${jobId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data || !data.job_id) {
      throw new Error('작업 상세 정보가 없습니다.');
    }
    return data;
  }
}

// Wrap static methods with error handlers
EvaluationAPI.loadTaskGroups = withErrorHandler(EvaluationAPI.loadTaskGroups, 'Failed to load task groups');
EvaluationAPI.loadMinioItems = withErrorHandler(EvaluationAPI.loadMinioItems, 'Failed to load minio items');
EvaluationAPI.fetchDatasetInfo = withErrorHandler(EvaluationAPI.fetchDatasetInfo, 'Failed to fetch dataset info');
EvaluationAPI.loadEvalResults = withErrorHandler(EvaluationAPI.loadEvalResults, 'Failed to load evaluation results');
EvaluationAPI.runEvaluation = withErrorHandler(EvaluationAPI.runEvaluation, 'Failed to run evaluation');
EvaluationAPI.getEvaluationDetails = withErrorHandler(EvaluationAPI.getEvaluationDetails, 'Failed to get evaluation details');


const _deleteEvaluationJob = async (jobId: string): Promise<any> => {
  const response = await apiClient(`${API_BASE_URL}/api/eval/${jobId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete evaluation job');
  }
  return response.json();
};
export const deleteEvaluationJob = withErrorHandler(_deleteEvaluationJob, 'Failed to delete evaluation job');

const _deleteMultipleEvaluationJobs = async (jobIds: string[]): Promise<any> => {
  const queryParams = jobIds.map(id => `job_ids=${encodeURIComponent(id)}`).join('&');
  const response = await apiClient(`${API_BASE_URL}/api/eval?${queryParams}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete evaluation jobs');
  }
  return response.json();
};
export const deleteMultipleEvaluationJobs = withErrorHandler(_deleteMultipleEvaluationJobs, 'Failed to delete multiple evaluation jobs');

export const refreshEvaluationJobs = withErrorHandler(EvaluationAPI.loadEvalResults, 'Failed to refresh evaluation jobs');

const _fetchEvaluationJobsByStatus = async (status: string): Promise<EvalResultsCollection> => {
  const allJobs = await EvaluationAPI.loadEvalResults();
  const filteredJobs: EvalResultsCollection = {};
  for (const [jobId, job] of Object.entries(allJobs)) {
    if (job.status === status) {
      filteredJobs[jobId] = job;
    }
  }
  return filteredJobs;
};
export const fetchEvaluationJobsByStatus = withErrorHandler(_fetchEvaluationJobsByStatus, 'Failed to fetch evaluation jobs by status');
