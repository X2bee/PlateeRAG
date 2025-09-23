'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from './assets/HuggingFaceUploadModal.module.scss';

interface HuggingFaceUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (repoId: string, filename: string, isPrivate: boolean, hfUserId: string, hubToken: string) => void;
}

// HuggingFace 업로드 모달 컴포넌트
export const HuggingFaceUploadModal: React.FC<HuggingFaceUploadModalProps> = ({
    isOpen,
    onClose,
    onUpload
}) => {
    const [repoId, setRepoId] = useState<string>('');
    const [filename, setFilename] = useState<string>('');
    const [isPrivate, setIsPrivate] = useState<boolean>(false);
    const [hfUserId, setHfUserId] = useState<string>('');
    const [hubToken, setHubToken] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!repoId.trim()) {
            alert('리포지토리 ID를 입력해주세요.');
            return;
        }

        onUpload(repoId, filename, isPrivate, hfUserId, hubToken);

        // 폼 초기화
        setRepoId('');
        setFilename('');
        setIsPrivate(false);
        setHfUserId('');
        setHubToken('');
        onClose();
    };

    const handleClose = () => {
        // 폼 초기화
        setRepoId('');
        setFilename('');
        setIsPrivate(false);
        setHfUserId('');
        setHubToken('');
        onClose();
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.uploadModal}>
                <div className={styles.uploadModalHeader}>
                    <h3>HuggingFace Hub 업로드</h3>
                    <button
                        onClick={handleClose}
                        className={styles.uploadModalCloseButton}
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                <div className={styles.uploadModalForm}>
                    <div className={styles.uploadFormGroup}>
                        <label>
                            리포지토리 ID<span className={styles.requiredMark}>*</span>
                        </label>
                        <input
                            type="text"
                            value={repoId}
                            onChange={(e) => setRepoId(e.target.value)}
                            placeholder="예: username/my-dataset 또는 my-dataset"
                            className={styles.formInput}
                        />
                        <small className={styles.formHint}>
                            사용자명/리포지토리명 형태로 입력하거나 리포지토리명만 입력하세요
                        </small>
                    </div>

                    <div className={styles.uploadFormGroup}>
                        <label>
                            파일명 (선택사항)
                        </label>
                        <input
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            placeholder="예: dataset.parquet (미지정시 자동 생성)"
                            className={styles.formInput}
                        />
                    </div>

                    <div className={styles.uploadFormGroup}>
                        <label>
                            HuggingFace 사용자 ID (선택사항)
                        </label>
                        <input
                            type="text"
                            value={hfUserId}
                            onChange={(e) => setHfUserId(e.target.value)}
                            placeholder="미지정시 설정값 사용"
                            className={styles.formInput}
                        />
                    </div>

                    <div className={styles.uploadFormGroup}>
                        <label>
                            HuggingFace Hub 토큰 (선택사항)
                        </label>
                        <input
                            type="password"
                            value={hubToken}
                            onChange={(e) => setHubToken(e.target.value)}
                            placeholder="미지정시 설정값 사용"
                            className={styles.formInput}
                        />
                        <small className={styles.formHint}>
                            보안상 미지정 권장 (서버 설정값 사용)
                        </small>
                    </div>

                    <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                            />
                            <span>프라이빗 리포지토리로 생성</span>
                        </label>
                    </div>
                </div>

                <div className={styles.dialogActions}>
                    <button
                        onClick={handleClose}
                        className={styles.cancelButton}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={styles.confirmButton}
                        disabled={!repoId.trim()}
                    >
                        업로드
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
