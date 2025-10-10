'use client';

import React from 'react';
import styles from './ModelDetailPanel.module.scss';
import type { ModelDetailResponse } from '../../types';
import { normalizeSchema } from '../MlModelWorkspaceContext';

const KST_FORMATTER = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
});

interface ModelDetailPanelProps {
    model: ModelDetailResponse | null;
    isLoading: boolean;
    errorMessage: string | null;
    onRefetch?: () => void;
    className?: string;
    showRefreshButton?: boolean;
    actionSlot?: React.ReactNode;
}

const ModelDetailPanel: React.FC<ModelDetailPanelProps> = ({
    model,
    isLoading,
    errorMessage,
    onRefetch,
    className,
    showRefreshButton = true,
    actionSlot,
}) => {
    const sectionClassName = className ? `${styles.detail} ${className}` : styles.detail;

    const formatLabel = (label: string) =>
        label
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());

    const formatValue = (value: unknown) => {
        if (value === null || value === undefined || value === '') {
            return '-';
        }

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        return <pre className={styles.codeBlock}>{JSON.stringify(value, null, 2)}</pre>;
    };

    const formatIsoTimestamp = (iso?: string | null) => {
        if (!iso) {
            return null;
        }

        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) {
            return iso;
        }

        const formatted = KST_FORMATTER.format(date);
        return formatted.replace(',', '').trim().replace(/\s+/g, ' ');
    };

    const renderTimestamp = (iso?: string | null, raw?: number | null) => {
        const hasIso = Boolean(iso);
        const hasRaw = raw !== null && raw !== undefined;

        if (!hasIso && !hasRaw) {
            return '-';
        }

        const formattedIso = formatIsoTimestamp(iso ?? null);

        return (
            <div className={styles.timestampValue}>
                {hasIso ? (
                    <time dateTime={iso ?? undefined} title={iso ?? undefined}>
                        {formattedIso}
                    </time>
                ) : null}
                {hasRaw ? <span className={styles.timestampRaw}>({raw} ms)</span> : null}
            </div>
        );
    };

    const extractFromObject = React.useCallback((source: unknown, paths: Array<Array<string>>): unknown => {
        if (!source || typeof source !== 'object') {
            return null;
        }

        for (const path of paths) {
            let current: unknown = source;
            let valid = true;

            for (const key of path) {
                if (!current || typeof current !== 'object') {
                    valid = false;
                    break;
                }
                current = (current as Record<string, unknown>)[key];
            }

            if (valid && current !== undefined && current !== null) {
                return current;
            }
        }
        return null;
    }, []);

    const extractFromMetadata = React.useCallback(
        (paths: Array<Array<string>>): unknown => extractFromObject(model?.metadata ?? null, paths),
        [extractFromObject, model?.metadata],
    );

    const extractFromMlflowMetadata = React.useCallback(
        (paths: Array<Array<string>>): unknown => extractFromObject(model?.mlflow_metadata ?? null, paths),
        [extractFromObject, model?.mlflow_metadata],
    );

    const normalizedInputSchema = React.useMemo(() => {
        const direct = normalizeSchema(model?.input_schema ?? null);
        if (direct && direct.length > 0) {
            return direct;
        }

        const fromMetadata = extractFromMetadata([
            ['input_schema'],
            ['inputSchema'],
            ['mlflow', 'input_schema'],
            ['mlflow', 'inputSchema'],
            ['mlflow', 'additional_metadata', 'input_schema'],
            ['mlflow', 'additional_metadata', 'inputSchema'],
            ['mlflow', 'additional_metadata', 'tags', 'input_feature_names'],
            ['mlflow', 'additional_metadata', 'tags', 'feature_names'],
            ['mlflow', 'additional_metadata', 'tags', 'input_schema'],
            ['mlflow', 'additional_metadata', 'tags', 'featureNames'],
        ]);

        const normalizedMetadata = normalizeSchema(fromMetadata ?? null);
        if (normalizedMetadata && normalizedMetadata.length > 0) {
            return normalizedMetadata;
        }

        const fromMlflowMetadata = extractFromMlflowMetadata([
            ['additional_metadata', 'input_schema'],
            ['additional_metadata', 'inputSchema'],
            ['additional_metadata', 'tags', 'input_feature_names'],
            ['additional_metadata', 'tags', 'feature_names'],
            ['additional_metadata', 'tags', 'input_schema'],
            ['additional_metadata', 'tags', 'featureNames'],
        ]);

        const normalizedMlflow = normalizeSchema(fromMlflowMetadata ?? null);
        return normalizedMlflow && normalizedMlflow.length > 0 ? normalizedMlflow : null;
    }, [extractFromMetadata, extractFromMlflowMetadata, model?.input_schema]);

    const normalizedOutputSchema = React.useMemo(() => {
        const direct = normalizeSchema(model?.output_schema ?? null);
        if (direct && direct.length > 0) {
            return direct;
        }

        const fromMetadata = extractFromMetadata([
            ['output_schema'],
            ['outputSchema'],
            ['mlflow', 'output_schema'],
            ['mlflow', 'outputSchema'],
            ['mlflow', 'additional_metadata', 'output_schema'],
            ['mlflow', 'additional_metadata', 'outputSchema'],
            ['mlflow', 'additional_metadata', 'tags', 'task_original_classes'],
            ['mlflow', 'additional_metadata', 'tags', 'output_classes'],
            ['mlflow', 'additional_metadata', 'tags', 'output_schema'],
            ['mlflow', 'additional_metadata', 'tags', 'taskOriginalClasses'],
        ]);

        const normalizedMetadata = normalizeSchema(fromMetadata ?? null);
        if (normalizedMetadata && normalizedMetadata.length > 0) {
            return normalizedMetadata;
        }

        const fromMlflowMetadata = extractFromMlflowMetadata([
            ['additional_metadata', 'output_schema'],
            ['additional_metadata', 'outputSchema'],
            ['additional_metadata', 'tags', 'task_original_classes'],
            ['additional_metadata', 'tags', 'output_classes'],
            ['additional_metadata', 'tags', 'output_schema'],
            ['additional_metadata', 'tags', 'taskOriginalClasses'],
        ]);

        const normalizedMlflow = normalizeSchema(fromMlflowMetadata ?? null);
        return normalizedMlflow && normalizedMlflow.length > 0 ? normalizedMlflow : null;
    }, [extractFromMetadata, extractFromMlflowMetadata, model?.output_schema]);

    const mlflowMetadata = model?.mlflow_metadata ?? null;
    const additionalMetadata = mlflowMetadata?.additional_metadata ?? null;
    const additionalEntries = additionalMetadata
        ? Object.entries(additionalMetadata).filter(([key]) => !key.endsWith('_timestamp_iso') && !key.endsWith('_timestamp') && key !== 'tags')
        : [];

    const timestampEntries = additionalMetadata
        ? Object.entries(additionalMetadata)
              .filter(([key]) => key.endsWith('_timestamp_iso'))
              .map(([key, value]) => {
                  const rawKey = key.replace('_iso', '');
                  const rawValue = (additionalMetadata as Record<string, unknown>)[rawKey] as number | null | undefined;
                  return { key: key.replace('_timestamp_iso', '_timestamp'), iso: value as string | null | undefined, raw: rawValue ?? null };
              })
        : [];

    const tags = (additionalMetadata?.tags ?? null) as Record<string, unknown> | null;

    return (
        <section className={sectionClassName}>
            <header className={styles.header}>
                <div>
                    <h2>모델 상세 정보</h2>
                    <p>선택한 모델의 메타데이터와 스키마를 확인하세요.</p>
                </div>
                {(() => {
                    const shouldShowRefresh = Boolean(onRefetch) && showRefreshButton;
                    if (!shouldShowRefresh && !actionSlot) {
                        return null;
                    }
                    return (
                        <div className={styles.headerActions}>
                            {actionSlot}
                            {shouldShowRefresh ? (
                                <button type="button" onClick={onRefetch} disabled={isLoading}>
                                    {isLoading ? '새로고침 중...' : '정보 새로고침'}
                                </button>
                            ) : null}
                        </div>
                    );
                })()}
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

                    {mlflowMetadata ? (
                        <div className={styles.mlflowSection}>
                            <h3>MLflow 메타데이터</h3>
                            <dl className={styles.metaGrid}>
                                <div>
                                    <dt>추적 URI</dt>
                                    <dd>{formatValue(mlflowMetadata.tracking_uri)}</dd>
                                </div>
                                <div>
                                    <dt>모델 URI</dt>
                                    <dd>{formatValue(mlflowMetadata.model_uri)}</dd>
                                </div>
                                <div>
                                    <dt>Run ID</dt>
                                    <dd>{formatValue(mlflowMetadata.run_id)}</dd>
                                </div>
                                <div>
                                    <dt>버전</dt>
                                    <dd>{formatValue(mlflowMetadata.model_version)}</dd>
                                </div>
                                <div>
                                    <dt>등록 모델명</dt>
                                    <dd>{formatValue(mlflowMetadata.registered_model_name)}</dd>
                                </div>
                                <div>
                                    <dt>Flavor</dt>
                                    <dd>{formatValue(mlflowMetadata.load_flavor)}</dd>
                                </div>
                                <div>
                                    <dt>아티팩트 경로</dt>
                                    <dd>{formatValue(mlflowMetadata.artifact_path)}</dd>
                                </div>
                            </dl>

                            {additionalEntries.length > 0 ? (
                                <div className={styles.additionalBox}>
                                    <h4>추가 메타데이터</h4>
                                    <dl className={styles.kvList}>
                                        {additionalEntries.map(([key, value]) => (
                                            <div key={key}>
                                                <dt>{formatLabel(key)}</dt>
                                                <dd>{formatValue(value)}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            ) : null}

                            {timestampEntries.length > 0 ? (
                                <div className={styles.additionalBox}>
                                    <h4>타임스탬프</h4>
                                    <dl className={styles.kvList}>
                                        {timestampEntries.map(entry => (
                                            <div key={entry.key}>
                                                <dt>{formatLabel(entry.key)}</dt>
                                                <dd>{renderTimestamp(entry.iso ?? null, entry.raw ?? null)}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            ) : null}

                            {tags && Object.keys(tags).length > 0 ? (
                                <div className={styles.additionalBox}>
                                    <h4>태그</h4>
                                    <dl className={styles.tagsList}>
                                        {Object.entries(tags).map(([key, value]) => (
                                            <div key={key}>
                                                <dt>{formatLabel(key)}</dt>
                                                <dd>{formatValue(value)}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <div className={styles.schemaSection}>
                        <h3>Input Schema</h3>
                        {normalizedInputSchema && normalizedInputSchema.length > 0 ? (
                            <ul>
                                {normalizedInputSchema.map(field => (
                                    <li key={field}>{field}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.info}>등록된 입력 스키마가 없습니다.</p>
                        )}
                    </div>

                    <div className={styles.schemaSection}>
                        <h3>Output Schema</h3>
                        {normalizedOutputSchema && normalizedOutputSchema.length > 0 ? (
                            <ul>
                                {normalizedOutputSchema.map(field => (
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
