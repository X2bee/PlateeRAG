'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
import styles from './assets/MLflowUploadModal.module.scss';

interface MLflowUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (experimentName: string, datasetName: string, options: any) => void;
}

export const MLflowUploadModal: React.FC<MLflowUploadModalProps> = ({
    isOpen,
    onClose,
    onUpload
}) => {
    const [experimentName, setExperimentName] = useState<string>('');
    const [datasetName, setDatasetName] = useState<string>('');
    const [artifactPath, setArtifactPath] = useState<string>('dataset');
    const [description, setDescription] = useState<string>('');
    const [format, setFormat] = useState<string>('parquet');
    const [mlflowTrackingUri, setMlflowTrackingUri] = useState<string>('');
    const [tags, setTags] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!experimentName.trim()) {
            alert('실험 이름을 입력해주세요.');
            return;
        }

        if (!datasetName.trim()) {
            alert('데이터셋 이름을 입력해주세요.');
            return;
        }

        let parsedTags = null;
        if (tags.trim()) {
            try {
                parsedTags = JSON.parse(tags);
            } catch (error) {
                alert('태그는 올바른 JSON 형식이어야 합니다.');
                return;
            }
        }

        const options = {
            artifactPath: artifactPath || 'dataset',
            description: description || null,
            tags: parsedTags,
            format: format,
            mlflowTrackingUri: mlflowTrackingUri || null
        };

        onUpload(experimentName, datasetName, options);

        setExperimentName('');
        setDatasetName('');
        setArtifactPath('dataset');
        setDescription('');
        setFormat('parquet');
        setMlflowTrackingUri('');
        setTags('');
        onClose();
    };

    const handleClose = () => {
        setExperimentName('');
        setDatasetName('');
        setArtifactPath('dataset');
        setDescription('');
        setFormat('parquet');
        setMlflowTrackingUri('');
        setTags('');
        onClose();
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.uploadModal}>
                <div className={styles.uploadModalHeader}>
                    <h3>MLflow 실험에 업로드</h3>
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
                            실험 이름<span className={styles.requiredMark}>*</span>
                        </label>
                        <input
                            type="text"
                            value={experimentName}
                            onChange={(e) => setExperimentName(e.target.value)}
                            placeholder="예: data-preprocessing-experiment"
                            className={styles.formInput}
                        />
                        <small className={styles.formHint}>
                            MLflow 실험 이름을 입력하세요
                        </small>
                    </div>

                    <div className={styles.uploadFormGroup}>
                        <label>
                            데이터셋 이름<span className={styles.requiredMark}>*</span>
                        </label>
                        <input
                            type="text"
                            value={datasetName}
                            onChange={(e) => setDatasetName(e.target.value)}
                            placeholder="예: customer_data_v1"
                            className={styles.formInput}
                        />
                        <small className={styles.formHint}>
                            데이터셋의 이름을 입력하세요
                        </small>
                    </div>

                    <div className={styles.uploadFormGroup}>
                        <label>아티팩트 경로 (선택사항)</label>
                        <input
                            type="text"
                            value={artifactPath}
                            onChange={(e) => setArtifactPath(e.target.value)}
                            placeholder="dataset"
                            className={styles.formInput}
                        />
                        <small className={styles.formHint}>
                            MLflow에서 아티팩트가 저장될 경로입니다
                        </small>
                    </div>

                    <div className={styles.uploadFormGroup}>
                        <label>설명 (선택사항)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="데이터셋에 대한 설명을 입력하세요..."
                            className={styles.formInput}
                            rows={3}
                        />
                    </div>

                    <div className={styles.uploadFormGroup}>
                        <label>저장 형식</label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className={styles.formInput}
                        >
                            <option value="parquet">Parquet</option>
                            <option value="csv">CSV</option>
                        </select>
                    </div>

                    <div className={styles.uploadFormGroup}>
                        <label>MLflow 서버 URI (선택사항)</label>
                        <input
                            type="text"
                            value={mlflowTrackingUri}
                            onChange={(e) => setMlflowTrackingUri(e.target.value)}
                            placeholder="http://localhost:5000 (미지정시 설정값 사용)"
                            className={styles.formInput}
                        />
                        <small className={styles.formHint}>
                            MLflow 추적 서버 URI입니다. 미지정시 서버 설정값을 사용합니다
                        </small>
                    </div>

                    <div className={styles.uploadFormGroup}>
                        <label>태그 (JSON, 선택사항)</label>
                        <textarea
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder='{"version": "1.0", "preprocessing": "completed"}'
                            className={styles.formInput}
                            rows={2}
                        />
                        <small className={styles.formHint}>
                            JSON 형식으로 태그를 입력하세요. 예: {`{"version": "1.0"}`}
                        </small>
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
                        disabled={!experimentName.trim() || !datasetName.trim()}
                    >
                        업로드
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MLflowUploadModal;