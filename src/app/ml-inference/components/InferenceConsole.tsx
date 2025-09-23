'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './InferenceConsole.module.scss';
import type { ApiError, InferenceResultPayload, RegisteredModel, RequestContext } from '../types';
import { apiClient } from '@/app/_common/api/helper/apiClient';

interface InferenceConsoleProps {
    request: RequestContext;
    models: RegisteredModel[];
    selectedModelId: number | null;
    onSelectModel: (modelId: number | null) => void;
}

const InferenceConsole: React.FC<InferenceConsoleProps> = ({ request, models, selectedModelId, onSelectModel }) => {
    const [manualModelId, setManualModelId] = useState('');
    const [modelName, setModelName] = useState('');
    const [modelVersion, setModelVersion] = useState('');
    const [inputsText, setInputsText] = useState('[\n  {\n    "feature": null\n  }\n]');
    const [returnProbabilities, setReturnProbabilities] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestPreview, setRequestPreview] = useState<string | null>(null);
    const [result, setResult] = useState<InferenceResultPayload | null>(null);
    const [error, setError] = useState<ApiError | null>(null);

    const selectedModel = useMemo(() => models.find(model => model.model_id === selectedModelId) ?? null, [models, selectedModelId]);

    useEffect(() => {
        if (!selectedModel) {
            return;
        }

        setModelName(selectedModel.model_name ?? '');
        setModelVersion(selectedModel.model_version ?? '');

        if (selectedModel.input_schema && selectedModel.input_schema.length > 0) {
            const templateObject: Record<string, unknown> = {};
            selectedModel.input_schema.forEach(field => {
                templateObject[field] = '';
            });

            setInputsText(JSON.stringify([templateObject], null, 2));
        }
    }, [selectedModel]);

    const validateAndParseInputs = (): unknown[] | null => {
        try {
            const parsed = JSON.parse(inputsText);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                setError({ status: 422, message: '입력 샘플은 하나 이상의 객체 배열이어야 합니다.' });
                return null;
            }
            return parsed;
        } catch {
            setError({ status: 400, message: '입력 JSON을 해석할 수 없습니다. 형식을 확인해주세요.' });
            return null;
        }
    };

    const resolveModelReference = () => {
        if (selectedModel) {
            return { model_id: selectedModel.model_id };
        }

        if (manualModelId.trim()) {
            const numericId = Number(manualModelId.trim());
            if (!Number.isNaN(numericId)) {
                return { model_id: numericId };
            }
        }

        if (!modelName.trim()) {
            setError({ status: 400, message: '모델을 지정하려면 모델 ID 또는 모델 이름을 입력해야 합니다.' });
            return null;
        }

        const reference: { model_name: string; model_version?: string } = {
            model_name: modelName.trim(),
        };

        if (modelVersion.trim()) {
            reference.model_version = modelVersion.trim();
        }

        return reference;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setResult(null);
        setRequestPreview(null);

        const inputs = validateAndParseInputs();
        if (!inputs) {
            return;
        }

        const modelReference = resolveModelReference();
        if (!modelReference) {
            return;
        }

        const payload = {
            ...modelReference,
            inputs,
            return_probabilities: returnProbabilities,
        };

        setRequestPreview(JSON.stringify(payload, null, 2));
        setIsSubmitting(true);

        try {
            const response = await apiClient(request.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const apiError: ApiError = {
                    status: response.status,
                    message: data?.message || '추론 요청이 실패했습니다.',
                    details: data,
                };
                setError(apiError);
                return;
            }

            setResult(data as InferenceResultPayload);
        } catch (requestError) {
            setError({
                status: 0,
                message: requestError instanceof Error ? requestError.message : '네트워크 요청 중 오류가 발생했습니다.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleModelSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value;
        if (!value) {
            onSelectModel(null);
            return;
        }
        onSelectModel(Number(value));
    };

    const handleTemplatePopulate = () => {
        if (selectedModel?.input_schema && selectedModel.input_schema.length > 0) {
            const template: Record<string, unknown> = {};
            selectedModel.input_schema.forEach(field => {
                template[field] = '';
            });
            setInputsText(JSON.stringify([template], null, 2));
        } else {
            setInputsText('[\n  {\n    "feature": null\n  }\n]');
        }
    };

    return (
        <section className={styles.console}>
            <header className={styles.header}>
                <div>
                    <h2>추론 콘솔</h2>
                    <p>업로드한 모델로 예측을 실행하고 결과를 확인하세요.</p>
                </div>
                <span className={styles.endpointBadge}>POST /api/models/infer</span>
            </header>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.modelSelector}>
                    <label>
                        <span>등록된 모델 선택</span>
                        <select value={selectedModelId ?? ''} onChange={handleModelSelectChange}>
                            <option value="">직접 입력</option>
                            {models.map(model => (
                                <option key={model.model_id} value={model.model_id}>
                                    {`${model.model_name} (${model.model_version ?? 'latest'})`}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className={styles.manualInputs}>
                        <label>
                            <span>모델 ID</span>
                            <input type="number" value={manualModelId} onChange={event => setManualModelId(event.target.value)} placeholder="예: 14" />
                        </label>
                        <label>
                            <span>모델 이름</span>
                            <input type="text" value={modelName} onChange={event => setModelName(event.target.value)} placeholder="예: demo-model" />
                        </label>
                        <label>
                            <span>모델 버전</span>
                            <input type="text" value={modelVersion} onChange={event => setModelVersion(event.target.value)} placeholder="예: v2" />
                        </label>
                    </div>
                </div>

                {selectedModel && (
                    <aside className={styles.modelSummary}>
                        <div>
                            <span>선택된 모델</span>
                            <strong>{selectedModel.model_name}</strong>
                        </div>
                        <div>
                            <span>버전</span>
                            <strong>{selectedModel.model_version ?? 'latest'}</strong>
                        </div>
                        {selectedModel.input_schema && (
                            <div className={styles.schemaPreview}>
                                <span>Input Schema</span>
                                <ul>
                                    {selectedModel.input_schema.map(field => (
                                        <li key={field}>{field}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </aside>
                )}

                <div className={styles.jsonEditor}>
                    <div className={styles.editorHeader}>
                        <label htmlFor="ml-inference-json">입력 샘플 (JSON 배열)</label>
                        <button type="button" onClick={handleTemplatePopulate}>
                            스키마로 템플릿 생성
                        </button>
                    </div>
                    <textarea
                        id="ml-inference-json"
                        value={inputsText}
                        onChange={event => setInputsText(event.target.value)}
                        rows={10}
                        spellCheck={false}
                    />
                </div>

                <label className={styles.toggleRow}>
                    <input type="checkbox" checked={returnProbabilities} onChange={event => setReturnProbabilities(event.target.checked)} />
                    <span>확률 결과 포함 (return_probabilities)</span>
                </label>

                {error && (
                    <div className={styles.errorPanel}>
                        <strong>요청 실패</strong>
                        <p>{error.message}</p>
                        {error.status ? <code>Status: {error.status}</code> : null}
                    </div>
                )}

                {requestPreview && (
                    <details className={styles.requestPreview}>
                        <summary>요청 페이로드 미리보기</summary>
                        <pre>{requestPreview}</pre>
                    </details>
                )}

                <div className={styles.actions}>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? '추론 실행 중...' : '추론 실행'}
                    </button>
                </div>
            </form>

            {result && (
                <section className={styles.resultPanel}>
                    <h3>추론 결과</h3>
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                </section>
            )}
        </section>
    );
};

export default InferenceConsole;
