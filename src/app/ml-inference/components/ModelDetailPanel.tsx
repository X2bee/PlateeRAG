'use client';

import React from 'react';
import styles from './ModelDetailPanel.module.scss';
import type { ModelDetailResponse } from '../types';

interface ModelDetailPanelProps {
    model: ModelDetailResponse | null;
    isLoading: boolean;
    errorMessage: string | null;
    onRefetch?: () => void;
}

const ModelDetailPanel: React.FC<ModelDetailPanelProps> = ({ model, isLoading, errorMessage, onRefetch }) => {
    return (
        <section className={styles.detail}>
            <header className={styles.header}>
                <div>
                    <h2>모델 상세 정보</h2>
                    <p>선택한 모델의 메타데이터와 스키마를 확인하세요.</p>
                </div>
                {onRefetch ? (
                    <button type="button" onClick={onRefetch} disabled={isLoading}>
                        {isLoading ? '새로고침 중...' : '정보 새로고침'}
                    </button>
                ) : null}
            </header>

            {isLoading ? <p className={styles.info}>모델 정보를 불러오는 중입니다...</p> : null}
            {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

            {!isLoading && !errorMessage && !model ? (
                <p className={styles.info}>좌측 목록에서 모델을 선택하면 상세 정보가 표시됩니다.</p>
            ) : null}

            {model ? (
                <div className={styles.body}>
                    <dl className={styles.metaGrid}>
                        <div>
                            <dt>모델 ID</dt>
                            <dd>{model.model_id}</dd>
                        </div>
                        <div>
                            <dt>모델 이름</dt>
                            <dd>{model.model_name}</dd>
                        </div>
                        <div>
                            <dt>버전</dt>
                            <dd>{model.model_version ?? 'latest'}</dd>
                        </div>
                        <div>
                            <dt>프레임워크</dt>
                            <dd>{model.framework ?? '-'}</dd>
                        </div>
                        <div>
                            <dt>업로드한 사용자</dt>
                            <dd>{model.uploaded_by ?? '-'}</dd>
                        </div>
                        <div>
                            <dt>상태</dt>
                            <dd>{model.status ?? '-'}</dd>
                        </div>
                        <div>
                            <dt>파일 크기</dt>
                            <dd>{model.file_size ? `${model.file_size.toLocaleString()} B` : '-'}</dd>
                        </div>
                        <div>
                            <dt>파일 경로</dt>
                            <dd>{model.file_path ?? '-'}</dd>
                        </div>
                        <div>
                            <dt>저장 경로</dt>
                            <dd>{model.storage_path ?? '-'}</dd>
                        </div>
                        <div>
                            <dt>생성 시각</dt>
                            <dd>{model.created_at ? new Date(model.created_at).toLocaleString() : '-'}</dd>
                        </div>
                        <div>
                            <dt>수정 시각</dt>
                            <dd>{model.updated_at ? new Date(model.updated_at).toLocaleString() : '-'}</dd>
                        </div>
                    </dl>

                    <div className={styles.schemaSection}>
                        <h3>Input Schema</h3>
                        {model.input_schema && model.input_schema.length > 0 ? (
                            <ul>
                                {model.input_schema.map(field => (
                                    <li key={field}>{field}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.info}>등록된 입력 스키마가 없습니다.</p>
                        )}
                    </div>

                    <div className={styles.schemaSection}>
                        <h3>Output Schema</h3>
                        {model.output_schema && model.output_schema.length > 0 ? (
                            <ul>
                                {model.output_schema.map(field => (
                                    <li key={field}>{field}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.info}>등록된 출력 스키마가 없습니다.</p>
                        )}
                    </div>

                    {model.description ? (
                        <div className={styles.descriptionBox}>
                            <h3>설명</h3>
                            <p>{model.description}</p>
                        </div>
                    ) : null}

                    {model.metadata ? (
                        <div className={styles.metadataBox}>
                            <h3>메타데이터</h3>
                            <pre>{JSON.stringify(model.metadata, null, 2)}</pre>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </section>
    );
};

export default ModelDetailPanel;
