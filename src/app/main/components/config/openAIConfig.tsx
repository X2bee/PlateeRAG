import React, { useState, useEffect } from "react";
import { FiEdit3, FiCheck, FiX } from "react-icons/fi";
import { updateConfig } from "@/app/api/configAPI";
import { devLog } from "@/app/utils/logger";
import styles from "@/app/main/assets/Settings.module.scss";

interface ConfigItem {
    env_name: string;
    config_path: string;
    current_value: any;
    default_value: any;
    is_saved: boolean;
}

interface OpenAIConfigProps {
    config?: Record<string, any>;
    onConfigChange?: (category: string, field: string, value: any) => void;
    onTestConnection?: (category: string) => void;
    configData?: ConfigItem[];
}

interface FieldConfig {
    label: string;
    type: string;
    placeholder?: string;
    description: string;
    required: boolean;
    min?: number;
    max?: number;
    step?: number;
    options?: Array<{ value: string; label: string }>;
}

// OpenAI 관련 설정 필드의 메타데이터 정의
const OPENAI_CONFIG_FIELDS: Record<string, FieldConfig> = {
    "OPENAI_API_KEY": {
        label: "API Key",
        type: "password",
        placeholder: "sk-...",
        description: "OpenAI API 키를 입력하세요. API 키는 안전하게 암호화되어 저장됩니다.",
        required: true
    },
    "OPENAI_API_BASE_URL": {
        label: "API Base URL",
        type: "text",
        placeholder: "https://api.openai.com/v1",
        description: "OpenAI API의 기본 URL입니다. 프록시나 대체 엔드포인트를 사용하는 경우 변경하세요.",
        required: false
    },
    "OPENAI_MODEL_DEFAULT": {
        label: "기본 모델",
        type: "select",
        options: [
            { value: "gpt-4o-mini-2024-07-18", label: "gpt-4o-mini-2024-07-18" },
            { value: "gpt-4o-2024-11-20", label: "gpt-4o-2024-11-20" },
            { value: "gpt-4.1-mini-2025-04-14", label: "gpt-4.1-mini-2025-04-14" },
            { value: "gpt-4.1-2025-04-14", label: "gpt-4.1-2025-04-14" },
        ],
        description: "워크플로우에서 사용할 기본 OpenAI 모델을 선택하세요.",
        required: false
    },
    "OPENAI_TEMPERATURE_DEFAULT": {
        label: "Temperature (창의성)",
        type: "number",
        min: 0,
        max: 2,
        step: 0.01,
        description: "0에 가까울수록 일관된 답변, 2에 가까울수록 창의적인 답변을 생성합니다. (기본값: 0.7)",
        required: false
    },
    "OPENAI_MAX_TOKENS_DEFAULT": {
        label: "최대 토큰 수",
        type: "number",
        min: 1,
        max: 32000,
        description: "응답에서 생성할 최대 토큰 수입니다. (1 토큰 ≈ 4글자, 기본값: 1000)",
        required: false
    },
    "OPENAI_ORGANIZATION_ID": {
        label: "Organization ID (선택사항)",
        type: "text",
        placeholder: "org-...",
        description: "OpenAI Organization에 속해 있는 경우 Organization ID를 입력하세요.",
        required: false
    }
};

const OpenAIConfig: React.FC<OpenAIConfigProps> = ({
    config = {},
    onConfigChange,
    onTestConnection,
    configData = []
}) => {
    const [localConfig, setLocalConfig] = useState<Record<string, any>>({});
    const [editingConfig, setEditingConfig] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [updating, setUpdating] = useState<Record<string, boolean>>({});

    // configData에서 OpenAI 관련 설정들을 추출
    const openaiConfigs = configData.filter(item =>
        item.config_path.startsWith('openai.') ||
        item.env_name.startsWith('OPENAI_')
    );

    useEffect(() => {
        // configData에서 현재 값들을 localConfig에 설정
        const newLocalConfig: Record<string, any> = {};
        openaiConfigs.forEach(item => {
            newLocalConfig[item.env_name] = item.current_value;
        });
        setLocalConfig(newLocalConfig);
    }, [configData]);

    const handleEditStart = (configItem: ConfigItem) => {
        setEditingConfig(configItem.env_name);
        setEditValue(String(configItem.current_value || ''));
    };

    const handleEditCancel = () => {
        setEditingConfig(null);
        setEditValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent, configItem: ConfigItem) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleEditSave(configItem);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleEditCancel();
        }
    };

    const validateValue = (value: string, fieldConfig: FieldConfig): { isValid: boolean; parsedValue: any; error?: string } => {
        try {
            switch (fieldConfig.type) {
                case 'number':
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) {
                        return { isValid: false, parsedValue: null, error: 'Invalid number format' };
                    }
                    if (fieldConfig.min !== undefined && numValue < fieldConfig.min) {
                        return { isValid: false, parsedValue: null, error: `Value must be at least ${fieldConfig.min}` };
                    }
                    if (fieldConfig.max !== undefined && numValue > fieldConfig.max) {
                        return { isValid: false, parsedValue: null, error: `Value must be at most ${fieldConfig.max}` };
                    }
                    return { isValid: true, parsedValue: numValue };

                case 'select':
                    const validOptions = fieldConfig.options?.map(opt => opt.value) || [];
                    if (!validOptions.includes(value)) {
                        return { isValid: false, parsedValue: null, error: 'Invalid option selected' };
                    }
                    return { isValid: true, parsedValue: value };

                case 'password':
                case 'text':
                default:
                    return { isValid: true, parsedValue: value };
            }
        } catch (error) {
            return { isValid: false, parsedValue: null, error: 'Invalid value format' };
        }
    };

    const handleEditSave = async (configItem: ConfigItem) => {
        const fieldConfig = OPENAI_CONFIG_FIELDS[configItem.env_name];
        if (!fieldConfig) return;

        const validation = validateValue(editValue, fieldConfig);

        if (!validation.isValid) {
            alert(`유효하지 않은 값입니다: ${validation.error}`);
            return;
        }

        setUpdating(prev => ({ ...prev, [configItem.env_name]: true }));

        try {
            await updateConfig(configItem.env_name, validation.parsedValue);
            setLocalConfig(prev => ({ ...prev, [configItem.env_name]: validation.parsedValue }));
            setEditingConfig(null);
            setEditValue('');
            devLog.info(`Updated ${configItem.env_name}:`, validation.parsedValue);
        } catch (error) {
            devLog.error(`Failed to update ${configItem.env_name}:`, error);
            alert('설정 업데이트에 실패했습니다.');
        } finally {
            setUpdating(prev => ({ ...prev, [configItem.env_name]: false }));
        }
    };

    const formatValue = (value: any, fieldConfig: FieldConfig): string => {
        if (value === null || value === undefined) return 'N/A';

        // 민감한 정보 마스킹 (API 키, 패스워드 등)
        if (fieldConfig.type === 'password' && typeof value === 'string' && value.length > 8) {
            return value.substring(0, 8) + '*'.repeat(Math.min(value.length - 8, 20)) + '...';
        }

        return String(value);
    };

    const handleTest = () => {
        if (onTestConnection) {
            onTestConnection("openai");
        }
    };

    return (
        <div className={styles.configForm}>
            {openaiConfigs.map(configItem => {
                const fieldConfig = OPENAI_CONFIG_FIELDS[configItem.env_name];
                if (!fieldConfig) return null;

                const currentValue = localConfig[configItem.env_name] !== undefined
                    ? localConfig[configItem.env_name]
                    : configItem.current_value;

                const isEditing = editingConfig === configItem.env_name;

                return (
                    <div key={configItem.env_name} className={styles.formGroup}>
                        <div className={styles.configHeader}>
                            <label>
                                {fieldConfig.label}
                                {fieldConfig.required && <span className={styles.required}>*</span>}
                            </label>
                        </div>

                        <div className={styles.configValue}>
                            {isEditing ? (
                                <div className={styles.editContainer}>
                                    {fieldConfig.type === "select" ? (
                                        <select
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            disabled={updating[configItem.env_name]}
                                            onKeyDown={(e) => handleKeyPress(e, configItem)}
                                            autoFocus
                                            className={`${styles.editInput} ${styles.editSelect}`}
                                        >
                                            <option value="">선택하세요</option>
                                            {fieldConfig.options?.map((option: { value: string; label: string }) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={fieldConfig.type === "password" ? "text" : fieldConfig.type}
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            placeholder={fieldConfig.placeholder}
                                            min={fieldConfig.min}
                                            max={fieldConfig.max}
                                            step={fieldConfig.step}
                                            disabled={updating[configItem.env_name]}
                                            onKeyDown={(e) => handleKeyPress(e, configItem)}
                                            autoFocus
                                            className={styles.editInput}
                                            style={{
                                                fontFamily: fieldConfig.type === 'password' ? "'Courier New', monospace" : "inherit"
                                            }}
                                        />
                                    )}

                                    <div className={styles.editButtons}>
                                        <button
                                            onClick={() => handleEditSave(configItem)}
                                            className={`${styles.editButton} ${styles.saveButton}`}
                                            disabled={updating[configItem.env_name]}
                                            title="저장"
                                        >
                                            <FiCheck />
                                        </button>
                                        <button
                                            onClick={handleEditCancel}
                                            className={`${styles.editButton} ${styles.cancelButton}`}
                                            disabled={updating[configItem.env_name]}
                                            title="취소"
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.editContainer}>
                                    <div className={styles.valueDisplay}>
                                        <span
                                            className={styles.currentValue}
                                            style={{
                                                fontFamily: fieldConfig.type === 'password' ? "'Courier New', monospace" : "inherit"
                                            }}
                                        >
                                            {formatValue(currentValue, fieldConfig)}
                                        </span>
                                    </div>
                                    <div className={styles.editButtons}>
                                        <button
                                            onClick={() => handleEditStart(configItem)}
                                            className={styles.editButton}
                                            title="편집"
                                        >
                                            <FiEdit3 />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <small className={styles.fieldDescription}>
                            {fieldConfig.description}
                            <br />
                            <span className={styles.configPath}>
                                환경변수: {configItem.env_name} | 설정경로: {configItem.config_path}
                            </span>
                            {!configItem.is_saved && (
                                <span className={styles.unsaved}> (저장되지 않음)</span>
                            )}
                            {updating[configItem.env_name] && (
                                <span className={styles.saving}> (저장 중...)</span>
                            )}
                        </small>
                    </div>
                );
            })}

            {/* Test Connection Button */}
            {openaiConfigs.length > 0 && (
                <div className={styles.formActions} style={{ marginTop: '1rem' }}>
                    <button
                        onClick={handleTest}
                        className={`${styles.button} ${styles.test}`}
                        disabled={!openaiConfigs.some(c => c.is_saved)}
                    >
                        연결 테스트
                    </button>
                </div>
            )}
        </div>
    );
};

export default OpenAIConfig;
