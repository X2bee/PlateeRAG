'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IoClose, IoChevronUp, IoChevronDown, IoInformationCircle } from 'react-icons/io5';
import styles from './assets/MLflowUploadModal.module.scss';
import { getUniqueMLflowExperimentNames, listMLflowDatasetsByExperiment } from '@/app/_common/api/dataManagerAPI';

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
    const [artifactPath, setArtifactPath] = useState<string>('dataset');
    const [description, setDescription] = useState<string>('');
    const [format, setFormat] = useState<string>('parquet');
    const [mlflowTrackingUri, setMlflowTrackingUri] = useState<string>('');
    const [tags, setTags] = useState<string>('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [existingExperiments, setExistingExperiments] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen) {
            const fetchExperiments = async () => {
                const names = await getUniqueMLflowExperimentNames();
                setExistingExperiments(names);
            };
            fetchExperiments();
        }
    }, [isOpen]);


    const handleSubmit = async () => {
        if (!experimentName.trim()) {
            alert('실험 이름을 입력해주세요.');
            return;
        }
        
        setIsSubmitting(true);

        try {
            // --- 데이터셋 이름 자동 생성 로직 ---
            const experimentDatasets = await listMLflowDatasetsByExperiment(experimentName.trim());
            const prefix = `${experimentName.trim()}_v`;
            
            let latestVersion = 0;
            if (experimentDatasets.success && experimentDatasets.datasets) {
                const versionNumbers = experimentDatasets.datasets
                    .filter(d => d.dataset_name.startsWith(prefix))
                    .map(d => {
                        const versionStr = d.dataset_name.substring(prefix.length);
                        return parseInt(versionStr, 10);
                    })
                    .filter(num => !isNaN(num)); 

                if (versionNumbers.length > 0) {
                    latestVersion = Math.max(...versionNumbers);
                }
            }
            
            const newVersion = latestVersion + 1;
            const newDatasetName = `${prefix}${newVersion}`;
            // --- 로직 끝 ---

            let parsedTags = null;
            if (tags.trim()) {
                try {
                    parsedTags = JSON.parse(tags);
                } catch (error) {
                    alert('태그는 올바른 JSON 형식이어야 합니다.');
                    setIsSubmitting(false);
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

            onUpload(experimentName, newDatasetName, options);

            handleReset();
            onClose();

        } catch (error) {
            console.error("Failed to generate dataset name or upload:", error);
            alert("데이터셋 버전 생성 또는 업로드 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setExperimentName('');
        setArtifactPath('dataset');
        setDescription('');
        setFormat('parquet');
        setMlflowTrackingUri('');
        setTags('');
        setShowAdvanced(false);
        setIsSubmitting(false);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div className={styles.dialogOverlay} onClick={handleClose}>
            <div className={styles.uploadModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.uploadModalHeader}>
                    <h3>MLflow 실험에 업로드</h3>
                    <button onClick={handleClose} className={styles.uploadModalCloseButton} title="닫기">
                        <IoClose size={24} />
                    </button>
                </div>

                <div className={styles.uploadModalBody}>
                    <div className={styles.uploadModalForm}>
                        {/* 필수 정보 섹션 */}
                        <div className={styles.formSection}>
                            <h4 className={styles.sectionTitle}>
                                <IoInformationCircle />
                                필수 정보
                            </h4>
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
                                    autoFocus
                                    list="experiment-names"
                                />
                                <datalist id="experiment-names">
                                    {existingExperiments.map(name => (
                                        <option key={name} value={name} />
                                    ))}
                                </datalist>
                                <small className={styles.formHint}>
                                    MLflow 실험 이름을 입력하거나 기존 실험을 선택하세요.
                                </small>
                            </div>
                        </div>

                        {/* 기본 설정 섹션 */}
                        <div className={styles.formSection}>
                            <h4 className={styles.sectionTitle}>기본 설정</h4>
                            <div className={styles.uploadFormGroup}>
                                <label>저장 형식</label>
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value)}
                                    className={styles.formInput}
                                >
                                    <option value="parquet">Parquet (권장)</option>
                                    <option value="csv">CSV</option>
                                </select>
                                <small className={styles.formHint}>
                                    Parquet 형식이 성능과 저장 공간 면에서 더 효율적입니다.
                                </small>
                            </div>
                            <div className={styles.uploadFormGroup}>
                                <label>아티팩트 경로</label>
                                <input
                                    type="text"
                                    value={artifactPath}
                                    onChange={(e) => setArtifactPath(e.target.value)}
                                    placeholder="dataset"
                                    className={styles.formInput}
                                />
                                <small className={styles.formHint}>
                                    MLflow에서 아티팩트가 저장될 경로 (기본값: dataset)
                                </small>
                            </div>
                            <div className={styles.uploadFormGroup}>
                                <label>설명 (선택사항)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="데이터셋에 대한 설명을 입력하세요..."
                                    className={styles.formTextarea}
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* 고급 옵션 섹션 */}
                        <div className={styles.advancedSection}>
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className={styles.advancedToggle}
                            >
                                <span>고급 옵션 및 계보 정보</span>
                                {showAdvanced ? <IoChevronUp /> : <IoChevronDown />}
                            </button>
                            {showAdvanced && (
                                <div className={styles.advancedOptions}>
                                    <div className={styles.infoBox}>
                                        <h4>
                                            <IoInformationCircle />
                                            업로드 시 자동으로 포함되는 정보
                                        </h4>
                                        <ul>
                                            <li><span className={styles.checkmark}>✓</span> 데이터셋 파일 (Parquet 또는 CSV)</li>
                                            <li><span className={styles.checkmark}>✓</span> 기술 통계 정보</li>
                                            <li><span className={styles.checkmark}>✓</span> 버전 이력 및 계보(Lineage) 정보</li>
                                            <li><span className={styles.checkmark}>✓</span> 원본 소스 정보</li>
                                            <li><span className={styles.checkmark}>✓</span> 모든 변환 작업 내역</li>
                                            <li><span className={styles.checkmark}>✓</span> 데이터 체크섬 (SHA256)</li>
                                            <li><span className={styles.checkmark}>✓</span> 매니저 ID 및 사용자 정보</li>
                                        </ul>
                                        <p className={styles.infoNote}>
                                            이 정보들은 MinIO와 Redis에서 자동으로 수집되어 MLflow와 함께 저장됩니다.
                                        </p>
                                    </div>
                                    <div className={styles.uploadFormGroup}>
                                        <label>
                                            MLflow Tracking URI
                                            <span className={styles.optionalBadge}>선택사항</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={mlflowTrackingUri}
                                            onChange={(e) => setMlflowTrackingUri(e.target.value)}
                                            placeholder="https://polar-mlflow-git.x2bee.com"
                                            className={styles.formInput}
                                        />
                                        <small className={styles.formHint}>
                                            미지정시 기본 서버 주소를 사용합니다.
                                        </small>
                                    </div>
                                    <div className={styles.uploadFormGroup}>
                                        <label>
                                            커스텀 태그 (JSON)
                                            <span className={styles.optionalBadge}>선택사항</span>
                                        </label>
                                        <textarea
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                            placeholder='{"version": "1.0", "team": "data-science"}'
                                            className={styles.formTextarea}
                                            rows={3}
                                        />
                                        <small className={styles.formHint}>
                                            JSON 형식으로 추가 태그를 입력하세요. 예: {`{"key": "value"}`}
                                        </small>
                                    </div>
                                    <div className={styles.storageInfo}>
                                        <h5>스토리지 구조</h5>
                                        <div className={styles.storageTree}>
                                            <div className={styles.treeItem}>📦 <strong>MLflow</strong> - 실험 추적 및 메타데이터</div>
                                            <div className={styles.treeItem}>🗄️ <strong>MinIO</strong> - 데이터셋 파일 및 버전 스냅샷</div>
                                            <div className={styles.treeItem}>💾 <strong>Redis</strong> - 버전 메타데이터 및 계보 정보</div>
                                        </div>
                                        <p className={styles.storageNote}>
                                            세 가지 스토리지가 연계되어 완전한 데이터 계보를 제공합니다.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.dialogActions}>
                    <button onClick={handleClose} className={styles.cancelButton} type="button">
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={styles.confirmButton}
                        disabled={!experimentName.trim() || isSubmitting}
                        type="button"
                    >
                        {isSubmitting ? '업로드 중...' : 'MLflow에 업로드'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MLflowUploadModal;