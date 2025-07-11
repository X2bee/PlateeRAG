"use client";
import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiDatabase, FiSettings, FiCpu, FiLayers, FiServer, FiArrowLeft } from 'react-icons/fi';
import { SiOpenai } from 'react-icons/si';
import { fetchAllConfigs } from '@/app/api/configAPI';
import { devLog } from '@/app/utils/logger';
import styles from '@/app/main/assets/ConfigViewer.module.scss';

interface ConfigItem {
    env_name: string;
    config_path: string;
    current_value: any;
    default_value: any;
    is_saved: boolean;
    type: string;
}

type CategoryType = 'database' | 'openai' | 'app' | 'workflow' | 'node' | 'other';

const ConfigViewer = () => {
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>('all');

    const fetchConfigs = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAllConfigs();
            devLog.info('Fetched config data:', data); // 데이터 구조 확인용
            
            // 백엔드에서 오는 실제 데이터 구조에 맞게 처리
            if (data && (data as any).persistent_summary && (data as any).persistent_summary.configs) {
                const configArray: ConfigItem[] = (data as any).persistent_summary.configs.map((config: any) => {
                    // 값의 타입을 추론
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
                        type: getValueType(config.current_value)
                    };
                });
                setConfigs(configArray);
            } else {
                setConfigs([]);
                devLog.warn('Unexpected data structure:', data);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
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
        return 'other';
    };

    const getCategoryIcon = (category: CategoryType) => {
        switch (category) {
            case 'database': return <FiDatabase />;
            case 'openai': return <SiOpenai />;
            case 'app': return <FiServer />;
            case 'workflow': return <FiLayers />;
            case 'node': return <FiCpu />;
            default: return <FiSettings />;
        }
    };

    const getCategoryColor = (category: CategoryType): string => {
        switch (category) {
            case 'database': return '#336791';
            case 'openai': return '#10a37f';
            case 'app': return '#0078d4';
            case 'workflow': return '#ff6b35';
            case 'node': return '#6366f1';
            default: return '#6b7280';
        }
    };

    const getCategoryName = (category: CategoryType): string => {
        switch (category) {
            case 'database': return '데이터베이스';
            case 'openai': return 'OpenAI';
            case 'app': return '애플리케이션';
            case 'workflow': return '워크플로우';
            case 'node': return '노드';
            default: return '기타';
        }
    };

    const formatValue = (value: any, type: string, envName?: string): string => {
        if (value === null || value === undefined) return 'N/A';
        
        // 민감한 정보 마스킹 (API 키, 패스워드 등)
        const sensitiveFields = ['API_KEY', 'PASSWORD', 'SECRET', 'TOKEN'];
        const isSensitive = envName && sensitiveFields.some(field => envName.includes(field));
        
        if (isSensitive && typeof value === 'string' && value.length > 8) {
            return value.substring(0, 8) + '*'.repeat(Math.min(value.length - 8, 20)) + '...';
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
        return configs.filter(config => getConfigCategory(config.config_path) === filter);
    };

    const getFilterStats = () => {
        const stats: Record<CategoryType, number> & { saved: number; unsaved: number; total: number } = {
            database: 0,
            openai: 0,
            app: 0,
            workflow: 0,
            node: 0,
            other: 0,
            saved: 0,
            unsaved: 0,
            total: 0
        };
        
        configs.forEach(config => {
            const category = getConfigCategory(config.config_path);
            stats[category]++;
        });
        
        stats.saved = configs.filter(c => c.is_saved).length;
        stats.unsaved = configs.length - stats.saved;
        stats.total = configs.length;
        
        return stats;
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
                    <button onClick={fetchConfigs} className={styles.retryButton}>
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
                <button onClick={fetchConfigs} className={styles.refreshButton}>
                    <FiRefreshCw />
                    새로고침
                </button>
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
                {(['database', 'openai', 'app', 'workflow', 'node'] as CategoryType[]).map(category => (
                    stats[category] > 0 && (
                        <button 
                            key={category}
                            className={`${styles.filterButton} ${filter === category ? styles.active : ''}`}
                            onClick={() => setFilter(category)}
                        >
                            <span 
                                className={styles.filterIcon}
                                style={{ color: getCategoryColor(category) }}
                            >
                                {getCategoryIcon(category)}
                            </span>
                            {getCategoryName(category)} ({stats[category]})
                        </button>
                    )
                ))}
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
                                        style={{ color: getCategoryColor(category) }}
                                    >
                                        {getCategoryIcon(category)}
                                    </div>
                                    <div className={styles.configTitle}>
                                        <h4>{config.env_name}</h4>
                                        <span className={styles.configPath}>{config.config_path}</span>
                                    </div>
                                </div>
                                <div className={styles.configStatus}>
                                    <span className={`${styles.statusBadge} ${config.is_saved ? styles.saved : styles.default}`}>
                                        {config.is_saved ? '설정됨' : '기본값'}
                                    </span>
                                    <span className={styles.typeBadge}>{formatTypeName(config.type)}</span>
                                </div>
                            </div>
                            <div className={styles.configValue}>
                                <div className={styles.valueRow}>
                                    <label>현재값:</label>
                                    <span className={styles.currentValue}>
                                        {formatValue(config.current_value, config.type, config.env_name)}
                                    </span>
                                </div>
                                {config.current_value !== config.default_value && (
                                    <div className={styles.valueRow}>
                                        <label>기본값:</label>
                                        <span className={styles.defaultValue}>
                                            {formatValue(config.default_value, config.type, config.env_name)}
                                        </span>
                                    </div>
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
