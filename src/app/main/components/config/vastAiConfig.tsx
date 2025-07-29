import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiPlay, FiSquare, FiCopy, FiExternalLink, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { BsGpuCard } from 'react-icons/bs';
import toast from 'react-hot-toast';
import BaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/main/components/config/baseConfigPanel';
import styles from '@/app/main/assets/Settings.module.scss';

interface VastAiConfigProps {
    configData?: ConfigItem[];
    onTestConnection?: (category: string) => void;
}

interface VastInstance {
    id: string;
    public_ipaddr: string;
    gpu_name: string;
    dph_total: number;
    cpu_cores: number;
    cpu_ram: number;
    gpu_ram: number;
    disk_space: number;
    inet_down: number;
    inet_up: number;
    cuda_max_good: number;
    reliability: number;
    verified: boolean;
    geolocation: string;
    status: 'ready' | 'loading' | 'error';
}

// Vast.ai 관련 설정 필드
const VAST_AI_CONFIG_FIELDS: Record<string, FieldConfig> = {
    VAST_API_KEY: {
        label: 'vast.ai API Key',
        type: 'text',
        placeholder: 'Enter your vast.ai API key',
        description: 'vast.ai 콘솔의 API 키를 입력하세요.',
        required: true,
    },
};

const VastAiConfig: React.FC<VastAiConfigProps> = ({
    configData = [],
    onTestConnection,
}) => {
    const [accessType, setAccessType] = useState<'vast' | 'external'>('vast');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [vastInstance, setVastInstance] = useState<VastInstance | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // 더미 인스턴스 데이터 (실제로는 API에서 가져와야 함)
    const dummyInstance: VastInstance = {
        id: '24295720',
        public_ipaddr: '80.188.223.202',
        gpu_name: 'A100 SXM4',
        dph_total: 1.285,
        cpu_cores: 128,
        cpu_ram: 515549,
        gpu_ram: 81920,
        disk_space: 256,
        inet_down: 6891.5,
        inet_up: 6492.4,
        cuda_max_good: 12.8,
        reliability: 99.9,
        verified: false,
        geolocation: 'Czechia, CZ',
        status: 'ready'
    };

    useEffect(() => {
        // 컴포넌트 마운트 시 더미 데이터 설정
        setVastInstance(dummyInstance);
    }, []);

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('클립보드에 복사되었습니다');
    };

    const handleOpenUrl = (url: string) => {
        window.open(url, '_blank');
    };

    const handleServeModel = () => {
        setIsLoading(true);
        // 모델 서빙 로직 구현
        setTimeout(() => {
            setIsLoading(false);
            toast.success('모델 서빙이 시작되었습니다');
        }, 2000);
    };

    const handleStopModel = () => {
        toast.success('모델이 중지되었습니다');
    };

    const renderAccessTypeSelection = () => (
        <div className={styles.accessTypeSection}>
            <label className={styles.fieldLabel}>How do you want to access VLLM?</label>
            <div className={styles.radioGrid}>
                <label className={`${styles.radioOption} ${accessType === 'vast' ? styles.selected : ''}`}>
                    <input
                        type="radio"
                        value="vast"
                        checked={accessType === 'vast'}
                        onChange={(e) => setAccessType(e.target.value as 'vast' | 'external')}
                        className={styles.radioInput}
                    />
                    <div className={styles.radioContent}>
                        <div className={styles.radioIcon}>🚀</div>
                        <div className={styles.radioInfo}>
                            <div className={styles.radioTitle}>Rent GPU from vast.ai</div>
                            <div className={styles.radioDescription}>
                                Automatically provision and configure a cloud GPU instance
                            </div>
                            <div className={styles.radioFeatures}>
                                <div className={styles.feature}>
                                    <span className={styles.checkmark}>✓</span>
                                    <span>Automatic setup & configuration</span>
                                </div>
                                <div className={styles.feature}>
                                    <span className={styles.checkmark}>✓</span>
                                    <span>Pay-per-use pricing</span>
                                </div>
                                <div className={styles.feature}>
                                    <span className={styles.checkmark}>✓</span>
                                    <span>Latest GPU hardware</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </label>

                <label className={`${styles.radioOption} ${accessType === 'external' ? styles.selected : ''}`}>
                    <input
                        type="radio"
                        value="external"
                        checked={accessType === 'external'}
                        onChange={(e) => setAccessType(e.target.value as 'vast' | 'external')}
                        className={styles.radioInput}
                    />
                    <div className={styles.radioContent}>
                        <div className={styles.radioIcon}>🔗</div>
                        <div className={styles.radioInfo}>
                            <div className={styles.radioTitle}>Connect to existing server</div>
                            <div className={styles.radioDescription}>
                                Use your own VLLM server or another cloud provider
                            </div>
                            <div className={styles.radioFeatures}>
                                <div className={styles.feature}>
                                    <span className={styles.checkmark}>✓</span>
                                    <span>Use existing infrastructure</span>
                                </div>
                                <div className={styles.feature}>
                                    <span className={styles.checkmark}>✓</span>
                                    <span>Full control over configuration</span>
                                </div>
                                <div className={styles.feature}>
                                    <span className={styles.checkmark}>✓</span>
                                    <span>Works with any VLLM server</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </label>
            </div>
        </div>
    );

    const renderVastInstanceOverview = () => {
        if (!vastInstance || accessType !== 'vast') return null;

        return (
            <div className={styles.vastInstanceSection}>
                <div className={styles.instanceHeader}>
                    <div className={styles.instanceTitle}>
                        <span className={styles.instanceIcon}>🚀</span>
                        <h4>Vast.ai GPU Instance Setup</h4>
                    </div>
                    <div className={styles.instanceControls}>
                        <span className={styles.statusBadge}>✅ Ready</span>
                        <span className={styles.statusBadge}>🔄 Auto-refresh ON</span>
                        <button
                            className={styles.refreshButton}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
                        >
                            🔄 Auto
                        </button>
                        <button className={styles.refreshButton} title="Refresh instance data">
                            <FiRefreshCw /> Refresh
                        </button>
                    </div>
                </div>

                {autoRefresh && (
                    <div className={styles.autoRefreshInfo}>
                        🔄 Auto-refresh is enabled. Instance status will be automatically checked when you return to this page or every 10 minutes.
                    </div>
                )}

                <div className={styles.instanceOverview}>
                    <div className={styles.overviewHeader}>
                        <h4>🖥️ Instance Overview</h4>
                        <span className={styles.statusBadge}>✅ Ready</span>
                    </div>
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <div className={styles.statLabel}>Instance ID</div>
                            <div className={styles.statValue}>{vastInstance.id}</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statLabel}>Public IP</div>
                            <div className={styles.statValue}>{vastInstance.public_ipaddr}</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statLabel}>GPU Type</div>
                            <div className={styles.statValue}>{vastInstance.gpu_name}</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statLabel}>Cost/Hour</div>
                            <div className={styles.statValue}>${vastInstance.dph_total}</div>
                        </div>
                    </div>
                </div>

                <div className={styles.hardwareSpecs}>
                    <h4>⚙️ Hardware Specifications</h4>
                    <div className={styles.specsGrid}>
                        <div className={styles.specItem}>
                            <div className={styles.specLabel}>GPU Count</div>
                            <div className={styles.specValue}>1</div>
                        </div>
                        <div className={styles.specItem}>
                            <div className={styles.specLabel}>GPU RAM</div>
                            <div className={styles.specValue}>{vastInstance.gpu_ram} GB</div>
                        </div>
                        <div className={styles.specItem}>
                            <div className={styles.specLabel}>CPU Cores</div>
                            <div className={styles.specValue}>{vastInstance.cpu_cores}</div>
                        </div>
                        <div className={styles.specItem}>
                            <div className={styles.specLabel}>System RAM</div>
                            <div className={styles.specValue}>{vastInstance.cpu_ram} GB</div>
                        </div>
                    </div>
                </div>

                <div className={styles.modelControl}>
                    <h4>🤖 Model Control</h4>

                    <div className={styles.apiEndpoints}>
                        <div className={styles.endpointItem}>
                            <span className={styles.endpointLabel}>OpenAI Compatible API:</span>
                            <div className={styles.endpointUrl}>
                                <code>http://{vastInstance.public_ipaddr}:11405/v1</code>
                                <button
                                    onClick={() => handleCopyToClipboard(`http://${vastInstance.public_ipaddr}:11405/v1`)}
                                    className={styles.copyButton}
                                >
                                    <FiCopy /> Copy
                                </button>
                            </div>
                        </div>
                        <div className={styles.endpointItem}>
                            <span className={styles.endpointLabel}>Health Check:</span>
                            <div className={styles.endpointUrl}>
                                <code>http://{vastInstance.public_ipaddr}:11405/health</code>
                                <button
                                    onClick={() => handleOpenUrl(`http://${vastInstance.public_ipaddr}:11405/health`)}
                                    className={styles.testButton}
                                >
                                    <FiExternalLink /> Test
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={styles.modelActions}>
                        <button
                            className={`${styles.serveButton} ${isLoading ? styles.loading : ''}`}
                            onClick={handleServeModel}
                            disabled={isLoading}
                        >
                            <FiPlay /> {isLoading ? 'Starting...' : 'Serve Model'}
                        </button>
                        <button
                            className={styles.stopButton}
                            onClick={handleStopModel}
                        >
                            <FiSquare /> Stop Model
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.configPanel}>
            <BaseConfigPanel
                configData={configData}
                fieldConfigs={VAST_AI_CONFIG_FIELDS}
                filterPrefix="vast"
                onTestConnection={onTestConnection}
                testConnectionLabel="연결 테스트"
                testConnectionCategory="vast"
            />
            {accessType === 'vast' && renderVastInstanceOverview()}

        </div>
    );
};

export default VastAiConfig;
