import { devLog } from '@/app/_common/utils/logger';
import { apiClient } from '@/app/api/apiClient.js';
import { API_BASE_URL } from '@/app/config.js';

/**
 * 훈련 작업을 시작합니다.
 * @param {Object} params - 훈련 파라미터 객체
 * @returns {Promise<Object>} 훈련 작업 시작 결과
 */
export const startTraining = async (params) => {
    const defaultParams = {
        // Common settings
        number_gpu: 1,
        project_name: 'test-project',
        training_method: 'cls',
        model_load_method: 'huggingface',
        dataset_load_method: 'huggingface',
        hugging_face_user_id: 'CocoRoF',
        hugging_face_token: '',
        mlflow_url: 'https://polar-mlflow-git.x2bee.com/',
        mlflow_run_id: 'test',
        minio_url: 'polar-store-api.x2bee.com',
        minio_access_key: '',
        minio_secret_key: '',

        // DeepSpeed settings
        use_deepspeed: false,
        ds_jsonpath: '',
        ds_preset: 'zero-2',
        ds_stage2_bucket_size: 5e8,
        ds_stage3_sub_group_size: 1e9,
        ds_stage3_max_live_parameters: 1e6,
        ds_stage3_max_reuse_distance: 1e6,

        // Model settings
        model_name_or_path: '',
        language_model_class: 'none',
        ref_model_path: '',
        model_subfolder: '',
        config_name: '',
        tokenizer_name: '',
        cache_dir: '',

        // Data settings
        train_data: '',
        train_data_dir: '',
        train_data_split: 'train',
        test_data: '',
        test_data_dir: '',
        test_data_split: 'test',

        // Dataset column settings
        dataset_main_column: 'instruction',
        dataset_sub_column: 'output',
        dataset_minor_column: '',
        dataset_last_column: '',

        // Push settings
        push_to_hub: true,
        push_to_minio: true,
        minio_model_load_bucket: 'models',
        minio_model_save_bucket: 'models',
        minio_data_load_bucket: 'data',

        // Training specific settings
        use_sfttrainer: false,
        use_dpotrainer: false,
        use_ppotrainer: false,
        use_grpotrainer: false,
        use_custom_kl_sfttrainer: false,
        mlm_probability: 0.2,
        num_labels: 17,

        // DPO Setting
        dpo_loss_type: 'sigmoid',
        dpo_beta: 0.1,
        dpo_label_smoothing: 0.0,

        // Sentence transformer settings
        st_pooling_mode: 'mean',
        st_dense_feature: 0,
        st_loss_func: 'CosineSimilarityLoss',
        st_evaluation: '',
        st_guide_model: 'nlpai-lab/KURE-v1',
        st_cache_minibatch: 16,
        st_triplet_margin: 5,
        st_cache_gist_temperature: 0.01,
        st_use_adaptivelayerloss: false,
        st_adaptivelayerloss_n_layer: 4,

        // Other settings
        use_attn_implementation: true,
        attn_implementation: 'eager',
        is_resume: false,
        model_commit_msg: 'large-try',
        train_test_split_ratio: 0.05,
        data_filtering: true,
        tokenizer_max_len: 256,
        output_dir: '',
        overwrite_output_dir: true,

        // Optimizer settings
        use_stableadamw: true,
        optim: 'adamw_torch',
        adam_beta1: 0.900,
        adam_beta2: 0.990,
        adam_epsilon: 1e-7,

        // Saving and evaluation settings
        save_strategy: 'steps',
        save_steps: 1000,
        eval_strategy: 'steps',
        eval_steps: 1000,
        save_total_limit: 1,
        hub_model_id: '',
        hub_strategy: 'checkpoint',

        // Logging and training settings
        logging_steps: 5,
        max_grad_norm: 1,
        per_device_train_batch_size: 4,
        per_device_eval_batch_size: 4,
        gradient_accumulation_steps: 16,
        ddp_find_unused_parameters: true,
        learning_rate: 2e-5,
        gradient_checkpointing: true,
        num_train_epochs: 1,
        warmup_ratio: 0.1,
        weight_decay: 0.01,
        do_train: true,
        do_eval: true,
        bf16: true,
        fp16: false,

        // PEFT settings
        use_peft: false,
        peft_type: 'lora',

        // For LoRA
        lora_target_modules: '',
        lora_r: 8,
        lora_alpha: 16,
        lora_dropout: 0.05,
        lora_modules_to_save: '',

        // For AdaLoRA
        adalora_init_r: 12,
        adalora_target_r: 4,
        adalora_tinit: 50,
        adalora_tfinal: 100,
        adalora_delta_t: 10,
        adalora_orth_reg_weight: 0.5,

        // For IA3
        ia3_target_modules: '',
        feedforward_modules: '',

        // For LlamaAdapter
        adapter_layers: 30,
        adapter_len: 16,

        // For Vera
        vera_target_modules: '',

        // For LayerNorm Tuning
        ln_target_modules: ''
    };

    // 기본값과 사용자 입력을 병합
    const mergedParams = { ...defaultParams, ...params };

    try {
        const response = await apiClient(`${API_BASE_URL}/api/train/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mergedParams),
        });

        if (!response.ok) {
            throw new Error(`Training start failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error starting training:', error);
        throw error;
    }
};

/**
 * MLflow 정보를 조회합니다.
 * @param {Object} params - MLflow 파라미터 객체
 * @param {string} params.mlflow_url - MLflow URL (기본값: "https://polar-mlflow-git.x2bee.com/")
 * @param {string} params.mlflow_exp_id - MLflow Experiment ID (기본값: "test")
 * @param {string} params.mlflow_run_id - MLflow Run ID (기본값: "test")
 * @returns {Promise<Object>} MLflow 정보
 */
export const getMLflow = async (params = {}) => {
    const defaultParams = {
        mlflow_url: 'https://polar-mlflow-git.x2bee.com/',
        mlflow_exp_id: 'test',
        mlflow_run_id: 'test'
    };

    const mergedParams = { ...defaultParams, ...params };

    try {
        const response = await apiClient(`${API_BASE_URL}/api/train/mlflow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mergedParams),
        });

        if (!response.ok) {
            throw new Error(`Get MLflow info failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting MLflow info:', error);
        throw error;
    }
};

/**
 * 특정 훈련 작업의 상태를 조회합니다.
 * @param {string} jobId - 작업 ID
 * @returns {Promise<Object>} 작업 상태 정보
 */
export const getTrainingStatus = async (jobId) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/train/status/${jobId}`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Get training status failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting training status:', error);
        throw error;
    }
};

/**
 * 모든 훈련 작업의 목록을 조회합니다.
 * @returns {Promise<Object>} 모든 작업 목록
 */
export const getAllTrainingJobs = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/train/jobs`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Get training jobs failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting training jobs:', error);
        throw error;
    }
};

/**
 * 특정 훈련 작업을 중지합니다.
 * @param {string} jobId - 작업 ID
 * @returns {Promise<Object>} 작업 중지 결과
 */
export const stopTraining = async (jobId) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/train/stop/${jobId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Stop training failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error stopping training:', error);
        throw error;
    }
};

/**
 * 새 인스턴스 생성 API
 * @param {Object} options - 인스턴스 생성 옵션
 * @param {string} [options.offer_id] - 특정 오퍼 ID
 * @param {Object} [options.offer_info] - 특정 오퍼 정보
 * @param {string} [options.hf_hub_token] - HuggingFace 토큰
 * @param {string} [options.template_name] - 템플릿 이름 (budget, high_performance, research)
 * @param {boolean} [options.auto_destroy] - 자동 삭제 여부
 * @param {Object} [options.vllm_config] - VLLM 설정
 * @returns {Promise<Object>} 생성 결과
 */
export const createTrainVastInstance = async (options = {}) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/train/instances`, {
            method: 'POST',
            body: JSON.stringify(options),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast instance created:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to create vast instance:', error);
        throw error;
    }
};
