'use client';

import React, { useState, useEffect } from 'react';
import {
    FiX,
    FiDatabase,
    FiCheck,
    FiAlertCircle,
    FiLoader,
    FiEye,
    FiEyeOff,
    FiSave,
    FiTrash2,
} from 'react-icons/fi';
import {
    testDatabaseConnection,
    listDatabaseSchemas,
    listDatabaseTables,
    previewDatabaseTable,
    validateSqlQuery,
    loadDatasetFromDatabase,
    parseConnectionUrl,
    dbConfigToUrl,
    validateDatabaseConfig,
    getDefaultDatabasePort,
    getSavedDatabaseConfigs,
    saveDatabaseConfigToLocal,
    deleteSavedDatabaseConfig,
} from '@/app/_common/api/dataManagerAPI';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from './assets/DatabaseConnectionModal.module.scss';

interface DatabaseConnectionModalProps {
    isOpen: boolean;
    managerId: string;
    onClose: () => void;
    onLoadSuccess: () => void;
}

interface DBConfig {
    db_type: 'postgresql' | 'mysql' | 'sqlite';
    host?: string;
    port?: number;
    database: string;
    username?: string;
    password?: string;
}

interface TableInfo {
    table_name: string;
    schema?: string;
    column_count: number;
    row_count: number | null;
}

type LoadMode = 'table' | 'query';
type Step = 'config' | 'mode' | 'table-select' | 'query-input' | 'preview';

const DatabaseConnectionModal: React.FC<DatabaseConnectionModalProps> = ({
    isOpen,
    managerId,
    onClose,
    onLoadSuccess,
}) => {
    // State
    const [step, setStep] = useState<Step>('config');
    const [loadMode, setLoadMode] = useState<LoadMode>('table');
    
    // URL 모드 관련
    const [useUrlMode, setUseUrlMode] = useState(false);
    const [connectionUrl, setConnectionUrl] = useState('');
    
    const [dbConfig, setDbConfig] = useState<DBConfig>({
        db_type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: '',
        username: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [testing, setTesting] = useState(false);
    const [connectionTested, setConnectionTested] = useState(false);
    const [connectionSuccess, setConnectionSuccess] = useState(false);

    const [schemas, setSchemas] = useState<Array<{ schema_name: string; table_count: number }>>([]);
    const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
    
    const [sqlQuery, setSqlQuery] = useState('');
    const [queryValidated, setQueryValidated] = useState(false);
    const [queryValid, setQueryValid] = useState(false);
    const [estimatedColumns, setEstimatedColumns] = useState<Array<{ name: string; type: string }>>([]);
    const [estimatedRows, setEstimatedRows] = useState<number | null>(null);

    const [previewData, setPreviewData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
    const [showSavedConfigs, setShowSavedConfigs] = useState(false);
    const [configName, setConfigName] = useState('');

    // DB 타입 변경 시 기본 포트 설정
    useEffect(() => {
        if (dbConfig.db_type !== 'sqlite') {
            setDbConfig(prev => ({
                ...prev,
                port: getDefaultDatabasePort(prev.db_type)
            }));
        }
    }, [dbConfig.db_type]);

    // 저장된 설정 불러오기
    useEffect(() => {
        if (isOpen) {
            setSavedConfigs(getSavedDatabaseConfigs());
        }
    }, [isOpen]);

    // 모달 닫기
    const handleClose = () => {
        resetModal();
        onClose();
    };

    // 모달 초기화
    const resetModal = () => {
        setStep('config');
        setLoadMode('table');
        setUseUrlMode(false);
        setConnectionUrl('');
        setConnectionTested(false);
        setConnectionSuccess(false);
        setSchemas([]);
        setSelectedSchema(null);
        setTables([]);
        setSelectedTable(null);
        setSqlQuery('');
        setQueryValidated(false);
        setQueryValid(false);
        setEstimatedColumns([]);
        setEstimatedRows(null);
        setPreviewData(null);
        setShowPassword(false);
    };

    // URL 파싱
    const handleParseUrl = () => {
        if (!connectionUrl.trim()) {
            showErrorToastKo('연결 URL을 입력해주세요.');
            return;
        }

        try {
            const parsed = parseConnectionUrl(connectionUrl) as any;
            setDbConfig(parsed);
            setUseUrlMode(false);
            setConnectionTested(false);
            showSuccessToastKo('URL이 성공적으로 파싱되었습니다!');
        } catch (error) {
            showErrorToastKo(`URL 파싱 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    // URL 생성
    const handleGenerateUrl = () => {
        // ✅ 유효성 검사 추가
        const validation = validateDatabaseConfig(dbConfig) as { valid: boolean; errors?: string[] };
        if (!validation.valid) {
            showErrorToastKo((validation.errors ?? []).join('\n'));
            return;
        }
        
        try {
            const url = dbConfigToUrl(dbConfig, true);
            setConnectionUrl(url);
            setUseUrlMode(true);
            setConnectionTested(false);
            showSuccessToastKo('연결 URL이 생성되었습니다!');
        } catch (error) {
            showErrorToastKo(`URL 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    // 연결 테스트
    const handleTestConnection = async () => {
        if (useUrlMode) {
            if (!connectionUrl.trim()) {
                showErrorToastKo('연결 URL을 입력해주세요.');
                return;
            }
        } else {
            const validation = validateDatabaseConfig(dbConfig) as { valid: boolean; errors?: string[] };
            if (!validation.valid) {
                showErrorToastKo((validation.errors ?? []).join('\n'));
                return;
            }
        }

        setTesting(true);
        try {
            const result = await testDatabaseConnection(
                useUrlMode ? null : dbConfig,
                useUrlMode ? connectionUrl : null
            ) as { success: boolean; parsed_config?: any; schemas?: any[] };
            
            if (result.success) {
                setConnectionTested(true);
                setConnectionSuccess(true);
                showSuccessToastKo('데이터베이스 연결 성공!');

                // URL 모드였다면 파싱된 설정으로 업데이트
                if (useUrlMode && result.parsed_config) {
                    setDbConfig(result.parsed_config);
                }

                // PostgreSQL인 경우 스키마 정보 저장
                if (result.schemas) {
                    setSchemas(result.schemas);
                }
            } else {
                setConnectionTested(true);
                setConnectionSuccess(false);
                showErrorToastKo('데이터베이스 연결 실패');
            }
        } catch (error) {
            setConnectionTested(true);
            setConnectionSuccess(false);
            showErrorToastKo(`연결 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setTesting(false);
        }
    };

    // 다음 단계로
    const handleNext = async () => {
        if (step === 'config') {
            if (!connectionTested || !connectionSuccess) {
                showErrorToastKo('먼저 데이터베이스 연결을 테스트해주세요.');
                return;
            }
            setStep('mode');
        } else if (step === 'mode') {
            if (loadMode === 'table') {
                await loadTables();
                setStep('table-select');
            } else {
                setStep('query-input');
            }
        } else if (step === 'table-select') {
            if (!selectedTable) {
                showErrorToastKo('테이블을 선택해주세요.');
                return;
            }
            await loadTablePreview();
            setStep('preview');
        } else if (step === 'query-input') {
            if (!queryValidated || !queryValid) {
                showErrorToastKo('먼저 쿼리를 검증해주세요.');
                return;
            }
            setStep('preview');
        }
    };

    // 이전 단계로
    const handleBack = () => {
        if (step === 'mode') {
            setStep('config');
        } else if (step === 'table-select' || step === 'query-input') {
            setStep('mode');
        } else if (step === 'preview') {
            setStep(loadMode === 'table' ? 'table-select' : 'query-input');
        }
    };

    // 테이블 목록 로드
    const loadTables = async () => {
        setLoading(true);
        try {
            const result = await listDatabaseTables(
                (useUrlMode ? null : dbConfig) as any,
                (useUrlMode ? connectionUrl : null) as any,
                selectedSchema as any
            );
            setTables(result.tables || []);
        } catch (error) {
            showErrorToastKo(`테이블 목록 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
        }
    };

    // 스키마 변경 시 테이블 다시 로드
    useEffect(() => {
        if (step === 'table-select' && connectionSuccess) {
            loadTables();
        }
    }, [selectedSchema]);

    // 테이블 미리보기
    const loadTablePreview = async () => {
        if (!selectedTable) return;

        setLoading(true);
        try {
            const result = await previewDatabaseTable(
                (useUrlMode ? null : dbConfig) as any,
                (useUrlMode ? connectionUrl : null) as any,
                selectedTable.table_name,
                selectedSchema as any,
                5
            );
            setPreviewData(result);
        } catch (error) {
            showErrorToastKo(`테이블 미리보기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
            );
        } finally {
            setLoading(false);
        }
    };

    // 쿼리 검증
    const handleValidateQuery = async () => {
        if (!sqlQuery.trim()) {
            showErrorToastKo('SQL 쿼리를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const result = await validateSqlQuery(
                (useUrlMode ? null : dbConfig) as any,
                (useUrlMode ? connectionUrl : null) as any,
                sqlQuery
            );
            
            if (result.valid) {
                setQueryValidated(true);
                setQueryValid(true);
                setEstimatedColumns(result.columns || []);
                setEstimatedRows(result.estimated_rows);
                showSuccessToastKo('쿼리가 유효합니다!');
            } else {
                setQueryValidated(true);
                setQueryValid(false);
                showErrorToastKo(`쿼리 오류: ${result.error || '알 수 없는 오류'}`);
            }
        } catch (error) {
            setQueryValidated(true);
            setQueryValid(false);
            showErrorToastKo(`쿼리 검증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
        }
    };

    // 데이터셋 로드 실행
    const handleLoadDataset = async () => {
        setLoading(true);
        try {
            const result = await loadDatasetFromDatabase(
                managerId,
                useUrlMode ? null : dbConfig,
                useUrlMode ? connectionUrl : null,
                loadMode,
                loadMode === 'table' ? selectedTable?.table_name : undefined,
                loadMode === 'query' ? sqlQuery : undefined,
                selectedSchema || undefined
            ) as { success: boolean; message?: string; [key: string]: any };

            if (result.success) {
                showSuccessToastKo('데이터셋이 성공적으로 로드되었습니다!');
                onLoadSuccess();
                handleClose();
            } else {
                showErrorToastKo(result.message || '데이터셋 로드 실패');
            }
        } catch (error) {
            showErrorToastKo(`데이터셋 로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
        }
    };

    // 설정 저장
    const handleSaveConfig = () => {
        if (!configName.trim()) {
            showErrorToastKo('설정 이름을 입력해주세요.');
            return;
        }

        saveDatabaseConfigToLocal(configName, dbConfig);
        setSavedConfigs(getSavedDatabaseConfigs());
        setConfigName('');
        showSuccessToastKo('설정이 저장되었습니다!');
    };

    // 저장된 설정 불러오기
    const handleLoadSavedConfig = (config: any) => {
        setDbConfig({
            ...config.config,
            password: '', // 비밀번호는 저장되지 않음
        });
        setShowSavedConfigs(false);
        setConnectionTested(false);
        setConnectionSuccess(false);
        showSuccessToastKo(`설정 '${config.name}'을 불러왔습니다. 비밀번호를 입력해주세요.`);
    };

    // 저장된 설정 삭제
    const handleDeleteSavedConfig = (name: string) => {
        deleteSavedDatabaseConfig(name);
        setSavedConfigs(getSavedDatabaseConfigs());
        showSuccessToastKo('설정이 삭제되었습니다.');
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerTitle}>
                        <FiDatabase />
                        <h2>데이터베이스에서 로드</h2>
                    </div>
                    <button onClick={handleClose} className={styles.closeButton}>
                        <FiX />
                    </button>
                </div>

                {/* 진행 단계 표시 */}
                <div className={styles.progressBar}>
                    <div className={`${styles.progressStep} ${step === 'config' ? styles.active : ''} ${['mode', 'table-select', 'query-input', 'preview'].includes(step) ? styles.completed : ''}`}>
                        <span className={styles.stepNumber}>1</span>
                        <span className={styles.stepLabel}>연결 설정</span>
                    </div>
                    <div className={styles.progressLine}></div>
                    <div className={`${styles.progressStep} ${step === 'mode' ? styles.active : ''} ${['table-select', 'query-input', 'preview'].includes(step) ? styles.completed : ''}`}>
                        <span className={styles.stepNumber}>2</span>
                        <span className={styles.stepLabel}>모드 선택</span>
                    </div>
                    <div className={styles.progressLine}></div>
                    <div className={`${styles.progressStep} ${['table-select', 'query-input'].includes(step) ? styles.active : ''} ${step === 'preview' ? styles.completed : ''}`}>
                        <span className={styles.stepNumber}>3</span>
                        <span className={styles.stepLabel}>데이터 선택</span>
                    </div>
                    <div className={styles.progressLine}></div>
                    <div className={`${styles.progressStep} ${step === 'preview' ? styles.active : ''}`}>
                        <span className={styles.stepNumber}>4</span>
                        <span className={styles.stepLabel}>미리보기</span>
                    </div>
                </div>

                {/* 본문 */}
                <div className={styles.modalBody}>
                    {/* Step 1: 연결 설정 */}
                    {step === 'config' && (
                        <div className={styles.configStep}>
                            {/* 저장된 설정 버튼 */}
                            {savedConfigs.length > 0 && (
                                <button
                                    onClick={() => setShowSavedConfigs(!showSavedConfigs)}
                                    className={styles.savedConfigsToggle}
                                >
                                    {showSavedConfigs ? '설정 숨기기' : '저장된 설정 불러오기'}
                                </button>
                            )}

                            {/* 저장된 설정 목록 */}
                            {showSavedConfigs && (
                                <div className={styles.savedConfigsList}>
                                    {savedConfigs.map((config) => (
                                        <div key={config.name} className={styles.savedConfigItem}>
                                            <div className={styles.configInfo}>
                                                <strong>{config.name}</strong>
                                                <span>{config.config.db_type} - {config.config.database}</span>
                                            </div>
                                            <div className={styles.configActions}>
                                                <button
                                                    onClick={() => handleLoadSavedConfig(config)}
                                                    className={styles.loadButton}
                                                >
                                                    불러오기
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSavedConfig(config.name)}
                                                    className={styles.deleteButton}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 모드 전환 버튼 */}
                            <div className={styles.modeToggle}>
                                <button
                                    onClick={() => setUseUrlMode(false)}
                                    className={`${styles.modeButton} ${!useUrlMode ? styles.active : ''}`}
                                >
                                    개별 설정
                                </button>
                                <button
                                    onClick={() => setUseUrlMode(true)}
                                    className={`${styles.modeButton} ${useUrlMode ? styles.active : ''}`}
                                >
                                    URL 사용
                                </button>
                            </div>

                            {useUrlMode ? (
                                // URL 입력 모드
                                <>
                                    <div className={styles.formGroup}>
                                        <label>연결 URL</label>
                                        <textarea
                                            value={connectionUrl}
                                            onChange={(e) => {
                                                setConnectionUrl(e.target.value);
                                                setConnectionTested(false);
                                            }}
                                            placeholder="postgresql://user:password@localhost:5432/mydb&#10;또는&#10;jdbc:postgresql://host:5432/database"
                                            className={styles.textareaUrl}
                                            rows={3}
                                        />
                                        <small className={styles.hint}>
                                            예시: postgresql://user:pass@host:5432/db<br/>
                                            JDBC URL도 지원: jdbc:postgresql://host:5432/db
                                        </small>
                                    </div>

                                    <button
                                        onClick={handleParseUrl}
                                        className={styles.secondaryButton}
                                    >
                                        URL 파싱하여 설정으로 변환
                                    </button>
                                </>
                            ) : (
                                // 개별 설정 모드
                                <>
                                    <div className={styles.formGroup}>
                                        <label>데이터베이스 타입</label>
                                        <select
                                            value={dbConfig.db_type}
                                            onChange={(e) => {
                                                setDbConfig({ ...dbConfig, db_type: e.target.value as any });
                                                setConnectionTested(false);
                                            }}
                                            className={styles.select}
                                        >
                                            <option value="postgresql">PostgreSQL</option>
                                            <option value="mysql">MySQL</option>
                                            <option value="sqlite">SQLite</option>
                                        </select>
                                    </div>

                                    {dbConfig.db_type !== 'sqlite' && (
                                        <>
                                            <div className={styles.formGroup}>
                                                <label>호스트</label>
                                                <input
                                                    type="text"
                                                    value={dbConfig.host || ''}
                                                    onChange={(e) => {
                                                        setDbConfig({ ...dbConfig, host: e.target.value });
                                                        setConnectionTested(false);
                                                    }}
                                                    placeholder="localhost 또는 192.168.1.100"
                                                    className={styles.input}
                                                />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>포트</label>
                                                <input
                                                    type="number"
                                                    value={dbConfig.port || ''}
                                                    onChange={(e) => {
                                                        setDbConfig({ ...dbConfig, port: parseInt(e.target.value) || undefined });
                                                        setConnectionTested(false);
                                                    }}
                                                    placeholder={String(getDefaultDatabasePort(dbConfig.db_type))}
                                                    className={styles.input}
                                                />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>
                                                    사용자명 <span className={styles.required}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={dbConfig.username || ''}
                                                    onChange={(e) => {
                                                        setDbConfig({ ...dbConfig, username: e.target.value });
                                                        setConnectionTested(false);
                                                    }}
                                                    placeholder="postgres"
                                                    className={styles.input}
                                                    required  // ✅ HTML5 필수 속성
                                                />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label>
                                                    비밀번호 <span className={styles.required}>*</span>
                                                </label>
                                                <div className={styles.passwordInput}>
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={dbConfig.password || ''}
                                                        onChange={(e) => {
                                                            setDbConfig({ ...dbConfig, password: e.target.value });
                                                            setConnectionTested(false);
                                                        }}
                                                        placeholder="••••••••"
                                                        className={styles.input}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className={styles.togglePassword}
                                                    >
                                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className={styles.formGroup}>
                                        <label>데이터베이스명</label>
                                        <input
                                            type="text"
                                            value={dbConfig.database}
                                            onChange={(e) => {
                                                setDbConfig({ ...dbConfig, database: e.target.value });
                                                setConnectionTested(false);
                                            }}
                                            placeholder={dbConfig.db_type === 'sqlite' ? '/path/to/database.db' : 'myapp'}
                                            className={styles.input}
                                        />
                                    </div>

                                    {dbConfig.db_type !== 'sqlite' && (
                                        <button
                                            onClick={handleGenerateUrl}
                                            className={styles.secondaryButton}
                                        >
                                            설정에서 URL 생성
                                        </button>
                                    )}
                                </>
                            )}

                            {/* 연결 테스트 */}
                            <button
                                onClick={handleTestConnection}
                                disabled={testing}
                                className={`${styles.testButton} ${connectionSuccess ? styles.success : ''}`}
                            >
                                {testing ? (
                                    <>
                                        <FiLoader className={styles.spinning} />
                                        테스트 중...
                                    </>
                                ) : connectionTested ? (
                                    connectionSuccess ? (
                                        <>
                                            <FiCheck />
                                            연결 성공
                                        </>
                                    ) : (
                                        <>
                                            <FiAlertCircle />
                                            연결 실패 - 다시 시도
                                        </>
                                    )
                                ) : (
                                    <>
                                        <FiDatabase />
                                        연결 테스트
                                    </>
                                )}
                            </button>

                            {/* 설정 저장 */}
                            {connectionSuccess && !useUrlMode && (
                                <div className={styles.saveConfigSection}>
                                    <input
                                        type="text"
                                        value={configName}
                                        onChange={(e) => setConfigName(e.target.value)}
                                        placeholder="설정 이름 (선택사항)"
                                        className={styles.input}
                                    />
                                    <button
                                        onClick={handleSaveConfig}
                                        disabled={!configName.trim()}
                                        className={styles.saveButton}
                                    >
                                        <FiSave />
                                        설정 저장
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: 모드 선택 */}
                    {step === 'mode' && (
                        <div className={styles.modeStep}>
                            <h3>데이터 로드 방식을 선택하세요</h3>
                            <div className={styles.modeOptions}>
                                <button
                                    onClick={() => setLoadMode('table')}
                                    className={`${styles.modeOption} ${loadMode === 'table' ? styles.active : ''}`}
                                >
                                    <FiDatabase />
                                    <h4>테이블 모드</h4>
                                    <p>테이블을 선택하여 전체 데이터 로드</p>
                                </button>
                                <button
                                    onClick={() => setLoadMode('query')}
                                    className={`${styles.modeOption} ${loadMode === 'query' ? styles.active : ''}`}
                                >
                                    <FiDatabase />
                                    <h4>쿼리 모드</h4>
                                    <p>SQL 쿼리를 작성하여 데이터 로드</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3a: 테이블 선택 */}
                    {step === 'table-select' && (
                        <div className={styles.tableSelectStep}>
                            {dbConfig.db_type === 'postgresql' && schemas.length > 0 && (
                                <div className={styles.formGroup}>
                                    <label>스키마 선택</label>
                                    <select
                                        value={selectedSchema || ''}
                                        onChange={(e) => setSelectedSchema(e.target.value || null)}
                                        className={styles.select}
                                    >
                                        <option value="">모든 스키마</option>
                                        {schemas.map((schema) => (
                                            <option key={schema.schema_name} value={schema.schema_name}>
                                                {schema.schema_name} ({schema.table_count}개 테이블)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {loading ? (
                                <div className={styles.loadingState}>
                                    <FiLoader className={styles.spinning} />
                                    <p>테이블 목록을 불러오는 중...</p>
                                </div>
                            ) : (
                                <div className={styles.tablesList}>
                                    {tables.length === 0 ? (
                                        <div className={styles.emptyState}>
                                            <FiAlertCircle />
                                            <p>테이블을 찾을 수 없습니다.</p>
                                        </div>
                                    ) : (
                                        tables.map((table) => (
                                            <div
                                                key={`${table.schema || ''}.${table.table_name}`}
                                                onClick={() => setSelectedTable(table)}
                                                className={`${styles.tableItem} ${
                                                    selectedTable?.table_name === table.table_name &&
                                                    selectedTable?.schema === table.schema
                                                        ? styles.selected
                                                        : ''
                                                }`}
                                            >
                                                <FiDatabase />
                                                <div className={styles.tableInfo}>
                                                    <strong>
                                                        {table.schema ? `${table.schema}.` : ''}
                                                        {table.table_name}
                                                    </strong>
                                                    <span>
                                                        {table.row_count !== null ? `${table.row_count.toLocaleString()} 행` : 'N/A'} ×{' '}
                                                        {table.column_count} 컬럼
                                                    </span>
                                                </div>
                                                {selectedTable?.table_name === table.table_name && 
                                                 selectedTable?.schema === table.schema && (
                                                    <FiCheck className={styles.checkIcon} />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3b: 쿼리 입력 */}
                    {step === 'query-input' && (
                        <div className={styles.queryInputStep}>
                            <div className={styles.formGroup}>
                                <label>SQL 쿼리</label>
                                <textarea
                                    value={sqlQuery}
                                    onChange={(e) => {
                                        setSqlQuery(e.target.value);
                                        setQueryValidated(false);
                                    }}
                                    placeholder="SELECT * FROM table_name WHERE ..."
                                    className={styles.textarea}
                                    rows={10}
                                />
                            </div>

                            <button
                                onClick={handleValidateQuery}
                                disabled={loading || !sqlQuery.trim()}
                                className={styles.validateButton}
                            >
                                {loading ? (
                                    <>
                                        <FiLoader className={styles.spinning} />
                                        검증 중...
                                    </>
                                ) : queryValidated ? (
                                    queryValid ? (
                                        <>
                                            <FiCheck />
                                            쿼리 유효
                                        </>
                                    ) : (
                                        <>
                                            <FiAlertCircle />
                                            쿼리 오류 - 수정 후 다시 검증
                                        </>
                                    )
                                ) : (
                                    <>
                                        <FiDatabase />
                                        쿼리 검증
                                    </>
                                )}
                            </button>

                            {queryValidated && queryValid && (
                                <div className={styles.queryInfo}>
                                    <h4>예상 결과</h4>
                                    <p>
                                        <strong>컬럼:</strong> {estimatedColumns.length}개
                                    </p>
                                    {estimatedRows !== null && (
                                        <p>
                                            <strong>행:</strong> {estimatedRows.toLocaleString()}개
                                        </p>
                                    )}
                                    <div className={styles.columnsList}>
                                        {estimatedColumns.map((col, idx) => (
                                            <div key={idx} className={styles.columnItem}>
                                                <span className={styles.columnName}>{col.name}</span>
                                                <span className={styles.columnType}>{col.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: 미리보기 */}
                    {step === 'preview' && (
                        <div className={styles.previewStep}>
                            {loading ? (
                                <div className={styles.loadingState}>
                                    <FiLoader className={styles.spinning} />
                                    <p>미리보기를 불러오는 중...</p>
                                </div>
                            ) : previewData ? (
                                <>
                                    <div className={styles.previewInfo}>
                                        <h4>데이터 미리보기</h4>
                                        <p>
                                            총 {previewData.total_rows?.toLocaleString() || 'N/A'} 행 ×{' '}
                                            {previewData.total_columns || 0} 컬럼
                                        </p>
                                    </div>
                                    <div className={styles.previewTable}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    {previewData.columns?.map((col: any) => (
                                                        <th key={col.name}>
                                                            <div>
                                                                <span>{col.name}</span>
                                                                <span className={styles.columnType}>{col.type}</span>
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData.sample_data?.map((row: any, idx: number) => (
                                                    <tr key={idx}>
                                                        {previewData.columns?.map((col: any) => (
                                                            <td key={col.name}>{String(row[col.name] || '')}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.emptyState}>
                                    <FiAlertCircle />
                                    <p>미리보기를 불러올 수 없습니다.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                <div className={styles.modalFooter}>
                    {step !== 'config' && (
                        <button onClick={handleBack} className={styles.backButton}>
                            이전
                        </button>
                    )}
                    <button onClick={handleClose} className={styles.cancelButton}>
                        취소
                    </button>
                    {step !== 'preview' ? (
                        <button
                            onClick={handleNext}
                            disabled={
                                (step === 'config' && (!connectionTested || !connectionSuccess)) ||
                                (step === 'table-select' && !selectedTable) ||
                                (step === 'query-input' && (!queryValidated || !queryValid))
                            }
                            className={styles.nextButton}
                        >
                            다음
                        </button>
                    ) : (
                        <button
                            onClick={handleLoadDataset}
                            disabled={loading}
                            className={styles.loadButton}
                        >
                            {loading ? (
                                <>
                                    <FiLoader className={styles.spinning} />
                                    로드 중...
                                </>
                            ) : (
                                <>
                                    <FiDatabase />
                                    데이터셋 로드
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DatabaseConnectionModal;