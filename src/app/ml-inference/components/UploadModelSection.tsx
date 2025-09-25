'use client';

import React, { useMemo, useRef, useState } from 'react';
import styles from './UploadModelSection.module.scss';
import type { ApiError, RequestContext, UploadSuccessResponse } from '../types';
import { apiClient } from '@/app/_common/api/helper/apiClient';

interface UploadModelSectionProps {
    request: RequestContext;
    onUploadSuccess: (model: UploadSuccessResponse) => void;
    onUploadFailure?: (error: ApiError) => void;
}

interface FormState {
    modelName: string;
    modelVersion: string;
    framework: string;
    description: string;
    inputSchema: string;
    outputSchema: string;
    metadata: string;
}

const initialFormState: FormState = {
    modelName: '',
    modelVersion: '',
    framework: 'sklearn',
    description: '',
    inputSchema: '',
    outputSchema: '',
    metadata: '',
};

const ACCEPTED_EXTENSIONS = ['.pkl', '.joblib'];

const UploadModelSection: React.FC<UploadModelSectionProps> = ({ request, onUploadSuccess, onUploadFailure }) => {
    const [formState, setFormState] = useState<FormState>(initialFormState);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [lastResponse, setLastResponse] = useState<UploadSuccessResponse | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const filePreview = useMemo(() => {
        if (!selectedFile) {
            return null;
        }

        const extension = selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase();
        const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
        const sizeInKb = selectedFile.size / 1024;

        return {
            name: selectedFile.name,
            sizeLabel: `${formatter.format(sizeInKb)} KB`,
            validExtension: ACCEPTED_EXTENSIONS.includes(extension),
        };
    }, [selectedFile]);

    const handleInputChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { value } = event.target;
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setSelectedFile(file);
        // 동일 파일을 다시 선택할 수 있도록 입력값을 비움
        event.target.value = '';
    };

    const resetForm = () => {
        setFormState(initialFormState);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submitFormData = async (form: FormData) => {
        const trimmedToken = request.token?.trim() ?? '';
        const headers = trimmedToken
            ? { Authorization: `Bearer ${trimmedToken}` }
            : undefined;

        const response = await apiClient(request.endpoint, {
            method: 'POST',
            body: form,
            headers,
        });

        let payload: unknown = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        if (!response.ok) {
            throw {
                status: response.status,
                message: (payload as ApiError | null)?.message || '업로드 요청이 실패했습니다.',
                details: payload,
            } as ApiError;
        }

        return (payload ?? {}) as UploadSuccessResponse;
    };

    const validateForm = () => {
        if (!selectedFile) {
            return '모델 파일을 선택해주세요.';
        }

        const hasValidExtension = ACCEPTED_EXTENSIONS.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
        if (!hasValidExtension) {
            return '지원되지 않는 파일 형식입니다. .pkl 또는 .joblib 파일만 업로드할 수 있습니다.';
        }

        if (!formState.modelName.trim()) {
            return '모델 이름을 입력해주세요.';
        }

        if (!formState.modelVersion.trim()) {
            return '모델 버전을 입력해주세요.';
        }

        if (formState.metadata.trim()) {
            try {
                JSON.parse(formState.metadata);
            } catch {
                return 'Metadata는 올바른 JSON 형식이어야 합니다.';
            }
        }

        const schemaFields = ['inputSchema', 'outputSchema'] as const;
        for (const field of schemaFields) {
            const value = formState[field].trim();
            if (!value) {
                continue;
            }

            const looksLikeJson = value.startsWith('[');
            if (looksLikeJson) {
                try {
                    const parsed = JSON.parse(value);
                    if (!Array.isArray(parsed)) {
                        return `${field === 'inputSchema' ? 'Input' : 'Output'} schema는 배열 JSON이어야 합니다.`;
                    }
                } catch {
                    return `${field === 'inputSchema' ? 'Input' : 'Output'} schema JSON 구문을 확인해주세요.`;
                }
            }
        }

        return null;
    };

    const buildFormData = (): FormData => {
        if (!selectedFile) {
            throw new Error('파일이 선택되지 않았습니다.');
        }

        const form = new FormData();
        form.append('file', selectedFile);
        form.append('model_name', formState.modelName.trim());
        form.append('model_version', formState.modelVersion.trim());

        const optionalFields: Array<[key: string, value: string]> = [
            ['framework', formState.framework],
            ['description', formState.description],
            ['input_schema', formState.inputSchema],
            ['output_schema', formState.outputSchema],
            ['metadata', formState.metadata],
        ];

        optionalFields.forEach(([key, value]) => {
            if (value.trim()) {
                form.append(key, value.trim());
            }
        });

        return form;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        setErrorMessage(null);
        setIsUploading(true);

        try {
            const payload = await submitFormData(buildFormData());
            setLastResponse(payload);
            onUploadSuccess(payload);
            resetForm();
        } catch (error) {
            const apiError: ApiError =
                error instanceof Error
                    ? { status: 0, message: error.message }
                    : (error as ApiError);
            setErrorMessage(apiError.message);
            onUploadFailure?.(apiError);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <section className={styles.uploadSection}>
            <header className={styles.sectionHeader}>
                <div>
                    <h2>모델 업로드</h2>
                    <p>학습된 모델 파일과 메타데이터를 등록하세요. 업로드가 완료되면 즉시 추론 콘솔에서 사용할 수 있습니다.</p>
                </div>
                <span className={styles.sectionBadge}>POST /api/models/upload</span>
            </header>

            <form className={styles.uploadForm} onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                    <label className={styles.formField}>
                        <span>모델 파일 *</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPTED_EXTENSIONS.join(',')}
                            onChange={handleFileChange}
                        />
                    </label>
                    <label className={styles.formField}>
                        <span>모델 이름 *</span>
                        <input type="text" value={formState.modelName} onChange={handleInputChange('modelName')} placeholder="예: churn-classifier" />
                    </label>
                    <label className={styles.formField}>
                        <span>모델 버전 *</span>
                        <input type="text" value={formState.modelVersion} onChange={handleInputChange('modelVersion')} placeholder="예: v1.0.0" />
                    </label>
                    <label className={styles.formField}>
                        <span>프레임워크</span>
                        <input type="text" value={formState.framework} onChange={handleInputChange('framework')} placeholder="예: sklearn" />
                    </label>
                    <label className={styles.formFieldFull}>
                        <span>설명</span>
                        <textarea value={formState.description} onChange={handleInputChange('description')} rows={2} placeholder="모델에 대한 간단한 설명을 작성하세요." />
                    </label>
                    <label className={styles.formFieldFull}>
                        <span>Input Schema</span>
                        <textarea value={formState.inputSchema} onChange={handleInputChange('inputSchema')} rows={2} placeholder='예: ["feature_a", "feature_b"] 또는 feature_a,feature_b' />
                    </label>
                    <label className={styles.formFieldFull}>
                        <span>Output Schema</span>
                        <textarea value={formState.outputSchema} onChange={handleInputChange('outputSchema')} rows={2} placeholder='예: ["class_label"] 또는 class_label' />
                    </label>
                    <label className={styles.formFieldFull}>
                        <span>Metadata (JSON)</span>
                        <textarea value={formState.metadata} onChange={handleInputChange('metadata')} rows={3} placeholder='예: {"labels": ["stay", "churn"]}' />
                    </label>
                </div>

                {filePreview && (
                    <aside className={styles.filePreview}>
                        <div>
                            <strong>{filePreview.name}</strong>
                            <span>{filePreview.sizeLabel}</span>
                        </div>
                        <span className={filePreview.validExtension ? styles.badgeOk : styles.badgeWarn}>
                            {filePreview.validExtension ? '지원되는 형식' : '확장자를 확인하세요'}
                        </span>
                    </aside>
                )}

                {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}

                <div className={styles.formActions}>
                    <button type="submit" disabled={isUploading}>
                        {isUploading ? '업로드 중...' : '모델 업로드'}
                    </button>
                    <button type="button" onClick={resetForm} disabled={isUploading} className={styles.secondaryButton}>
                        입력 초기화
                    </button>
                </div>
            </form>

            {lastResponse && (
                <div className={styles.responsePanel}>
                    <h3>업로드 결과</h3>
                    <dl>
                        <div>
                            <dt>모델 ID</dt>
                            <dd>{lastResponse.model_id}</dd>
                        </div>
                        <div>
                            <dt>모델 이름</dt>
                            <dd>{lastResponse.model_name}</dd>
                        </div>
                        <div>
                            <dt>버전</dt>
                            <dd>{lastResponse.model_version ?? '-'}</dd>
                        </div>
                        <div>
                            <dt>프레임워크</dt>
                            <dd>{lastResponse.framework ?? '-'}</dd>
                        </div>
                        <div>
                            <dt>파일 경로</dt>
                            <dd>{lastResponse.file_path ?? '-'}</dd>
                        </div>
                    </dl>
                </div>
            )}
        </section>
    );
};

export default UploadModelSection;
