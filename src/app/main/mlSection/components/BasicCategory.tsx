'use client';

import React from 'react';
import styles from '@/app/main/mlSection/assets/MLTrain.module.scss';

interface MLConfig {
    model_id: string;
    task: 'classification' | 'regression';
    test_size: number;
    validation_size: number;
    use_cv: boolean;
    cv_folds: number;
    mlflow_tracking_uri: string;
    artifact_base_uri: string;
    s3_endpoint_url?: string;
    aws_access_key_id?: string;
    aws_secret_access_key?: string;
    aws_region: string;
}

interface BasicCategoryProps {
    config: MLConfig;
    handleConfigChange: (key: keyof MLConfig, value: any) => void;
}

const BasicCategory: React.FC<BasicCategoryProps> = ({
    config,
    handleConfigChange
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
                            <label className={`${styles.formLabel} ${styles.required}`}>모델 ID</label>
                            <input
                                type="text"
                                value={config.model_id}
                                onChange={(e) => handleConfigChange('model_id', e.target.value)}
                                className={styles.formInput}
                                placeholder="예: my-classification-model"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={`${styles.formLabel} ${styles.required}`}>태스크 유형</label>
                            <select
                                value={config.task}
                                onChange={(e) => handleConfigChange('task', e.target.value as 'classification' | 'regression')}
                                className={styles.formSelect}
                            >
                                <option value="classification">분류 (Classification)</option>
                                <option value="regression">회귀 (Regression)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 데이터 분할 설정 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>데이터 분할 설정</label>
                    </div>
                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>테스트 셋 비율</label>
                            <input
                                type="number"
                                value={config.test_size}
                                onChange={(e) => handleConfigChange('test_size', parseFloat(e.target.value))}
                                className={styles.formInput}
                                min="0.1"
                                max="0.5"
                                step="0.05"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>검증 셋 비율</label>
                            <input
                                type="number"
                                value={config.validation_size}
                                onChange={(e) => handleConfigChange('validation_size', parseFloat(e.target.value))}
                                className={styles.formInput}
                                min="0"
                                max="0.3"
                                step="0.05"
                            />
                        </div>
                    </div>

                    {/* 교차 검증 설정 */}
                    <div className={styles.formRow}>
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={config.use_cv}
                                    onChange={(e) => handleConfigChange('use_cv', e.target.checked)}
                                    className={styles.checkbox}
                                />
                                교차 검증 사용
                            </label>
                        </div>
                    </div>

                    {config.use_cv && (
                        <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>교차 검증 폴드 수</label>
                                <input
                                    type="number"
                                    value={config.cv_folds}
                                    onChange={(e) => handleConfigChange('cv_folds', parseInt(e.target.value))}
                                    className={styles.formInput}
                                    min="3"
                                    max="10"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* MLflow 설정 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>MLflow 설정</label>
                    </div>
                    <div className={styles.formGrid}>
                        <div className={styles.formField}>
                            <label className={`${styles.formLabel} ${styles.required}`}>MLflow Tracking URI</label>
                            <input
                                type="text"
                                value={config.mlflow_tracking_uri}
                                onChange={(e) => handleConfigChange('mlflow_tracking_uri', e.target.value)}
                                className={styles.formInput}
                                placeholder="http://localhost:5000"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>Artifact Base URI</label>
                            <input
                                type="text"
                                value={config.artifact_base_uri}
                                onChange={(e) => handleConfigChange('artifact_base_uri', e.target.value)}
                                className={styles.formInput}
                                placeholder="file:///tmp/artifacts 또는 s3://bucket/path"
                            />
                        </div>
                    </div>
                </div>

                {/* S3/MinIO 설정 (선택사항) */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>S3/MinIO 설정 (선택사항)</label>
                    </div>
                    <div className={styles.formGrid}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>S3 Endpoint URL</label>
                            <input
                                type="text"
                                value={config.s3_endpoint_url || ''}
                                onChange={(e) => handleConfigChange('s3_endpoint_url', e.target.value || undefined)}
                                className={styles.formInput}
                                placeholder="MinIO 등 커스텀 S3 엔드포인트"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>AWS 리전</label>
                            <input
                                type="text"
                                value={config.aws_region}
                                onChange={(e) => handleConfigChange('aws_region', e.target.value)}
                                className={styles.formInput}
                                placeholder="ap-northeast-2"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>AWS Access Key ID</label>
                            <input
                                type="text"
                                value={config.aws_access_key_id || ''}
                                onChange={(e) => handleConfigChange('aws_access_key_id', e.target.value || undefined)}
                                className={styles.formInput}
                                placeholder="액세스 키 (선택사항)"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>AWS Secret Access Key</label>
                            <input
                                type="password"
                                value={config.aws_secret_access_key || ''}
                                onChange={(e) => handleConfigChange('aws_secret_access_key', e.target.value || undefined)}
                                className={styles.formInput}
                                placeholder="시크릿 키 (선택사항)"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };
        
        export default BasicCategory;