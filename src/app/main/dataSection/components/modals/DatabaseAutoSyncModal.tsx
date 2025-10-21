'use client';

import React, { useState, useEffect } from 'react';
import {
    FiX,
    FiRefreshCw,
    FiCheck,
    FiAlertCircle,
    FiClock,
    FiDatabase,
    FiPlay,
    FiPause,
    FiTrash2,
    FiLoader,
    FiCalendar,
    FiSearch,
    FiActivity,  // ✨ 추가
} from 'react-icons/fi';
import {
    addDBAutoSync,
    getDBSyncStatus,
    getSavedDatabaseConfigs,
    getDefaultDatabasePort,
    testDatabaseConnection,
    validateSqlQuery,
    loadDatasetFromDatabase,
} from '@/app/_common/api/dataManagerAPI';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from './assets/DatabaseAutoSyncModal.module.scss';

interface DatabaseAutoSyncModalProps {
    isOpen: boolean;
    managerId: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface DBConfig {
    db_type: 'postgresql' | 'mysql' | 'sqlite';
    host?: string;
    port?: number;
    database: string;
    username?: string;
    password?: string;
}

interface SyncConfig {
    enabled: boolean;
    schedule_type: 'interval' | 'cron';
    interval_minutes?: number;
    cron_expression?: string;
    query?: string;
    table_name?: string;
    schema_name?: string;
    chunk_size?: number;
    detect_changes: boolean;
    notification_enabled: boolean;
    // ✨ MLflow 설정 추가
    mlflow_enabled: boolean;
    mlflow_experiment_name?: string;
    mlflow_tracking_uri?: string;
}


const DatabaseAutoSyncModal: React.FC<DatabaseAutoSyncModalProps> = ({
    isOpen,
    managerId,
    onClose,
    onSuccess,
}) => {
    const [step, setStep] = useState<'config' | 'schedule' | 'mlflow' | 'review'>('config');  // ✨ mlflow 단계 추가
    const [connectionTesting, setConnectionTesting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<{
        tested: boolean;
        success: boolean;
        message: string;
    } | null>(null);

    // 쿼리 검증 상태
    const [queryValidating, setQueryValidating] = useState(false);
    const [queryValidationStatus, setQueryValidationStatus] = useState<{
        validated: boolean;
        valid: boolean;
        message: string;
    } | null>(null);

    // DB 설정
    const [dbConfig, setDbConfig] = useState<DBConfig>({
        db_type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: '',
        username: '',
        password: '',
    });

    // 동기화 설정
    const [syncConfig, setSyncConfig] = useState<SyncConfig>({
        enabled: true,
        schedule_type: 'interval',
        interval_minutes: 30,
        cron_expression: '',
        query: '',
        table_name: '',
        schema_name: '',
        chunk_size: undefined,
        detect_changes: true,
        notification_enabled: false,
        // ✨ MLflow 기본값
        mlflow_enabled: false,
        mlflow_experiment_name: '',
        mlflow_tracking_uri: '',
    });

    const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
    const [showSavedConfigs, setShowSavedConfigs] = useState(false);
    const [loading, setLoading] = useState(false);
    const [existingSync, setExistingSync] = useState<any>(null);

    // 기존 동기화 설정 확인
    useEffect(() => {
        if (isOpen) {
            checkExistingSync();
            setSavedConfigs(getSavedDatabaseConfigs());
        }
    }, [isOpen, managerId]);

    const checkExistingSync = async () => {
        try {
            const status = await getDBSyncStatus(managerId) as any;
            if (status.success && status.status) {
                setExistingSync(status.status);
            }
        } catch (error) {
            // 동기화 설정이 없는 경우
            setExistingSync(null);
        }
    };

    // DB 타입 변경 시 기본 포트 설정
    useEffect(() => {
        if (dbConfig.db_type !== 'sqlite') {
            setDbConfig(prev => ({
                ...prev,
                port: getDefaultDatabasePort(prev.db_type)
            }));
        }
    }, [dbConfig.db_type]);

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const handleTestConnection = async () => {
        // 기본 유효성 검사
        if (!dbConfig.database) {
            showErrorToastKo('데이터베이스명을 입력해주세요.');
            return;
        }
        if (dbConfig.db_type !== 'sqlite') {
            if (!dbConfig.username || !dbConfig.password) {
                showErrorToastKo('사용자명과 비밀번호를 입력해주세요.');
                return;
            }
        }

        setConnectionTesting(true);
        setConnectionStatus(null);

        try {
            const result = await testDatabaseConnection(dbConfig, null) as any;

            if (result.success) {
                setConnectionStatus({
                    tested: true,
                    success: true,
                    message: result.message || 'DB 연결에 성공했습니다!'
                });
                showSuccessToastKo('DB 연결에 성공했습니다!');
            } else {
                setConnectionStatus({
                    tested: true,
                    success: false,
                    message: result.message || 'DB 연결에 실패했습니다.'
                });
                showErrorToastKo(result.message || 'DB 연결에 실패했습니다.');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            setConnectionStatus({
                tested: true,
                success: false,
                message: errorMessage
            });
            showErrorToastKo(`DB 연결 실패: ${errorMessage}`);
        } finally {
            setConnectionTesting(false);
        }
    };

    // 쿼리 유효성 검증
    const handleValidateQuery = async () => {
            if (!syncConfig.query || syncConfig.query.trim() === '') {
                showErrorToastKo('SQL 쿼리를 입력해주세요.');
                return;
            }
    
            if (!connectionStatus?.success) {
                showErrorToastKo('먼저 DB 연결을 테스트해주세요.');
                return;
            }
    
            setQueryValidating(true);
            setQueryValidationStatus(null);
    
            try {
                const result = await validateSqlQuery(dbConfig as any, null, syncConfig.query) as any;
    
                if (result.valid) {
                    setQueryValidationStatus({
                        validated: true,
                        valid: true,
                        message: `쿼리가 유효합니다! (예상 ${result.row_count || 0}개 행)`
                    });
                    showSuccessToastKo('쿼리가 유효합니다!');
                } else {
                    setQueryValidationStatus({
                        validated: true,
                        valid: false,
                        message: result.error || '쿼리가 유효하지 않습니다.'
                    });
                    showErrorToastKo(result.error || '쿼리가 유효하지 않습니다.');
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
                setQueryValidationStatus({
                    validated: true,
                    valid: false,
                    message: errorMessage
                });
                showErrorToastKo(`쿼리 검증 실패: ${errorMessage}`);
            } finally {
                setQueryValidating(false);
            }
        };

    const resetModal = () => {
        setStep('config');
        setDbConfig({
            db_type: 'postgresql',
            host: 'localhost',
            port: 5432,
            database: '',
            username: '',
            password: '',
        });
        setSyncConfig({
            enabled: true,
            schedule_type: 'interval',
            interval_minutes: 30,
            cron_expression: '',
            query: '',
            table_name: '',
            schema_name: '',
            chunk_size: undefined,
            detect_changes: true,
            notification_enabled: false,
            // MLflow 기본값 추가
            mlflow_enabled: false,
            mlflow_experiment_name: '',
            mlflow_tracking_uri: '',
        });
        setExistingSync(null);
        setConnectionStatus(null);
        setQueryValidationStatus(null);
    };

    const handleLoadSavedConfig = (config: any) => {
        setDbConfig({
            ...config.config,
            password: '', // 비밀번호는 저장되지 않음
        });
        setShowSavedConfigs(false);
        showSuccessToastKo(`설정 '${config.name}'을 불러왔습니다. 비밀번호를 입력해주세요.`);
    };

    const handleNext = () => {
        if (step === 'config') {
            // DB 설정 검증
            if (!dbConfig.database) {
                showErrorToastKo('데이터베이스명을 입력해주세요.');
                return;
            }
            if (dbConfig.db_type !== 'sqlite') {
                if (!dbConfig.username || !dbConfig.password) {
                    showErrorToastKo('사용자명과 비밀번호를 입력해주세요.');
                    return;
                }
            }
            if (!connectionStatus?.success) {
                showErrorToastKo('먼저 DB 연결 테스트를 완료해주세요.');
                return;
            }
            
            setStep('schedule');
        } else if (step === 'schedule') {
            // 스케줄 설정 검증
            if (syncConfig.schedule_type === 'interval') {
                if (!syncConfig.interval_minutes || syncConfig.interval_minutes < 1) {
                    showErrorToastKo('1분 이상의 간격을 입력해주세요.');
                    return;
                }
            } else {
                if (!syncConfig.cron_expression) {
                    showErrorToastKo('Cron 표현식을 입력해주세요.');
                    return;
                }
            }
            if (!syncConfig.query && !syncConfig.table_name) {
                showErrorToastKo('SQL 쿼리 또는 테이블명 중 하나는 필수입니다.');
                return;
            }
            if (syncConfig.query && syncConfig.query.trim() !== '') {
                if (!queryValidationStatus?.valid) {
                    showErrorToastKo('SQL 쿼리 검증을 완료해주세요.');
                    return;
                }
            }
            
            setStep('mlflow');  // ✨ MLflow 설정 단계로
        } else if (step === 'mlflow') {
            // ✨ MLflow 설정 검증
            if (syncConfig.mlflow_enabled) {
                if (!syncConfig.mlflow_experiment_name || syncConfig.mlflow_experiment_name.trim() === '') {
                    showErrorToastKo('MLflow 실험 이름을 입력해주세요.');
                    return;
                }
            }
            
            setStep('review');
        }
    };

    const handleBack = () => {
        if (step === 'schedule') {
            setStep('config');
        } else if (step === 'mlflow') {
            setStep('schedule');
        } else if (step === 'review') {
            setStep('mlflow');
        }
    };

    // 제출 - 동기화 설정 + 초기 데이터 로드
    const handleSubmit = async () => {
        setLoading(true);
        try {
            // 1. 동기화 설정 추가
            const syncResult = await addDBAutoSync(managerId, dbConfig, syncConfig) as any;
            
            if (!syncResult.success) {
                showErrorToastKo(syncResult.message || 'DB 자동 동기화 설정 실패');
                return;
            }

            showSuccessToastKo('DB 자동 동기화가 설정되었습니다!');

            // 2. 즉시 첫 데이터 로드
            try {
                showSuccessToastKo('초기 데이터를 불러오는 중...');
                
                const loadMode = syncConfig.query ? 'query' : 'table';
                const loadResult = await loadDatasetFromDatabase(
                    managerId,
                    dbConfig as any,
                    null, // connectionUrl
                    loadMode,
                    syncConfig.table_name || undefined,
                    syncConfig.query || undefined,
                    syncConfig.schema_name || undefined,
                    syncConfig.chunk_size || undefined
                ) as any;

                if (loadResult.success) {
                    showSuccessToastKo(`초기 데이터 로드 완료! (${loadResult.num_rows || 0}개 행)`);
                } else {
                    showErrorToastKo('초기 데이터 로드 실패: ' + (loadResult.message || '알 수 없는 오류'));
                }
            } catch (loadError) {
                console.error('초기 데이터 로드 실패:', loadError);
                showErrorToastKo('초기 데이터 로드에 실패했지만 동기화는 설정되었습니다.');
            }

            onSuccess();
            handleClose();
        } catch (error) {
            showErrorToastKo(`DB 자동 동기화 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
        }
    };

    // Cron 표현식 예시
    const cronExamples = [
        { label: '매시간 정각', value: '0 * * * *' },
        { label: '매일 오전 9시', value: '0 9 * * *' },
        { label: '매일 자정', value: '0 0 * * *' },
        { label: '매주 월요일 오전 9시', value: '0 9 * * 1' },
        { label: '매월 1일 오전 9시', value: '0 9 1 * *' },
    ];

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerTitle}>
                        <FiRefreshCw />
                        <h2>DB 자동 동기화 설정</h2>
                    </div>
                    <button onClick={handleClose} className={styles.closeButton} aria-label="Close">
                        <FiX />
                    </button>
                </div>

                {/* Existing sync warning */}
                {existingSync && (
                    <div className={styles.warningBanner}>
                        <FiAlertCircle />
                        <div>
                            <strong>이미 동기화가 설정되어 있습니다</strong>
                            <p>새로운 설정을 저장하면 기존 설정이 업데이트됩니다.</p>
                        </div>
                    </div>
                )}

                {/* Progress Bar - 4단계 */}
                <div className={styles.progressBar}>
                    <div className={`${styles.progressStep} ${step === 'config' ? styles.active : ''} ${['schedule','mlflow','review'].includes(step) ? styles.completed : ''}`}>
                        <span className={styles.stepNumber}>1</span>
                        <span className={styles.stepLabel}>DB 설정</span>
                    </div>

                    <div className={styles.progressLine}></div>

                    <div className={`${styles.progressStep} ${step === 'schedule' ? styles.active : ''} ${['mlflow','review'].includes(step) ? styles.completed : ''}`}>
                        <span className={styles.stepNumber}>2</span>
                        <span className={styles.stepLabel}>스케줄 설정</span>
                    </div>

                    <div className={styles.progressLine}></div>

                    <div className={`${styles.progressStep} ${step === 'mlflow' ? styles.active : ''} ${step === 'review' ? styles.completed : ''}`}>
                        <span className={styles.stepNumber}>3</span>
                        <span className={styles.stepLabel}>MLflow 설정</span>
                    </div>

                    <div className={styles.progressLine}></div>

                    <div className={`${styles.progressStep} ${step === 'review' ? styles.active : ''}`}>
                        <span className={styles.stepNumber}>4</span>
                        <span className={styles.stepLabel}>최종 확인</span>
                    </div>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    {/* Step 1: DB Configuration */}
                    {step === 'config' && (
                        <div className={styles.configStep}>
                            {/* Saved configs toggle */}
                            {savedConfigs.length > 0 && (
                                <button
                                    onClick={() => setShowSavedConfigs(!showSavedConfigs)}
                                    className={styles.savedConfigsToggle}
                                    type="button"
                                >
                                    {showSavedConfigs ? '설정 숨기기' : '저장된 설정 불러오기'}
                                </button>
                            )}

                            {showSavedConfigs && (
                                <div className={styles.savedConfigsList}>
                                    {savedConfigs.map((config) => (
                                        <div key={config.name} className={styles.savedConfigItem}>
                                            <div className={styles.configInfo}>
                                                <strong>{config.name}</strong>
                                                <span>{config.config.db_type} - {config.config.database}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleLoadSavedConfig(config)}
                                                className={styles.loadButton}
                                            >
                                                불러오기
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* DB Type */}
                            <div className={styles.formGroup}>
                                <label>데이터베이스 타입</label>
                                <select
                                    value={dbConfig.db_type}
                                    onChange={(e) => {
                                        setDbConfig({ ...dbConfig, db_type: e.target.value as any });
                                        setConnectionStatus(null);
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
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label>호스트</label>
                                            <input
                                                type="text"
                                                value={dbConfig.host || ''}
                                                onChange={(e) => {
                                                    setDbConfig({ ...dbConfig, host: e.target.value });
                                                    setConnectionStatus(null);
                                                }}
                                                placeholder="localhost"
                                                className={styles.input}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>포트</label>
                                            <input
                                                type="number"
                                                value={dbConfig.port ?? ''}
                                                onChange={(e) => {
                                                    setDbConfig({ ...dbConfig, port: parseInt(e.target.value) || undefined });
                                                    setConnectionStatus(null);
                                                }}
                                                placeholder={String(getDefaultDatabasePort(dbConfig.db_type))}
                                                className={styles.input}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>사용자명 <span className={styles.required}>*</span></label>
                                        <input
                                            type="text"
                                            value={dbConfig.username || ''}
                                            onChange={(e) => {
                                                setDbConfig({ ...dbConfig, username: e.target.value });
                                                setConnectionStatus(null);
                                            }}
                                            placeholder="postgres"
                                            className={styles.input}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>비밀번호 <span className={styles.required}>*</span></label>
                                        <input
                                            type="password"
                                            value={dbConfig.password || ''}
                                            onChange={(e) => {
                                                setDbConfig({ ...dbConfig, password: e.target.value });
                                                setConnectionStatus(null);
                                            }}
                                            placeholder="••••••••"
                                            className={styles.input}
                                        />
                                    </div>
                                </>
                            )}

                            <div className={styles.formGroup}>
                                <label>데이터베이스명 <span className={styles.required}>*</span></label>
                                <input
                                    type="text"
                                    value={dbConfig.database}
                                    onChange={(e) => {
                                        setDbConfig({ ...dbConfig, database: e.target.value });
                                        setConnectionStatus(null);
                                    }}
                                    placeholder={dbConfig.db_type === 'sqlite' ? '/path/to/database.db' : 'myapp'}
                                    className={styles.input}
                                />
                            </div>

                            {/* Test Connection Button */}
                            <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={connectionTesting}
                                className={styles.testConnectionButton}
                            >
                                {connectionTesting ? (
                                    <>
                                        <FiLoader className={styles.spinning} />
                                        연결 확인 중...
                                    </>
                                ) : (
                                    <>
                                        <FiCheck />
                                        연결 테스트
                                    </>
                                )}
                            </button>

                            {/* Connection Status */}
                            {connectionStatus && (
                                <div className={connectionStatus.success ? styles.connectionSuccess : styles.connectionError}>
                                    {connectionStatus.success ? (
                                        <>
                                            <FiCheck />
                                            <span>{connectionStatus.message}</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiAlertCircle />
                                            <span>{connectionStatus.message}</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Schedule Configuration */}
                    {step === 'schedule' && (
                        <div className={styles.scheduleStep}>
                            {/* Schedule Type */}
                            <div className={styles.formGroup}>
                                <label>스케줄 타입</label>
                                <div className={styles.radioGroup}>
                                    <label className={styles.radioLabel}>
                                        <input
                                            type="radio"
                                            name="schedule_type"
                                            value="interval"
                                            checked={syncConfig.schedule_type === 'interval'}
                                            onChange={() => setSyncConfig({ ...syncConfig, schedule_type: 'interval' })}
                                        />
                                        <FiClock />
                                        <span>주기적 간격</span>
                                    </label>
                                    <label className={styles.radioLabel}>
                                        <input
                                            type="radio"
                                            name="schedule_type"
                                            value="cron"
                                            checked={syncConfig.schedule_type === 'cron'}
                                            onChange={() => setSyncConfig({ ...syncConfig, schedule_type: 'cron' })}
                                        />
                                        <FiCalendar />
                                        <span>Cron 표현식</span>
                                    </label>
                                </div>
                            </div>

                            {/* Interval Setting */}
                            {syncConfig.schedule_type === 'interval' && (
                                <div className={styles.formGroup}>
                                    <label>동기화 간격 (분) <span className={styles.required}>*</span></label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={syncConfig.interval_minutes || ''}
                                        onChange={(e) => setSyncConfig({ ...syncConfig, interval_minutes: parseInt(e.target.value) || undefined })}
                                        placeholder="30"
                                        className={styles.input}
                                    />
                                    <span className={styles.hint}>최소 1분 이상</span>
                                </div>
                            )}

                            {/* Cron Expression */}
                            {syncConfig.schedule_type === 'cron' && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label>Cron 표현식 <span className={styles.required}>*</span></label>
                                        <input
                                            type="text"
                                            value={syncConfig.cron_expression || ''}
                                            onChange={(e) => setSyncConfig({ ...syncConfig, cron_expression: e.target.value })}
                                            placeholder="0 * * * *"
                                            className={styles.input}
                                        />
                                        <span className={styles.hint}>예: 0 * * * * (매시간 정각)</span>
                                    </div>

                                    {/* Cron Examples */}
                                    <div className={styles.cronExamples}>
                                        <strong>자주 사용하는 표현식</strong>
                                        {cronExamples.map((example) => (
                                            <button
                                                key={example.value}
                                                type="button"
                                                onClick={() => setSyncConfig({ ...syncConfig, cron_expression: example.value })}
                                                className={styles.cronExampleButton}
                                            >
                                                <span>{example.label}</span>
                                                <code>{example.value}</code>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            <div className={styles.divider}>데이터 소스</div>

                            {/* SQL Query with Validation */}
                            <div className={styles.formGroup}>
                                <label>SQL 쿼리</label>
                                <textarea
                                    value={syncConfig.query || ''}
                                    onChange={(e) => {
                                        setSyncConfig({ ...syncConfig, query: e.target.value });
                                        setQueryValidationStatus(null);
                                    }}
                                    placeholder="SELECT * FROM users WHERE active = true"
                                    className={styles.textarea}
                                />
                                <span className={styles.hint}>커스텀 SQL 쿼리 (선택사항)</span>
                                
                                {/* Query Validation Button */}
                                {syncConfig.query && syncConfig.query.trim() !== '' && (
                                    <button
                                        type="button"
                                        onClick={handleValidateQuery}
                                        disabled={queryValidating}
                                        className={styles.validateQueryButton}
                                    >
                                        {queryValidating ? (
                                            <>
                                                <FiLoader className={styles.spinning} />
                                                쿼리 검증 중...
                                            </>
                                        ) : (
                                            <>
                                                <FiSearch />
                                                쿼리 검증
                                            </>
                                        )}
                                    </button>
                                )}

                                {/* Query Validation Status */}
                                {queryValidationStatus && (
                                    <div className={queryValidationStatus.valid ? styles.connectionSuccess : styles.connectionError}>
                                        {queryValidationStatus.valid ? (
                                            <>
                                                <FiCheck />
                                                <span>{queryValidationStatus.message}</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiAlertCircle />
                                                <span>{queryValidationStatus.message}</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className={styles.divider}>또는</div>

                            {/* Table Name */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>테이블명</label>
                                    <input
                                        type="text"
                                        value={syncConfig.table_name || ''}
                                        onChange={(e) => setSyncConfig({ ...syncConfig, table_name: e.target.value })}
                                        placeholder="users"
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>스키마명 (선택)</label>
                                    <input
                                        type="text"
                                        value={syncConfig.schema_name || ''}
                                        onChange={(e) => setSyncConfig({ ...syncConfig, schema_name: e.target.value })}
                                        placeholder="public"
                                        className={styles.input}
                                    />
                                </div>
                                </div>

                                <div className={styles.divider}>추가 옵션</div>

                                {/* Chunk Size */}
                                <div className={styles.formGroup}>
                                    <label>청크 크기 (선택)</label>
                                    <input
                                        type="number"
                                        min="100"
                                        value={syncConfig.chunk_size || ''}
                                        onChange={(e) => setSyncConfig({ ...syncConfig, chunk_size: parseInt(e.target.value) || undefined })}
                                        placeholder="1000"
                                        className={styles.input}
                                    />
                                    <span className={styles.hint}>대용량 데이터 처리시 청크 단위</span>
                                </div>

                                {/* Options */}
                                <div className={styles.optionsGroup}>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={syncConfig.detect_changes}
                                            onChange={(e) => setSyncConfig({ ...syncConfig, detect_changes: e.target.checked })}
                                        />
                                        <span>변경사항만 감지하여 동기화</span>
                                    </label>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            checked={syncConfig.notification_enabled}
                                            onChange={(e) => setSyncConfig({ ...syncConfig, notification_enabled: e.target.checked })}
                                        />
                                        <span>동기화 완료 시 알림</span>
                                    </label>
                                </div>
                                </div>
                                )}

                                {/* Step 3: MLflow Configuration */}
                                {step === 'mlflow' && (
                                <div className={styles.mlflowStep}>
                                <div className={styles.sectionHeader}>
                                    <FiActivity />
                                    <h3>MLflow 자동 업로드 설정</h3>
                                    <p className={styles.sectionDescription}>
                                        동기화 성공 시 자동으로 MLflow에 데이터셋을 업로드합니다
                                    </p>
                                </div>

                                {/* MLflow 활성화 토글 */}
                                <div className={styles.toggleSection}>
                                    <label className={styles.toggleLabel}>
                                        <input
                                            type="checkbox"
                                            checked={syncConfig.mlflow_enabled}
                                            onChange={(e) => setSyncConfig({ ...syncConfig, mlflow_enabled: e.target.checked })}
                                            className={styles.toggleCheckbox}
                                        />
                                        <div className={styles.toggleSwitch}>
                                            <div className={styles.toggleSlider}></div>
                                        </div>
                                        <span>MLflow 자동 업로드 활성화</span>
                                    </label>
                                </div>

                                {/* MLflow 설정 (활성화 시에만 표시) */}
                                {syncConfig.mlflow_enabled && (
                                    <>
                                        <div className={styles.formGroup}>
                                            <label>
                                                실험 이름 <span className={styles.required}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={syncConfig.mlflow_experiment_name || ''}
                                                onChange={(e) => setSyncConfig({ ...syncConfig, mlflow_experiment_name: e.target.value })}
                                                placeholder="my_experiment"
                                                className={styles.input}
                                            />
                                            <span className={styles.hint}>
                                                동기화마다 자동으로 버전이 증가합니다 (예: my_experiment_v1, my_experiment_v2...)
                                            </span>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>MLflow Tracking URI (선택)</label>
                                            <input
                                                type="text"
                                                value={syncConfig.mlflow_tracking_uri || ''}
                                                onChange={(e) => setSyncConfig({ ...syncConfig, mlflow_tracking_uri: e.target.value })}
                                                placeholder="https://mlflow.example.com"
                                                className={styles.input}
                                            />
                                            <span className={styles.hint}>
                                                비워두면 기본 MLflow 서버 사용
                                            </span>
                                        </div>

                                        {/* 예시 표시 */}
                                        <div className={styles.exampleBox}>
                                            <h4>📊 업로드 예시</h4>
                                            <div className={styles.exampleContent}>
                                                <p><strong>실험 이름:</strong> {syncConfig.mlflow_experiment_name || 'my_experiment'}</p>
                                                <p><strong>데이터셋 이름:</strong></p>
                                                <ul>
                                                    <li>1회차: {syncConfig.mlflow_experiment_name || 'my_experiment'}_v1</li>
                                                    <li>2회차: {syncConfig.mlflow_experiment_name || 'my_experiment'}_v2</li>
                                                    <li>3회차: {syncConfig.mlflow_experiment_name || 'my_experiment'}_v3</li>
                                                    <li>...</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* MLflow 비활성화 시 안내 */}
                                {!syncConfig.mlflow_enabled && (
                                    <div className={styles.infoBox}>
                                        <FiAlertCircle />
                                        <p>
                                            MLflow 자동 업로드가 비활성화되어 있습니다.
                                            <br />
                                            동기화된 데이터는 Manager에만 저장되며, MLflow에 자동으로 업로드되지 않습니다.
                                        </p>
                                    </div>
                                )}
                                </div>
                                )}

                                {/* Step 4: Review */}
                                {step === 'review' && (
                                <div className={styles.reviewStep}>
                                <h3>설정 최종 확인</h3>

                                {/* DB Configuration Section */}
                                <div className={styles.reviewSection}>
                                    <h4>
                                        <FiDatabase />
                                        데이터베이스 설정
                                    </h4>
                                    <div className={styles.reviewItem}>
                                        <span>DB 타입</span>
                                        <strong>{dbConfig.db_type.toUpperCase()}</strong>
                                    </div>
                                    {dbConfig.db_type !== 'sqlite' && (
                                        <>
                                            <div className={styles.reviewItem}>
                                                <span>호스트</span>
                                                <strong>{dbConfig.host}:{dbConfig.port}</strong>
                                            </div>
                                            <div className={styles.reviewItem}>
                                                <span>사용자명</span>
                                                <strong>{dbConfig.username}</strong>
                                            </div>
                                        </>
                                    )}
                                    <div className={styles.reviewItem}>
                                        <span>데이터베이스</span>
                                        <strong>{dbConfig.database}</strong>
                                    </div>
                                </div>

                                {/* Schedule Configuration Section */}
                                <div className={styles.reviewSection}>
                                    <h4>
                                        <FiClock />
                                        스케줄 설정
                                    </h4>
                                    <div className={styles.reviewItem}>
                                        <span>스케줄 타입</span>
                                        <strong>
                                            {syncConfig.schedule_type === 'interval' ? '주기적 간격' : 'Cron 표현식'}
                                        </strong>
                                    </div>
                                    {syncConfig.schedule_type === 'interval' ? (
                                        <div className={styles.reviewItem}>
                                            <span>동기화 간격</span>
                                            <strong>{syncConfig.interval_minutes}분마다</strong>
                                        </div>
                                    ) : (
                                        <div className={styles.reviewItem}>
                                            <span>Cron 표현식</span>
                                            <strong>{syncConfig.cron_expression}</strong>
                                        </div>
                                    )}
                                    {syncConfig.query && (
                                        <div className={styles.reviewItem}>
                                            <span>SQL 쿼리</span>
                                            <strong style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                {syncConfig.query.length > 50 
                                                    ? syncConfig.query.substring(0, 50) + '...' 
                                                    : syncConfig.query}
                                            </strong>
                                        </div>
                                    )}
                                    {syncConfig.table_name && (
                                        <>
                                            <div className={styles.reviewItem}>
                                                <span>테이블명</span>
                                                <strong>{syncConfig.table_name}</strong>
                                            </div>
                                            {syncConfig.schema_name && (
                                                <div className={styles.reviewItem}>
                                                    <span>스키마명</span>
                                                    <strong>{syncConfig.schema_name}</strong>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {syncConfig.chunk_size && (
                                        <div className={styles.reviewItem}>
                                            <span>청크 크기</span>
                                            <strong>{syncConfig.chunk_size.toLocaleString()}</strong>
                                        </div>
                                    )}
                                </div>

                                {/* MLflow Configuration Section */}
                                <div className={styles.reviewSection}>
                                    <h4>
                                        <FiActivity />
                                        MLflow 자동 업로드
                                    </h4>
                                    <div className={styles.reviewItem}>
                                        <span>MLflow 업로드</span>
                                        <strong>{syncConfig.mlflow_enabled ? '활성화' : '비활성화'}</strong>
                                    </div>
                                    {syncConfig.mlflow_enabled && (
                                        <>
                                            <div className={styles.reviewItem}>
                                                <span>실험 이름</span>
                                                <strong>{syncConfig.mlflow_experiment_name}</strong>
                                            </div>
                                            <div className={styles.reviewItem}>
                                                <span>데이터셋 명명 규칙</span>
                                                <strong>{syncConfig.mlflow_experiment_name}_v1, v2, v3...</strong>
                                            </div>
                                            {syncConfig.mlflow_tracking_uri && (
                                                <div className={styles.reviewItem}>
                                                    <span>Tracking URI</span>
                                                    <strong>{syncConfig.mlflow_tracking_uri}</strong>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Options Section */}
                                <div className={styles.reviewSection}>
                                    <h4>
                                        <FiCheck />
                                        추가 옵션
                                    </h4>
                                    <div className={styles.reviewItem}>
                                        <span>변경사항 감지</span>
                                        <strong>{syncConfig.detect_changes ? '활성화' : '비활성화'}</strong>
                                    </div>
                                    <div className={styles.reviewItem}>
                                        <span>알림</span>
                                        <strong>{syncConfig.notification_enabled ? '활성화' : '비활성화'}</strong>
                                    </div>
                                </div>
                                </div>
                                )}
                                </div>

                                {/* Footer */}
                                <div className={styles.modalFooter}>
                                {step !== 'config' && (
                                <button onClick={handleBack} className={styles.backButton} type="button">
                                이전
                                </button>
                                )}

                                <button onClick={handleClose} className={styles.cancelButton} type="button">
                                취소
                                </button>

                                {step === 'config' && (
                                <button onClick={handleNext} className={styles.nextButton} type="button">
                                다음
                                </button>
                                )}

                                {step === 'schedule' && (
                                <button onClick={handleNext} className={styles.nextButton} type="button">
                                다음
                                </button>
                                )}

                                {step === 'mlflow' && (
                                <button onClick={handleNext} className={styles.nextButton} type="button">
                                다음
                                </button>
                                )}

                                {step === 'review' && (
                                <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className={styles.submitButton}
                                type="button"
                                >
                                {loading ? (
                                    <>
                                        <FiLoader className={styles.spinning} />
                                        설정 중...
                                    </>
                                ) : (
                                    <>
                                        <FiCheck />
                                        자동 동기화 설정
                                    </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DatabaseAutoSyncModal;
