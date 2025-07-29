import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiPlay, FiSquare, FiCopy, FiExternalLink, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { BsGpuCard } from 'react-icons/bs';
import toast from 'react-hot-toast';
import BaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/main/components/config/baseConfigPanel';
import { checkVastHealth, searchVastOffers } from '@/app/api/vastAPI';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/main/assets/Settings.module.scss';

interface VastAiConfigProps {
    configData?: ConfigItem[];
    onTestConnection?: (category: string) => void;
}

interface VastOffer {
    id: string;
    gpu_name: string;
    num_gpus: number;
    gpu_ram: number;
    dph_total: number;
    rentable: boolean;
    public_ipaddr?: string;
}

interface VastOfferSearchResponse {
    offers: VastOffer[];
    total: number;
    filtered_count: number;
    search_query?: string;
    sort_info: {
        sort_by: string;
        order: string;
    };
}

interface SearchParams {
    gpu_name?: string;
    max_price?: number;
    min_gpu_ram?: number;
    num_gpus?: number;
    rentable?: boolean;
    sort_by?: string;
    limit?: number;
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

interface VastHealthResponse {
    status: string;
    service: string;
    message: string;
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
}) => {
    const [searchParams, setSearchParams] = useState<SearchParams>({
        gpu_name: '',
        max_price: 2,
        min_gpu_ram: 16,
        num_gpus: 1,
        rentable: true,
        sort_by: 'price',
        limit: 20
    });
    const [searchResults, setSearchResults] = useState<VastOfferSearchResponse | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const handleTestConnection = async () => {
        try {
            devLog.info('Testing vast.ai connection...');
            const result = await checkVastHealth() as VastHealthResponse;

            if (result && result.status === 'healthy' && result.service === 'vast') {
                toast.success(`연결 성공: ${result.message || 'VastAI 서비스가 정상적으로 작동 중입니다'}`);
                devLog.info('Vast connection test successful:', result);
            } else {
                throw new Error('Invalid response format or service not healthy');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`연결 실패: ${errorMessage}`);
            devLog.error('Vast connection test failed:', error);
        }
    };

    const handleSearchOffers = async () => {
        if (!searchParams.gpu_name?.trim()) {
            toast.error('GPU 이름을 입력해주세요.');
            return;
        }

        setIsSearching(true);
        try {
            devLog.info('Searching vast offers with params:', searchParams);

            // 빈 값들을 제거한 검색 파라미터 생성
            const cleanParams: SearchParams = {};
            if (searchParams.gpu_name?.trim()) cleanParams.gpu_name = searchParams.gpu_name.trim();
            if (searchParams.max_price) cleanParams.max_price = searchParams.max_price;
            if (searchParams.min_gpu_ram) cleanParams.min_gpu_ram = searchParams.min_gpu_ram;
            if (searchParams.num_gpus) cleanParams.num_gpus = searchParams.num_gpus;
            if (searchParams.rentable !== undefined) cleanParams.rentable = searchParams.rentable;
            if (searchParams.sort_by) cleanParams.sort_by = searchParams.sort_by;
            if (searchParams.limit) cleanParams.limit = searchParams.limit;

            const result = await searchVastOffers(cleanParams) as VastOfferSearchResponse;
            setSearchResults(result);

            toast.success(`${result.filtered_count}개의 오퍼를 찾았습니다.`);
            devLog.info('Search results:', result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`검색 실패: ${errorMessage}`);
            devLog.error('Failed to search offers:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleParamChange = (field: keyof SearchParams, value: any) => {
        setSearchParams(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className={styles.configPanel}>
            <BaseConfigPanel
                configData={configData}
                fieldConfigs={VAST_AI_CONFIG_FIELDS}
                filterPrefix="vast"
                onTestConnection={() => handleTestConnection()}
                testConnectionLabel="Vast.ai 연결 테스트"
                testConnectionCategory="vast"
            />

            {/* GPU 오퍼 검색 패널 */}
            <div className={styles.configSection}>
                <h3 className={styles.sectionTitle}>
                    <BsGpuCard className={styles.sectionIcon} />
                    GPU 오퍼 검색
                </h3>

                <div className={styles.searchLayout}>
                    <div className={styles.searchPanel}>
                        <div className={styles.searchItem}>
                            <label className={styles.searchLabel}>GPU 모델명</label>
                            <div className={styles.inputGroup}>
                                <select
                                    className={styles.select}
                                    value={searchParams.gpu_name || ''}
                                    onChange={(e) => handleParamChange('gpu_name', e.target.value)}
                                >
                                    <option value="">GPU 모델을 선택하세요</option>
                                    <option value="RTX_4090">RTX 4090</option>
                                    <option value="RTX_5090">RTX 5090</option>
                                </select>
                                <button
                                    className={`${styles.button} ${styles.primary}`}
                                    onClick={handleSearchOffers}
                                    disabled={isSearching || !searchParams.gpu_name?.trim()}
                                >
                                    {isSearching ? (
                                        <>
                                            <FiRefreshCw className={`${styles.icon} ${styles.spinning}`} />
                                            검색
                                        </>
                                    ) : (
                                        <>
                                            <FiPlay className={styles.icon} />
                                            검색
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 고급 설정들을 컴팩트하게 배치 */}
                        <div className={styles.compactRow}>
                            <div className={styles.advancedFormGroup}>
                                <label className={styles.label}>최대 가격 ($/시간)</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    placeholder="2.0"
                                    step="0.1"
                                    min="0"
                                    value={searchParams.max_price || ''}
                                    onChange={(e) => handleParamChange('max_price', parseFloat(e.target.value) || undefined)}
                                />
                            </div>
                            <div className={styles.advancedFormGroup}>
                                <label className={styles.label}>최소 GPU RAM (GB)</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    placeholder="16"
                                    min="1"
                                    value={searchParams.min_gpu_ram || ''}
                                    onChange={(e) => handleParamChange('min_gpu_ram', parseInt(e.target.value) || undefined)}
                                />
                            </div>
                        </div>

                        <div className={styles.compactRow}>
                            <div className={styles.advancedFormGroup}>
                                <label className={styles.label}>GPU 개수</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    placeholder="1"
                                    min="1"
                                    value={searchParams.num_gpus || ''}
                                    onChange={(e) => handleParamChange('num_gpus', parseInt(e.target.value) || undefined)}
                                />
                            </div>
                            <div className={styles.advancedFormGroup}>
                                <label className={styles.label}>정렬 기준</label>
                                <select
                                    className={styles.select}
                                    value={searchParams.sort_by || 'price'}
                                    onChange={(e) => handleParamChange('sort_by', e.target.value)}
                                >
                                    <option value="price">가격순</option>
                                    <option value="gpu_ram">GPU RAM순</option>
                                    <option value="num_gpus">GPU 개수순</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.compactRow}>
                            <div className={styles.advancedFormGroup}>
                                <label className={styles.label}>결과 제한</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    placeholder="20"
                                    min="1"
                                    max="100"
                                    value={searchParams.limit || ''}
                                    onChange={(e) => handleParamChange('limit', parseInt(e.target.value) || undefined)}
                                />
                            </div>
                            <div className={styles.advancedFormGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={searchParams.rentable ?? true}
                                        onChange={(e) => handleParamChange('rentable', e.target.checked)}
                                    />
                                    렌트 가능한 것만
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 우측 결과 패널 */}
                    <div className={styles.resultsPanel}>
                        {searchResults ? (
                            <div className={styles.resultsSection}>
                                <div className={styles.resultsHeader}>
                                    <h4>검색 결과</h4>
                                    <span className={styles.resultCount}>
                                        총 {searchResults.total}개 중 {searchResults.filtered_count}개 표시
                                    </span>
                                </div>

                                {searchResults.offers.length === 0 ? (
                                    <div className={styles.noResults}>
                                        <FiX className={styles.icon} />
                                        검색 조건에 맞는 오퍼가 없습니다.
                                    </div>
                                ) : (
                                    <div className={styles.offersList}>
                                        {searchResults.offers.map((offer) => (
                                            <div key={offer.id} className={styles.offerCard}>
                                                <div className={styles.offerHeader}>
                                                    <div className={styles.gpuInfo}>
                                                        <BsGpuCard className={styles.gpuIcon} />
                                                        <span className={styles.gpuName}>{offer.gpu_name}</span>
                                                        {offer.num_gpus > 1 && (
                                                            <span className={styles.gpuCount}>x{offer.num_gpus}</span>
                                                        )}
                                                    </div>
                                                    <div className={styles.price}>
                                                        ${offer.dph_total.toFixed(3)}/시간
                                                    </div>
                                                </div>

                                                <div className={styles.offerDetails}>
                                                    <div className={styles.detail}>
                                                        <span className={styles.detailLabel}>GPU RAM:</span>
                                                        <span className={styles.detailValue}>{offer.gpu_ram}GB</span>
                                                    </div>
                                                    <div className={styles.detail}>
                                                        <span className={styles.detailLabel}>상태:</span>
                                                        <span className={`${styles.status} ${offer.rentable ? styles.available : styles.unavailable}`}>
                                                            {offer.rentable ? (
                                                                <>
                                                                    <FiCheck className={styles.statusIcon} />
                                                                    렌트 가능
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FiX className={styles.statusIcon} />
                                                                    렌트 불가
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>
                                                    {offer.public_ipaddr && (
                                                        <div className={styles.detail}>
                                                            <span className={styles.detailLabel}>IP:</span>
                                                            <span className={styles.detailValue}>{offer.public_ipaddr}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={styles.offerActions}>
                                                    <button
                                                        className={styles.copyButton}
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(offer.id);
                                                            toast.success('오퍼 ID가 복사되었습니다.');
                                                        }}
                                                    >
                                                        <FiCopy className={styles.icon} />
                                                        ID 복사
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.noResults}>
                                <BsGpuCard className={styles.icon} />
                                GPU 모델명을 입력하고 검색해주세요.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VastAiConfig;
