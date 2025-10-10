'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import styles from './ModelRegistryPanel.module.scss';
import type { RegisteredModel } from '../../types';
import { formatStageDisplay, normalizeMlflowStage } from '../../utils/stageUtils';

interface ModelVersionDialogProps {
    groupLabel: string;
    versions: RegisteredModel[];
    selectedModelId: number | null;
    onSelect: (modelId: number) => void;
    onClose: () => void;
}

const formatTimestamp = (value?: string | null) => {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }
    return parsed.toLocaleString();
};

const ModelVersionDialog: React.FC<ModelVersionDialogProps> = ({ groupLabel, versions, selectedModelId, onSelect, onClose }) => {
    const handleSelect = (modelId: number) => {
        onSelect(modelId);
    };

    const modalContent = (
        <div className={styles.versionModalBackdrop} role="presentation">
            <div className={styles.versionModal} role="dialog" aria-modal="true" aria-labelledby="model-version-dialog-title">
                <header className={styles.versionModalHeader}>
                    <h2 id="model-version-dialog-title">버전 변경</h2>
                    <button type="button" onClick={onClose} aria-label="닫기">
                        ✕
                    </button>
                </header>
                <p className={styles.versionModalDescription}>{groupLabel} 모델의 다른 버전을 선택하세요.</p>
                <div className={styles.versionModalList}>
                    {versions.map(version => {
                        const normalizedStage = normalizeMlflowStage(version.mlflow_metadata?.additional_metadata?.stage);
                        const stageLabel = formatStageDisplay(normalizedStage);
                        const isActive = version.model_id === selectedModelId;
                        const runIdentifier = String(version.mlflow_metadata?.run_id ?? version.model_id);
                        const createdAt = formatTimestamp(version.created_at);
                        const updatedAt = formatTimestamp(version.updated_at);

                        return (
                            <button
                                key={version.model_id}
                                type="button"
                                className={isActive ? styles.versionCardActive : styles.versionCard}
                                onClick={() => handleSelect(version.model_id)}
                                aria-pressed={isActive}
                            >
                                <div className={styles.versionCardHeader}>
                                    <span className={styles.versionCardTitle}>버전 {version.mlflow_metadata?.model_version ?? version.model_version ?? 'latest'}</span>
                                    <span
                                        className={`${styles.versionCardStage} ${
                                            normalizedStage === 'Production'
                                                ? styles.versionCardStageProduction
                                                : normalizedStage === 'Staging'
                                                    ? styles.versionCardStageStaging
                                                    : normalizedStage === 'Archived'
                                                        ? styles.versionCardStageArchived
                                                        : styles.versionCardStageNone
                                        }`}
                                    >
                                        {stageLabel}
                                    </span>
                                </div>
                                <div className={styles.versionCardMeta}>
                                    <span className={styles.versionCardMetaLabel}>Run</span>
                                    <span className={styles.versionCardMetaValue}>{runIdentifier}</span>
                                </div>
                                {createdAt || updatedAt ? (
                                    <div className={styles.versionCardTimestamp}>
                                        {createdAt ? <span>생성 {createdAt}</span> : null}
                                        {updatedAt ? <span>업데이트 {updatedAt}</span> : null}
                                    </div>
                                ) : null}
                                <span className={styles.versionCardHint}>{isActive ? '현재 선택됨' : '이 버전 선택'}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ModelVersionDialog;
