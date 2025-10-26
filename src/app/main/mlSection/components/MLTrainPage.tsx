'use client';

import React, { useState } from 'react';
import { FaCog, FaDatabase, FaBrain, FaChartLine } from 'react-icons/fa';
import BasicCategory from './BasicCategory';
import DataCategory from './DataCategory';
import ModelCategory from './ModelCategory';
import { mlAPI, mlUtils } from '@/app/_common/api/mlAPI';
import styles from '@/app/main/mlSection/assets/MLTrain.module.scss';

interface HyperparameterConfig {
    enable_hpo: boolean;
    n_trials: number;
    timeout_minutes?: number;
    param_spaces?: Record<string, any>;
}

interface MLConfig {
    // Basic config
    model_id: string;
    task: 'classification' | 'regression' | 'clustering' | 'anomaly_detection' | 'timeseries'
    test_size: number;
    validation_size: number;
    use_cv: boolean;
    cv_folds: number;

    // Data config
    hf_repo: string;
    hf_filename: string;
    hf_revision?: string;
    target_column: string;
    feature_columns?: string[];
    
    // MLflow data config (추가)
    use_mlflow_dataset: boolean;
    mlflow_run_id?: string;
    mlflow_experiment_name?: string;
    mlflow_artifact_path: string;

    // Model config
    model_names: string[];
    overrides?: Record<string, Record<string, any>>;

    // HPO config
    hpo_config?: HyperparameterConfig;

    // MLflow config (UI용)
    mlflow_tracking_uri: string;
    artifact_base_uri: string;
    s3_endpoint_url?: string;
    aws_access_key_id?: string;
    aws_secret_access_key?: string;
    aws_region: string;
    task_config?: Record<string, any>;

}

interface ModelResult {
    run_id: string;
    algorithm: string;
    metrics: {
        test: Record<string, number>;
        validation?: Record<string, number>;
        cross_validation?: {
            scores: number[];
            mean: number;
            std: number;
        };
    };
    training_duration: number;
    hpo_used?: boolean;
    hpo_results?: any;
    final_params?: Record<string, any>;
}

interface TrainResult {
    results: ModelResult[];
    best: {
        run_id: string;
        algorithm: string;
        metrics: {
            test: Record<string, number>;
            validation?: Record<string, number>;
        };
        hpo_used?: boolean;
    };
    runs_manifest_uri: string;
    registry: {
        model_name: string;
        production_version: string;
    };
    training_duration: number;
    feature_names: string[];
    training_timestamp: string;
    hpo_summary?: {
        enabled: boolean;
        models_optimized: number;
        config: HyperparameterConfig | null;
    };
    label_encoding?: {
        used: boolean;
        original_classes?: string[];
        label_mapping?: Record<string, number>;
    };
}

type TabKey = 'basic' | 'data' | 'model' | 'results';

const MLTrainPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabKey>('basic');
    const [isTraining, setIsTraining] = useState<boolean>(false);
    const [trainResult, setTrainResult] = useState<TrainResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [trainingMode, setTrainingMode] = useState<'sync' | 'async'>('sync');

    const [config, setConfig] = useState<MLConfig>({

        // Basic
        model_id: '',
        task: 'classification',
        test_size: 0.2,
        validation_size: 0.1,
        use_cv: false,
        cv_folds: 5,

        // Data
        hf_repo: '',
        hf_filename: '',
        hf_revision: undefined,
        target_column: '',
        feature_columns: undefined,
        
        // MLflow Data (추가)
        use_mlflow_dataset: false,
        mlflow_run_id: undefined,
        mlflow_experiment_name: undefined,
        mlflow_artifact_path: 'dataset',

        // Model
        model_names: [],
        overrides: undefined,

        // HPO
        hpo_config: {
            enable_hpo: false,
            n_trials: 50,
            timeout_minutes: undefined,
            param_spaces: undefined
        },

        // MLflow (UI 표시용)
        mlflow_tracking_uri: process.env.NEXT_PUBLIC_MLFLOW_TRACKING_URI || '',
        artifact_base_uri: 'file:///tmp/artifacts',
        s3_endpoint_url: undefined,
        aws_access_key_id: undefined,
        aws_secret_access_key: undefined,
        aws_region: 'ap-northeast-2',
    // Task config 추가
        task_config: {
            // timeseries
            lookback_window: 10,
            forecast_horizon: 1,
            time_column: undefined,
            // anomaly_detection
            contamination: 0.1,
            // clustering
            n_clusters: 3,
        },
});

    const handleConfigChange = (key: keyof MLConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const prepareTrainData = () => {
        const baseData: any = {
            model_id: config.model_id,
            task: config.task,
            target_column: config.target_column || null,  // clustering/anomaly_detection은 null 가능
            feature_columns: config.feature_columns || null,
            model_names: config.model_names,
            overrides: config.overrides || null,
            test_size: config.test_size,
            validation_size: config.validation_size,
            use_cv: config.use_cv,
            cv_folds: config.cv_folds,
            task_config: config.task_config || null,  // 태스크별 설정 추가
            hpo_config: config.hpo_config && config.hpo_config.enable_hpo ? {
                enable_hpo: true,
                n_trials: config.hpo_config.n_trials || 50,
                timeout_minutes: config.hpo_config.timeout_minutes || null,
                param_spaces: config.hpo_config.param_spaces || null
            } : null
        };

        // 데이터 소스에 따라 분기
        if (config.use_mlflow_dataset) {
            // MLflow 데이터셋 사용
            return {
                ...baseData,
                use_mlflow_dataset: true,
                mlflow_run_id: config.mlflow_run_id,
                mlflow_experiment_name: config.mlflow_experiment_name || null,
                mlflow_artifact_path: config.mlflow_artifact_path || 'dataset',
                // HuggingFace 필드는 null로
                hf_repo: null,
                hf_filename: null,
                hf_revision: null,
            };
        } else {
            // HuggingFace 데이터셋 사용
            return {
                ...baseData,
                use_mlflow_dataset: false,
                hf_repo: config.hf_repo,
                hf_filename: config.hf_filename,
                hf_revision: config.hf_revision || null,
                // MLflow 필드는 null로
                mlflow_run_id: null,
                mlflow_experiment_name: null,
                mlflow_artifact_path: null,
            };
        }
    };

    const handleTrain = async (): Promise<void> => {
        // 설정 검증
        const errors = mlUtils.validateTrainConfig(config);
        if (errors.length > 0) {
            setError(errors.join('\n'));
            return;
        }

        setIsTraining(true);
        setError(null);
        setCurrentTaskId(null);

        try {
            const trainData = prepareTrainData();
            console.log('Starting sync training with data:', trainData);

            // 동기 학습
            const result = await mlAPI.trainSync(trainData);
            console.log('Training completed:', result);

            setTrainResult(result);
        } catch (err: unknown) {
            const errorMessage = mlUtils.formatError(err);
            console.error('Training failed:', err);
            setError(errorMessage);
        } finally {
            setIsTraining(false);
        }
    };

    const handleAsyncTrain = async (): Promise<void> => {
        // 설정 검증
        const errors = mlUtils.validateTrainConfig(config);
        if (errors.length > 0) {
            setError(errors.join('\n'));
            return;
        }

        setIsTraining(true);
        setError(null);
        setCurrentTaskId(null);

        try {
            const trainData = prepareTrainData();
            console.log('Starting async training with data:', trainData);

            // 비동기 학습 시작
            const response = await mlAPI.trainAsync(trainData);
            const taskId = response.task_id;
            
            console.log('Async training started with task ID:', taskId);
            setCurrentTaskId(taskId);
            
            // 상태 폴링 시작
            const pollStatus = async () => {
                try {
                    const status = await mlAPI.getAsyncTaskStatus(taskId);
                    
                    if (status.status === 'completed' && status.result) {
                        setTrainResult(status.result);
                        setIsTraining(false);
                        setCurrentTaskId(null);
                        return;
                    } else if (status.status === 'failed') {
                        setError(status.error || '학습이 실패했습니다.');
                        setIsTraining(false);
                        setCurrentTaskId(null);
                        return;
                    } else if (status.status === 'running' || status.status === 'pending') {
                        // 아직 진행 중이면 3초 후 다시 확인
                        setTimeout(pollStatus, 3000);
                    } else {
                        // 알 수 없는 상태
                        console.warn(`Unknown task status: ${status.status}`);
                        setTimeout(pollStatus, 3000);
                    }
                } catch (err) {
                    console.error('Failed to get task status:', err);
                    setError('학습 상태 확인에 실패했습니다.');
                    setIsTraining(false);
                    setCurrentTaskId(null);
                }
            };
            
            // 첫 번째 상태 확인을 3초 후에 시작
            setTimeout(pollStatus, 3000);
            
        } catch (err: unknown) {
            const errorMessage = mlUtils.formatError(err);
            console.error('Async training failed:', err);
            setError(errorMessage);
            setIsTraining(false);
            setCurrentTaskId(null);
        }
    };

    const handleCancelAsyncTrain = () => {
        setIsTraining(false);
        setCurrentTaskId(null);
        setError('학습이 취소되었습니다.');
    };

    const baseTabs = [
        { key: 'basic' as const, label: '기본 설정', icon: FaCog },
        { key: 'data' as const, label: '데이터 설정', icon: FaDatabase },
        { key: 'model' as const, label: '모델 설정', icon: FaBrain },
    ];
    
    // 결과가 있으면 탭에 추가
    const tabs = baseTabs;

    return (
        <div className={styles.container}>
            <div className={styles.contentArea}>
                <div className={styles.tabNavigation}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            className={`${styles.tabButton} ${
                                activeTab === tab.key ? styles.active : ''
                            }`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <tab.icon />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className={styles.configWrapper}>
                    {activeTab === 'basic' && (
                        <BasicCategory
                            config={config}
                            handleConfigChange={handleConfigChange}
                        />
                    )}

                    {activeTab === 'data' && (
                        <DataCategory
                            config={config}
                            handleConfigChange={handleConfigChange}
                        />
                    )}

                    {activeTab === 'model' && (
                        <ModelCategory
                            config={config}
                            handleConfigChange={handleConfigChange}
                        />
                    )}

                    {activeTab !== 'results' && (
                        <div className={styles.formActions}>
                            <div className={styles.actionGroup}>
                                {error && (
                                    <div style={{ 
                                        color: '#dc2626', 
                                        fontSize: '0.875rem',
                                        whiteSpace: 'pre-line',
                                        maxWidth: '400px'
                                    }}>
                                        {error}
                                    </div>
                                )}
                                
                                {currentTaskId && (
                                    <div style={{ 
                                        color: '#1e40af', 
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <div className={styles.spinner} style={{ width: '16px', height: '16px' }} />
                                        비동기 학습 진행 중... (Task ID: {currentTaskId})
                                    </div>
                                )}
                            </div>
                            
                            <div className={styles.actionGroup}>
                                {/* 학습 모드 선택 */}
                                {!isTraining && (
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '1rem',
                                        marginRight: '1rem'
                                    }}>
                                        <label style={{ fontSize: '0.875rem', color: '#374151' }}>
                                            학습 방식:
                                        </label>
                                        <label className={styles.checkboxLabel} style={{ fontSize: '0.875rem' }}>
                                            <input
                                                type="radio"
                                                name="trainingMode"
                                                value="sync"
                                                checked={trainingMode === 'sync'}
                                                onChange={(e) => setTrainingMode(e.target.value as 'sync' | 'async')}
                                            />
                                            동기 (즉시 결과)
                                        </label>
                                        <label className={styles.checkboxLabel} style={{ fontSize: '0.875rem' }}>
                                            <input
                                                type="radio"
                                                name="trainingMode"
                                                value="async"
                                                checked={trainingMode === 'async'}
                                                onChange={(e) => setTrainingMode(e.target.value as 'sync' | 'async')}
                                            />
                                            비동기 (백그라운드)
                                        </label>
                                    </div>
                                )}

                                {/* 학습 버튼들 */}
                                {!currentTaskId ? (
                                    <button
                                        className={`${styles.button} ${styles.primary} ${styles.large}`}
                                        onClick={trainingMode === 'sync' ? handleTrain : handleAsyncTrain}
                                        disabled={isTraining}
                                    >
                                        {isTraining && <div className={styles.spinner} />}
                                        {isTraining ? 
                                            (trainingMode === 'sync' ? '동기 학습 중...' : '비동기 학습 시작 중...') : 
                                            (trainingMode === 'sync' ? '동기 학습 시작' : '비동기 학습 시작')
                                        }
                                        {config.hpo_config?.enable_hpo && (
                                            <span style={{ 
                                                marginLeft: '0.5rem',
                                                padding: '0.125rem 0.375rem',
                                                background: 'rgba(255, 255, 255, 0.2)',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem'
                                            }}>
                                                HPO
                                            </span>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        className={`${styles.button} ${styles.secondary} ${styles.large}`}
                                        onClick={handleCancelAsyncTrain}
                                    >
                                        학습 취소
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* HPO 활성화 시 추가 안내 */}
                {config.hpo_config?.enable_hpo && activeTab !== 'results' && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: '#f0f9ff',
                        border: '1px solid #0ea5e9',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem'
                    }}>
                        <div style={{ fontWeight: 500, color: '#1e40af', marginBottom: '0.5rem' }}>
                            하이퍼파라미터 최적화(HPO) 활성화됨
                        </div>
                        <div style={{ color: '#1e40af' }}>
                            • 최적화 시도 횟수: {config.hpo_config.n_trials}회
                            {config.hpo_config.timeout_minutes && (
                                <span> • 최대 실행 시간: {config.hpo_config.timeout_minutes}분</span>
                            )}
                        </div>
                        <div style={{ color: '#1e40af', marginTop: '0.25rem' }}>
                            HPO는 각 모델의 최적 파라미터를 자동으로 찾아 더 높은 성능을 달성합니다.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MLTrainPage;