'use client';

import React, { useState } from 'react';
import styles from '@/app/model/assets/Train.module.scss';
import ModelStorageModal from '@/app/model/components/Train/ModelStorageModal';
import useSidebarManager from '@/app/_common/hooks/useSidebarManager';

interface ModelConfig {
    model_load_method: string;
    model_name_or_path: string;
    tokenizer_name: string;
    language_model_class: string;
    tokenizer_max_len: number;
    minio_model_load_bucket: string;
    use_attn_implementation: boolean;
    attn_implementation: string;
    ref_model_path: string;
    model_subfolder: string;
    config_name: string;
    cache_dir: string;
    is_resume: boolean;
}

interface ModelCategoryProps {
    modelConfig: ModelConfig;
    handleModelConfigChange: (key: string, value: any) => void;
}

const ModelCategory: React.FC<ModelCategoryProps> = ({
    modelConfig,
    handleModelConfigChange
}) => {
    const [isModelModalOpen, setIsModelModalOpen] = useState(false);
    const [isRefModelModalOpen, setIsRefModelModalOpen] = useState(false);

    useSidebarManager(isModelModalOpen||isRefModelModalOpen)

    const handleOpenModelModal = () => {
        setIsModelModalOpen(true);
    };

    const handleCloseModelModal = () => {
        setIsModelModalOpen(false);
    };

    const handleSelectModel = (modelId: string) => {
        handleModelConfigChange('model_name_or_path', modelId);
    };

    const handleOpenRefModelModal = () => {
        setIsRefModelModalOpen(true);
    };

    const handleCloseRefModelModal = () => {
        setIsRefModelModalOpen(false);
    };

    const handleSelectRefModel = (modelId: string) => {
        handleModelConfigChange('ref_model_path', modelId);
    };
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
                            {/* <option value="minio">Minio</option> */}
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
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={modelConfig.model_name_or_path}
                                        onChange={(e) => handleModelConfigChange('model_name_or_path', e.target.value)}
                                        className={styles.formInput}
                                        placeholder="예: models/my-model"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleOpenModelModal}
                                        className={`${styles.button} ${styles.secondary}`}
                                    >
                                        불러오기
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Reference Model Repository</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={modelConfig.ref_model_path}
                                        onChange={(e) => handleModelConfigChange('ref_model_path', e.target.value)}
                                        className={styles.formInput}
                                        placeholder="[Optional] 참조 모델 경로"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleOpenRefModelModal}
                                        className={`${styles.button} ${styles.secondary}`}
                                    >
                                        불러오기
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Architecture Class</label>
                                <select
                                    value={modelConfig.language_model_class}
                                    onChange={(e) => handleModelConfigChange('language_model_class', e.target.value)}
                                    className={styles.formSelect}
                                >
                                    <option value="gemma3">Gemma3</option>
                                    <option value="qwen3">Qwen3</option>
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
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={modelConfig.model_name_or_path}
                                        onChange={(e) => handleModelConfigChange('model_name_or_path', e.target.value)}
                                        className={styles.formInput}
                                        placeholder="예: models/my-model"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleOpenModelModal}
                                        className={`${styles.button} ${styles.secondary}`}
                                    >
                                        불러오기
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>Reference Model 경로</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={modelConfig.ref_model_path}
                                        onChange={(e) => handleModelConfigChange('ref_model_path', e.target.value)}
                                        className={styles.formInput}
                                        placeholder="[Optional] 참조 모델 경로"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleOpenRefModelModal}
                                        className={`${styles.button} ${styles.secondary}`}
                                    >
                                        불러오기
                                    </button>
                                </div>
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

            {/* Model Storage Modals */}
            <ModelStorageModal
                isOpen={isModelModalOpen}
                onClose={handleCloseModelModal}
                onSelectModel={handleSelectModel}
                currentModelId={modelConfig.model_name_or_path}
            />

            <ModelStorageModal
                isOpen={isRefModelModalOpen}
                onClose={handleCloseRefModelModal}
                onSelectModel={handleSelectRefModel}
                currentModelId={modelConfig.ref_model_path}
            />
        </div>
    );
};

export default ModelCategory;
