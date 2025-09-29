// BasicCategory.tsx
'use client';

import React from 'react';
import styles from '@/app/main/mlSection/assets/MLTrain.module.scss';

interface MLConfig {
    model_id: string;
    task: 'classification' | 'regression' | 'timeseries' | 'anomaly_detection' | 'clustering';
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
    // 태스크별 설정
    task_config?: {
        // timeseries
        lookback_window?: number;
        forecast_horizon?: number;
        time_column?: string;
        // anomaly_detection
        contamination?: number;
        // clustering
        n_clusters?: number;
    };
}

interface BasicCategoryProps {
    config: MLConfig;
    handleConfigChange: (key: keyof MLConfig, value: any) => void;
}

const BasicCategory: React.FC<BasicCategoryProps> = ({
    config,
    handleConfigChange
}) => {
    const handleTaskConfigChange = (key: string, value: any) => {
        const currentTaskConfig = config.task_config || {};
        handleConfigChange('task_config', {
            ...currentTaskConfig,
            [key]: value
        });
    };

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
                                onChange={(e) => handleConfigChange('task', e.target.value as MLConfig['task'])}
                                className={styles.formSelect}
                            >
                                <option value="classification">분류 (Classification)</option>
                                <option value="regression">회귀 (Regression)</option>
                                <option value="timeseries">시계열 (Time Series)</option>
                                <option value="anomaly_detection">이상 탐지 (Anomaly Detection)</option>
                                <option value="clustering">클러스터링 (Clustering)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 태스크별 설정 */}
                {config.task === 'timeseries' && (
                    <div className={styles.formGroup}>
                        <div className={styles.configHeader}>
                            <label>시계열 설정</label>
                        </div>
                        <div className={styles.formGrid}>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>과거 시점 개수 (Lookback Window)</label>
                                <input
                                    type="number"
                                    value={config.task_config?.lookback_window || 10}
                                    onChange={(e) => handleTaskConfigChange('lookback_window', parseInt(e.target.value))}
                                    className={styles.formInput}
                                    min="1"
                                    max="100"
                                />
                                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                    과거 몇 개 시점의 데이터를 사용할지 설정
                                </small>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>예측 시점 개수 (Forecast Horizon)</label>
                                <input
                                    type="number"
                                    value={config.task_config?.forecast_horizon || 1}
                                    onChange={(e) => handleTaskConfigChange('forecast_horizon', parseInt(e.target.value))}
                                    className={styles.formInput}
                                    min="1"
                                    max="50"
                                />
                                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                    미래 몇 개 시점을 예측할지 설정
                                </small>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>시간 컬럼명 (선택사항)</label>
                                <input
                                    type="text"
                                    value={config.task_config?.time_column || ''}
                                    onChange={(e) => handleTaskConfigChange('time_column', e.target.value || undefined)}
                                    className={styles.formInput}
                                    placeholder="예: timestamp, date"
                                />
                                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                    시간 순서 정렬에 사용할 컬럼명
                                </small>
                            </div>
                        </div>
                    </div>
                )}

                {config.task === 'anomaly_detection' && (
                    <div className={styles.formGroup}>
                        <div className={styles.configHeader}>
                            <label>이상 탐지 설정</label>
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>예상 이상치 비율 (Contamination)</label>
                            <input
                                type="number"
                                value={config.task_config?.contamination || 0.1}
                                onChange={(e) => handleTaskConfigChange('contamination', parseFloat(e.target.value))}
                                className={styles.formInput}
                                min="0.01"
                                max="0.5"
                                step="0.01"
                            />
                            <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                데이터에서 이상치가 차지하는 예상 비율 (0.1 = 10%)
                            </small>
                        </div>
                        <div style={{ 
                            marginTop: '1rem',
                            padding: '1rem',
                            background: '#f0f9ff',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem'
                        }}>
                            <div style={{ fontWeight: 500, color: '#1e40af', marginBottom: '0.5rem' }}>
                                이상 탐지 모드
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#1e40af' }}>
                                <li><strong>지도 학습:</strong> 타겟 컬럼이 있으면 지도 학습 방식 사용</li>
                                <li><strong>비지도 학습:</strong> 타겟 컬럼이 없으면 비지도 학습 방식 사용</li>
                            </ul>
                        </div>
                    </div>
                )}

                {config.task === 'clustering' && (
                    <div className={styles.formGroup}>
                        <div className={styles.configHeader}>
                            <label>클러스터링 설정</label>
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>클러스터 개수</label>
                            <input
                                type="number"
                                value={config.task_config?.n_clusters || 3}
                                onChange={(e) => handleTaskConfigChange('n_clusters', parseInt(e.target.value))}
                                className={styles.formInput}
                                min="2"
                                max="20"
                            />
                            <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                데이터를 나눌 그룹의 개수
                            </small>
                        </div>
                        <div style={{ 
                            marginTop: '1rem',
                            padding: '1rem',
                            background: '#fef3c7',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem'
                        }}>
                            <div style={{ fontWeight: 500, color: '#92400e', marginBottom: '0.5rem' }}>
                                참고사항
                            </div>
                            <div style={{ color: '#92400e' }}>
                                클러스터링은 비지도 학습이므로 타겟 컬럼이 필요하지 않습니다.
                            </div>
                        </div>
                    </div>
                )}

                {/* 데이터 분할 설정 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>데이터 분할 설정</label>
                    </div>
                    
                    {config.task === 'timeseries' && (
                        <div style={{ 
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            background: '#fef3c7',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            color: '#92400e'
                        }}>
                            ⚠️ 시계열 데이터는 시간 순서를 유지하며 분할됩니다 (랜덤 셔플 없음)
                        </div>
                    )}

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

                    {/* 교차 검증 설정 - 클러스터링은 제외 */}
                    {config.task !== 'clustering' && (
                        <>
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
                        </>
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
                                placeholder="시크릿 키 (선택사항)"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BasicCategory;