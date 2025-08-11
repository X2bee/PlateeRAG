'use client';

import React, { useState } from 'react';
import { FiPlay, FiSettings, FiDatabase, FiCpu, FiBox } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { startTraining } from '@/app/api/trainAPI';
import { devLog } from '@/app/_common/utils/logger';
import { handleGemma3Training, handleQwen3Training } from './sampleHandler';
import BasicCategory from '@/app/model/components/Train/BasicCategory';
import ModelCategory from '@/app/model/components/Train/ModelCategory';
import DataCategory from '@/app/model/components/Train/DataCategory';
import TrainerCategory from '@/app/model/components/Train/TrainerCategory';
import styles from '@/app/model/assets/Train.module.scss';

const TrainPageContent: React.FC = () => {
    const [isTraining, setIsTraining] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'model' | 'data' | 'trainer'>('basic');

    // 기본(공통) 설정
    const [basicConfig, setBasicConfig] = useState({
        project_name: 'test-project',
        number_gpu: 1,
        training_method: 'cls',
        hugging_face_user_id: 'CocoRoF',
        hugging_face_token: '',
        minio_url: 'polar-store-api.x2bee.com',
        minio_access_key: '',
        minio_secret_key: '',
        minio_model_save_bucket: 'models',
        mlflow_url: 'https://polar-mlflow-git.x2bee.com/',
        mlflow_run_id: 'test',
        model_load_method: 'huggingface',
        push_to_hub: true,
        push_to_minio: true,
        hub_model_id: '',
        model_commit_msg: '',
        hub_strategy: 'checkpoint',
        output_dir: '',
        overwrite_output_dir: true,
        save_strategy: 'steps',
        save_steps: 1000,
        eval_strategy: 'steps',
        eval_steps: 1000,
        logging_steps: 10,
    });

    const [modelConfig, setModelConfig] = useState({
        model_load_method: 'huggingface', // 'huggingface' or 'minio'
        model_name_or_path: '',
        tokenizer_name: '',
        language_model_class: '',
        tokenizer_max_len: 256,
        minio_model_load_bucket: 'models',
        use_attn_implementation: true,
        attn_implementation: 'eager',
        ref_model_path: '',
        model_subfolder: '',
        config_name: '',
        cache_dir: '',
        is_resume: false,
    });

    // 데이터 관련 설정
    const [dataConfig, setDataConfig] = useState({
        dataset_load_method: 'huggingface', // 'huggingface' or 'minio'
        train_data: '',
        train_data_dir: '',
        train_data_split: 'train',
        test_data: '',
        test_data_dir: '',
        test_data_split: 'test',
        dataset_main_column: 'Input',
        dataset_sub_column: '',
        dataset_minor_column: '',
        dataset_last_column: '',
        train_test_split_ratio: 0.00,
        data_filtering: true,
        minio_data_load_bucket: 'data'
    });

    // 트레이너 관련 설정
    const [trainerConfig, setTrainerConfig] = useState({
        use_sfttrainer: false,
        use_dpotrainer: false,
        use_ppotrainer: false,
        use_grpotrainer: false,
        use_custom_kl_sfttrainer: false,
        use_deepspeed: false,
        ds_jsonpath: '',
        ds_stage3_sub_group_size: 1e9,
        ds_stage3_max_live_parameters: 1e6,
        ds_stage3_max_reuse_distance: 1e6,
        use_stableadamw: false,
        optim: 'adamw_torch',
        adam_beta1: 0.900,
        adam_beta2: 0.990,
        adam_epsilon: 1e-7,
        per_device_eval_batch_size: 4,
        ddp_find_unused_parameters: true,
        ds_preset: 'zero-2',
        ds_stage2_bucket_size: 5e8,
        learning_rate: 2e-5,
        num_train_epochs: 1,
        per_device_train_batch_size: 4,
        gradient_accumulation_steps: 16,
        warmup_ratio: 0.1,
        weight_decay: 0.01,
        max_grad_norm: 1,
        bf16: true,
        fp16: false,
        gradient_checkpointing: true,
        use_peft: false,
        peft_type: 'lora',
        lora_target_modules: '',
        lora_r: 8,
        lora_alpha: 16,
        lora_dropout: 0.05,
        lora_modules_to_save: '',
        adalora_init_r: 12,
        adalora_target_r: 4,
        adalora_tinit: 50,
        adalora_tfinal: 100,
        adalora_delta_t: 10,
        adalora_orth_reg_weight: 0.5,
        ia3_target_modules: '',
        feedforward_modules: '',
        adapter_layers: 30,
        adapter_len: 16,
        vera_target_modules: '',
        ln_target_modules: '',
        dpo_loss_type: 'sigmoid',
        dpo_beta: 0.1,
        dpo_label_smoothing: 0.0,
        mlm_probability: 0.2,
        num_labels: 17,
        st_pooling_mode: 'mean',
        st_dense_feature: 0,
        st_loss_func: 'CosineSimilarityLoss',
        st_evaluation: '',
        st_guide_model: 'nlpai-lab/KURE-v1',
        st_cache_minibatch: 16,
        st_triplet_margin: 5,
        st_cache_gist_temperature: 0.01,
        st_use_adaptivelayerloss: false,
        st_adaptivelayerloss_n_layer: 4
    });

    const toggleSection = (tab: 'basic' | 'model' | 'data' | 'trainer') => {
        setActiveTab(tab);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic':
                return (
                    <BasicCategory
                        basicConfig={basicConfig}
                        handleBasicConfigChange={handleBasicConfigChange}
                    />
                );

            case 'model':
                return (
                    <ModelCategory
                        modelConfig={modelConfig}
                        handleModelConfigChange={handleModelConfigChange}
                    />
                );

            case 'data':
                return (
                    <DataCategory
                        dataConfig={dataConfig}
                        handleDataConfigChange={handleDataConfigChange}
                    />
                );

            case 'trainer':
                return (
                    <TrainerCategory
                        trainerConfig={trainerConfig}
                        handleTrainerConfigChange={handleTrainerConfigChange}
                    />
                );

            default:
                return null;
        }
    };

    const handleBasicConfigChange = (key: string, value: any) => {
        setBasicConfig(prev => ({
            ...prev,
            [key]: value
        }));

        // training_method이 sft로 변경되면 use_sfttrainer를 자동으로 설정
        if (key === 'training_method' && value === 'sft') {
            setTrainerConfig(prev => ({
                ...prev,
                use_sfttrainer: true,
                use_dpotrainer: false,
                use_ppotrainer: false,
                use_grpotrainer: false,
                use_custom_kl_sfttrainer: false
            }));
        }
    };

    const handleModelConfigChange = (key: string, value: any) => {
        setModelConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleDataConfigChange = (key: string, value: any) => {
        setDataConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleTrainerConfigChange = (key: string, value: any) => {
        setTrainerConfig(prev => {
            const newConfig = {
                ...prev,
                [key]: value
            };

            // optim 값이 변경되면 use_stableadamw를 자동으로 설정
            if (key === 'optim') {
                newConfig.use_stableadamw = value === 'stable_adamw';
            }

            // BF16과 FP16은 상호 배타적
            if (key === 'bf16' && value === true) {
                newConfig.fp16 = false;
            } else if (key === 'fp16' && value === true) {
                newConfig.bf16 = false;
            }

            // 트레이너 타입들은 상호 배타적 (하나만 선택 가능)
            const trainerTypes = ['use_sfttrainer', 'use_dpotrainer', 'use_ppotrainer', 'use_grpotrainer', 'use_custom_kl_sfttrainer'];
            if (trainerTypes.includes(key) && value === true) {
                // 선택된 트레이너 외의 모든 트레이너를 false로 설정
                trainerTypes.forEach(trainerType => {
                    if (trainerType !== key) {
                        (newConfig as any)[trainerType] = false;
                    }
                });
            }

            return newConfig;
        });

        // training_method이 sft인 경우 use_sfttrainer를 자동으로 설정
        if (basicConfig.training_method === 'sft') {
            setTrainerConfig(prevTrainer => ({
                ...prevTrainer,
                use_sfttrainer: true,
                use_dpotrainer: false,
                use_ppotrainer: false,
                use_grpotrainer: false,
                use_custom_kl_sfttrainer: false
            }));
        }
    };

    const handleStartTraining = async () => {
        if (!modelConfig.model_name_or_path) {
            toast.error('모델 경로를 입력해주세요.');
            return;
        }

        if (!dataConfig.train_data) {
            toast.error('훈련 데이터를 입력해주세요.');
            return;
        }

        setIsTraining(true);

        try {
            const allParams = {
                ...basicConfig,
                ...modelConfig,
                ...dataConfig,
                ...trainerConfig,
                save_total_limit: 1,
                do_train: true,
                do_eval: true
            };

            devLog.info('Starting training with params:', allParams);

            const result = await startTraining(allParams);

            toast.success('훈련이 시작되었습니다!');
            devLog.info('Training started successfully:', result);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`훈련 시작 실패: ${errorMessage}`);
            devLog.error('Failed to start training:', error);
        } finally {
            setIsTraining(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.contentArea}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h2>모델 훈련 설정</h2>
                        <p>모델 훈련을 위한 파라미터를 설정하고 훈련을 시작하세요.</p>
                    </div>
                </div>

                {/* 탭 네비게이션 */}
                <div className={styles.tabNavigation}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'basic' ? styles.active : ''}`}
                        onClick={() => setActiveTab('basic')}
                    >
                        <FiSettings />
                        기본 설정
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'model' ? styles.active : ''}`}
                        onClick={() => setActiveTab('model')}
                    >
                        <FiBox />
                        모델 설정
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'data' ? styles.active : ''}`}
                        onClick={() => setActiveTab('data')}
                    >
                        <FiDatabase />
                        데이터 설정
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'trainer' ? styles.active : ''}`}
                        onClick={() => setActiveTab('trainer')}
                    >
                        <FiCpu />
                        트레이너 설정
                    </button>
                </div>

                {/* 탭 컨텐츠 */}
                <div className={styles.configWrapper}>
                    {renderTabContent()}

                    {/* 훈련 시작 버튼 */}
                    <div className={styles.formActions}>
                        <div className={styles.sampleWrapper}>
                            <button
                                onClick={() => handleGemma3Training(setBasicConfig, setModelConfig, setDataConfig, setTrainerConfig)}
                                disabled={isTraining}
                                className={`${styles.button} ${styles.third} ${styles.large}`}
                            >
                                <>
                                    <FiPlay className={styles.icon} />
                                    Train Sample: Gemma3 4b SFT
                                </>
                            </button>
                            <button
                                onClick={() => handleQwen3Training(setBasicConfig, setModelConfig, setDataConfig, setTrainerConfig)}
                                disabled={isTraining}
                                className={`${styles.button} ${styles.third} ${styles.large}`}
                            >
                                <>
                                    <FiPlay className={styles.icon} />
                                    Train Sample: Qwen3 4b SFT
                                </>
                            </button>
                        </div>
                        <button
                            onClick={handleStartTraining}
                            disabled={isTraining}
                            className={`${styles.button} ${styles.primary} ${styles.large}`}
                        >
                            {isTraining ? (
                                <>
                                    <div className={styles.spinner} />
                                    훈련 시작 중...
                                </>
                            ) : (
                                <>
                                    <FiPlay className={styles.icon} />
                                    훈련 시작
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainPageContent;
