'use client';

import React, { useState } from 'react';
import { FiPlay, FiSettings, FiDatabase, FiCpu, FiBox } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { startTraining } from '@/app/api/trainAPI';
import { devLog } from '@/app/_common/utils/logger';
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
        language_model_class: 'gemma3',
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
        use_stableadamw: true,
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
                    <div className={styles.configSection}>
                        <div className={styles.configForm}>
                            {/* 기본 설정 */}
                            <div className={styles.formGroup}>
                                <div className={styles.configHeader}>
                                    <label>기본 설정</label>
                                </div>
                                <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
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
                                        <label className={styles.formLabel}>Logging Step</label>
                                        <input
                                            type="number"
                                            value={basicConfig.logging_steps}
                                            onChange={(e) => handleBasicConfigChange('logging_steps', parseInt(e.target.value))}
                                            className={styles.formInput}
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 허깅페이스 설정 */}
                            <div className={styles.formGroup}>
                                <div className={styles.configHeader}>
                                    <label>허깅페이스 설정</label>
                                </div>
                                <div className={styles.formGrid}>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>사용자 ID</label>
                                        <input
                                            type="text"
                                            value={basicConfig.hugging_face_user_id}
                                            onChange={(e) => handleBasicConfigChange('hugging_face_user_id', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="CocoRoF"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>토큰</label>
                                        <input
                                            type="password"
                                            value={basicConfig.hugging_face_token}
                                            onChange={(e) => handleBasicConfigChange('hugging_face_token', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="허깅페이스 토큰을 입력하세요"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* MinIO 설정 */}
                            <div className={styles.formGroup}>
                                <div className={styles.configHeader}>
                                    <label>MinIO 설정</label>
                                </div>
                                <div className={styles.formGrid}>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>MinIO URL</label>
                                        <input
                                            type="text"
                                            value={basicConfig.minio_url}
                                            onChange={(e) => handleBasicConfigChange('minio_url', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="polar-store-api.x2bee.com"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>액세스 키</label>
                                        <input
                                            type="text"
                                            value={basicConfig.minio_access_key}
                                            onChange={(e) => handleBasicConfigChange('minio_access_key', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="MinIO 액세스 키를 입력하세요"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>시크릿 키</label>
                                        <input
                                            type="password"
                                            value={basicConfig.minio_secret_key}
                                            onChange={(e) => handleBasicConfigChange('minio_secret_key', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="MinIO 시크릿 키를 입력하세요"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* MLflow 설정 */}
                            <div className={styles.formGroup}>
                                <div className={styles.configHeader}>
                                    <label>MLflow 설정</label>
                                </div>
                                <div className={styles.formGrid}>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>MLflow URL</label>
                                        <input
                                            type="text"
                                            value={basicConfig.mlflow_url}
                                            onChange={(e) => handleBasicConfigChange('mlflow_url', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="https://polar-mlflow-git.x2bee.com/"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>실행 ID</label>
                                        <input
                                            type="text"
                                            value={basicConfig.mlflow_run_id}
                                            onChange={(e) => handleBasicConfigChange('mlflow_run_id', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="test"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 저장 설정 */}
                            <div className={styles.formGroup}>
                                <div className={styles.configHeader}>
                                    <label>저장 설정</label>
                                </div>
                                {/* 푸시 옵션 */}
                                <div className={styles.formRow}>
                                    <div className={styles.checkboxGroup}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={basicConfig.push_to_hub}
                                                onChange={(e) => handleBasicConfigChange('push_to_hub', e.target.checked)}
                                                className={styles.checkbox}
                                            />
                                            Hub에 푸시
                                        </label>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={basicConfig.push_to_minio}
                                                onChange={(e) => handleBasicConfigChange('push_to_minio', e.target.checked)}
                                                className={styles.checkbox}
                                            />
                                            MinIO에 푸시
                                        </label>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={basicConfig.overwrite_output_dir}
                                                onChange={(e) => handleBasicConfigChange('overwrite_output_dir', e.target.checked)}
                                                className={styles.checkbox}
                                            />
                                            출력 디렉토리 덮어쓰기
                                        </label>
                                    </div>
                                </div>

                                {/* 기본 저장 옵션 */}
                                <div>
                                    {/* 출력 디렉토리 - 한 줄 */}
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>출력 디렉토리</label>
                                            <input
                                                type="text"
                                                value={basicConfig.output_dir}
                                                onChange={(e) => handleBasicConfigChange('output_dir', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="[Optional] 출력 디렉토리 경로"
                                            />
                                        </div>
                                    </div>

                                    {/* 저장 관련 - 한 줄에 2개 */}
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>저장 전략</label>
                                            <select
                                                value={basicConfig.save_strategy}
                                                onChange={(e) => handleBasicConfigChange('save_strategy', e.target.value)}
                                                className={styles.formSelect}
                                            >
                                                <option value="steps">Steps</option>
                                                <option value="epoch">Epoch</option>
                                                <option value="no">No</option>
                                            </select>
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>저장 스텝</label>
                                            <input
                                                type="number"
                                                value={basicConfig.save_steps}
                                                onChange={(e) => handleBasicConfigChange('save_steps', parseInt(e.target.value))}
                                                className={styles.formInput}
                                                min="1"
                                                placeholder="1000"
                                            />
                                        </div>
                                    </div>

                                    {/* 평가 관련 - 한 줄에 2개 */}
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>평가 전략</label>
                                            <select
                                                value={basicConfig.eval_strategy}
                                                onChange={(e) => handleBasicConfigChange('eval_strategy', e.target.value)}
                                                className={styles.formSelect}
                                            >
                                                <option value="steps">Steps</option>
                                                <option value="epoch">Epoch</option>
                                                <option value="no">No</option>
                                            </select>
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>평가 스텝</label>
                                            <input
                                                type="number"
                                                value={basicConfig.eval_steps}
                                                onChange={(e) => handleBasicConfigChange('eval_steps', parseInt(e.target.value))}
                                                className={styles.formInput}
                                                min="1"
                                                placeholder="1000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Hub 푸시 설정 - push_to_hub가 체크되었을 때만 표시 */}
                                {basicConfig.push_to_hub && (
                                    <div className={styles.formGrid}>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>Huggingface Push Repo</label>
                                            <input
                                                type="text"
                                                value={basicConfig.hub_model_id}
                                                onChange={(e) => handleBasicConfigChange('hub_model_id', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="[Optional] 저장 레포지토리 주소"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>커밋 메시지</label>
                                            <input
                                                type="text"
                                                value={basicConfig.model_commit_msg}
                                                onChange={(e) => handleBasicConfigChange('model_commit_msg', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="[Optional] 커밋 메시지"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>Hub 전략</label>
                                            <select
                                                value={basicConfig.hub_strategy}
                                                onChange={(e) => handleBasicConfigChange('hub_strategy', e.target.value)}
                                                className={styles.formSelect}
                                            >
                                                <option value="checkpoint">Checkpoint</option>
                                                <option value="end">End</option>
                                                <option value="every_save">Every Save</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                                {basicConfig.push_to_minio && (
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>MinIO 모델 저장 버킷</label>
                                        <input
                                            type="text"
                                            value={basicConfig.minio_model_save_bucket}
                                            onChange={(e) => handleBasicConfigChange('minio_model_save_bucket', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="[Optional] MinIO 모델 저장 버킷"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'model':
                return (
                    <div className={styles.configSection}>
                        <div className={styles.configForm}>
                            {/* 모델 로드 방법 선택 */}
                            <div className={styles.formGroup}>
                                <div className={styles.configHeader}>
                                    <label>모델 로드 방법</label>
                                </div>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>모델 로드 방법</label>
                                    <select
                                        value={modelConfig.model_load_method}
                                        onChange={(e) => handleModelConfigChange('model_load_method', e.target.value)}
                                        className={styles.formSelect}
                                    >
                                        <option value="huggingface">Huggingface</option>
                                        <option value="minio">Minio</option>
                                    </select>
                                </div>
                            </div>

                            {/* Huggingface 모델 설정 */}
                            {modelConfig.model_load_method === 'huggingface' && (
                                <div className={styles.formGroup}>
                                    <div className={styles.configHeader}>
                                        <label>Huggingface 모델 설정</label>
                                    </div>
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                        <div className={styles.formField}>
                                            <label className={`${styles.formLabel} ${styles.required}`}>Huggingface Repository</label>
                                            <input
                                                type="text"
                                                value={modelConfig.model_name_or_path}
                                                onChange={(e) => handleModelConfigChange('model_name_or_path', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="예: models/my-model"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>Reference Model Repository</label>
                                            <input
                                                type="text"
                                                value={modelConfig.ref_model_path}
                                                onChange={(e) => handleModelConfigChange('ref_model_path', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="[Optional] 참조 모델 경로"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>Architecture Class</label>
                                            <select
                                                value={modelConfig.language_model_class}
                                                onChange={(e) => handleModelConfigChange('language_model_class', e.target.value)}
                                                className={styles.formSelect}
                                            >
                                                <option value="gemma3">Gemma3</option>
                                                <option value="llama">Llama</option>
                                                <option value="bert">BERT</option>
                                                <option value="gpt">GPT</option>
                                                <option value="none">None</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>모델 서브폴더</label>
                                            <input
                                                type="text"
                                                value={modelConfig.model_subfolder}
                                                onChange={(e) => handleModelConfigChange('model_subfolder', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="[Optional] 모델 서브폴더"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>설정 이름</label>
                                            <input
                                                type="text"
                                                value={modelConfig.config_name}
                                                onChange={(e) => handleModelConfigChange('config_name', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="[Optional] 설정 이름"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>캐시 디렉토리</label>
                                            <input
                                                type="text"
                                                value={modelConfig.cache_dir}
                                                onChange={(e) => handleModelConfigChange('cache_dir', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="[Optional] 캐시 디렉토리"
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>Tokenizer 이름</label>
                                            <input
                                                type="text"
                                                value={modelConfig.tokenizer_name}
                                                onChange={(e) => handleModelConfigChange('tokenizer_name', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="[Optional] Tokenizer 이름 - 모델과 다른 경우 사용"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>Tokenizer 최대 길이</label>
                                            <input
                                                type="number"
                                                value={modelConfig.tokenizer_max_len}
                                                onChange={(e) => handleModelConfigChange('tokenizer_max_len', parseInt(e.target.value))}
                                                className={styles.formInput}
                                                min="1"
                                                placeholder="256"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Minio 모델 설정 */}
                            {modelConfig.model_load_method === 'minio' && (
                                <div className={styles.formGroup}>
                                    <div className={styles.configHeader}>
                                        <label>Minio 모델 설정</label>
                                    </div>
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>모델 로드 버킷</label>
                                            <select
                                                value={modelConfig.minio_model_load_bucket}
                                                onChange={(e) => handleModelConfigChange('minio_model_load_bucket', e.target.value)}
                                                className={styles.formSelect}
                                            >
                                                <option value="models">models</option>
                                                <option value="data">data</option>
                                                <option value="checkpoints">checkpoints</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                        <div className={styles.formField}>
                                            <label className={`${styles.formLabel} ${styles.required}`}>MinIO 모델 경로</label>
                                            <input
                                                type="text"
                                                value={modelConfig.model_name_or_path}
                                                onChange={(e) => handleModelConfigChange('model_name_or_path', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="예: models/my-model"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>Reference Model 경로</label>
                                            <input
                                                type="text"
                                                value={modelConfig.ref_model_path}
                                                onChange={(e) => handleModelConfigChange('ref_model_path', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="[Optional] 참조 모델 경로"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>Architecture Class</label>
                                            <select
                                                value={modelConfig.language_model_class}
                                                onChange={(e) => handleModelConfigChange('language_model_class', e.target.value)}
                                                className={styles.formSelect}
                                            >
                                                <option value="gemma3">Gemma3</option>
                                                <option value="llama">Llama</option>
                                                <option value="bert">BERT</option>
                                                <option value="gpt">GPT</option>
                                                <option value="none">None</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>Tokenizer 이름</label>
                                            <input
                                                type="text"
                                                value={modelConfig.tokenizer_name}
                                                onChange={(e) => handleModelConfigChange('tokenizer_name', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="[Optional] Tokenizer 이름 - 모델과 다른 경우 사용"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>Tokenizer 최대 길이</label>
                                            <input
                                                type="number"
                                                value={modelConfig.tokenizer_max_len}
                                                onChange={(e) => handleModelConfigChange('tokenizer_max_len', parseInt(e.target.value))}
                                                className={styles.formInput}
                                                min="1"
                                                placeholder="256"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 추가 모델 설정 */}
                            <div className={styles.formGroup}>
                                <div className={styles.configHeader}>
                                    <label>추가 모델 설정</label>
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.checkboxGroup}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={modelConfig.use_attn_implementation}
                                                onChange={(e) => handleModelConfigChange('use_attn_implementation', e.target.checked)}
                                                className={styles.checkbox}
                                            />
                                            어텐션 구현 사용
                                        </label>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={modelConfig.is_resume}
                                                onChange={(e) => handleModelConfigChange('is_resume', e.target.checked)}
                                                className={styles.checkbox}
                                            />
                                            이어서 훈련
                                        </label>
                                    </div>
                                </div>
                                {modelConfig.use_attn_implementation && (
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>어텐션 구현 방식</label>
                                            <select
                                                value={modelConfig.attn_implementation}
                                                onChange={(e) => handleModelConfigChange('attn_implementation', e.target.value)}
                                                className={styles.formSelect}
                                            >
                                                <option value="eager">Eager</option>
                                                <option value="flash_attention_2">Flash Attention 2</option>
                                                <option value="sdpa">SDPA</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'data':
                return (
                    <div className={styles.configSection}>
                        <div className={styles.configForm}>
                            {/* 데이터 소스 선택 */}
                            <div className={styles.formGroup}>
                                <div className={styles.configHeader}>
                                    <label>데이터 소스 선택</label>
                                </div>
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>데이터 로드 방법</label>
                                    <select
                                        value={dataConfig.dataset_load_method}
                                        onChange={(e) => handleDataConfigChange('dataset_load_method', e.target.value)}
                                        className={styles.formSelect}
                                    >
                                        <option value="huggingface">Huggingface</option>
                                        <option value="minio">Minio</option>
                                    </select>
                                </div>
                            </div>

                            {/* Huggingface 설정 */}
                            {dataConfig.dataset_load_method === 'huggingface' && (
                                <div className={styles.formGroup}>
                                    <div className={styles.configHeader}>
                                        <label>Huggingface 설정</label>
                                    </div>

                                    {/* 훈련 데이터 row - 5:3:3 비율 */}
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '5fr 3fr 3fr' }}>
                                        <div className={styles.formField}>
                                            <label className={`${styles.formLabel} ${styles.required}`}>훈련 데이터 (URL Path)</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    value={dataConfig.train_data}
                                                    onChange={(e) => handleDataConfigChange('train_data', e.target.value)}
                                                    className={styles.formInput}
                                                    placeholder="예: squad_v2"
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleLoadTrainData}
                                                    className={`${styles.button} ${styles.secondary}`}
                                                >
                                                    불러오기
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>훈련 데이터 디렉토리</label>
                                            <input
                                                type="text"
                                                value={dataConfig.train_data_dir}
                                                onChange={(e) => handleDataConfigChange('train_data_dir', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="데이터 디렉토리 경로"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>훈련 데이터 분할</label>
                                            <input
                                                type="text"
                                                value={dataConfig.train_data_split}
                                                onChange={(e) => handleDataConfigChange('train_data_split', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="train"
                                            />
                                        </div>
                                    </div>

                                    {/* 테스트 데이터 row - 5:3:3 비율 */}
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '5fr 3fr 3fr' }}>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>테스트 데이터 (URL Path)</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    value={dataConfig.test_data}
                                                    onChange={(e) => handleDataConfigChange('test_data', e.target.value)}
                                                    className={styles.formInput}
                                                    placeholder="테스트 데이터셋 경로"
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleLoadTestData}
                                                    className={`${styles.button} ${styles.secondary}`}
                                                >
                                                    불러오기
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>테스트 데이터 디렉토리</label>
                                            <input
                                                type="text"
                                                value={dataConfig.test_data_dir}
                                                onChange={(e) => handleDataConfigChange('test_data_dir', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="데이터 디렉토리 경로"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>테스트 데이터 분할</label>
                                            <input
                                                type="text"
                                                value={dataConfig.test_data_split}
                                                onChange={(e) => handleDataConfigChange('test_data_split', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="test"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Minio 설정 */}
                            {dataConfig.dataset_load_method === 'minio' && (
                                <div className={styles.formGroup}>
                                    <div className={styles.configHeader}>
                                        <label>Minio 설정</label>
                                    </div>

                                    {/* 버킷 선택 - 전체 너비 */}
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>데이터 로드 버킷</label>
                                            <select
                                                value={dataConfig.minio_data_load_bucket}
                                                onChange={(e) => handleDataConfigChange('minio_data_load_bucket', e.target.value)}
                                                className={styles.formSelect}
                                            >
                                                <option value="data">data</option>
                                                <option value="models">models</option>
                                                <option value="datasets">datasets</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* 훈련 데이터 row - 5:3:3 비율 */}
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '5fr 3fr 3fr' }}>
                                        <div className={styles.formField}>
                                            <label className={`${styles.formLabel} ${styles.required}`}>훈련 데이터 (URL Path)</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    value={dataConfig.train_data}
                                                    onChange={(e) => handleDataConfigChange('train_data', e.target.value)}
                                                    className={styles.formInput}
                                                    placeholder="예: datasets/train.json"
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleLoadTrainData}
                                                    className={`${styles.button} ${styles.secondary}`}
                                                >
                                                    불러오기
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>훈련 데이터 디렉토리</label>
                                            <input
                                                type="text"
                                                value={dataConfig.train_data_dir}
                                                onChange={(e) => handleDataConfigChange('train_data_dir', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="데이터 디렉토리 경로"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>훈련 데이터 분할</label>
                                            <input
                                                type="text"
                                                value={dataConfig.train_data_split}
                                                onChange={(e) => handleDataConfigChange('train_data_split', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="train"
                                            />
                                        </div>
                                    </div>

                                    {/* 테스트 데이터 row - 5:3:3 비율 */}
                                    <div className={styles.formGrid} style={{ gridTemplateColumns: '5fr 3fr 3fr' }}>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>테스트 데이터 (URL Path)</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="text"
                                                    value={dataConfig.test_data}
                                                    onChange={(e) => handleDataConfigChange('test_data', e.target.value)}
                                                    className={styles.formInput}
                                                    placeholder="예: datasets/test.json"
                                                    style={{ flex: 1 }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleLoadTestData}
                                                    className={`${styles.button} ${styles.secondary}`}
                                                >
                                                    불러오기
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>테스트 데이터 디렉토리</label>
                                            <input
                                                type="text"
                                                value={dataConfig.test_data_dir}
                                                onChange={(e) => handleDataConfigChange('test_data_dir', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="데이터 디렉토리 경로"
                                            />
                                        </div>
                                        <div className={styles.formField}>
                                            <label className={styles.formLabel}>테스트 데이터 분할</label>
                                            <input
                                                type="text"
                                                value={dataConfig.test_data_split}
                                                onChange={(e) => handleDataConfigChange('test_data_split', e.target.value)}
                                                className={styles.formInput}
                                                placeholder="test"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 데이터셋 열 설정 */}
                            <div className={styles.formGroup}>
                                <div className={styles.configHeader}>
                                    <label>데이터셋 열 설정</label>
                                </div>
                                <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>Major Column</label>
                                        <input
                                            type="text"
                                            value={dataConfig.dataset_main_column}
                                            onChange={(e) => handleDataConfigChange('dataset_main_column', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="Major Column"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>Sub Column</label>
                                        <input
                                            type="text"
                                            value={dataConfig.dataset_sub_column}
                                            onChange={(e) => handleDataConfigChange('dataset_sub_column', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="Sub Column: Context, Answer, Etc"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>3rd Column</label>
                                        <input
                                            type="text"
                                            value={dataConfig.dataset_minor_column}
                                            onChange={(e) => handleDataConfigChange('dataset_minor_column', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="Use for additional context"
                                        />
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>4th Column</label>
                                        <input
                                            type="text"
                                            value={dataConfig.dataset_last_column}
                                            onChange={(e) => handleDataConfigChange('dataset_last_column', e.target.value)}
                                            className={styles.formInput}
                                            placeholder="Use for additional context"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 추가 옵션 */}
                            <div className={styles.formGroup}>
                                <div className={styles.configHeader}>
                                    <label>추가 옵션</label>
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
                                    </div>
                                </div>
                                <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>[Optional] 훈련/테스트 분할 비율 - 테스트 데이터가 없는 경우에만 선택적으로 사용</label>
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
                            </div>
                        </div>
                    </div>
                );

            case 'trainer':
                return (
                    <div className={styles.configSection}>
                        <div className={styles.configForm}>
                            <div className={styles.formGroup}>
                                <div className={styles.configHeader}>
                                    <label>트레이너 타입</label>
                                </div>
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
                                <div className={styles.configHeader}>
                                    <label>PEFT 설정</label>
                                </div>
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

                            <div className={styles.formGroup}>
                                <div className={styles.configHeader}>
                                    <label>추가 설정</label>
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
                        </div>
                    </div>
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
        setTrainerConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleLoadTrainData = () => {
        // 추후 API 연결 예정
        toast.success('훈련 데이터 불러오기 기능은 개발 중입니다.');
    };

    const handleLoadTestData = () => {
        // 추후 API 연결 예정
        toast.success('테스트 데이터 불러오기 기능은 개발 중입니다.');
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
                // 추가 기본값들
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
