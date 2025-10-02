'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import styles from './DeleteModelDialog.module.scss';
import type { RegisteredModel } from '../../types';
import { formatStageDisplay, normalizeMlflowStage } from '../../utils/stageUtils';

interface DeleteModelDialogProps {
    model: RegisteredModel;
    isDeleting: boolean;
    errorMessage: string | null;
    errorCode: string | null;
    onCancel: () => void;
    onConfirm: () => void;
    onRequestStageChange?: (model: RegisteredModel) => void;
}

const DeleteModelDialog: React.FC<DeleteModelDialogProps> = ({
    model,
    isDeleting,
    errorMessage,
    errorCode,
    onCancel,
    onConfirm,
    onRequestStageChange,
}) => {
    const normalizedStage = normalizeMlflowStage(model.mlflow_metadata?.additional_metadata?.stage);
    const stageLabel = formatStageDisplay(normalizedStage);
    const isProductionStage = normalizedStage === 'Production';
    const stageBlocked = (errorCode ?? '').toUpperCase() === 'MODEL_STAGE_DELETE_BLOCKED';

    const handleStageChangeClick = () => {
        if (onRequestStageChange) {
            onRequestStageChange(model);
        }
    };

    const confirmDisabled = isDeleting || isProductionStage || stageBlocked;

    const modalContent = (
        <div className={styles.backdrop} role="presentation">
            <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="ml-delete-heading">
                <header className={styles.header}>
                    <h2 id="ml-delete-heading">모델 삭제</h2>
                    <button type="button" onClick={onCancel} aria-label="닫기" disabled={isDeleting}>
                        ✕
                    </button>
                </header>
                <div className={styles.content}>
                    <p>
                        선택한 모델 <strong>{model.model_name}</strong>
                        {model.model_version ? <span className={styles.versionTag}>버전 {model.model_version}</span> : null}
                        을(를) 삭제하시겠어요?
                    </p>
                    <p className={styles.subText}>
                        삭제 후에는 해당 모델로 추론을 실행할 수 없습니다. 서버 저장소에서 완전히 제거되므로 신중하게 진행하세요.
                    </p>
                    <dl className={styles.metaList}>
                        <div>
                            <dt>모델 ID</dt>
                            <dd>{model.model_id}</dd>
                        </div>
                        {model.framework ? (
                            <div>
                                <dt>프레임워크</dt>
                                <dd>{model.framework}</dd>
                            </div>
                        ) : null}
                        <div>
                            <dt>현재 스테이지</dt>
                            <dd>
                                <span className={`${styles.stageBadge} ${styles[`stage-${normalizedStage.toLowerCase()}`]}`}>
                                    {stageLabel}
                                </span>
                            </dd>
                        </div>
                        {model.file_size ? (
                            <div>
                                <dt>파일 크기</dt>
                                <dd>{model.file_size.toLocaleString()} B</dd>
                            </div>
                        ) : null}
                    </dl>
                    {isProductionStage ? (
                        <div className={styles.stageWarning}>
                            <p>Production 스테이지에서는 바로 삭제할 수 없습니다. 스테이지를 변경한 후 다시 시도해주세요.</p>
                            {onRequestStageChange ? (
                                <button
                                    type="button"
                                    className={styles.stageChangeButton}
                                    onClick={handleStageChangeClick}
                                    disabled={isDeleting}
                                >
                                    스테이지 변경하기
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                    {errorMessage ? (
                        <p className={styles.error} role="alert">
                            {errorMessage}
                        </p>
                    ) : null}
                    {stageBlocked && !isProductionStage && onRequestStageChange ? (
                        <div className={styles.stageWarningSecondary}>
                            <p>서버에 저장된 스테이지가 Production 상태입니다. 스테이지를 변경한 뒤 다시 시도해주세요.</p>
                            <button
                                type="button"
                                onClick={handleStageChangeClick}
                                className={styles.stageChangeInline}
                                disabled={isDeleting}
                            >
                                스테이지 변경 화면 열기
                            </button>
                        </div>
                    ) : null}
                </div>
                <footer className={styles.actions}>
                    <button type="button" onClick={onCancel} disabled={isDeleting} className={styles.cancelBtn}>
                        취소
                    </button>
                    <button type="button" onClick={onConfirm} disabled={confirmDisabled} className={styles.deleteBtn}>
                        {isDeleting ? '삭제 중...' : '영구 삭제'}
                    </button>
                </footer>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default DeleteModelDialog;
