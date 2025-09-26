'use client';

import React from 'react';
import styles from './ModelRegistryPanel.module.scss';
import type { RegisteredModel } from '../types';

interface ModelRegistryPanelProps {
    models: RegisteredModel[];
    selectedModelId: number | null;
    onSelect: (modelId: number) => void;
    onDelete?: (model: RegisteredModel) => void;
}

const formatBytes = (bytes?: number | null) => {
    if (!bytes || Number.isNaN(bytes)) {
        return '-';
    }
    const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
    if (bytes < 1024) {
        return `${formatter.format(bytes)} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${formatter.format(bytes / 1024)} KB`;
    }
    return `${formatter.format(bytes / (1024 * 1024))} MB`;
};

const ModelRegistryPanel: React.FC<ModelRegistryPanelProps> = ({ models, selectedModelId, onSelect, onDelete }) => {
    if (models.length === 0) {
        return (
            <section className={styles.registryEmpty}>
                <h3>등록된 모델이 없습니다.</h3>
                <p>업로드한 모델은 이곳에 표시됩니다. 업로드 후 추론 콘솔에서 빠르게 선택할 수 있습니다.</p>
            </section>
        );
    }

    return (
        <section className={styles.registry}>
            <header className={styles.header}>
                <h3>모델 레지스트리</h3>
                <span>{models.length}개</span>
            </header>
            <ul className={styles.list}>
                {models.map(model => {
                    const isActive = model.model_id === selectedModelId;
                    const handleDeleteClick = () => {
                        if (!onDelete) {
                            return;
                        }
                        onDelete(model);
                    };

                    return (
                        <li key={model.model_id} className={isActive ? styles.listItemActive : styles.listItem}>
                            <div className={styles.listItemInner}>
                                <button
                                    type="button"
                                    onClick={() => onSelect(model.model_id)}
                                    className={styles.selectButton}
                                >
                                    <div className={styles.modelTitle}>
                                        <strong>{model.model_name}</strong>
                                        <span>{model.model_version ?? 'latest'}</span>
                                    </div>
                                    <div className={styles.modelMeta}>
                                        <span>ID {model.model_id}</span>
                                        <span>{model.framework ?? '-'}</span>
                                        <span>{formatBytes(model.file_size ?? null)}</span>
                                        {model.status ? <span className={styles.statusTag}>{model.status}</span> : null}
                                    </div>
                                    {model.input_schema && model.input_schema.length > 0 && (
                                        <div className={styles.schemaChips}>
                                            {model.input_schema.slice(0, 4).map(field => (
                                                <span key={field}>{field}</span>
                                            ))}
                                            {model.input_schema.length > 4 ? <span>+{model.input_schema.length - 4}</span> : null}
                                        </div>
                                    )}
                                    {(model.created_at || model.updated_at) ? (
                                        <div className={styles.timestampRow}>
                                            {model.created_at ? <span>생성 {new Date(model.created_at).toLocaleString()}</span> : null}
                                            {model.updated_at ? <span>업데이트 {new Date(model.updated_at).toLocaleString()}</span> : null}
                                        </div>
                                    ) : null}
                                </button>
                                {onDelete ? (
                                    <button
                                        type="button"
                                        onClick={handleDeleteClick}
                                        className={styles.deleteButton}
                                        aria-label={`${model.model_name} 삭제`}
                                    >
                                        삭제
                                    </button>
                                ) : null}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default ModelRegistryPanel;
