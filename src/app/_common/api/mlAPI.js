// /app/_common/api/mlAPI.js
const getMLApiBaseUrl = () => {
    const host = process.env.NEXT_PUBLIC_ML_API_HOST;
    const port = process.env.NEXT_PUBLIC_ML_API_PORT;
    
    console.log('ML API URL environment variables:', host, port);

    if (host && port) {
        const protocol = host.startsWith('http') ? '' : 'http://';
        return `${protocol}${host}:${port}`;
    }

    return process.env.NEXT_PUBLIC_ML_API_URL || 'https://xgen-ml.x2bee.com';
};

const ML_API_BASE_URL = getMLApiBaseUrl();

async function apiCall(endpoint, options = {}) {
    const url = `${ML_API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'text/plain',
            ...options.headers,
        },
        mode: 'cors',
    };

    const response = await fetch(url, {
        ...defaultOptions,
        ...options,
    });

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorData.detail || errorData.message || errorMessage;
        } catch {
            // JSON 파싱 실패 시 기본 메시지 사용
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
    }

    return response.json();
}

export const mlAPI = {
    // 동기 학습
    trainSync: async (data) => {
        return apiCall('/api/training/sync', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // 비동기 학습
    trainAsync: async (data) => {
        return apiCall('/api/training/async', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // 비동기 태스크 상태 조회
    getAsyncTaskStatus: async (taskId) => {
        return apiCall(`/api/training/task/${taskId}/status`);
    },

    // MLflow run 상태 조회
    getTrainingStatus: async (runId) => {
        return apiCall(`/api/training/run/${runId}/status`);
    },

    // 실험 목록 조회
    getExperiments: async () => {
        return apiCall('/api/training/experiments');
    },

    // 모델 카탈로그 조회
    getModelCatalog: async (task = null, includeDetails = true) => {
        const params = new URLSearchParams();
        if (task) params.append('task', task);
        params.append('include_details', includeDetails.toString());
        
        return apiCall(`/api/models/catalog?${params.toString()}`);
    },
    

    // 특정 태스크 모델들 조회
    getModelsForTask: async (task) => {
        return apiCall(`/api/models/catalog/${task}`);
    },

    // 모델 상세 정보
    getModelDetails: async (task, modelName) => {
        return apiCall(`/api/models/catalog/${task}/${modelName}`);
    },

    // 모델 선택 검증
    validateModelSelection: async (data) => {
        return apiCall('/api/models/validate', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // 예측 관련
    predict: async (modelId, records) => {
        return apiCall(`/api/predict/${modelId}`, {
            method: 'POST',
            body: JSON.stringify(records),
        });
    },

    predictBatch: async (modelId, records) => {
        return apiCall(`/api/predict/${modelId}/batch`, {
            method: 'POST',
            body: JSON.stringify(records),
        });
    },

    getModelInfo: async (modelId) => {
        return apiCall(`/api/predict/${modelId}/info`);
    },

    validateInputSchema: async (modelId, sampleRecord) => {
        return apiCall(`/api/predict/${modelId}/validate`, {
            method: 'POST',
            body: JSON.stringify(sampleRecord),
        });
    },

    // 캐시 관리
    getCacheStats: async () => {
        return apiCall('/api/cache/stats');
    },

    invalidateModelCache: async (modelId) => {
        return apiCall(`/api/cache/models/${modelId}`, {
            method: 'DELETE',
        });
    },

    clearAllCache: async () => {
        return apiCall('/api/cache/clear', {
            method: 'DELETE',
        });
    },
};

export const mlUtils = {
    formatError: (error) => {
        if (typeof error === 'string') return error;
        
        if (error && typeof error === 'object') {
            if (error.message) return error.message;
            if (error.detail) return error.detail;
        }
        
        return '알 수 없는 오류가 발생했습니다.';
    },

    formatDuration: (seconds) => {
        if (seconds < 60) return `${seconds.toFixed(1)}초`;
        if (seconds < 3600) return `${(seconds / 60).toFixed(1)}분`;
        return `${(seconds / 3600).toFixed(1)}시간`;
    },

    formatMetric: (value, decimals = 4) => {
        return value.toFixed(decimals);
    },

    validateTrainConfig: (config) => {
        const errors = [];

        if (!config.model_id?.trim()) {
            errors.push('모델 ID를 입력해주세요.');
        }

        // 데이터 소스 검증
        if (config.use_mlflow_dataset) {
            // MLflow 데이터셋 사용 시
            if (!config.mlflow_run_id?.trim()) {
                errors.push('MLflow 데이터셋을 선택해주세요.');
            }
        } else {
            // HuggingFace 데이터셋 사용 시
            if (!config.hf_repo?.trim()) {
                errors.push('HuggingFace 레포지토리를 입력해주세요.');
            }
            if (!config.hf_filename?.trim()) {
                errors.push('데이터 파일명을 입력해주세요.');
            }
        }

        if (!config.target_column?.trim()) {
            errors.push('타겟 컬럼을 입력해주세요.');
        }

        if (!config.model_names || config.model_names.length === 0) {
            errors.push('최소 하나의 모델을 선택해주세요.');
        }

        if (config.test_size && (config.test_size <= 0 || config.test_size >= 1)) {
            errors.push('테스트 셋 비율은 0과 1 사이의 값이어야 합니다.');
        }

        if (config.validation_size && (config.validation_size < 0 || config.validation_size >= 1)) {
            errors.push('검증 셋 비율은 0 이상 1 미만의 값이어야 합니다.');
        }

        if (config.use_cv && config.cv_folds && config.cv_folds < 2) {
            errors.push('교차 검증 폴드 수는 2 이상이어야 합니다.');
        }

        // HPO 검증
        if (config.hpo_config && config.hpo_config.enable_hpo) {
            if (config.hpo_config.n_trials && (config.hpo_config.n_trials < 10 || config.hpo_config.n_trials > 500)) {
                errors.push('HPO 시도 횟수는 10~500 사이여야 합니다.');
            }
            
            if (config.hpo_config.timeout_minutes && config.hpo_config.timeout_minutes > 120) {
                errors.push('HPO 타임아웃은 120분을 초과할 수 없습니다.');
            }
        }

        return errors;
    },

    createDefaultConfig: () => ({
        model_id: '',
        task: 'classification',
        test_size: 0.2,
        validation_size: 0.1,
        use_cv: false,
        cv_folds: 5,
        // HuggingFace
        hf_repo: '',
        hf_filename: '',
        hf_revision: null,
        // MLflow (추가)
        use_mlflow_dataset: false,
        mlflow_run_id: null,
        mlflow_experiment_name: null,
        mlflow_artifact_path: 'dataset',
        // 나머지
        target_column: '',
        feature_columns: null,
        model_names: [],
        overrides: null,
        hpo_config: {
            enable_hpo: false,
            n_trials: 50,
            timeout_minutes: null,
            param_spaces: null
        }
    }),
};

export const ML_DEFAULTS = {
    test_size: 0.2,
    validation_size: 0.1,
    use_cv: false,
    cv_folds: 5,
    task: 'classification',
    
    availableModels: {
        classification: [
            { name: 'logistic_regression', label: '로지스틱 회귀', description: '선형 분류기, 빠르고 해석 가능' },
            { name: 'svm', label: 'SVM', description: '서포트 벡터 머신, 고차원 데이터에 효과적' },
            { name: 'random_forest', label: '랜덤 포레스트', description: '앙상블 방법, 과적합에 강함' },
            { name: 'gradient_boosting', label: '그래디언트 부스팅', description: '순차적 앙상블, 높은 성능' },
            { name: 'xgboost', label: 'XGBoost', description: 'Extreme Gradient Boosting, 최고 성능' },
        ],
        regression: [
            { name: 'linear_regression', label: '선형 회귀', description: '기본 선형 모델, 해석 가능' },
            { name: 'ridge', label: 'Ridge 회귀', description: 'L2 정규화, 과적합 방지' },
            { name: 'lasso', label: 'Lasso 회귀', description: 'L1 정규화, 피처 선택 효과' },
            { name: 'random_forest', label: '랜덤 포레스트', description: '앙상블 방법, 비선형 관계 모델링' },
            { name: 'xgboost', label: 'XGBoost', description: 'Extreme Gradient Boosting, 최고 성능' },
        ],
    },
};