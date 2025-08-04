import React, { useState, useEffect } from 'react';
import { FiEdit3, FiCheck, FiX } from 'react-icons/fi';
import { updateConfig } from '@/app/api/configAPI';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/main/assets/Settings.module.scss';

export interface ConfigItem {
    env_name: string;
    config_path: string;
    current_value: any;
    default_value: any;
    is_saved: boolean;
}

export interface FieldConfig {
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

interface BaseConfigPanelProps {
    configData: ConfigItem[];
    fieldConfigs: Record<string, FieldConfig>;
    filterPrefix?: string; // 필터링할 env_name 또는 config_path 접두사
    onTestConnection?: (category: string) => void;
    testConnectionLabel?: string;
    testConnectionCategory?: string;
    onConfigChange?: () => Promise<void>; // ✅ 이 줄 추가
}

const BaseConfigPanel: React.FC<BaseConfigPanelProps> = ({
    configData = [],
    fieldConfigs,
    filterPrefix,
    onTestConnection,
    testConnectionLabel = '연결 테스트',
    testConnectionCategory = 'default',
    onConfigChange, // ✅ props에서 받기
}) => {
    const [localConfig, setLocalConfig] = useState<Record<string, any>>({});
    const [editingConfig, setEditingConfig] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [updating, setUpdating] = useState<Record<string, boolean>>({});

    // configData에서 관련 설정들을 추출 (filterPrefix가 있으면 필터링)
    const filteredConfigs = filterPrefix
        ? configData.filter(
            (item) =>
                item.config_path.startsWith(filterPrefix) ||
                item.env_name.startsWith(filterPrefix),
        )
        : configData;

    // 중복 키 제거 (env_name 기준으로 중복 제거)
    const uniqueConfigs = filteredConfigs.reduce(
        (acc: ConfigItem[], current) => {
            const existing = acc.find(
                (item) => item.env_name === current.env_name,
            );
            if (!existing) {
                acc.push(current);
            }
            return acc;
        },
        [],
    );

    useEffect(() => {
        // configData에서 현재 값들을 localConfig에 설정
        const newLocalConfig: Record<string, any> = {};
        uniqueConfigs.forEach((item) => {
            newLocalConfig[item.env_name] = item.current_value;
        });
        setLocalConfig(newLocalConfig);
    }, [configData, filterPrefix]);

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

    const validateValue = (
        value: string,
        fieldConfig: FieldConfig,
    ): { isValid: boolean; parsedValue: any; error?: string } => {
        try {
            switch (fieldConfig.type) {
                case 'number': {
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) {
                        return {
                            isValid: false,
                            parsedValue: null,
                            error: 'Invalid number format',
                        };
                    }
                    if (
                        fieldConfig.min !== undefined &&
                        numValue < fieldConfig.min
                    ) {
                        return {
                            isValid: false,
                            parsedValue: null,
                            error: `Value must be at least ${fieldConfig.min}`,
                        };
                    }
                    if (
                        fieldConfig.max !== undefined &&
                        numValue > fieldConfig.max
                    ) {
                        return {
                            isValid: false,
                            parsedValue: null,
                            error: `Value must be at most ${fieldConfig.max}`,
                        };
                    }
                    return { isValid: true, parsedValue: numValue };
                }

                case 'boolean':
                    if (value === 'true' || value === 'false') {
                        return { isValid: true, parsedValue: value === 'true' };
                    }
                    return {
                        isValid: false,
                        parsedValue: null,
                        error: 'Invalid boolean value',
                    };

                case 'select': {
                    const validOptions =
                        fieldConfig.options?.map((opt) => opt.value) || [];
                    if (!validOptions.includes(value)) {
                        return {
                            isValid: false,
                            parsedValue: null,
                            error: 'Invalid option selected',
                        };
                    }
                    return { isValid: true, parsedValue: value };
                }

                case 'password':
                case 'text':
                default:
                    return { isValid: true, parsedValue: value };
            }
        } catch (error) {
            return {
                isValid: false,
                parsedValue: null,
                error: 'Invalid value format',
            };
        }
    };

    const handleEditSave = async (configItem: ConfigItem) => {
        const fieldConfig = fieldConfigs[configItem.env_name];
        if (!fieldConfig) return;

        const validation = validateValue(editValue, fieldConfig);

        if (!validation.isValid) {
            alert(`유효하지 않은 값입니다: ${validation.error}`);
            return;
        }

        setUpdating((prev) => ({ ...prev, [configItem.env_name]: true }));

        try {
            await updateConfig(configItem.env_name, validation.parsedValue);
            setLocalConfig((prev) => ({
                ...prev,
                [configItem.env_name]: validation.parsedValue,
            }));
            setEditingConfig(null);
            setEditValue('');
            devLog.info(
                `Updated ${configItem.env_name}:`,
                validation.parsedValue,
            );
        } catch (error) {
            devLog.error(`Failed to update ${configItem.env_name}:`, error);
            alert('설정 업데이트에 실패했습니다.');
        } finally {
            setUpdating((prev) => ({ ...prev, [configItem.env_name]: false }));
            if (onConfigChange) {
                await onConfigChange();
            }
        }
    };

    const formatValue = (value: any, fieldConfig: FieldConfig): string => {
        if (value === null || value === undefined) return 'N/A';

        // 민감한 정보 마스킹 (API 키, 패스워드 등)
        if (
            fieldConfig.type === 'password' &&
            typeof value === 'string' &&
            value.length > 8
        ) {
            return (
                value.substring(0, 8) +
                '*'.repeat(Math.min(value.length - 8, 20)) +
                '...'
            );
        }

        // Boolean 값 처리
        if (fieldConfig.type === 'boolean') {
            return value ? '활성화' : '비활성화';
        }

        return String(value);
    };

    const handleTest = () => {
        if (onTestConnection) {
            onTestConnection(testConnectionCategory);
        }
    };

    const renderEditInput = (
        configItem: ConfigItem,
        fieldConfig: FieldConfig,
    ) => {
        if (fieldConfig.type === 'select') {
            return (
                <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    disabled={updating[configItem.env_name]}
                    onKeyDown={(e) => handleKeyPress(e, configItem)}
                    autoFocus
                    className={`${styles.editInput} ${styles.editSelect}`}
                >
                    <option value="">선택하세요</option>
                    {fieldConfig.options?.map(
                        (option: { value: string; label: string }) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ),
                    )}
                </select>
            );
        } else if (fieldConfig.type === 'boolean') {
            return (
                <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    disabled={updating[configItem.env_name]}
                    onKeyDown={(e) => handleKeyPress(e, configItem)}
                    autoFocus
                    className={`${styles.editInput} ${styles.editSelect}`}
                >
                    <option value="true">활성화</option>
                    <option value="false">비활성화</option>
                </select>
            );
        } else {
            return (
                <input
                    type={
                        fieldConfig.type === 'password'
                            ? 'text'
                            : fieldConfig.type
                    }
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
                        fontFamily:
                            fieldConfig.type === 'password'
                                ? "'Courier New', monospace"
                                : 'inherit',
                    }}
                />
            );
        }
    };

    return (
        <div className={styles.configForm}>
            {uniqueConfigs.map((configItem) => {
                const fieldConfig = fieldConfigs[configItem.env_name];
                if (!fieldConfig) return null;

                const currentValue =
                    localConfig[configItem.env_name] !== undefined
                        ? localConfig[configItem.env_name]
                        : configItem.current_value;

                const isEditing = editingConfig === configItem.env_name;

                return (
                    <div key={configItem.env_name} className={styles.formGroup}>
                        <div className={styles.configHeader}>
                            <label>
                                {fieldConfig.label}
                                {fieldConfig.required && (
                                    <span className={styles.required}>*</span>
                                )}
                            </label>
                        </div>

                        <div className={styles.configValue}>
                            {isEditing ? (
                                <div className={styles.editContainer}>
                                    {renderEditInput(configItem, fieldConfig)}

                                    <div className={styles.editButtons}>
                                        <button
                                            onClick={() =>
                                                handleEditSave(configItem)
                                            }
                                            className={`${styles.editButton} ${styles.saveButton}`}
                                            disabled={
                                                updating[configItem.env_name]
                                            }
                                            title="저장"
                                        >
                                            <FiCheck />
                                        </button>
                                        <button
                                            onClick={handleEditCancel}
                                            className={`${styles.editButton} ${styles.cancelButton}`}
                                            disabled={
                                                updating[configItem.env_name]
                                            }
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
                                                fontFamily:
                                                    fieldConfig.type ===
                                                        'password'
                                                        ? "'Courier New', monospace"
                                                        : 'inherit',
                                            }}
                                        >
                                            {formatValue(
                                                currentValue,
                                                fieldConfig,
                                            )}
                                        </span>
                                    </div>
                                    <div className={styles.editButtons}>
                                        <button
                                            onClick={() =>
                                                handleEditStart(configItem)
                                            }
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
                                환경변수: {configItem.env_name} | 설정경로:{' '}
                                {configItem.config_path}
                            </span>
                            {!configItem.is_saved && (
                                <span className={styles.unsaved}>
                                    {' '}
                                    (저장되지 않음)
                                </span>
                            )}
                            {updating[configItem.env_name] && (
                                <span className={styles.saving}>
                                    {' '}
                                    (저장 중...)
                                </span>
                            )}
                        </small>
                    </div>
                );
            })}

            {/* Test Connection Button */}
            {uniqueConfigs.length > 0 && onTestConnection && (
                <div
                    className={styles.formActions}
                    style={{ marginTop: '1rem' }}
                >
                    <button
                        onClick={handleTest}
                        className={`${styles.button} ${styles.test}`}
                        disabled={!uniqueConfigs.some((c) => c.is_saved)}
                    >
                        {testConnectionLabel}
                    </button>
                </div>
            )}
        </div>
    );
};

export default BaseConfigPanel;
