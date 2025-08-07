import { devLog } from '@/app/_common/utils/logger';

/**
 * Gemma3 4b SFT 훈련 시작 함수
 */
export const handleGemma3Training = (
    setBasicConfig: (config: any) => void,
    setModelConfig: (config: any) => void,
    setDataConfig: (config: any) => void,
    setTrainerConfig: (config: any) => void
) => {
    devLog.log('Gemma3 4b SFT 훈련 시작');
    console.log('Train Sample: Gemma3 4b SFT clicked');

    // basicConfig 설정 변경
    setBasicConfig((prev: any) => ({
        ...prev,
        project_name: 'test_gemma3-4b-sft',
        training_method: 'sft',
        hugging_face_token: '',
        minio_url: '',
        minio_access_key: '',
        minio_secret_key: '',
        minio_model_save_bucket: '',
        mlflow_run_id: 'test_gemma3-4b-sft',
        push_to_minio: false,
        hub_model_id: 'CocoRoF/gemma3-4b-sft-test',
        model_commit_msg: 'Initial commit for Gemma3 4b SFT training',
    }));

    // modelConfig 설정 변경
    setModelConfig((prev: any) => ({
        ...prev,
        model_name_or_path: 'google/gemma-3-4b-it',
        language_model_class: 'gemma3',
        tokenizer_max_len: 1024,
        use_attn_implementation: true,
        attn_implementation: 'eager',
    }));

    // dataConfig 설정 변경
    setDataConfig((prev: any) => ({
        ...prev,
        train_data: 'CocoRoF/electronic-commerce-law-questions-v2',
        train_data_split: 'train',
        dataset_main_column: 'instruction',
        dataset_sub_column: 'output',
        data_filtering: true,
        test_data_split: '',
    }));

    // trainerConfig 설정 변경
    setTrainerConfig((prev: any) => ({
        ...prev,
        use_sfttrainer: true,
        use_dpotrainer: false,
        use_ppotrainer: false,
        use_grpotrainer: false,
        use_custom_kl_sfttrainer: false,
        use_deepspeed: true,
        optim: 'adamw_torch',
        adam_beta1: 0.900,
        adam_beta2: 0.990,
        adam_epsilon: 1e-7,
        ddp_find_unused_parameters: true,
        ds_preset: 'zero-2',
        ds_stage2_bucket_size: 5e8,
        learning_rate: 1e-5,
        num_train_epochs: 3,
        per_device_train_batch_size: 4,
        gradient_accumulation_steps: 8,
        warmup_ratio: 0.1,
        weight_decay: 0.01,
        max_grad_norm: 1,
        bf16: true,
        fp16: false,
        gradient_checkpointing: true,
    }));
};

/**
 * Qwen3 4b SFT 훈련 시작 함수
 */
export const handleQwen3Training = (
    setBasicConfig: (config: any) => void,
    setModelConfig: (config: any) => void,
    setDataConfig: (config: any) => void,
    setTrainerConfig: (config: any) => void
) => {
    devLog.log('Qwen3 4b SFT 훈련 시작');
    console.log('Train Sample: Qwen3 4b SFT clicked');

    // basicConfig 설정 변경
    setBasicConfig((prev: any) => ({
        ...prev,
        project_name: 'test_qwen3-4b-sft',
        training_method: 'sft',
        minio_url: '',
        minio_access_key: '',
        minio_secret_key: '',
        minio_model_save_bucket: '',
        mlflow_run_id: 'test_qwen3-4b-sft',
        push_to_minio: false,
        hub_model_id: 'CocoRoF/qwen3-4b-sft-test',
        model_commit_msg: 'Initial commit for Qwen3 4b SFT training',
    }));

        // modelConfig 설정 변경
    setModelConfig((prev: any) => ({
        ...prev,
        model_name_or_path: 'Qwen/Qwen3-4B',
        language_model_class: 'qwen3',
        tokenizer_max_len: 1024,
        use_attn_implementation: true,
        attn_implementation: 'flash_attention_2',
    }));

    // dataConfig 설정 변경
    setDataConfig((prev: any) => ({
        ...prev,
        train_data: 'CocoRoF/electronic-commerce-law-questions-v2',
        train_data_split: 'train',
        dataset_main_column: 'instruction',
        dataset_sub_column: 'output',
        data_filtering: true,
        test_data_split: '',
    }));

    // trainerConfig 설정 변경
    setTrainerConfig((prev: any) => ({
        ...prev,
        use_sfttrainer: true,
        use_dpotrainer: false,
        use_ppotrainer: false,
        use_grpotrainer: false,
        use_custom_kl_sfttrainer: false,
        use_deepspeed: true,
        optim: 'adamw_torch',
        adam_beta1: 0.900,
        adam_beta2: 0.990,
        adam_epsilon: 1e-7,
        ddp_find_unused_parameters: true,
        ds_preset: 'zero-2',
        ds_stage2_bucket_size: 5e8,
        learning_rate: 1e-5,
        num_train_epochs: 3,
        per_device_train_batch_size: 4,
        gradient_accumulation_steps: 8,
        warmup_ratio: 0.1,
        weight_decay: 0.01,
        max_grad_norm: 1,
        bf16: true,
        fp16: false,
        gradient_checkpointing: true,
    }));
};
