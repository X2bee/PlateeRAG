'use client';

import React from 'react';
import styles from '@/app/model/assets/Train.module.scss';

interface BasicConfig {
    project_name: string;
    number_gpu: number;
    training_method: string;
    hugging_face_user_id: string;
    hugging_face_token: string;
    minio_url: string;
    minio_access_key: string;
    minio_secret_key: string;
    minio_model_save_bucket: string;
    mlflow_url: string;
    mlflow_run_id: string;
    push_to_hub: boolean;
    push_to_minio: boolean;
    hub_model_id: string;
    model_commit_msg: string;
    hub_strategy: string;
    output_dir: string;
    overwrite_output_dir: boolean;
    save_strategy: string;
    save_steps: number;
    eval_strategy: string;
    eval_steps: number;
    logging_steps: number;
}

interface BasicCategoryProps {
    basicConfig: BasicConfig;
    handleBasicConfigChange: (key: string, value: any) => void;
}

const BasicCategory: React.FC<BasicCategoryProps> = ({
    basicConfig,
    handleBasicConfigChange
}) => {
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
                                <option value="mlm">Masked Language Model</option>
                                <option value="clm">Causal Language Model</option>
                                <option value="sft">Supervised Fine Tune (Instruction)</option>
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
};

export default BasicCategory;
