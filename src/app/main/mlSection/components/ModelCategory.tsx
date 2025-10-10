// ModelCategory.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { mlAPI } from '@/app/_common/api/mlAPI';
import styles from '@/app/main/mlSection/assets/MLTrain.module.scss';
import UserScriptWorkbench from './UserScriptWorkbench';

interface HyperparameterConfig {
    enable_hpo: boolean;
    n_trials: number;
    timeout_minutes?: number;
    param_spaces?: Record<string, any>;
}

interface MLConfig {
    task: 'classification' | 'regression' | 'clustering' | 'anomaly_detection' | 'timeseries';
    model_names: string[];
    overrides?: Record<string, Record<string, any>>;
    hpo_config?: HyperparameterConfig;
}

interface ModelCategoryProps {
    config: Pick<MLConfig, 'task' | 'model_names' | 'overrides' | 'hpo_config'>;
    handleConfigChange: (key: keyof MLConfig, value: any) => void;
}

interface Model {
    name: string;
    label?: string;
    description?: string;
    cls: string;
    script_path?: string;
    version?: string;
    task?: string;
    default?: Record<string, any>;
    tags?: string[];
}

interface CatalogEntry {
    name: string;
    display_name?: string;
    description?: string;
    script_path?: string;
    version?: string;
    task?: string;
    tags?: string[];
}

const ModelCategory: React.FC<ModelCategoryProps> = ({
    config,
    handleConfigChange
}) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showUserScriptWorkspace, setShowUserScriptWorkspace] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [availableModels, setAvailableModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(false);
    const [localValue, setLocalValue] = useState(config.hpo_config?.n_trials?.toString() || '10');

    const [error, setError] = useState<string | null>(null);

    // 모델 카탈로그 로드
    useEffect(() => {
        loadModelsForTask();
    }, [config.task]);

    const loadModelsForTask = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // API에서 해당 태스크의 모델들을 가져옴
            const response = await mlAPI.getModelsForTask(config.task);
            setAvailableModels(response.models || []);
        } catch (err) {
            console.error('Failed to load models:', err);
            setError('모델 목록을 불러오는데 실패했습니다.');
            setAvailableModels([]);
        } finally {
            setLoading(false);
        }
    };

    // getDefaultModels 함수 제거 - API에서 가져오므로 불필요

    const handleModelSelection = (modelName: string, selected: boolean) => {
        if (selected) {
            handleConfigChange('model_names', [...config.model_names, modelName]);
        } else {
            handleConfigChange('model_names', config.model_names.filter(name => name !== modelName));
        }
    };

    const handleOverrideChange = (modelName: string, paramKey: string, value: any) => {
        const currentOverrides = config.overrides || {};
        const modelOverrides = currentOverrides[modelName] || {};
        
        const newOverrides = {
            ...currentOverrides,
            [modelName]: {
                ...modelOverrides,
                [paramKey]: value
            }
        };

        handleConfigChange('overrides', newOverrides);
    };

    const handleHPOConfigChange = (key: keyof HyperparameterConfig, value: any) => {
        const currentHPOConfig = config.hpo_config || {
            enable_hpo: false,
            n_trials: 50,
            timeout_minutes: undefined,
            param_spaces: undefined
        };

        handleConfigChange('hpo_config', {
            ...currentHPOConfig,
            [key]: value
        });
    };

    const handleCatalogEntry = (entry?: CatalogEntry | null) => {
        if (!entry?.name) {
            return;
        }

        setAvailableModels((prev) => {
            const normalizedModel: Model = {
                name: entry.name,
                label: entry.display_name || entry.name,
                description:
                    entry.description ||
                    '등록된 사용자 스크립트입니다. 학습에 사용하려면 선택하세요.',
                cls: 'user_script',
                script_path: entry.script_path,
                version: entry.version,
                task: entry.task,
                default: {},
                tags: entry.tags?.length ? entry.tags : ['user_script'],
            };

            const exists = prev.some((model) => model.name === entry.name);
            if (exists) {
                return prev.map((model) => (model.name === entry.name ? normalizedModel : model));
            }
            return [...prev, normalizedModel];
        });
    };

    return (
        <div className={styles.configSection}>
            <div className={styles.configForm}>
                {/* 모델 선택 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>모델 선택</label>
                        {loading && (
                            <div className={styles.spinner} style={{ width: '16px', height: '16px' }} />
                        )}
                        {error && (
                            <button 
                                onClick={loadModelsForTask}
                                className={`${styles.button} ${styles.secondary}`}
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            >
                                재시도
                            </button>
                        )}
                    </div>
                    
                    {error ? (
                        <div style={{ 
                            color: '#dc2626', 
                            fontSize: '0.875rem', 
                            padding: '1rem',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    ) : (
                        <>
                            <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                학습할 모델을 선택하세요. 여러 모델을 선택하여 성능을 비교할 수 있습니다.
                            </div>
                            
                            <div className={styles.checkboxGroup} style={{ flexDirection: 'column', gap: '0.75rem' }}>
                                {availableModels.map((model) => (
                                    <label
                                        key={model.name}
                                        className={`${styles.checkboxLabel} ${
                                            config.model_names.includes(model.name) ? styles.highlighted : ''
                                        }`}
                                        style={{ 
                                            padding: '0.75rem', 
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '0.5rem',
                                            alignItems: 'flex-start',
                                            gap: '0.75rem'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={config.model_names.includes(model.name)}
                                            onChange={(e) => handleModelSelection(model.name, e.target.checked)}
                                            className={styles.checkbox}
                                            style={{ marginTop: '0.125rem' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 500, color: '#374151' }}>
                                                {model.label || model.name}
                                                {model.tags?.includes('high_performance') && (
                                                    <span style={{ 
                                                        marginLeft: '0.5rem',
                                                        padding: '0.125rem 0.25rem',
                                                        background: '#3b82f6',
                                                        color: 'white',
                                                        fontSize: '0.625rem',
                                                        borderRadius: '0.25rem'
                                                    }}>
                                                        고성능
                                                    </span>
                                                )}
                                                {model.tags?.includes('user_script') && (
                                                    <span style={{ 
                                                        marginLeft: '0.5rem',
                                                        padding: '0.125rem 0.25rem',
                                                        background: '#0f172a',
                                                        color: 'white',
                                                        fontSize: '0.625rem',
                                                        borderRadius: '0.25rem'
                                                    }}>
                                                        사용자
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                                {model.description}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.userScriptCTA}>
                    <div className={styles.userScriptCTAContent}>
                        <span className={styles.userScriptCTATitle}>사용자 지정 모델</span>
                        <span className={styles.userScriptCTADescription}>
                            🚧(현재 개발 진행중)자체 스크립트를 작성·검증·등록하여 카탈로그에 추가할 수 있습니다.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowUserScriptWorkspace(prev => !prev)}
                        className={`${styles.button} ${styles.secondary}`}
                    >
                        {showUserScriptWorkspace ? '작업 공간 닫기' : '작업 공간 열기'}
                    </button>
                </div>

                {/* 하이퍼파라미터 최적화 (HPO) 설정 */}
                {config.model_names.length > 0 && (
                    <div className={styles.formGroup}>
                        <div className={styles.configHeader}>
                            <label>하이퍼파라미터 최적화 (HPO)</label>
                        </div>
                        
                        <div className={styles.formRow}>
                            <div className={styles.checkboxGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={config.hpo_config?.enable_hpo || false}
                                        onChange={(e) => handleHPOConfigChange('enable_hpo', e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    자동 하이퍼파라미터 최적화 사용
                                </label>
                            </div>
                        </div>
    
                        {config.hpo_config?.enable_hpo && (
                            <div style={{ 
                                padding: '1rem', 
                                background: '#f0f9ff', 
                                borderRadius: '0.5rem',
                                border: '1px solid #0ea5e9',
                                marginTop: '0.75rem'
                            }}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>최적화 시도 횟수</label>
                                        <input
                                            type="number"
                                            value={localValue}
                                            onChange={(e) => setLocalValue(e.target.value)}
                                            onBlur={(e) => {
                                                const val = parseInt(e.target.value) || 10;
                                                const clamped = Math.min(Math.max(val, 10), 500);
                                                handleHPOConfigChange('n_trials', clamped);
                                                setLocalValue(clamped.toString());
                                            }}
                                            className={styles.formInput}
                                            min="10"
                                            max="500"
                                        />
                                        <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                            더 많은 시도는 더 좋은 결과를 가져올 수 있지만 시간이 더 오래 걸립니다
                                        </small>
                                    </div>
                                    <div className={styles.formField}>
                                        <label className={styles.formLabel}>최대 실행 시간 (분)</label>
                                        <input
                                            type="number"
                                            value={config.hpo_config.timeout_minutes || ''}
                                            onChange={(e) => handleHPOConfigChange('timeout_minutes', e.target.value ? parseInt(e.target.value) : undefined)}
                                            className={styles.formInput}
                                            min="5"
                                            max="120"
                                            placeholder="제한 없음"
                                        />
                                        <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                            비어두면 시간 제한 없이 모든 시도를 완료합니다
                                        </small>
                                    </div>
                                </div>
    
                                <div style={{ 
                                    marginTop: '0.75rem',
                                    padding: '0.75rem',
                                    background: '#ffffff',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem'
                                }}>
                                    <div style={{ fontWeight: 500, color: '#1e40af', marginBottom: '0.5rem' }}>
                                        HPO 안내사항
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#1e40af' }}>
                                        <li>XGBoost, Random Forest 등 주요 모델에 대해 최적화를 수행합니다</li>
                                        <li>베이지안 최적화(TPE)를 사용하여 효율적으로 탐색합니다</li>
                                        <li>최적화 과정은 MLflow에 기록되어 나중에 분석할 수 있습니다</li>
                                        <li>HPO가 적용된 모델은 결과에서 별도 표시됩니다</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
    
                {/* 수동 하이퍼파라미터 설정 */}
                {config.model_names.length > 0 && !config.hpo_config?.enable_hpo && (
                    <div className={styles.formGroup}>
                        <div className={styles.configHeader}>
                            <label>수동 하이퍼파라미터 설정 (선택사항)</label>
                        </div>
                        
                        <div className={styles.formRow}>
                            <div className={styles.checkboxGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={showAdvanced}
                                        onChange={(e) => setShowAdvanced(e.target.checked)}
                                        className={styles.checkbox}
                                    />
                                    고급 설정 표시
                                </label>
                            </div>
                        </div>
    
                        {showAdvanced && (
                            <div>
                                <div className={styles.formField} style={{ marginBottom: '1rem' }}>
                                    <label className={styles.formLabel}>모델 선택</label>
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className={styles.formSelect}
                                    >
                                        <option value="">설정할 모델을 선택하세요</option>
                                        {config.model_names.map((modelName) => {
                                            const model = availableModels.find(m => m.name === modelName);
                                            return (
                                                <option key={modelName} value={modelName}>
                                                    {model?.label || modelName}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
    
                                {selectedModel && (
                                    <ModelParameterForm
                                        modelName={selectedModel}
                                        modelInfo={availableModels.find(m => m.name === selectedModel)}
                                        currentParams={config.overrides?.[selectedModel] || {}}
                                        onParamChange={(key, value) => handleOverrideChange(selectedModel, key, value)}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {showUserScriptWorkspace && (
                <div className={styles.userScriptWorkspace}>
                    <UserScriptWorkbench
                        task={config.task}
                        onCatalogEntry={handleCatalogEntry}
                        onRefreshCatalog={loadModelsForTask}
                    />
                </div>
            )}
        </div>
    );
};

/// 모델별 파라미터 폼 컴포넌트
const ModelParameterForm: React.FC<{
    modelName: string;
    modelInfo?: Model;
    currentParams: Record<string, any>;
    onParamChange: (key: string, value: any) => void;
}> = ({ modelName, modelInfo, currentParams, onParamChange }) => {
    const renderParameterFields = () => {
        switch (modelName) {
            case 'xgboost':
                return (
                    <div className={styles.formGrid}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>n_estimators</label>
                            <input
                                type="number"
                                value={currentParams.n_estimators || 300}
                                onChange={(e) => onParamChange('n_estimators', parseInt(e.target.value))}
                                className={styles.formInput}
                                min="10"
                                max="1000"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>max_depth</label>
                            <input
                                type="number"
                                value={currentParams.max_depth || 6}
                                onChange={(e) => onParamChange('max_depth', parseInt(e.target.value))}
                                className={styles.formInput}
                                min="3"
                                max="12"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>learning_rate</label>
                            <input
                                type="number"
                                value={currentParams.learning_rate || 0.1}
                                onChange={(e) => onParamChange('learning_rate', parseFloat(e.target.value))}
                                className={styles.formInput}
                                min="0.01"
                                max="1"
                                step="0.01"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>subsample</label>
                            <input
                                type="number"
                                value={currentParams.subsample || 0.8}
                                onChange={(e) => onParamChange('subsample', parseFloat(e.target.value))}
                                className={styles.formInput}
                                min="0.5"
                                max="1"
                                step="0.1"
                            />
                        </div>
                    </div>
                );
            
            case 'random_forest':
                return (
                    <div className={styles.formGrid}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>n_estimators</label>
                            <input
                                type="number"
                                value={currentParams.n_estimators || 300}
                                onChange={(e) => onParamChange('n_estimators', parseInt(e.target.value))}
                                className={styles.formInput}
                                min="10"
                                max="1000"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>max_depth</label>
                            <input
                                type="number"
                                value={currentParams.max_depth || 12}
                                onChange={(e) => onParamChange('max_depth', parseInt(e.target.value))}
                                className={styles.formInput}
                                min="3"
                                max="50"
                            />
                        </div>
                    </div>
                );
            
            case 'svm':
                return (
                    <div className={styles.formGrid}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>C (정규화 강도)</label>
                            <input
                                type="number"
                                value={currentParams.C || 1.0}
                                onChange={(e) => onParamChange('C', parseFloat(e.target.value))}
                                className={styles.formInput}
                                min="0.001"
                                max="1000"
                                step="0.1"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>kernel</label>
                            <select
                                value={currentParams.kernel || 'rbf'}
                                onChange={(e) => onParamChange('kernel', e.target.value)}
                                className={styles.formSelect}
                            >
                                <option value="rbf">RBF</option>
                                <option value="linear">Linear</option>
                                <option value="poly">Polynomial</option>
                                <option value="sigmoid">Sigmoid</option>
                            </select>
                        </div>
                    </div>
                );
            
            default:
                return (
                    <div style={{ 
                        color: '#6b7280', 
                        fontSize: '0.875rem',
                        textAlign: 'center',
                        padding: '1rem'
                    }}>
                        {modelName}에 대한 파라미터 설정이 준비 중입니다.
                    </div>
                );
        }
    };

    return (
        <div style={{ 
            padding: '1rem', 
            background: '#f9fafb', 
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
        }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                {modelInfo?.label || modelName} 설정
            </h4>
            {renderParameterFields()}
        </div>
    );
};

export default ModelCategory;
