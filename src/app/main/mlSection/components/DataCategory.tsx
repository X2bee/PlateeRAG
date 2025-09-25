'use client';

import React from 'react';
import styles from '@/app/main/mlSection/assets/MLTrain.module.scss';

interface MLConfig {
    hf_repo: string;
    hf_filename: string;
    hf_revision?: string;
    target_column: string;
    feature_columns?: string[];
}

interface DataCategoryProps {
    config: Pick<MLConfig, 'hf_repo' | 'hf_filename' | 'hf_revision' | 'target_column' | 'feature_columns'>;
    handleConfigChange: (key: keyof MLConfig, value: any) => void;
}

const DataCategory: React.FC<DataCategoryProps> = ({
    config,
    handleConfigChange
}) => {
    const handleFeatureColumnsChange = (value: string) => {
        if (value.trim() === '') {
            handleConfigChange('feature_columns', undefined);
        } else {
            const columns = value.split(',').map(col => col.trim()).filter(col => col !== '');
            handleConfigChange('feature_columns', columns);
        }
    };

    const featureColumnsString = config.feature_columns?.join(', ') || '';

    return (
        <div className={styles.configSection}>
            <div className={styles.configForm}>
                {/* HuggingFace 데이터셋 설정 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>HuggingFace 데이터셋 설정</label>
                    </div>
                    <div className={styles.formGrid}>
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
                        <div className={styles.formField}>
                            <label className={`${styles.formLabel} ${styles.required}`}>파일명</label>
                            <input
                                type="text"
                                value={config.hf_filename}
                                onChange={(e) => handleConfigChange('hf_filename', e.target.value)}
                                className={styles.formInput}
                                placeholder="예: train.csv 또는 data.parquet"
                            />
                            <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                .csv 또는 .parquet 파일만 지원
                            </small>
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>브랜치/태그 (선택사항)</label>
                            <input
                                type="text"
                                value={config.hf_revision || ''}
                                onChange={(e) => handleConfigChange('hf_revision', e.target.value || undefined)}
                                className={styles.formInput}
                                placeholder="예: main, v1.0 (기본값: main)"
                            />
                        </div>
                    </div>
                </div>

                {/* 컬럼 설정 */}
                <div className={styles.formGroup}>
                    <div className={styles.configHeader}>
                        <label>컬럼 설정</label>
                    </div>
                    <div className={styles.formGrid}>
                        <div className={styles.formField}>
                            <label className={`${styles.formLabel} ${styles.required}`}>타겟 컬럼</label>
                            <input
                                type="text"
                                value={config.target_column}
                                onChange={(e) => handleConfigChange('target_column', e.target.value)}
                                className={styles.formInput}
                                placeholder="예: label, target, y"
                            />
                            <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                예측하고자 하는 목표 변수의 컬럼명
                            </small>
                        </div>
                    </div>
                    
                    <div className={styles.formGrid} style={{ gridTemplateColumns: '1fr' }}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}>피처 컬럼 (선택사항)</label>
                            <input
                                type="text"
                                value={featureColumnsString}
                                onChange={(e) => handleFeatureColumnsChange(e.target.value)}
                                className={styles.formInput}
                                placeholder="예: feature1, feature2, feature3 (비어있으면 타겟 제외한 모든 컬럼 사용)"
                            />
                            <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                                쉼표로 구분하여 입력. 비어있으면 타겟 컬럼을 제외한 모든 컬럼을 피처로 사용
                            </small>
                        </div>
                    </div>
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