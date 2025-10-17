'use client';
import React, { useState } from 'react';
import { FiArrowLeft, FiSave, FiSettings, FiLink, FiMoreHorizontal, FiPlay } from 'react-icons/fi';
import styles from '@/app/main/workflowSection/assets/ToolStorageUpload.module.scss';
import { saveTool, testApiEndpoint } from '@/app/_common/api/toolsAPI';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import { devLog } from '@/app/_common/utils/logger';

interface ToolStorageUploadProps {
    onBack: () => void;
    editMode?: boolean;
    initialData?: any;
}

interface HeaderParam {
    id: string;
    key: string;
    value: string;
    isPreset: boolean;
}

interface BodyParam {
    id: string;
    key: string;
    type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
    description: string;
    required: boolean;
    enum?: string;
}

const ToolStorageUpload: React.FC<ToolStorageUploadProps> = ({ onBack, editMode = false, initialData = null }) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'api' | 'additional'>('basic');

    // 편집 모드일 경우 initialData로 초기화
    const [formData, setFormData] = useState({
        function_name: initialData?.function_name || '',
        function_id: initialData?.function_id || '',
        description: initialData?.description || '',
        api_url: initialData?.api_url || '',
        api_method: initialData?.api_method || 'GET',
        api_timeout: initialData?.api_timeout || 30,
        response_filter: initialData?.response_filter || false,
        response_filter_path: initialData?.response_filter_path || '',
        response_filter_field: initialData?.response_filter_field || '',
    });

    // Header 파라미터 초기화
    const initializeHeaderParams = (): HeaderParam[] => {
        if (!initialData?.api_header) return [];

        try {
            const headers = typeof initialData.api_header === 'string'
                ? JSON.parse(initialData.api_header)
                : initialData.api_header;

            if (!headers || typeof headers !== 'object') return [];

            return Object.entries(headers).map(([key, value], index) => ({
                id: `header_${Date.now()}_${index}`,
                key,
                value: String(value),
                isPreset: false
            }));
        } catch (error) {
            devLog.error('Failed to parse api_header:', error);
            return [];
        }
    };

    // Body 파라미터 초기화
    const initializeBodyParams = (): BodyParam[] => {
        if (!initialData?.api_body) return [];

        try {
            const body = typeof initialData.api_body === 'string'
                ? JSON.parse(initialData.api_body)
                : initialData.api_body;

            if (!body || typeof body !== 'object') return [];

            // properties와 required 구조 체크
            const properties = body.properties || body;
            const requiredFields = body.required || [];

            return Object.entries(properties).map(([key, value]: [string, any], index) => {
                return {
                    id: `body_${Date.now()}_${index}`,
                    key,
                    type: value.type || 'string',
                    description: value.description || '',
                    required: requiredFields.includes(key),
                    enum: value.enum ? (Array.isArray(value.enum) ? value.enum.join(', ') : String(value.enum)) : ''
                };
            });
        } catch (error) {
            devLog.error('Failed to parse api_body:', error);
            return [];
        }
    };

    const [headerParams, setHeaderParams] = useState<HeaderParam[]>(initializeHeaderParams());
    const [bodyParams, setBodyParams] = useState<BodyParam[]>(initializeBodyParams());
    const [metadata, setMetadata] = useState(initialData?.metadata ? JSON.stringify(initialData.metadata, null, 2) : '{}');
    const [testResult, setTestResult] = useState<{ success: boolean; data: any; error?: string } | null>(
        initialData?.test_result || null
    );
    const [testing, setTesting] = useState(false);
    const [apiTested, setApiTested] = useState(editMode && initialData?.test_result ? true : false);
    const [apiTestSuccess, setApiTestSuccess] = useState(editMode && initialData?.test_result?.success ? true : false);

    // Header 관리 함수
    const addHeaderParam = () => {
        const newParam: HeaderParam = {
            id: `header_${Date.now()}`,
            key: '',
            value: '',
            isPreset: false
        };
        setHeaderParams([...headerParams, newParam]);
        // Header 파라미터가 변경되면 테스트 상태 초기화
        setApiTested(false);
        setApiTestSuccess(false);
        setTestResult(null);
    };

    const updateHeaderParam = (id: string, field: keyof HeaderParam, value: string) => {
        setHeaderParams(headerParams.map(param =>
            param.id === id ? { ...param, [field]: value } : param
        ));
        // Header 파라미터가 변경되면 테스트 상태 초기화
        setApiTested(false);
        setApiTestSuccess(false);
        setTestResult(null);
    };

    const removeHeaderParam = (id: string) => {
        setHeaderParams(headerParams.filter(param => param.id !== id));
        // Header 파라미터가 변경되면 테스트 상태 초기화
        setApiTested(false);
        setApiTestSuccess(false);
        setTestResult(null);
    };

    // Body 관리 함수
    const addBodyParam = () => {
        const newParam: BodyParam = {
            id: `body_${Date.now()}`,
            key: '',
            type: 'string',
            description: '',
            required: false,
            enum: ''
        };
        setBodyParams([...bodyParams, newParam]);
        // Body 파라미터가 변경되면 테스트 상태 초기화
        setApiTested(false);
        setApiTestSuccess(false);
        setTestResult(null);
    };

    const updateBodyParam = (id: string, field: keyof BodyParam, value: string) => {
        setBodyParams(bodyParams.map(param => {
            if (param.id === id) {
                if (field === 'required') {
                    return { ...param, [field]: value === 'true' };
                }
                return { ...param, [field]: value };
            }
            return param;
        }));
        // Body 파라미터가 변경되면 테스트 상태 초기화
        setApiTested(false);
        setApiTestSuccess(false);
        setTestResult(null);
    };

    const removeBodyParam = (id: string) => {
        setBodyParams(bodyParams.filter(param => param.id !== id));
        // Body 파라미터가 변경되면 테스트 상태 초기화
        setApiTested(false);
        setApiTestSuccess(false);
        setTestResult(null);
    };

    // Header/Body를 JSON으로 변환
    const buildHeaderJSON = () => {
        const headerObj: Record<string, string> = {};
        headerParams.forEach(param => {
            if (param.key && param.value) {
                headerObj[param.key] = param.value;
            }
        });
        return headerObj;
    };

    const buildBodyJSON = () => {
        const bodyObj: Record<string, any> = {};
        bodyParams.forEach(param => {
            if (param.key) {
                const paramSchema: any = {
                    type: param.type,
                    description: param.description
                };

                // enum이 있으면 추가
                if (param.enum && param.enum.trim()) {
                    paramSchema.enum = param.enum.split(',').map((v: string) => v.trim()).filter((v: string) => v);
                }

                // required 정보는 별도로 관리 (OpenAI function calling 스키마 형식)
                bodyObj[param.key] = paramSchema;
            }
        });

        // required 필드 목록 생성
        const requiredFields = bodyParams
            .filter(param => param.required && param.key)
            .map(param => param.key);

        return {
            properties: bodyObj,
            required: requiredFields.length > 0 ? requiredFields : undefined
        };
    };

    // 테스트 결과에 필터 적용하여 표시용 데이터 생성
    const getFilteredTestResult = () => {
        if (!testResult || !testResult.success) {
            return testResult?.error || null;
        }

        const displayData = testResult.data?.response || testResult.data;

        // 필터가 활성화되어 있으면 필터링 적용
        if (formData.response_filter && displayData) {
            try {
                let extractedData = displayData;

                // 필터 경로가 설정되어 있으면 경로로 데이터 추출
                if (formData.response_filter_path && formData.response_filter_path.trim()) {
                    const pathKeys = formData.response_filter_path.split('.');

                    for (const key of pathKeys) {
                        if (extractedData && typeof extractedData === 'object' && key in extractedData) {
                            extractedData = extractedData[key];
                        } else {
                            // 경로를 찾지 못하면 원본 반환
                            return displayData;
                        }
                    }
                }

                // 필터 필드 적용 (경로 설정 여부와 무관하게)
                if (formData.response_filter_field && formData.response_filter_field.trim()) {
                    const fields = formData.response_filter_field.split(',').map((f: string) => f.trim()).filter((f: string) => f);

                    if (fields.length > 0) {
                        // 배열인 경우
                        if (Array.isArray(extractedData)) {
                            const filteredList = extractedData.map((item: any) => {
                                if (typeof item === 'object' && item !== null) {
                                    const filteredItem: any = {};
                                    fields.forEach((field: string) => {
                                        if (field in item) {
                                            filteredItem[field] = item[field];
                                        }
                                    });
                                    return filteredItem;
                                }
                                return item;
                            });
                            return filteredList;
                        }
                        // 단일 객체인 경우
                        else if (typeof extractedData === 'object' && extractedData !== null) {
                            const filteredItem: any = {};
                            fields.forEach((field: string) => {
                                if (field in extractedData) {
                                    filteredItem[field] = extractedData[field];
                                }
                            });
                            return filteredItem;
                        }
                    }
                }

                return extractedData;
            } catch (filterError) {
                devLog.error('Error applying response filter for display:', filterError);
            }
        }

        return displayData;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else if (type === 'number') {
            setFormData(prev => ({
                ...prev,
                [name]: parseInt(value) || 0
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // API 관련 필드가 변경되면 테스트 상태 초기화
        if (['api_url', 'api_method', 'api_timeout'].includes(name)) {
            setApiTested(false);
            setApiTestSuccess(false);
            setTestResult(null);
        }
    };

    const handleTestApi = async () => {
        if (!formData.api_url.trim()) {
            showErrorToastKo('API URL을 입력해주세요.');
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const headers = headerParams.length > 0 ? buildHeaderJSON() : {};
            const body = bodyParams.length > 0 ? buildBodyJSON() : {};

            devLog.log('Testing API via backend proxy:', {
                url: formData.api_url,
                method: formData.api_method,
                headers,
                body: formData.api_method !== 'GET' ? body : undefined
            });

            // 백엔드 프록시를 통해 API 테스트
            const result: any = await testApiEndpoint({
                api_url: formData.api_url,
                api_method: formData.api_method || 'GET',
                api_headers: headers,
                api_body: body,
                api_timeout: formData.api_timeout || 30
            });

            devLog.log('API Test Result:', result);

            setTestResult({
                success: result.success || false,
                data: result.data || null,
                error: result.error
            });

            // API 테스트 상태 업데이트
            setApiTested(true);
            setApiTestSuccess(result.success || false);

            if (result.success) {
                showSuccessToastKo('API 테스트 성공');
            } else if (result.error) {
                showErrorToastKo(`API 테스트 실패: ${result.error}`);
            } else {
                showErrorToastKo(`API 응답: ${result.data?.status} ${result.data?.statusText}`);
            }
        } catch (error: any) {
            devLog.error('API Test Error:', error);

            const errorMessage = error.message || 'API 요청 실패';

            setTestResult({
                success: false,
                data: null,
                error: errorMessage
            });

            // API 테스트 상태 업데이트 (실패)
            setApiTested(true);
            setApiTestSuccess(false);

            showErrorToastKo('API 테스트 실패: ' + errorMessage);
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        try {
            // 유효성 검사
            if (!formData.function_name.trim()) {
                showErrorToastKo('도구 이름을 입력하세요.');
                return;
            }

            if (!formData.function_id.trim()) {
                showErrorToastKo('도구 ID를 입력하세요.');
                return;
            }

            if (!formData.api_url.trim()) {
                showErrorToastKo('API URL을 입력하세요.');
                return;
            }

            setLoading(true);

            // JSON 파싱
            const parsedApiHeader = buildHeaderJSON();
            const parsedApiBody = buildBodyJSON();
            let parsedMetadata = {};

            try {
                parsedMetadata = metadata.trim() ? JSON.parse(metadata) : {};
            } catch (e) {
                showErrorToastKo('Metadata JSON 형식이 올바르지 않습니다.');
                setLoading(false);
                return;
            }

            // 도구 데이터 구성
            const toolData = {
                function_name: formData.function_name,
                function_id: formData.function_id,
                description: formData.description,
                api_header: parsedApiHeader,
                api_body: parsedApiBody,
                api_url: formData.api_url,
                api_method: formData.api_method,
                api_timeout: formData.api_timeout,
                response_filter: formData.response_filter,
                response_filter_path: formData.response_filter_path,
                response_filter_field: formData.response_filter_field,
                status: apiTestSuccess ? 'active' : 'inactive',
                metadata: parsedMetadata,
            };

            devLog.log('Saving tool:', toolData);

            if (editMode && initialData) {
                // 편집 모드: updateTool 호출
                const { updateTool } = await import('@/app/_common/api/toolsAPI');
                await updateTool(initialData.id, formData.function_id, toolData);
                showSuccessToastKo('도구가 성공적으로 수정되었습니다!');
            } else {
                // 생성 모드: saveTool 호출
                await saveTool(formData.function_name, toolData);
                showSuccessToastKo('도구가 성공적으로 저장되었습니다!');
            }

            // 저장소로 돌아가기
            onBack();
        } catch (error) {
            devLog.error('Failed to save tool:', error);
            showErrorToastKo(
                `도구 ${editMode ? '수정' : '저장'}에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button
                    className={styles.backButton}
                    onClick={onBack}
                    disabled={loading}
                >
                    <FiArrowLeft />
                    <span>돌아가기</span>
                </button>
                <h2 className={styles.title}>{editMode ? '도구 수정' : '새 도구 만들기'}</h2>
                <div className={styles.headerActions}>
                    <div className={styles.saveButtonWrapper}>
                        <button
                            className={styles.saveButton}
                            onClick={handleSave}
                            disabled={loading || !apiTested}
                        >
                            <FiSave />
                            <span>{loading ? '저장 중...' : '저장'}</span>
                        </button>
                        {!apiTested && (
                            <span className={styles.tooltipText}>API 테스트가 필요합니다</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className={styles.tabNavigation}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'basic' ? styles.active : ''}`}
                    onClick={() => setActiveTab('basic')}
                    disabled={loading}
                >
                    <FiSettings />
                    <span>기본 설정</span>
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'api' ? styles.active : ''}`}
                    onClick={() => setActiveTab('api')}
                    disabled={loading}
                >
                    <FiLink />
                    <span>API 설정</span>
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'additional' ? styles.active : ''}`}
                    onClick={() => setActiveTab('additional')}
                    disabled={loading}
                >
                    <FiMoreHorizontal />
                    <span>추가 설정</span>
                </button>
            </div>

            {/* Form Container with Config Wrapper */}
            <div className={styles.configWrapper}>
                <div className={styles.configSection}>
                    {/* 기본 설정 탭 */}
                    {activeTab === 'basic' && (
                        <div className={styles.formGroup}>
                            <div className={styles.configHeader}>
                                <label>기본 정보</label>
                            </div>

                    <div className={styles.formRow}>
                        <div>
                            <div className={styles.fieldLabel}>
                                도구 이름 <span className={styles.required}>*</span>
                            </div>
                            <div className={styles.fieldDescription}>
                                도구를 식별할 수 있는 이름을 입력하세요.
                            </div>
                        </div>
                        <div className={styles.fieldInput}>
                            <input
                                type="text"
                                id="function_name"
                                name="function_name"
                                value={formData.function_name}
                                onChange={handleInputChange}
                                className={styles.input}
                                placeholder="예: Weather API Tool"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div>
                            <div className={styles.fieldLabel}>
                                도구 ID <span className={styles.required}>*</span>
                            </div>
                            <div className={styles.fieldDescription}>
                                도구의 고유 식별자입니다. 영문, 숫자, 언더스코어만 사용 가능합니다.
                            </div>
                        </div>
                        <div className={styles.fieldInput}>
                            <input
                                type="text"
                                id="function_id"
                                name="function_id"
                                value={formData.function_id}
                                onChange={handleInputChange}
                                className={styles.input}
                                placeholder="예: weather_api_tool_001"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div>
                            <div className={styles.fieldLabel}>
                                상태
                            </div>
                            <div className={styles.fieldDescription}>
                                API 테스트 결과에 따라 자동으로 설정됩니다.
                            </div>
                        </div>
                        <div className={styles.fieldInput}>
                            <div className={styles.statusDisplay}>
                                {apiTestSuccess ? (
                                    <span className={styles.statusActive}>활성</span>
                                ) : (
                                    <span className={styles.statusInactive}>비활성</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div>
                            <div className={styles.fieldLabel}>
                                설명
                            </div>
                            <div className={styles.fieldDescription}>
                                도구의 용도와 기능에 대한 설명을 입력하세요.
                            </div>
                        </div>
                        <div className={styles.fieldInput}>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className={styles.textarea}
                                placeholder="이 도구는 실시간 날씨 정보를 조회합니다."
                                rows={3}
                                disabled={loading}
                            />
                        </div>
                    </div>
                        </div>
                    )}

                    {/* API 설정 탭 */}
                    {activeTab === 'api' && (
                        <div className={styles.formGroup}>
                            <div className={styles.configHeader}>
                                <label>API 설정</label>
                                <button
                                    className={styles.testButton}
                                    onClick={handleTestApi}
                                    disabled={loading || testing}
                                >
                                    <FiPlay />
                                    <span>{testing ? '테스트 중...' : '테스트'}</span>
                                </button>
                            </div>

                    <div className={styles.formRow}>
                        <div>
                            <div className={styles.fieldLabel}>
                                API URL <span className={styles.required}>*</span>
                            </div>
                            <div className={styles.fieldDescription}>
                                호출할 API의 전체 URL을 입력하세요.
                            </div>
                        </div>
                        <div className={styles.fieldInput}>
                            <input
                                type="text"
                                id="api_url"
                                name="api_url"
                                value={formData.api_url}
                                onChange={handleInputChange}
                                className={styles.input}
                                placeholder="https://api.example.com/v1/weather"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div>
                            <div className={styles.fieldLabel}>
                                HTTP 메서드
                            </div>
                            <div className={styles.fieldDescription}>
                                API 요청에 사용할 HTTP 메서드를 선택하세요.
                            </div>
                        </div>
                        <div className={styles.fieldInput}>
                            <select
                                id="api_method"
                                name="api_method"
                                value={formData.api_method}
                                onChange={handleInputChange}
                                className={styles.select}
                                disabled={loading}
                            >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                                <option value="PATCH">PATCH</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div>
                            <div className={styles.fieldLabel}>
                                타임아웃 (초)
                            </div>
                            <div className={styles.fieldDescription}>
                                API 요청의 최대 대기 시간을 초 단위로 설정하세요.
                            </div>
                        </div>
                        <div className={styles.fieldInput}>
                            <input
                                type="number"
                                id="api_timeout"
                                name="api_timeout"
                                value={formData.api_timeout}
                                onChange={handleInputChange}
                                className={styles.input}
                                min="1"
                                max="300"
                                placeholder="30"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* API Header 섹션 */}
                    <div className={styles.apiParamsSection}>
                        <div className={styles.apiParamsHeader}>
                            <div className={styles.fieldLabel}>
                                API Header
                            </div>
                            <div className={styles.fieldDescription}>
                                API 요청에 포함할 헤더를 설정하세요.
                            </div>
                        </div>

                        <div className={styles.apiParamsContainer}>
                            {/* 좌측 입력 패널 */}
                            <div className={styles.apiParamsInput}>
                                <div className={styles.paramsList}>
                                    {headerParams.map((param) => (
                                        <div key={param.id} className={styles.paramItem}>
                                            <select
                                                className={styles.paramTypeSelect}
                                                value={param.isPreset ? param.key : '__custom__'}
                                                onChange={(e) => {
                                                    const selectedKey = e.target.value;
                                                    if (selectedKey === '__custom__') {
                                                        setHeaderParams(headerParams.map(p =>
                                                            p.id === param.id
                                                                ? { ...p, isPreset: false, key: '', value: '' }
                                                                : p
                                                        ));
                                                    } else {
                                                        setHeaderParams(headerParams.map(p =>
                                                            p.id === param.id
                                                                ? { ...p, isPreset: true, key: selectedKey, value: '' }
                                                                : p
                                                        ));
                                                    }
                                                }}
                                                disabled={loading}
                                            >
                                                <option value="Content-Type">Content-Type</option>
                                                <option value="Accept">Accept</option>
                                                <option value="Authorization">Authorization</option>
                                                <option value="User-Agent">User-Agent</option>
                                                <option value="Cache-Control">Cache-Control</option>
                                                <option value="__custom__">Custom</option>
                                            </select>

                                            {param.isPreset ? (
                                                <div className={styles.paramKeyDisplay}>
                                                    {param.key}
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    className={styles.paramKeyInput}
                                                    placeholder="Enter custom key"
                                                    value={param.key}
                                                    onChange={(e) => updateHeaderParam(param.id, 'key', e.target.value)}
                                                    disabled={loading}
                                                />
                                            )}

                                            {/* Value 입력: Preset에 따라 Select 또는 Input */}
                                            {param.isPreset && param.key === 'Content-Type' ? (
                                                <select
                                                    className={styles.paramValueInput}
                                                    value={param.value}
                                                    onChange={(e) => updateHeaderParam(param.id, 'value', e.target.value)}
                                                    disabled={loading}
                                                >
                                                    <option value="">Select Content-Type</option>
                                                    <option value="application/json">application/json</option>
                                                    <option value="application/xml">application/xml</option>
                                                    <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                                                    <option value="multipart/form-data">multipart/form-data</option>
                                                    <option value="text/plain">text/plain</option>
                                                    <option value="text/html">text/html</option>
                                                    <option value="text/csv">text/csv</option>
                                                </select>
                                            ) : param.isPreset && param.key === 'Accept' ? (
                                                <select
                                                    className={styles.paramValueInput}
                                                    value={param.value}
                                                    onChange={(e) => updateHeaderParam(param.id, 'value', e.target.value)}
                                                    disabled={loading}
                                                >
                                                    <option value="">Select Accept</option>
                                                    <option value="application/json">application/json</option>
                                                    <option value="application/xml">application/xml</option>
                                                    <option value="text/plain">text/plain</option>
                                                    <option value="text/html">text/html</option>
                                                    <option value="*/*">*/* (Any)</option>
                                                </select>
                                            ) : param.isPreset && param.key === 'Cache-Control' ? (
                                                <select
                                                    className={styles.paramValueInput}
                                                    value={param.value}
                                                    onChange={(e) => updateHeaderParam(param.id, 'value', e.target.value)}
                                                    disabled={loading}
                                                >
                                                    <option value="">Select Cache-Control</option>
                                                    <option value="no-cache">no-cache</option>
                                                    <option value="no-store">no-store</option>
                                                    <option value="max-age=0">max-age=0</option>
                                                    <option value="must-revalidate">must-revalidate</option>
                                                    <option value="public">public</option>
                                                    <option value="private">private</option>
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    className={styles.paramValueInput}
                                                    placeholder={
                                                        param.isPreset && param.key === 'Authorization'
                                                            ? 'Bearer YOUR_TOKEN'
                                                            : param.isPreset && param.key === 'User-Agent'
                                                            ? 'Mozilla/5.0 or Custom User Agent'
                                                            : 'Value'
                                                    }
                                                    value={param.value}
                                                    onChange={(e) => updateHeaderParam(param.id, 'value', e.target.value)}
                                                    disabled={loading}
                                                />
                                            )}

                                            <button
                                                className={styles.paramRemoveButton}
                                                onClick={() => removeHeaderParam(param.id)}
                                                disabled={loading}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className={styles.addParamButton}
                                    onClick={addHeaderParam}
                                    disabled={loading}
                                >
                                    + Add Header
                                </button>
                            </div>

                            {/* 우측 미리보기 패널 */}
                            <div className={styles.apiParamsPreview}>
                                <div className={styles.previewTitle}>Preview</div>
                                <pre className={styles.previewCode}>
                                    {JSON.stringify(buildHeaderJSON(), null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* API Body 섹션 */}
                    <div className={styles.apiParamsSection}>
                        <div className={styles.apiParamsHeader}>
                            <div className={styles.fieldLabel}>
                                API Body Parameter Schema
                            </div>
                            <div className={styles.fieldDescription}>
                                AI가 이 도구를 사용하기 위한 파라미터 스키마를 정의하세요.
                            </div>
                        </div>

                        <div className={styles.apiParamsContainer}>
                            {/* 좌측 입력 패널 */}
                            <div className={styles.apiParamsInput}>
                                <div className={styles.paramsList}>
                                    {bodyParams.map((param) => (
                                        <div key={param.id} className={styles.paramItem}>
                                            <input
                                                type="text"
                                                className={styles.paramKeyInput}
                                                placeholder="Parameter Name *"
                                                value={param.key}
                                                onChange={(e) => updateBodyParam(param.id, 'key', e.target.value)}
                                                disabled={loading}
                                            />

                                            <select
                                                className={styles.paramTypeSelect}
                                                value={param.type}
                                                onChange={(e) => updateBodyParam(param.id, 'type', e.target.value)}
                                                disabled={loading}
                                            >
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="integer">Integer</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="array">Array</option>
                                                <option value="object">Object</option>
                                                <option value="null">Null</option>
                                            </select>

                                            <input
                                                type="text"
                                                className={styles.paramDescInput}
                                                placeholder="Description *"
                                                value={param.description}
                                                onChange={(e) => updateBodyParam(param.id, 'description', e.target.value)}
                                                disabled={loading}
                                            />

                                            <input
                                                type="text"
                                                className={styles.paramValueInput}
                                                placeholder="Enum (comma-separated, optional)"
                                                value={param.enum || ''}
                                                onChange={(e) => updateBodyParam(param.id, 'enum', e.target.value)}
                                                disabled={loading}
                                            />

                                            <label className={styles.checkboxLabel} style={{ minWidth: '80px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={param.required}
                                                    onChange={(e) => updateBodyParam(param.id, 'required', e.target.checked ? 'true' : 'false')}
                                                    disabled={loading}
                                                />
                                                <span>Required</span>
                                            </label>

                                            <button
                                                className={styles.paramRemoveButton}
                                                onClick={() => removeBodyParam(param.id)}
                                                disabled={loading}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className={styles.addParamButton}
                                    onClick={addBodyParam}
                                    disabled={loading}
                                >
                                    + Add Parameter
                                </button>
                            </div>

                            {/* 우측 미리보기 패널 */}
                            <div className={styles.apiParamsPreview}>
                                <div className={styles.previewTitle}>Preview</div>
                                <pre className={styles.previewCode}>
                                    {JSON.stringify(buildBodyJSON(), null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* 응답 필터 섹션 */}
                    <div className={styles.apiParamsSection}>
                        <div className={styles.apiParamsHeader}>
                            <div className={styles.fieldLabel}>
                                응답 필터
                            </div>
                            <div className={styles.fieldDescription}>
                                API 응답에서 특정 데이터만 추출하려면 활성화하세요.
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div>
                                <div className={styles.fieldLabel}>
                                    응답 필터 사용
                                </div>
                            </div>
                            <div className={styles.fieldInput}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        name="response_filter"
                                        checked={formData.response_filter}
                                        onChange={handleInputChange}
                                        className={styles.checkbox}
                                        disabled={loading}
                                    />
                                    <span>필터 활성화</span>
                                </label>
                            </div>
                        </div>

                        {formData.response_filter && (
                            <>
                                <div className={styles.formRow}>
                                    <div>
                                        <div className={styles.fieldLabel}>
                                            필터 경로
                                        </div>
                                        <div className={styles.fieldDescription}>
                                            응답 객체에서 데이터를 추출할 경로를 지정하세요. <br></br>(예: data.results)
                                        </div>
                                    </div>
                                    <div className={styles.fieldInput}>
                                        <input
                                            type="text"
                                            id="response_filter_path"
                                            name="response_filter_path"
                                            value={formData.response_filter_path}
                                            onChange={handleInputChange}
                                            className={styles.input}
                                            placeholder="data.weather.current"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div>
                                        <div className={styles.fieldLabel}>
                                            필터 필드
                                        </div>
                                        <div className={styles.fieldDescription}>
                                            추출한 데이터에서 특정 필드만 사용하려면 필드명을 입력하세요(여러개인 경우 , 로 구분).
                                        </div>
                                    </div>
                                    <div className={styles.fieldInput}>
                                        <input
                                            type="text"
                                            id="response_filter_field"
                                            name="response_filter_field"
                                            value={formData.response_filter_field}
                                            onChange={handleInputChange}
                                            className={styles.input}
                                            placeholder="temperature"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* 테스트 결과 섹션 */}
                    {testResult && (
                        <div className={styles.testResultSection}>
                            <div className={styles.testResultHeader}>
                                <span className={testResult.success ? styles.successBadge : styles.errorBadge}>
                                    {testResult.success ? '✓ 성공' : '✗ 실패'}
                                </span>
                                {testResult.data && (
                                    <span className={styles.statusCode}>
                                        {testResult.data.status} {testResult.data.statusText}
                                    </span>
                                )}
                            </div>
                            <div className={styles.testResultContent}>
                                <pre className={styles.testResultCode}>
                                    {testResult.error
                                        ? testResult.error
                                        : JSON.stringify(getFilteredTestResult(), null, 2)
                                    }
                                </pre>
                            </div>
                        </div>
                    )}
                        </div>
                    )}

                    {/* 추가 설정 탭 */}
                    {activeTab === 'additional' && (
                        <div className={styles.formGroup}>
                            <div className={styles.configHeader}>
                                <label>메타데이터</label>
                            </div>

                    <div className={styles.formRow}>
                        <div>
                            <div className={styles.fieldLabel}>
                                메타데이터
                            </div>
                            <div className={styles.fieldDescription}>
                                도구에 대한 추가 정보를 JSON 형식으로 입력하세요.
                            </div>
                        </div>
                        <div className={styles.fieldInput}>
                            <textarea
                                id="metadata"
                                name="metadata"
                                value={metadata}
                                onChange={(e) => setMetadata(e.target.value)}
                                className={styles.textarea}
                                placeholder='{"category": "날씨", "version": "1.0", "tags": ["weather", "api"]}'
                                rows={4}
                                disabled={loading}
                            />
                        </div>
                    </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ToolStorageUpload;
