// lib/api/evaluationApi.js
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/api/apiClient';

/**
 * 평가 API 호출 함수들을 관리하는 클래스
 */
export class EvaluationAPI {
  static buildParams(params) {
    const urlParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlParams.append(key, value.toString());
      }
    });
    return urlParams.toString();
  }

  /**
   * 태스크 그룹을 로드하는 함수
   * @returns {Promise<Object>} 태스크 그룹 정보
   */
  static async loadTaskGroups() {
    try {
      const response = await fetch('/task.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      devLog.error('Failed to load task groups:', error);
      throw error;
    }
  }

  /**
   * Minio 아이템들(모델 또는 데이터셋)을 로드하는 함수
   * @param {string} type - 'model' 또는 'dataset'
   * @returns {Promise<Array>} 모델 또는 데이터셋 정보 배열
   */
  static async loadMinioItems(type) {
    try {
      // 환경변수 직접 사용
      const bucketName = type === 'model' 
        ? process.env.NEXT_PUBLIC_MINIO_MODEL_BUCKET 
        : process.env.NEXT_PUBLIC_MINIO_DATA_BUCKET;
      
      const params = this.buildParams({
        bucket_name: bucketName,
        hugging_face_user_id: process.env.NEXT_PUBLIC_HUGGING_FACE_USER_ID,
        hugging_face_token: process.env.NEXT_PUBLIC_HUGGING_FACE_TOKEN,
        minio_url: process.env.NEXT_PUBLIC_MINIO_URL,
        minio_access_key: process.env.NEXT_PUBLIC_MINIO_ACCESS_KEY,
        minio_secret_key: process.env.NEXT_PUBLIC_MINIO_SECRET_KEY
      });

      const response = await apiClient(`${API_BASE_URL}/api/loader/minio/subfolders?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      if (responseData.status === "success" && Array.isArray(responseData.data)) {
        return responseData.data;
      } else {
        return [];
      }
    } catch (error) {
      devLog.error(`Failed to load ${type}s:`, error);
      throw error;
    }
  }

  /**
   * 데이터셋 정보를 가져오는 함수
   * @param {string} datasetName - 데이터셋 이름
   * @returns {Promise<Array>} 컬럼 정보 배열
   */
  static async fetchDatasetInfo(datasetName) {
    try {
      const params = this.buildParams({
        dataset_name: datasetName,
        bucket_name: process.env.NEXT_PUBLIC_MINIO_DATA_BUCKET,
        return_origin: true,
        hugging_face_user_id: process.env.NEXT_PUBLIC_HUGGING_FACE_USER_ID,
        hugging_face_token: process.env.NEXT_PUBLIC_HUGGING_FACE_TOKEN,
        minio_url: process.env.NEXT_PUBLIC_MINIO_URL,
        minio_access_key: process.env.NEXT_PUBLIC_MINIO_ACCESS_KEY,
        minio_secret_key: process.env.NEXT_PUBLIC_MINIO_SECRET_KEY
      });

      const response = await apiClient(`${API_BASE_URL}/api/loader/minio/dataset/info?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
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
    } catch (error) {
      devLog.error('Failed to fetch dataset info:', error);
      throw error;
    }
  }

  /**
   * 모든 평가 결과를 로드하는 함수
   * @returns {Promise<Object>} 평가 작업 정보
   */
  static async loadEvalResults() {
    try {
      const response = await apiClient(`${API_BASE_URL}/api/eval`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 각 작업 객체에 job_id 필드 추가
      const jobs = {};
      Object.keys(data).forEach(jobId => {
        const jobData = data[jobId];
        jobData.job_id = jobId;
        jobs[jobId] = jobData;
      });
      
      return jobs;
    } catch (error) {
      devLog.error('Failed to load evaluation results:', error);
      throw error;
    }
  }

  /**
   * 평가를 실행하는 함수
   * @param {Object} requestBody - 평가 요청 데이터
   * @returns {Promise<Object>} 평가 실행 결과
   */
  static async runEvaluation(requestBody) {
    try {
      const response = await apiClient(`${API_BASE_URL}/api/eval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || '평가 실행에 실패했습니다');
      }
      
      return response.json();
    } catch (error) {
      devLog.error('Failed to run evaluation:', error);
      throw error;
    }
  }

  /**
   * 평가 작업 상세 정보를 가져오는 함수
   * @param {string} jobId - 작업 ID
   * @returns {Promise<Object>} 평가 작업 상세 정보
   */
  static async getEvaluationDetails(jobId) {
    try {
      const response = await apiClient(`${API_BASE_URL}/api/eval/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.job_id) {
        throw new Error('작업 상세 정보가 없습니다.');
      }
      
      return data;
    } catch (error) {
      devLog.error('Failed to get evaluation details:', error);
      throw error;
    }
  }
}

/**
 * 평가 작업을 삭제하는 함수
 * @param {string} jobId - 작업 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteEvaluationJob = async (jobId) => {
  try {
    const response = await apiClient(`${API_BASE_URL}/api/eval/${jobId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete evaluation job');
    }

    return response.json();
  } catch (error) {
    devLog.error('Failed to delete evaluation job:', error);
    throw error;
  }
};

/**
 * 여러 평가 작업을 일괄 삭제하는 함수
 * @param {Array<string>} jobIds - 작업 ID 배열
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteMultipleEvaluationJobs = async (jobIds) => {
  try {
    const queryParams = jobIds.map(id => `job_ids=${encodeURIComponent(id)}`).join('&');
    const response = await apiClient(`${API_BASE_URL}/api/eval?${queryParams}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete evaluation jobs');
    }

    return response.json();
  } catch (error) {
    devLog.error('Failed to delete multiple evaluation jobs:', error);
    throw error;
  }
};

/**
 * 평가 작업 상태를 새로고침하는 함수
 * @returns {Promise<Object>} 새로고침된 평가 작업 정보
 */
export const refreshEvaluationJobs = async () => {
  try {
    devLog.info('Refreshing evaluation jobs...');
    const jobs = await EvaluationAPI.loadEvalResults();
    devLog.info('Evaluation jobs refreshed successfully');
    return jobs;
  } catch (error) {
    devLog.error('Failed to refresh evaluation jobs:', error);
    throw error;
  }
};

/**
 * 평가 작업을 상태별로 필터링하는 함수 (클라이언트 필터링)
 * @param {string} status - 상태 ('running', 'completed', 'failed' 등)
 * @returns {Promise<Object>} 필터링된 평가 작업 정보
 */
export const fetchEvaluationJobsByStatus = async (status) => {
  try {
    const allJobs = await EvaluationAPI.loadEvalResults();
    const filteredJobs = {};

    for (const [jobId, job] of Object.entries(allJobs)) {
      if (job.status === status) {
        filteredJobs[jobId] = job;
      }
    }

    return filteredJobs;
  } catch (error) {
    devLog.error('Failed to fetch evaluation jobs by status:', error);
    throw error;
  }
};

/**
 * 평가 작업 연결 테스트를 수행하는 함수
 * @param {string} jobId - 작업 ID
 * @returns {Promise<Object>} 테스트 결과
 */
export const testEvaluationConnection = async (jobId) => {
  try {
    devLog.info(`Testing connection for job ${jobId}...`);

    // 실제 연결 테스트 로직 (백엔드 엔드포인트가 있는 경우)
    const job = await EvaluationAPI.getEvaluationDetails(jobId);
    
    return {
      success: true,
      message: `평가 작업 ${jobId} 연결 테스트가 완료되었습니다.`,
      jobId: jobId,
      status: job.status,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    devLog.error('Failed to test evaluation connection:', error);
    return {
      success: false,
      message: '연결 테스트에 실패했습니다.',
      jobId: jobId,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * 모든 평가 작업 정보를 저장하는 함수 (백엔드에 저장 API가 있는 경우)
 * @returns {Promise<Object>} 저장 결과
 */
export const saveEvaluationJobs = async () => {
  try {
    const response = await apiClient(`${API_BASE_URL}/api/eval/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    devLog.error('Failed to save evaluation jobs:', error);
    throw error;
  }
};