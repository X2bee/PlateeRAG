'use client';

import React, { useState, useEffect, ReactElement} from 'react';
import { mlAPI, mlUtils } from '@/app/_common/api/mlAPI';
import styles from '@/app/main/mlSection/assets/MLTrain.module.scss';

// 타입 정의
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
}

interface TrainResult {
    results: ModelResult[];
    best?: {
        run_id: string;
        algorithm: string;
        metrics: {
            test: Record<string, number>;
            validation?: Record<string, number>;
        };
        hpo_used?: boolean;
    };
    runs_manifest_uri?: string;
    registry?: {  // 옵셔널로 변경
        model_name: string;
        production_version: string;
    };
    training_duration: number;
    feature_names: string[];
    training_timestamp: string;
    hpo_summary?: {
        enabled: boolean;
        models_optimized: number;
        config: any;
    };
    label_encoding?: {
        used: boolean;
        original_classes?: string[];
        label_mapping?: Record<string, number>;
    };
}


interface RunStatus {
    status: string;
    start_time?: string;
    end_time?: string;
    progress?: number;
}

interface Experiment {
    experiment_id: string;
    name: string;
    lifecycle_stage: string;
    creation_time?: string;
    last_update_time?: string;
}

interface TrainResultsProps {
    result: TrainResult | null;
}

const TrainResults: React.FC<TrainResultsProps> = ({ result }) => {
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [loadingExperiments, setLoadingExperiments] = useState<boolean>(false);
    const [experimentsError, setExperimentsError] = useState<string | null>(null);
    const [showExperiments, setShowExperiments] = useState<boolean>(false);
    
    // 학습 상태 추적
    const [runStatuses, setRunStatuses] = useState<Record<string, RunStatus>>({});
    const [loadingStatuses, setLoadingStatuses] = useState<boolean>(false);

    // 실험 목록 로드
    const loadExperiments = async (): Promise<void> => {
        setLoadingExperiments(true);
        setExperimentsError(null);
        
        try {
            const experimentList = await mlAPI.getExperiments();
            setExperiments(experimentList);
        } catch (error) {
            setExperimentsError(mlUtils.formatError(error));
        } finally {
            setLoadingExperiments(false);
        }
    };

    // Run 상태 확인
    const loadRunStatuses = async (): Promise<void> => {
        if (!result || !result.results) return;
        
        setLoadingStatuses(true);
        const statuses: Record<string, RunStatus> = {};
        
        try {
            await Promise.all(
                result.results.map(async (modelResult: ModelResult) => {
                    try {
                        const status = await mlAPI.getTrainingStatus(modelResult.run_id);
                        statuses[modelResult.run_id] = status;
                    } catch (error) {
                        console.warn(`Failed to get status for run ${modelResult.run_id}:`, error);
                        statuses[modelResult.run_id] = { status: 'UNKNOWN' };
                    }
                })
            );
        } catch (error) {
            console.error('Error loading run statuses:', error);
        } finally {
            setRunStatuses(statuses);
            setLoadingStatuses(false);
        }
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        if (result) {
            loadExperiments();
            loadRunStatuses();
        }
    }, [result]);

    const formatDuration = (seconds: number): string => {
        if (seconds < 60) return `${seconds.toFixed(1)}초`;
        if (seconds < 3600) return `${(seconds / 60).toFixed(1)}분`;
        return `${(seconds / 3600).toFixed(1)}시간`;
    };

    const formatMetric = (value: number): string => {
        return value.toFixed(4);
    };

    const formatTimestamp = (timestamp: string | number | undefined): string => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString('ko-KR');
    };

    const getStatusBadge = (status: string): ReactElement => {
        const statusStyles: Record<string, { background: string; color: string; text: string }> = {
            'FINISHED': { background: '#dcfce7', color: '#166534', text: '완료' },
            'RUNNING': { background: '#dbeafe', color: '#1d4ed8', text: '실행중' },
            'FAILED': { background: '#fee2e2', color: '#dc2626', text: '실패' },
            'SCHEDULED': { background: '#fef3c7', color: '#d97706', text: '예약됨' },
            'KILLED': { background: '#f3f4f6', color: '#6b7280', text: '중단됨' },
            'UNKNOWN': { background: '#f3f4f6', color: '#6b7280', text: '알 수 없음' }
        };

        const style = statusStyles[status] || statusStyles['UNKNOWN'];
        
        return (
            <span style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '500',
                ...style
            }}>
                {style.text}
            </span>
        );
    };

    if (!result) {
        return (
            <div className={styles.configSection}>
                <div className={styles.resultsSection}>
                    <div className={styles.resultsHeader}>
                        학습 결과
                    </div>
                    <div style={{ 
                        textAlign: 'center', 
                        color: '#6b7280', 
                        fontSize: '0.875rem',
                        padding: '2rem'
                    }}>
                        학습을 시작하면 결과가 여기에 표시됩니다.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.configSection}>
            <div className={styles.resultsSection}>
                <div className={styles.resultsHeader}>
                    학습 결과
                    <button
                        className={`${styles.button} ${styles.secondary}`}
                        onClick={() => {
                            loadExperiments();
                            loadRunStatuses();
                        }}
                        style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                    >
                        새로고침
                    </button>
                </div>
                
                {/* 전체 요약 */}
                <div style={{ 
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: '#f0f9ff',
                    border: '1px solid #0ea5e9',
                    borderRadius: '0.5rem'
                }}>
                    <div style={{ fontWeight: 600, color: '#0c4a6e', marginBottom: '0.5rem' }}>
                        학습 완료 요약
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                    <div>
                        <span style={{ color: '#6b7280' }}>총 학습 시간: </span>
                        <span style={{ fontWeight: 500 }}>{formatDuration(result.training_duration)}</span>
                    </div>
                    <div>
                        <span style={{ color: '#6b7280' }}>학습된 모델 수: </span>
                        <span style={{ fontWeight: 500 }}>{result.results?.length || 0}개</span>
                    </div>
                    {result.best && (
                        <div>
                            <span style={{ color: '#6b7280' }}>베스트 모델: </span>
                            <span style={{ fontWeight: 500 }}>{result.best.algorithm}</span>
                        </div>
                    )}
                    {result.registry?.production_version && (
                        <div>
                            <span style={{ color: '#6b7280' }}>등록 버전: </span>
                            <span style={{ fontWeight: 500 }}>v{result.registry.production_version}</span>
                        </div>
                    )}
                </div>
                </div>

                {/* 모델별 결과 */}
                <div className={styles.resultsContent}>
                    {result.results.map((modelResult: ModelResult, index: number) => {
                        const isBest = modelResult.run_id === result.best?.run_id;
                        const runStatus = runStatuses[modelResult.run_id];
                        
                        return (
                            <div 
                                key={modelResult.run_id}
                                className={`${styles.modelResult} ${isBest ? styles.bestModel : ''}`}
                            >
                                <div className={styles.modelName}>
                                    {modelResult.algorithm}
                                    {isBest && (
                                        <span style={{ 
                                            marginLeft: '0.5rem',
                                            padding: '0.125rem 0.5rem',
                                            background: '#3b82f6',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            borderRadius: '0.25rem',
                                            fontWeight: 'normal'
                                        }}>
                                            BEST
                                        </span>
                                    )}
                                    <div style={{ marginLeft: '0.5rem' }}>
                                        {runStatus ? getStatusBadge(runStatus.status) : 
                                         loadingStatuses ? <div className={styles.spinner} style={{ width: '12px', height: '12px' }} /> : null}
                                    </div>
                                </div>
                                
                                <div style={{ 
                                    marginBottom: '0.75rem',
                                    fontSize: '0.75rem',
                                    color: '#6b7280'
                                }}>
                                    <div>Run ID: {modelResult.run_id}</div>
                                    <div>학습 시간: {formatDuration(modelResult.training_duration)}</div>
                                    {runStatus?.start_time && (
                                        <div>시작 시간: {formatTimestamp(runStatus.start_time)}</div>
                                    )}
                                    {runStatus?.end_time && (
                                        <div>종료 시간: {formatTimestamp(runStatus.end_time)}</div>
                                    )}
                                </div>

                                <div className={styles.modelMetrics}>
                                    <div>
                                        <strong>테스트 메트릭:</strong>
                                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                            {Object.entries(modelResult.metrics.test).map(([key, value]) => (
                                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{key}:</span>
                                                    <span style={{ fontWeight: 500 }}>{formatMetric(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {modelResult.metrics.validation && (
                                        <div>
                                            <strong>검증 메트릭:</strong>
                                            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                                {Object.entries(modelResult.metrics.validation).map(([key, value]) => (
                                                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>{key}:</span>
                                                        <span style={{ fontWeight: 500 }}>{formatMetric(value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {modelResult.metrics.cross_validation && (
                                        <div>
                                            <strong>교차 검증:</strong>
                                            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>평균:</span>
                                                    <span style={{ fontWeight: 500 }}>{formatMetric(modelResult.metrics.cross_validation.mean)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>표준편차:</span>
                                                    <span style={{ fontWeight: 500 }}>{formatMetric(modelResult.metrics.cross_validation.std)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* MLflow 실험 정보 */}
                <div style={{ 
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '0.75rem' 
                    }}>
                        <div style={{ fontWeight: 600, color: '#374151' }}>
                            MLflow 실험 목록
                        </div>
                        <button
                            className={`${styles.button} ${styles.secondary}`}
                            onClick={() => setShowExperiments(!showExperiments)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        >
                            {showExperiments ? '숨기기' : '보기'}
                        </button>
                    </div>
                    
                    {showExperiments && (
                        <div>
                            {loadingExperiments ? (
                                <div style={{ textAlign: 'center', padding: '1rem' }}>
                                    <div className={styles.spinner} />
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                        실험 목록 로딩 중...
                                    </div>
                                </div>
                            ) : experimentsError ? (
                                <div style={{ color: '#dc2626', fontSize: '0.875rem', padding: '1rem' }}>
                                    에러: {experimentsError}
                                </div>
                            ) : experiments.length === 0 ? (
                                <div style={{ color: '#6b7280', fontSize: '0.875rem', padding: '1rem' }}>
                                    등록된 실험이 없습니다.
                                </div>
                            ) : (
                                <div style={{ 
                                    display: 'grid',
                                    gap: '0.5rem',
                                    fontSize: '0.75rem'
                                }}>
                                    {experiments.map((exp: Experiment) => (
                                        <div 
                                            key={exp.experiment_id}
                                            style={{
                                                padding: '0.75rem',
                                                background: '#ffffff',
                                                borderRadius: '0.25rem',
                                                border: '1px solid #e5e7eb',
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 150px 100px',
                                                gap: '1rem',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 500, color: '#374151' }}>
                                                    {exp.name}
                                                </div>
                                                <div style={{ color: '#6b7280', fontSize: '0.7rem' }}>
                                                    ID: {exp.experiment_id}
                                                </div>
                                            </div>
                                            <div style={{ color: '#6b7280' }}>
                                                {exp.creation_time ? formatTimestamp(exp.creation_time) : 'N/A'}
                                            </div>
                                            <div>
                                                <span style={{
                                                    padding: '0.125rem 0.375rem',
                                                    background: exp.lifecycle_stage === 'active' ? '#dcfce7' : '#f3f4f6',
                                                    color: exp.lifecycle_stage === 'active' ? '#166534' : '#6b7280',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.65rem'
                                                }}>
                                                    {exp.lifecycle_stage === 'active' ? '활성' : '비활성'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 피처 정보 */}
                {result.feature_names && result.feature_names.length > 0 && (
                    <div style={{ 
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: '#f9fafb',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ 
                            fontWeight: 600, 
                            color: '#374151', 
                            marginBottom: '0.75rem' 
                        }}>
                            사용된 피처 ({result.feature_names.length}개)
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '0.25rem',
                            fontSize: '0.75rem'
                        }}>
                            {result.feature_names.map((feature: string, index: number) => (
                                <span 
                                    key={index}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        background: '#e5e7eb',
                                        borderRadius: '0.25rem',
                                        color: '#374151'
                                    }}
                                >
                                    {feature}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 라벨 인코딩 정보 섹션 - 여기에 추가 */}
                {result.label_encoding?.used && (
                    <div style={{ 
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: '#fef3c7',
                        borderRadius: '0.5rem',
                        border: '1px solid #f59e0b'
                    }}>
                        <div style={{ 
                            fontWeight: 600, 
                            color: '#92400e', 
                            marginBottom: '0.5rem' 
                        }}>
                            라벨 인코딩 정보
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                            <div><strong>원본 클래스:</strong> {result.label_encoding.original_classes?.join(', ')}</div>
                            <div style={{ marginTop: '0.25rem' }}>
                                <strong>숫자 매핑:</strong> {JSON.stringify(result.label_encoding.label_mapping)}
                            </div>
                            <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                                예측 시 자동으로 원본 라벨로 변환됩니다.
                            </div>
                        </div>
                    </div>
                )}
                                {/* 추가 정보 */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: '#fffbeb',
                    borderRadius: '0.5rem',
                    border: '1px solid #f59e0b',
                    fontSize: '0.875rem'
                }}>
                    <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '0.5rem' }}>
                        모델 사용 안내
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e' }}>
                        <li>베스트 모델이 MLflow Model Registry에 Production 단계로 등록되었습니다</li>
                        <li>모델 ID '{result.registry?.model_name}'로 추론 API에서 사용 가능합니다</li>
                        <li>MLflow UI에서 상세한 실험 기록을 확인할 수 있습니다</li>
                        <li>학습 시간: {new Date(result.training_timestamp).toLocaleString('ko-KR')}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default TrainResults;