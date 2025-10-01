'use client';

import React from 'react';
import styles from './DeleteModelDialog.module.scss';
import type { RegisteredModel } from '../../types';
import { createPortal } from 'react-dom';

interface DeleteModelDialogProps {
    model: RegisteredModel;
    isDeleting: boolean;
    errorMessage: string | null;
    onCancel: () => void;
    onConfirm: () => void;
}

const DeleteModelDialog: React.FC<DeleteModelDialogProps> = ({ model, isDeleting, errorMessage, onCancel, onConfirm }) => {
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
                        {model.file_size ? (
                            <div>
                                <dt>파일 크기</dt>
                                <dd>{model.file_size.toLocaleString()} B</dd>
                            </div>
                        ) : null}
                    </dl>
                    {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
                </div>
                <footer className={styles.actions}>
                    <button type="button" onClick={onCancel} disabled={isDeleting} className={styles.cancelBtn}>
                        취소
                    </button>
                    <button type="button" onClick={onConfirm} disabled={isDeleting} className={styles.deleteBtn}>
                        {isDeleting ? '삭제 중...' : '영구 삭제'}
                    </button>
                </footer>
            </div>
        </div>
    );
    
    return createPortal(modalContent, document.body);
};

export default DeleteModelDialog;
