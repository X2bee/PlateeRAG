'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import styles from './ModelStageDialog.module.scss';
import type { RegisteredModel, StageUpdateRequest, MlflowStage, ApiError } from '../../types';
import { useMlModelWorkspace } from '../MlModelWorkspaceContext';
import { formatStageDisplay, normalizeMlflowStage, STAGE_OPTIONS } from '../../utils/stageUtils';

interface ModelStageDialogProps {
    model: RegisteredModel;
    onClose: () => void;
}

const mapStageErrorMessage = (error: ApiError): string => {
    if (!error) {
        return '스테이지 변경에 실패했습니다. 다시 시도해주세요.';
    }

    switch (error.status) {
        case 404:
            return '선택한 모델 정보를 찾을 수 없습니다. 목록을 새로고친 후 다시 시도해주세요.';
        case 400:
            return error.message || '이 모델은 스테이지 변경을 지원하지 않습니다.';
        case 502:
            return 'MLflow 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
        default:
            return error.message || '스테이지 변경에 실패했습니다.';
    }
};

const ModelStageDialog: React.FC<ModelStageDialogProps> = ({ model, onClose }) => {
    const { changeModelStage } = useMlModelWorkspace();
    const currentStage = React.useMemo<MlflowStage>(() => normalizeMlflowStage(model.mlflow_metadata?.additional_metadata?.stage), [model]);
    const [selectedStage, setSelectedStage] = React.useState<MlflowStage>(currentStage);
    const [archiveExisting, setArchiveExisting] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    React.useEffect(() => {
        const normalized = normalizeMlflowStage(model.mlflow_metadata?.additional_metadata?.stage);
        setSelectedStage(normalized);
        setArchiveExisting(false);
        setErrorMessage(null);
    }, [model]);

    const stageChanged = selectedStage !== currentStage;
    const submitDisabled = isSubmitting || (!stageChanged && !(selectedStage === 'Production' && archiveExisting));

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmitting) {
            return;
        }

        const shouldArchive = selectedStage === 'Production' ? archiveExisting : false;

        if (!stageChanged && !shouldArchive) {
            onClose();
            return;
        }

        const payload: StageUpdateRequest = {
            stage: selectedStage,
            archive_existing_versions: shouldArchive,
        };

        try {
            setIsSubmitting(true);
            setErrorMessage(null);
            await changeModelStage(model.model_id, payload);
            onClose();
        } catch (error) {
            const apiError: ApiError =
                error && typeof error === 'object' && 'status' in (error as Record<string, unknown>)
                    ? (error as ApiError)
                    : { status: 0, message: (error as Error | null)?.message ?? '스테이지 변경에 실패했습니다.' };
            setErrorMessage(mapStageErrorMessage(apiError));
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
        <div className={styles.backdrop} role="presentation">
            <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="model-stage-dialog-title">
                <header className={styles.header}>
                    <h2 id="model-stage-dialog-title">MLflow 스테이지 변경</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="닫기"
                        disabled={isSubmitting}
                    >
                        ✕
                    </button>
                </header>
                <form onSubmit={handleSubmit} className={styles.formArea}>
                    <div className={styles.modelSummary}>
                        <h3>{model.model_name}</h3>
                        <dl>
                            <div>
                                <dt>모델 ID</dt>
                                <dd>{model.model_id}</dd>
                            </div>
                            {model.model_version ? (
                                <div>
                                    <dt>버전</dt>
                                    <dd>{model.model_version}</dd>
                                </div>
                            ) : null}
                            <div>
                                <dt>현재 스테이지</dt>
                                <dd>{formatStageDisplay(currentStage)}</dd>
                            </div>
                        </dl>
                    </div>

                    <fieldset className={styles.stageFieldset}>
                        <legend>변경할 스테이지</legend>
                        <div className={styles.stageOptions}>
                            {STAGE_OPTIONS.map(option => {
                                const isActive = option.value === selectedStage;
                                return (
                                    <label
                                        key={option.value}
                                        className={isActive ? styles.stageOptionActive : styles.stageOption}
                                    >
                                        <input
                                            type="radio"
                                            name="mlflow-stage"
                                            value={option.value}
                                            checked={isActive}
                                            onChange={() => setSelectedStage(option.value)}
                                            disabled={isSubmitting}
                                        />
                                        <span>
                                            <span className={styles.optionLabel}>{option.label}</span>
                                            <span className={styles.optionDescription}>{option.description}</span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>

                    {selectedStage === 'Production' ? (
                        <div className={styles.archiveRow}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={archiveExisting}
                                    onChange={event => setArchiveExisting(event.target.checked)}
                                    disabled={isSubmitting}
                                />
                                <span>Production으로 승급 시 기존 Production 버전을 Archived로 이동</span>
                            </label>
                            <p className={styles.archiveHelper}>
                                기존 운영 버전을 자동으로 보관 처리하여 충돌 없이 새 모델을 운영 단계에 배치합니다.
                            </p>
                        </div>
                    ) : null}

                    {errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}

                    <footer className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isSubmitting}>
                            취소
                        </button>
                        <button
                            type="submit"
                            className={styles.confirmButton}
                            disabled={submitDisabled}
                        >
                            {isSubmitting ? '변경 중...' : '스테이지 변경'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ModelStageDialog;
