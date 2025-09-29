'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/app/main/mlSection/assets/MLTrain.module.scss';
import { listMLflowDatasets, listMLflowDatasetsByExperiment , getMLflowDatasetColumns } from '@/app/_common/api/dataManagerAPI';

interface MLConfig {
    hf_repo: string;
    hf_filename: string;
    hf_revision?: string;
    target_column: string;
    feature_columns?: string[];
    // MLflow 데이터셋 사용 시
    use_mlflow_dataset?: boolean;
    mlflow_run_id?: string;
    mlflow_experiment_name?: string;
    mlflow_artifact_path?: string; // 추가
    task: 'classification' | 'regression' | 'clustering' | 'anomaly_detection' | 'timeseries'; // task 추가
}


interface DataCategoryProps {
    config: Pick<MLConfig, 
        'hf_repo' | 'hf_filename' | 'hf_revision' | 
        'target_column' | 'feature_columns' | 
        'use_mlflow_dataset' | 'mlflow_run_id' | 'mlflow_experiment_name' | 'mlflow_artifact_path' |
        'task'  // task 추가
    >;
    handleConfigChange: (key: keyof MLConfig, value: any) => void;
}

interface MLflowDataset {
    run_id: string;
    experiment_name: string;
    dataset_name: string;
    format: string;
    created_at: string;
    metrics: {
        rows?: number;
        columns?: number;
        size_mb?: number;
    };
    artifacts: Array<{
        path: string;
        size_bytes: number;
    }>;
}

interface ColumnInfo {
    name: string;
    type: string;
    nullable: boolean;
}


const DataCategory: React.FC<DataCategoryProps> = ({
    config,
    handleConfigChange
}) => {
    const [mlflowDatasets, setMlflowDatasets] = useState<MLflowDataset[]>([]);
    const [loadingDatasets, setLoadingDatasets] = useState(false);
    const [datasetError, setDatasetError] = useState<string | null>(null);
    const [selectedExperiment, setSelectedExperiment] = useState<string>('');
    const [experiments, setExperiments] = useState<string[]>([]);
    const [availableColumns, setAvailableColumns] = useState<ColumnInfo[]>([]);
    const [loadingColumns, setLoadingColumns] = useState(false);
    const [columnsError, setColumnsError] = useState<string | null>(null);

    // MLflow 데이터셋 목록 불러오기
    useEffect(() => {
        const fetchMLflowDatasets = async () => {
            try {
                setLoadingDatasets(true);
                setDatasetError(null);

                const raw = selectedExperiment
                    ? await listMLflowDatasetsByExperiment(selectedExperiment, 200)
                    : await listMLflowDatasets({ maxResults: 200 });
            
                const typed = raw as { datasets?: MLflowDataset[] };
                const datasets = Array.isArray(typed.datasets) ? typed.datasets : [];
                setMlflowDatasets(datasets);
                
                // 실험명 목록 추출
                const expNames = [...new Set(datasets.map((d: MLflowDataset) => d.experiment_name))];
                setExperiments(expNames);

            } catch (error) {
                console.error('MLflow 데이터셋 목록 불러오기 실패:', error);
                setDatasetError(error instanceof Error ? error.message : '데이터셋을 불러올 수 없습니다');
            } finally {
                setLoadingDatasets(false);
            }
        };

        if (config.use_mlflow_dataset) {
            fetchMLflowDatasets();
        }
    }, [config.use_mlflow_dataset, selectedExperiment]);

    // MLflow 데이터셋 선택 시 컬럼 정보 불러오기
    useEffect(() => {
        const fetchColumns = async () => {
            if (!config.mlflow_run_id) {
                setAvailableColumns([]);
                return;
            }

            try {
                setLoadingColumns(true);
                setColumnsError(null);

                const result = await getMLflowDatasetColumns(config.mlflow_run_id);
                const colsTyped = result as { columns?: ColumnInfo[] };
                const cols = Array.isArray(colsTyped.columns) ? colsTyped.columns : [];
                setAvailableColumns(cols);

            } catch (error) {
                console.error('컬럼 정보 불러오기 실패:', error);
                setColumnsError(error instanceof Error ? error.message : '컬럼 정보를 불러올 수 없습니다');
            } finally {
                setLoadingColumns(false);
            }
        };

        if (config.use_mlflow_dataset && config.mlflow_run_id) {
            fetchColumns();
        }
    }, [config.use_mlflow_dataset, config.mlflow_run_id]);

    const toggleFeatureColumn = (columnName: string) => {
        const currentFeatures = config.feature_columns || [];
        const isSelected = currentFeatures.includes(columnName);

        if (isSelected) {
            handleConfigChange('feature_columns', currentFeatures.filter(c => c !== columnName));
        } else {
            handleConfigChange('feature_columns', [...currentFeatures, columnName]);
        }
    };

    const handleFeatureColumnsChange = (value: string) => {
        if (value.trim() === '') {
            handleConfigChange('feature_columns', undefined);
        } else {
            const columns = value.split(',').map(col => col.trim()).filter(col => col !== '');
            handleConfigChange('feature_columns', columns);
        }
    };

    const handleDataSourceToggle = (useMLflow: boolean) => {
        handleConfigChange('use_mlflow_dataset', useMLflow);
        if (!useMLflow) {
            handleConfigChange('mlflow_run_id', undefined);
            handleConfigChange('mlflow_experiment_name', undefined);
        }
    };

    const handleMLflowDatasetSelect = (dataset: MLflowDataset) => {
        handleConfigChange('mlflow_run_id', dataset.run_id);
        handleConfigChange('mlflow_experiment_name', dataset.experiment_name);
        
        // 파일 정보를 HuggingFace 필드에도 반영 (백엔드 호환성)
        const datasetFile = dataset.artifacts.find(a => 
            a.path.endsWith('.csv') || a.path.endsWith('.parquet')
        );
        
        if (datasetFile) {
            handleConfigChange('hf_filename', datasetFile.path.split('/').pop() || '');
        }
    };

    const featureColumnsString = config.feature_columns?.join(', ') || '';
    const selectedDataset = mlflowDatasets.find(d => d.run_id === config.mlflow_run_id);

    return (
        <div className={styles.configSection}>
            <div className={styles.configForm}>
                {/* 데이터 소스 선택 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>데이터 소스 선택</label>
                    </div>
                    <div className={styles.dataSourceToggle}>
                        <button
                            type="button"
                            onClick={() => handleDataSourceToggle(false)}
                            className={`${styles.toggleButton} ${!config.use_mlflow_dataset ? styles.active : ''}`}
                        >
                            HuggingFace 데이터셋
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDataSourceToggle(true)}
                            className={`${styles.toggleButton} ${config.use_mlflow_dataset ? styles.active : ''}`}
                        >
                            MLflow 업로드 데이터셋
                        </button>
                    </div>
                </div>
    
                {/* MLflow 데이터셋 선택 */}
                {config.use_mlflow_dataset ? (
                    <div className={styles.formGroup}>
                        <div className={styles.configHeader}>
                            <label>MLflow 데이터셋 선택</label>
                        </div>
                        
                        {/* 실험 필터 */}
                        <div className={styles.formField} style={{ marginBottom: '1rem' }}>
                            <label className={styles.formLabel}>실험으로 필터링 (선택사항)</label>
                            <select
                                value={selectedExperiment}
                                onChange={(e) => setSelectedExperiment(e.target.value)}
                                className={styles.formSelect}
                            >
                                <option value="">전체 실험</option>
                                {experiments.map(exp => (
                                    <option key={exp} value={exp}>{exp}</option>
                                ))}
                            </select>
                        </div>
    
                        {/* 데이터셋 목록 */}
                        <div>
                            {loadingDatasets ? (
                                <div className={styles.loadingState}>
                                    <div className={styles.loadingSpinner} />
                                    <div className={styles.emptyText}>데이터셋을 불러오는 중...</div>
                                </div>
                            ) : datasetError ? (
                                <div className={styles.errorBox}>
                                    <span className={styles.errorIcon}>⚠️</span>
                                    <span className={styles.errorText}>{datasetError}</span>
                                </div>
                            ) : mlflowDatasets.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>📂</div>
                                    <div className={styles.emptyText}>업로드된 데이터셋이 없습니다</div>
                                </div>
                            ) : (
                                <div className={styles.datasetList}>
                                    {mlflowDatasets.map((dataset) => (
                                        <div
                                            key={dataset.run_id}
                                            onClick={() => handleMLflowDatasetSelect(dataset)}
                                            className={`${styles.datasetCard} ${
                                                dataset.run_id === config.mlflow_run_id ? styles.selected : ''
                                            }`}
                                        >
                                            {dataset.run_id === config.mlflow_run_id && (
                                                <div className={styles.selectedBadge}>
                                                    선택됨
                                                </div>
                                            )}
                                            <div className={styles.datasetCardHeader}>
                                                <div style={{ flex: 1 }}>
                                                    <div className={styles.datasetName}>
                                                        {dataset.dataset_name}
                                                    </div>
                                                    <div className={styles.experimentName}>
                                                        실험: {dataset.experiment_name}
                                                    </div>
                                                    <div className={styles.datasetMetrics}>
                                                        <span className={styles.metricBadge}>
                                                            {dataset.metrics.rows?.toLocaleString()} rows
                                                        </span>
                                                        <span className={styles.metricBadge}>
                                                            {dataset.metrics.columns} columns
                                                        </span>
                                                        <span className={styles.metricBadge}>
                                                            {dataset.metrics.size_mb?.toFixed(2)} MB
                                                        </span>
                                                        <span className={`${styles.metricBadge} ${styles.format}`}>
                                                            {dataset.format.toUpperCase()}
                                                        </span>
                                                        <span className={styles.metricBadge}>
                                                            {new Date(dataset.created_at).toLocaleDateString('ko-KR', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
    
                        {/* 선택된 데이터셋 정보 */}
                        {selectedDataset && (
                            <div className={styles.successBox}>
                                <div className={styles.successHeader}>
                                    <span>✓</span>
                                    선택된 데이터셋
                                </div>
                                <div className={styles.successContent}>
                                    {selectedDataset.dataset_name} ({selectedDataset.experiment_name})
                                </div>
                                <div className={styles.successDetail}>
                                    Run ID: {selectedDataset.run_id}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* HuggingFace 데이터셋 설정 */
                    <div className={styles.formGroup}>
                        <div className={styles.configHeader}>
                            <label>HuggingFace 데이터셋 설정</label>
                        </div>
                        <div className={styles.formField}>
                            <label className={`${styles.formLabel} ${styles.required}`}>레포지토리 ID</label>
                            <input
                                type="text"
                                value={config.hf_repo}
                                onChange={(e) => handleConfigChange('hf_repo', e.target.value)}
                                className={styles.formInput}
                                placeholder="예: username/dataset-name"
                            />
                            <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                HuggingFace 데이터셋 레포지토리 경로
                            </small>
                        </div>
                        <div className={styles.formGrid}>
                            <div className={styles.formField}>
                                <label className={`${styles.formLabel} ${styles.required}`}>파일명</label>
                                <input
                                    type="text"
                                    value={config.hf_filename}
                                    onChange={(e) => handleConfigChange('hf_filename', e.target.value)}
                                    className={styles.formInput}
                                    placeholder="train.csv"
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.formLabel}>브랜치/태그</label>
                                <input
                                    type="text"
                                    value={config.hf_revision || ''}
                                    onChange={(e) => handleConfigChange('hf_revision', e.target.value || undefined)}
                                    className={styles.formInput}
                                    placeholder="main"
                                />
                            </div>
                        </div>
                    </div>
                )}
    
                {/* 컬럼 설정 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>컬럼 설정</label>
                    </div>
    
                    {/* MLflow 컬럼 정보 */}
                    {config.use_mlflow_dataset && config.mlflow_run_id && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            {loadingColumns ? (
                                <div className={styles.loadingState}>
                                    <div className={styles.loadingSpinner} />
                                    <div className={styles.emptyText}>컬럼 정보를 불러오는 중...</div>
                                </div>
                            ) : columnsError ? (
                                <div className={styles.errorBox}>
                                    <span className={styles.errorIcon}>⚠️</span>
                                    <span className={styles.errorText}>{columnsError}</span>
                                </div>
                            ) : availableColumns.length > 0 && (
                                <div className={styles.columnInfo}>
                                    <div className={styles.columnInfoHeader}>
                                        사용 가능한 컬럼 ({availableColumns.length}개)
                                    </div>
                                    <div className={styles.columnInfoDescription}>
                                        타겟 컬럼과 피처 컬럼을 선택하세요
                                    </div>
                                    <div className={styles.columnGrid}>
                                        {availableColumns.map(column => (
                                            <div key={column.name} className={styles.columnItem}>
                                                <div className={styles.columnName}>
                                                    {column.name}
                                                </div>
                                                <div className={styles.columnType}>
                                                    {column.type}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
    
                    {/* 타겟 컬럼 */}
                    <div className={styles.formField} style={{ marginBottom: '1.5rem' }}>
                        <label className={`${styles.formLabel} ${
                            config.task === 'clustering' || config.task === 'anomaly_detection' 
                                ? '' : styles.required
                        }`}>
                            타겟 컬럼 {(config.task === 'clustering' || config.task === 'anomaly_detection') && '(선택사항)'}
                        </label>

                        {config.use_mlflow_dataset && availableColumns.length > 0 ? (
                            <select
                                value={config.target_column}
                                onChange={(e) => handleConfigChange('target_column', e.target.value)}
                                className={styles.formSelect}
                            >
                                <option value="">선택하세요</option>
                                {availableColumns.map(column => (
                                    <option key={column.name} value={column.name}>
                                        {column.name} ({column.type})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={config.target_column}
                                onChange={(e) => handleConfigChange('target_column', e.target.value)}
                                className={styles.formInput}
                                placeholder="예: label, target, y"
                            />
                        )}
                        <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                            예측하고자 하는 목표 변수의 컬럼명
                        </small>
                        <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                            {config.task === 'clustering' 
                                ? '클러스터링은 비지도 학습이므로 타겟 컬럼이 필요하지 않습니다'
                                : config.task === 'anomaly_detection'
                                ? '이상 탐지는 라벨이 있으면 지도 학습, 없으면 비지도 학습으로 동작합니다'
                                : '예측하고자 하는 목표 변수의 컬럼명'}
                        </small>
                    </div>
                    
                    {/* 피처 컬럼 */}
                    <div className={styles.formField}>
                        <label className={styles.formLabel}>피처 컬럼 (선택사항)</label>
                        
                        {config.use_mlflow_dataset && availableColumns.length > 0 ? (
                            <div>
                                <div className={`${styles.featureSelection} ${config.feature_columns && config.feature_columns.length > 0 ? styles.hasSelection : ''}`}>
                                    {availableColumns
                                        .filter(col => col.name !== config.target_column)
                                        .map(column => {
                                            const isSelected = config.feature_columns?.includes(column.name);
                                            return (
                                                <button
                                                    key={column.name}
                                                    type="button"
                                                    onClick={() => toggleFeatureColumn(column.name)}
                                                    className={`${styles.featureChip} ${isSelected ? styles.selected : ''}`}
                                                >
                                                    {column.name}
                                                </button>
                                            );
                                        })}
                                </div>
                                <small style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>
                                    클릭하여 피처 컬럼 선택/해제. 비어있으면 타겟 컬럼을 제외한 모든 컬럼 사용
                                </small>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    value={featureColumnsString}
                                    onChange={(e) => handleFeatureColumnsChange(e.target.value)}
                                    className={styles.formInput}
                                    placeholder="예: feature1, feature2, feature3"
                                />
                                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                    쉼표로 구분하여 입력. 비어있으면 타겟 컬럼을 제외한 모든 컬럼을 피처로 사용
                                </small>
                            </>
                        )}
                    </div>
    
                    {/* 선택된 피처 요약 */}
                    {config.use_mlflow_dataset && config.feature_columns && config.feature_columns.length > 0 && (
                        <div className={styles.featureSummary}>
                            <div className={styles.summaryHeader}>
                                <span>✓</span>
                                선택된 피처: {config.feature_columns.length}개 컬럼
                            </div>
                            <div className={styles.summaryList}>
                                {config.feature_columns.join(', ')}
                            </div>
                        </div>
                    )}
                </div>
    
                {/* 데이터 요구사항 안내 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>데이터 요구사항</label>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
                        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                            <li>전처리가 완료된 데이터여야 합니다 (숫자 데이터, 원핫 인코딩 완료)</li>
                            <li>결측치(NaN)가 없어야 합니다</li>
                            <li>분류 작업의 경우 타겟 컬럼이 정수 라벨이어야 합니다</li>
                            <li>회귀 작업의 경우 타겟 컬럼이 연속형 숫자여야 합니다</li>
                            <li>지원 형식: .csv, .parquet</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataCategory;