'use client';

import React, { useState } from 'react';
import { FiPlay, FiSettings, FiDatabase, FiCpu, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { startTraining } from '@/app/api/trainAPI';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/model/assets/Train.module.scss';

const TrainPageContent: React.FC = () => {
    const [isTraining, setIsTraining] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        data: false,
        trainer: false
    });

    // 기본(공통) 설정
    const [basicConfig, setBasicConfig] = useState({
        number_gpu: 1,
        project_name: 'test-project',
        training_method: 'cls',
        model_load_method: 'huggingface',
        dataset_load_method: 'huggingface',
        model_name_or_path: '',
        language_model_class: 'none',
        hugging_face_user_id: 'CocoRoF',
        hugging_face_token: '',
        mlflow_url: 'https://polar-mlflow-git.x2bee.com/',
        mlflow_run_id: 'test',
        minio_url: 'polar-store-api.x2bee.com',
        minio_access_key: '',
        minio_secret_key: '',
        use_deepspeed: false,
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
        save_strategy: 'steps',
        save_steps: 1000,
        eval_strategy: 'steps',
        eval_steps: 1000,
        logging_steps: 5
    });

    // 데이터 관련 설정
    const [dataConfig, setDataConfig] = useState({
        train_data: '',
        train_data_dir: '',
        train_data_split: 'train',
        test_data: '',
        test_data_dir: '',
        test_data_split: 'test',
        dataset_main_colunm: 'goods_nm',
        dataset_sub_colunm: 'label',
        dataset_minor_colunm: '',
        dataset_last_colunm: '',
        dataset_main_column: 'instruction',
        dataset_sub_column: 'output',
        dataset_minor_column: '',
        tokenizer_max_len: 256,
        train_test_split_ratio: 0.05,
        data_filtering: true,
        push_to_hub: true,
        push_to_minio: true,
        minio_model_load_bucket: 'models',
        minio_model_save_bucket: 'models',
        minio_data_load_bucket: 'data'
    });

    // 트레이너 관련 설정
    const [trainerConfig, setTrainerConfig] = useState({
        use_sfttrainer: false,
        use_dpotrainer: false,
        use_ppotrainer: false,
        use_grpotrainer: false,
        use_custom_kl_sfttrainer: false,
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

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleBasicConfigChange = (key: string, value: any) => {
        setBasicConfig(prev => ({
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
        setTrainerConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleStartTraining = async () => {
        if (!basicConfig.model_name_or_path) {
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
                ...dataConfig,
                ...trainerConfig,
                // 추가 기본값들
                ref_model_path: '',
                model_subfolder: '',
                config_name: '',
                tokenizer_name: '',
                cache_dir: '',
                ds_jsonpath: '',
                ds_stage3_sub_group_size: 1e9,
                ds_stage3_max_live_parameters: 1e6,
                ds_stage3_max_reuse_distance: 1e6,
                use_attn_implementation: true,
                attn_implementation: 'eager',
                is_resume: false,
                model_commit_msg: 'large-try',
                output_dir: '',
                overwrite_output_dir: true,
                use_stableadamw: true,
                optim: 'adamw_torch',
                adam_beta1: 0.900,
                adam_beta2: 0.990,
                adam_epsilon: 1e-7,
                per_device_eval_batch_size: 4,
                ddp_find_unused_parameters: true,
                save_total_limit: 1,
                hub_model_id: '',
                hub_strategy: 'checkpoint',
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
        <div className={styles.trainContainer}>
            <h2 className={styles.pageTitle}>
                <FiCpu className={styles.pageIcon} />
                모델 훈련 설정
            </h2>

            {/* 기본(공통) 설정 섹션 */}
            <div className={`${styles.configGroup} ${styles.basicSection}`}>
                <div
                    className={styles.configGroupHeader}
                    onClick={() => toggleSection('basic')}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FiSettings className={styles.sectionIcon} />
                        <span>기본(공통) 설정</span>
                    </div>
                    {expandedSections.basic ? <FiChevronUp /> : <FiChevronDown />}
                </div>

                {expandedSections.basic && (
                    <div className={styles.configGroupContent}>
                        <div className={styles.formGrid}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>프로젝트 이름</label>
                                <input
                                    type="text"
                                    value={basicConfig.project_name}
                                    onChange={(e) => handleBasicConfigChange('project_name', e.target.value)}
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={`${styles.formLabel} ${styles.required}`}>모델 경로</label>
                                <input
                                    type="text"
                                    value={basicConfig.model_name_or_path}
                                    onChange={(e) => handleBasicConfigChange('model_name_or_path', e.target.value)}
                                    className={styles.formInput}
                                    placeholder="예: microsoft/DialoGPT-medium"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>훈련 방법</label>
                                <select
                                    value={basicConfig.training_method}
                                    onChange={(e) => handleBasicConfigChange('training_method', e.target.value)}
                                    className={styles.formSelect}
                                >
                                    <option value="cls">Classification</option>
                                    <option value="mlm">Masked Language Model</option>
                                    <option value="st">Sentence Transformer</option>
                                </select>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>GPU 개수</label>
                                <input
                                    type="number"
                                    value={basicConfig.number_gpu}
                                    onChange={(e) => handleBasicConfigChange('number_gpu', parseInt(e.target.value))}
                                    className={styles.formInput}
                                    min="1"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>학습률</label>
                                <input
                                    type="number"
                                    value={basicConfig.learning_rate}
                                    onChange={(e) => handleBasicConfigChange('learning_rate', parseFloat(e.target.value))}
                                    className={styles.formInput}
                                    step="0.00001"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>에포크 수</label>
                                <input
                                    type="number"
                                    value={basicConfig.num_train_epochs}
                                    onChange={(e) => handleBasicConfigChange('num_train_epochs', parseInt(e.target.value))}
                                    className={styles.formInput}
                                    min="1"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>배치 사이즈</label>
                                <input
                                    type="number"
                                    value={basicConfig.per_device_train_batch_size}
                                    onChange={(e) => handleBasicConfigChange('per_device_train_batch_size', parseInt(e.target.value))}
                                    className={styles.formInput}
                                    min="1"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>그래디언트 누적 단계</label>
                                <input
                                    type="number"
                                    value={basicConfig.gradient_accumulation_steps}
                                    onChange={(e) => handleBasicConfigChange('gradient_accumulation_steps', parseInt(e.target.value))}
                                    className={styles.formInput}
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.checkboxGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={basicConfig.use_deepspeed}
                                        onChange={(e) => handleBasicConfigChange('use_deepspeed', e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    DeepSpeed 사용
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={basicConfig.bf16}
                                        onChange={(e) => handleBasicConfigChange('bf16', e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    BF16 정밀도
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={basicConfig.gradient_checkpointing}
                                        onChange={(e) => handleBasicConfigChange('gradient_checkpointing', e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    그래디언트 체크포인팅
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 데이터 관련 설정 섹션 */}
            <div className={`${styles.configGroup} ${styles.dataSection}`}>
                <div
                    className={styles.configGroupHeader}
                    onClick={() => toggleSection('data')}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FiDatabase className={styles.sectionIcon} />
                        <span>데이터 관련 설정</span>
                    </div>
                    {expandedSections.data ? <FiChevronUp /> : <FiChevronDown />}
                </div>

                {expandedSections.data && (
                    <div className={styles.configGroupContent}>
                        <div className={styles.formGrid}>
                            <div className={styles.formField}>
                                <label className={`${styles.formLabel} ${styles.required}`}>훈련 데이터</label>
                                <input
                                    type="text"
                                    value={dataConfig.train_data}
                                    onChange={(e) => handleDataConfigChange('train_data', e.target.value)}
                                    className={styles.formInput}
                                    placeholder="예: squad_v2"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>테스트 데이터</label>
                                <input
                                    type="text"
                                    value={dataConfig.test_data}
                                    onChange={(e) => handleDataConfigChange('test_data', e.target.value)}
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>메인 컬럼</label>
                                <input
                                    type="text"
                                    value={dataConfig.dataset_main_column}
                                    onChange={(e) => handleDataConfigChange('dataset_main_column', e.target.value)}
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>서브 컬럼</label>
                                <input
                                    type="text"
                                    value={dataConfig.dataset_sub_column}
                                    onChange={(e) => handleDataConfigChange('dataset_sub_column', e.target.value)}
                                    className={styles.formInput}
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>토크나이저 최대 길이</label>
                                <input
                                    type="number"
                                    value={dataConfig.tokenizer_max_len}
                                    onChange={(e) => handleDataConfigChange('tokenizer_max_len', parseInt(e.target.value))}
                                    className={styles.formInput}
                                    min="1"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>훈련/테스트 분할 비율</label>
                                <input
                                    type="number"
                                    value={dataConfig.train_test_split_ratio}
                                    onChange={(e) => handleDataConfigChange('train_test_split_ratio', parseFloat(e.target.value))}
                                    className={styles.formInput}
                                    step="0.01"
                                    min="0"
                                    max="1"
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.checkboxGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={dataConfig.data_filtering}
                                        onChange={(e) => handleDataConfigChange('data_filtering', e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    데이터 필터링
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={dataConfig.push_to_hub}
                                        onChange={(e) => handleDataConfigChange('push_to_hub', e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    Hub에 푸시
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={dataConfig.push_to_minio}
                                        onChange={(e) => handleDataConfigChange('push_to_minio', e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    MinIO에 푸시
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 트레이너 관련 설정 섹션 */}
            <div className={`${styles.configGroup} ${styles.trainerSection}`}>
                <div
                    className={styles.configGroupHeader}
                    onClick={() => toggleSection('trainer')}
                >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FiCpu className={styles.sectionIcon} />
                        <span>트레이너 관련 설정</span>
                    </div>
                    {expandedSections.trainer ? <FiChevronUp /> : <FiChevronDown />}
                </div>

                {expandedSections.trainer && (
                    <div className={styles.configGroupContent}>
                        <div className={styles.formGroup}>
                            <h4 className={styles.formGroupTitle}>트레이너 타입</h4>
                            <div className={styles.checkboxGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={trainerConfig.use_sfttrainer}
                                        onChange={(e) => handleTrainerConfigChange('use_sfttrainer', e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    SFT Trainer
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={trainerConfig.use_dpotrainer}
                                        onChange={(e) => handleTrainerConfigChange('use_dpotrainer', e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    DPO Trainer
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={trainerConfig.use_ppotrainer}
                                        onChange={(e) => handleTrainerConfigChange('use_ppotrainer', e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    PPO Trainer
                                </label>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={trainerConfig.use_grpotrainer}
                                        onChange={(e) => handleTrainerConfigChange('use_grpotrainer', e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    GRPO Trainer
                                </label>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <h4 className={styles.formGroupTitle}>PEFT 설정</h4>
                            <div className={styles.formRow}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={trainerConfig.use_peft}
                                        onChange={(e) => handleTrainerConfigChange('use_peft', e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    PEFT 사용
                                </label>
                            </div>

                            {trainerConfig.use_peft && (
                                <div className={styles.formGrid}>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>PEFT 타입</label>
                                        <select
                                            value={trainerConfig.peft_type}
                                            onChange={(e) => handleTrainerConfigChange('peft_type', e.target.value)}
                                            className={styles.formSelect}
                                        >
                                            <option value="lora">LoRA</option>
                                            <option value="adalora">AdaLoRA</option>
                                            <option value="ia3">IA3</option>
                                            <option value="vera">Vera</option>
                                        </select>
                                    </div>
                                    {trainerConfig.peft_type === 'lora' && (
                                        <>
                                            <div className={styles.formField}>
                                                <label className={styles.formLabel}>LoRA 타겟 모듈</label>
                                                <input
                                                    type="text"
                                                    value={trainerConfig.lora_target_modules}
                                                    onChange={(e) => handleTrainerConfigChange('lora_target_modules', e.target.value)}
                                                    className={styles.formInput}
                                                    placeholder="예: q_proj,k_proj,v_proj"
                                                />
                                            </div>
                                            <div className={styles.formField}>
                                                <label className={styles.formLabel}>LoRA Rank (r)</label>
                                                <input
                                                    type="number"
                                                    value={trainerConfig.lora_r}
                                                    onChange={(e) => handleTrainerConfigChange('lora_r', parseInt(e.target.value))}
                                                    className={styles.formInput}
                                                    min="1"
                                                />
                                            </div>
                                            <div className={styles.formField}>
                                                <label className={styles.formLabel}>LoRA Alpha</label>
                                                <input
                                                    type="number"
                                                    value={trainerConfig.lora_alpha}
                                                    onChange={(e) => handleTrainerConfigChange('lora_alpha', parseInt(e.target.value))}
                                                    className={styles.formInput}
                                                    min="1"
                                                />
                                            </div>
                                            <div className={styles.formField}>
                                                <label className={styles.formLabel}>LoRA Dropout</label>
                                                <input
                                                    type="number"
                                                    value={trainerConfig.lora_dropout}
                                                    onChange={(e) => handleTrainerConfigChange('lora_dropout', parseFloat(e.target.value))}
                                                    className={styles.formInput}
                                                    step="0.01"
                                                    min="0"
                                                    max="1"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={styles.formGrid}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>라벨 수</label>
                                <input
                                    type="number"
                                    value={trainerConfig.num_labels}
                                    onChange={(e) => handleTrainerConfigChange('num_labels', parseInt(e.target.value))}
                                    className={styles.formInput}
                                    min="1"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>MLM 확률</label>
                                <input
                                    type="number"
                                    value={trainerConfig.mlm_probability}
                                    onChange={(e) => handleTrainerConfigChange('mlm_probability', parseFloat(e.target.value))}
                                    className={styles.formInput}
                                    step="0.01"
                                    min="0"
                                    max="1"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 훈련 시작 버튼 */}
            <div className={styles.formActions}>
                <button
                    onClick={handleStartTraining}
                    disabled={isTraining}
                    className={styles.trainButton}
                >
                    {isTraining ? (
                        <>
                            <div className={styles.spinner} />
                            훈련 시작 중...
                        </>
                    ) : (
                        <>
                            <FiPlay className={styles.buttonIcon} />
                            훈련 시작
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default TrainPageContent;
