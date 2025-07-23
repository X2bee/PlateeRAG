'use client';

import React, { useState, useEffect } from 'react';
import {
    FiRefreshCw,
    FiDatabase,
    FiSettings,
    FiCpu,
    FiLayers,
    FiServer,
    FiArrowLeft,
    FiEdit3,
    FiCheck,
    FiX,
} from 'react-icons/fi';
import { BsDatabaseUp } from 'react-icons/bs';
import { SiOpenai } from 'react-icons/si';
import { fetchAllConfigs, updateConfig } from '@/app/api/configAPI';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/main/assets/ConfigViewer.module.scss';

interface ConfigItem {
    env_name: string;
    config_path: string;
    current_value: any;
    default_value: any;
    is_saved: boolean;
    type: string;
}

type CategoryType =
    | 'database'
    | 'openai'
    | 'app'
    | 'workflow'
    | 'node'
    | 'vectordb'
    | 'other';

interface ConfigViewerProps {
    onNavigateToSettings?: () => void;
}

const ConfigViewer: React.FC<ConfigViewerProps> = ({
    onNavigateToSettings,
}) => {
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');
    const [editingConfig, setEditingConfig] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [updating, setUpdating] = useState(false);

    const fetchConfigs = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAllConfigs();
            devLog.info('Fetched config data:', data);

            if (
                data &&
                (data as any).persistent_summary &&
                (data as any).persistent_summary.configs
            ) {
                const configArray: ConfigItem[] = (
                    data as any
                ).persistent_summary.configs.map((config: any) => {
                    const getValueType = (value: any): string => {
                        if (Array.isArray(value)) return 'Array';
                        if (typeof value === 'boolean') return 'Bool';
                        if (typeof value === 'number') return 'Num';
                        if (typeof value === 'string') return 'Str';
                        return 'Unknown';
                    };

                    return {
                        env_name: config.env_name,
                        config_path: config.config_path,
                        current_value: config.current_value,
                        default_value: config.default_value,
                        is_saved: config.is_saved || false,
                        type: getValueType(config.current_value),
                    };
                });
                setConfigs(configArray);
                devLog.info('Parsed config items:', configArray);
            } else {
                setConfigs([]);
                devLog.warn('Unexpected data structure:', data);
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : '알 수 없는 오류';
            setError(`설정 정보를 불러오는데 실패했습니다: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const getConfigCategory = (configPath: string): CategoryType => {
        const path = configPath.toLowerCase();
        if (path.startsWith('database.')) return 'database';
        if (path.startsWith('openai.')) return 'openai';
        if (path.startsWith('app.')) return 'app';
        if (path.startsWith('workflow.')) return 'workflow';
        if (path.startsWith('node.')) return 'node';
        if (path.startsWith('vectordb.')) return 'vectordb';
        return 'other';
    };

    const getCategoryIcon = (category: CategoryType) => {
        switch (category) {
            case 'database':
                return <FiDatabase />;
            case 'openai':
                return <SiOpenai />;
            case 'app':
                return <FiServer />;
            case 'workflow':
                return <FiLayers />;
            case 'node':
                return <FiCpu />;
            case 'vectordb':
                return <BsDatabaseUp />;
            default:
                return <FiSettings />;
        }
    };

    const getCategoryColor = (category: CategoryType): string => {
        switch (category) {
            case 'database':
                return '#336791';
            case 'openai':
                return '#10a37f';
            case 'app':
                return '#0078d4';
            case 'workflow':
                return '#ff6b35';
            case 'node':
                return '#6366f1';
            case 'vectordb':
                return '#023196';
            default:
                return '#6b7280';
        }
    };

    const getCategoryName = (category: CategoryType): string => {
        switch (category) {
            case 'database':
                return '데이터베이스';
            case 'openai':
                return 'OpenAI';
            case 'app':
                return '애플리케이션';
            case 'workflow':
                return '워크플로우';
            case 'node':
                return '노드';
            case 'vectordb':
                return '벡터 데이터베이스';
            default:
                return '기타';
        }
    };

    const formatValue = (
        value: any,
        type: string,
        envName?: string,
    ): string => {
        if (value === null || value === undefined) return 'N/A';

        // 민감한 정보 마스킹 (API 키, 패스워드 등)
        const sensitiveFields = ['API_KEY', 'PASSWORD', 'SECRET', 'TOKEN'];
        const isSensitive =
            envName && sensitiveFields.some((field) => envName.includes(field));

        if (isSensitive && typeof value === 'string' && value.length > 8) {
            return (
                value.substring(0, 8) +
                '*'.repeat(Math.min(value.length - 8, 20)) +
                '...'
            );
        }

        // 배열 타입 처리
        if (Array.isArray(value)) {
            return value.join(', ');
        }

        // 긴 문자열 처리
        if (typeof value === 'string' && value.length > 50) {
            return value.substring(0, 47) + '...';
        }

        return String(value);
    };

    const formatTypeName = (type: string): string => {
        if (!type) return 'Unknown';
        return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    };

    const getFilteredConfigs = () => {
        if (filter === 'all') return configs;
        return configs.filter(
            (config) => getConfigCategory(config.config_path) === filter,
        );
    };

    const getFilterStats = () => {
        const stats: Record<CategoryType, number> & {
            saved: number;
            unsaved: number;
            total: number;
        } = {
            database: 0,
            openai: 0,
            app: 0,
            workflow: 0,
            node: 0,
            vectordb: 0,
            other: 0,
            saved: 0,
            unsaved: 0,
            total: 0,
        };

        configs.forEach((config) => {
            const category = getConfigCategory(config.config_path);
            stats[category]++;
        });

        stats.saved = configs.filter(
            (c) => c.is_saved && c.current_value != c.default_value,
        ).length;
        stats.unsaved = configs.length - stats.saved;
        stats.total = configs.length;

        return stats;
    };

    const handleEditStart = (config: ConfigItem) => {
        setEditingConfig(config.env_name);
        setEditValue(String(config.current_value));
    };

    const handleEditCancel = () => {
        setEditingConfig(null);
        setEditValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent, config: ConfigItem) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleEditSave(config);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleEditCancel();
        }
    };

    const validateValue = (
        value: string,
        type: string,
    ): { isValid: boolean; parsedValue: any; error?: string } => {
        try {
            switch (type.toLowerCase()) {
                case 'boolean': {
                    const boolValue = value.toLowerCase().trim();
                    if (boolValue === 'true')
                        return { isValid: true, parsedValue: true };
                    if (boolValue === 'false')
                        return { isValid: true, parsedValue: false };
                    return {
                        isValid: false,
                        parsedValue: null,
                        error: 'Boolean values must be "true" or "false"',
                    };
                }

                case 'number': {
                    const numValue = Number(value);
                    if (isNaN(numValue))
                        return {
                            isValid: false,
                            parsedValue: null,
                            error: 'Invalid number format',
                        };
                    return { isValid: true, parsedValue: numValue };
                }

                case 'array':
                    try {
                        const arrayValue = JSON.parse(value);
                        if (!Array.isArray(arrayValue)) {
                            return {
                                isValid: false,
                                parsedValue: null,
                                error: 'Value must be a valid JSON array',
                            };
                        }
                        return { isValid: true, parsedValue: arrayValue };
                    } catch {
                        // 쉼표로 구분된 문자열을 배열로 변환
                        const arrayValue = value
                            .split(',')
                            .map((item) => item.trim())
                            .filter((item) => item.length > 0);
                        return { isValid: true, parsedValue: arrayValue };
                    }

                case 'string':
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

    const handleEditSave = async (config: ConfigItem) => {
        const validation = validateValue(editValue, config.type);

        if (!validation.isValid) {
            alert(`유효하지 않은 값입니다: ${validation.error}`);
            return;
        }

        setUpdating(true);
        try {
            await updateConfig(config.env_name, validation.parsedValue);

            // 로컬 상태 업데이트
            setConfigs((prevConfigs) =>
                prevConfigs.map((c) =>
                    c.env_name === config.env_name
                        ? {
                              ...c,
                              current_value: validation.parsedValue,
                              is_saved: true,
                          }
                        : c,
                ),
            );

            setEditingConfig(null);
            setEditValue('');

            devLog.info(`Config ${config.env_name} updated successfully`);
        } catch (error) {
            devLog.error('Failed to update config:', error);
            alert('설정 업데이트에 실패했습니다.');
        } finally {
            setUpdating(false);
        }
    };

    const stats = getFilterStats();
    const filteredConfigs = getFilteredConfigs();

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <FiRefreshCw className={styles.spinner} />
                    <p>설정 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <p>{error}</p>
                    <button
                        onClick={fetchConfigs}
                        className={styles.retryButton}
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header - simplified for component use */}
            <div className={styles.header}>
                <div className={styles.headerActions}>
                    <button
                        onClick={fetchConfigs}
                        className={styles.refreshButton}
                    >
                        <FiRefreshCw />
                        새로고침
                    </button>
                    {onNavigateToSettings && (
                        <button
                            onClick={onNavigateToSettings}
                            className={styles.settingsButton}
                            title="고급 환경 설정으로 이동"
                        >
                            <FiSettings />
                            고급 설정
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.total}</div>
                    <div className={styles.statLabel}>전체 설정</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.saved}</div>
                    <div className={styles.statLabel}>저장된 설정</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{stats.unsaved}</div>
                    <div className={styles.statLabel}>기본값 사용</div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <button
                    className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    전체 ({stats.total})
                </button>
                {(
                    [
                        'node',
                        'workflow',
                        'app',
                        'database',
                        'vectordb',
                        'openai',
                    ] as CategoryType[]
                ).map(
                    (category) =>
                        stats[category] > 0 && (
                            <button
                                key={category}
                                className={`${styles.filterButton} ${filter === category ? styles.active : ''}`}
                                onClick={() => setFilter(category)}
                            >
                                <span
                                    className={styles.filterIcon}
                                    style={{
                                        color: getCategoryColor(category),
                                    }}
                                >
                                    {getCategoryIcon(category)}
                                </span>
                                {getCategoryName(category)} ({stats[category]})
                            </button>
                        ),
                )}
            </div>

            {/* Config List */}
            <div className={styles.configList}>
                {filteredConfigs.map((config, index) => {
                    const category = getConfigCategory(config.config_path);
                    return (
                        <div key={index} className={styles.configItem}>
                            <div className={styles.configHeader}>
                                <div className={styles.configInfo}>
                                    <div
                                        className={styles.categoryIcon}
                                        style={{
                                            color: getCategoryColor(category),
                                        }}
                                    >
                                        {getCategoryIcon(category)}
                                    </div>
                                    <div className={styles.configTitle}>
                                        <h4>{config.env_name}</h4>
                                        <span className={styles.configPath}>
                                            {config.config_path}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.configStatus}>
                                    <span
                                        className={`${styles.statusBadge} ${config.is_saved && config.current_value != config.default_value ? styles.saved : styles.default}`}
                                    >
                                        {config.is_saved &&
                                        config.current_value !=
                                            config.default_value
                                            ? '설정됨'
                                            : '기본값'}
                                    </span>
                                    <span className={styles.typeBadge}>
                                        {formatTypeName(config.type)}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.configValue}>
                                {editingConfig === config.env_name ? (
                                    <>
                                        <div className={styles.valueRow}>
                                            <label>현재값:</label>
                                            <div
                                                className={styles.valueWithEdit}
                                            >
                                                {config.type.toLowerCase() ===
                                                'boolean' ? (
                                                    <select
                                                        value={editValue}
                                                        onChange={(e) =>
                                                            setEditValue(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={
                                                            styles.editSelectInline
                                                        }
                                                        disabled={updating}
                                                        onKeyDown={(e) =>
                                                            handleKeyPress(
                                                                e,
                                                                config,
                                                            )
                                                        }
                                                        autoFocus
                                                    >
                                                        <option value="true">
                                                            true
                                                        </option>
                                                        <option value="false">
                                                            false
                                                        </option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={
                                                            config.type.toLowerCase() ===
                                                            'number'
                                                                ? 'number'
                                                                : 'text'
                                                        }
                                                        value={editValue}
                                                        onChange={(e) =>
                                                            setEditValue(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className={
                                                            styles.editInputInline
                                                        }
                                                        disabled={updating}
                                                        placeholder={`Enter ${config.type.toLowerCase()} value`}
                                                        onKeyDown={(e) =>
                                                            handleKeyPress(
                                                                e,
                                                                config,
                                                            )
                                                        }
                                                        autoFocus
                                                    />
                                                )}
                                                <div
                                                    className={
                                                        styles.editButtons
                                                    }
                                                >
                                                    <button
                                                        onClick={() =>
                                                            handleEditSave(
                                                                config,
                                                            )
                                                        }
                                                        className={`${styles.editButton} ${styles.saveButton}`}
                                                        disabled={updating}
                                                        title="저장"
                                                    >
                                                        <FiCheck />
                                                    </button>
                                                    <button
                                                        onClick={
                                                            handleEditCancel
                                                        }
                                                        className={`${styles.editButton} ${styles.cancelButton}`}
                                                        disabled={updating}
                                                        title="취소"
                                                    >
                                                        <FiX />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.valueRow}>
                                            <label>기본값:</label>
                                            <span
                                                className={styles.defaultValue}
                                            >
                                                {formatValue(
                                                    config.default_value,
                                                    config.type,
                                                    config.env_name,
                                                )}
                                            </span>
                                        </div>
                                        {config.type.toLowerCase() ===
                                            'array' && (
                                            <div className={styles.helpText}>
                                                배열 값: JSON 형식 [&quot;value1&quot;,
                                                &quot;value2&quot;] 또는 쉼표로 구분된 값
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.valueRow}>
                                            <label>현재값:</label>
                                            <div
                                                className={styles.valueWithEdit}
                                            >
                                                <span
                                                    className={
                                                        styles.currentValue
                                                    }
                                                >
                                                    {formatValue(
                                                        config.current_value,
                                                        config.type,
                                                        config.env_name,
                                                    )}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleEditStart(config)
                                                    }
                                                    className={
                                                        styles.editTrigger
                                                    }
                                                    title="현재값 편집"
                                                >
                                                    <FiEdit3 />
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.valueRow}>
                                            <label>기본값:</label>
                                            <span
                                                className={styles.defaultValue}
                                            >
                                                {formatValue(
                                                    config.default_value,
                                                    config.type,
                                                    config.env_name,
                                                )}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredConfigs.length === 0 && (
                <div className={styles.emptyState}>
                    <p>해당 카테고리에 설정이 없습니다.</p>
                </div>
            )}
        </div>
    );
};

export default ConfigViewer;
