// AdminGaudiVLLMModal.tsx 수정
import React, { useState, useEffect } from 'react';
import { FiPlay, FiCpu, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { 
    startVLLMAutoAllocation, 
    startVLLMManualAllocation,
    getAvailableHPUs,
    getRecommendedModels,
    VLLM_CONFIG_TEMPLATES
} from '@/app/admin/api/gaudiAPI';
import styles from '@/app/admin/assets/AdminGaudiModal.module.scss';

interface AdminGaudiVLLMModalProps {
    healthData: any;
    onInstanceCreated: () => void;
}

// 타입 정의 추가
interface ValidationResult {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
    adjustedConfig: any;
}

interface VLLMStartResult {
    instance_id: string;
    status: string;
    model_name: string;
    port: number;
    allocated_hpus: number[];
    tensor_parallel_size: number;
    pid: number;
    uptime: number;
    api_url: string;
}

export const AdminGaudiVLLMModal: React.FC<AdminGaudiVLLMModalProps> = ({
    healthData,
    onInstanceCreated
}) => {
    const [vllmConfig, setVLLMConfig] = useState({
        model_name: 'x2bee/Polar-14B',
        max_model_len: 2048,
        host: '0.0.0.0',
        port: 12434,
        dtype: 'bfloat16',
        hpu_memory_utilization: 0.9,
        tensor_parallel_size: 1,
        tool_call_parser: 'hermes',
        trust_remote_code: true,
        enable_lora: false
    });

    const [allocationMode, setAllocationMode] = useState<'auto' | 'manual'>('auto');
    const [selectedHPUs, setSelectedHPUs] = useState<number[]>([]);
    const [availableHPUs, setAvailableHPUs] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [recommendedModels, setRecommendedModels] = useState<any>(null);

    useEffect(() => {
        loadAvailableHPUs();
        loadRecommendedModels();
    }, []);

    const loadAvailableHPUs = async () => {
        try {
            const result = await getAvailableHPUs();
            setAvailableHPUs(result);
        } catch (error) {
            console.error('Failed to load available HPUs:', error);
        }
    };

    const loadRecommendedModels = async () => {
        try {
            const result = await getRecommendedModels();
            setRecommendedModels(result);
        } catch (error) {
            console.error('Failed to load recommended models:', error);
        }
    };

    const handleConfigChange = (field: string, value: any) => {
        setVLLMConfig(prev => ({ ...prev, [field]: value }));
    };

    const applyTemplate = (template: keyof typeof VLLM_CONFIG_TEMPLATES) => {
        const templateConfig = VLLM_CONFIG_TEMPLATES[template];
        setVLLMConfig(prev => ({ ...prev, ...templateConfig }));
        toast.success(`${template} 템플릿이 적용되었습니다`);
    };

    // validateVLLMConfig 함수를 컴포넌트 내부에서 구현
    const validateVLLMConfig = (vllmConfig: any, availableHPUs: number): ValidationResult => {
        const validation: ValidationResult = {
            isValid: true,
            warnings: [],
            recommendations: [],
            adjustedConfig: { ...vllmConfig }
        };

        // 텐서 병렬 크기 검증
        if (vllmConfig.tensor_parallel_size > availableHPUs) {
            validation.isValid = false;
            validation.warnings.push(`요청된 텐서 병렬 크기(${vllmConfig.tensor_parallel_size})가 사용 가능한 HPU 개수(${availableHPUs})를 초과합니다.`);
            validation.adjustedConfig.tensor_parallel_size = availableHPUs;
            validation.recommendations.push(`텐서 병렬 크기를 ${availableHPUs}로 조정하는 것을 권장합니다.`);
        }

        // 메모리 사용률 검증
        if (vllmConfig.hpu_memory_utilization > 0.95) {
            validation.warnings.push('HPU 메모리 사용률이 95%를 초과합니다. 안정성을 위해 90% 이하로 설정하는 것을 권장합니다.');
            validation.adjustedConfig.hpu_memory_utilization = 0.9;
            validation.recommendations.push('HPU 메모리 사용률을 90%로 조정하는 것을 권장합니다.');
        }

        // 모델 길이와 메모리 사용률 관계 검증
        if (vllmConfig.max_model_len > 8192 && vllmConfig.hpu_memory_utilization > 0.8) {
            validation.warnings.push('긴 모델 길이와 높은 메모리 사용률 조합으로 인해 메모리 부족이 발생할 수 있습니다.');
            validation.recommendations.push('메모리 사용률을 70-80%로 낮추거나 모델 길이를 줄이는 것을 권장합니다.');
        }

        // 데이터 타입 검증
        const supportedDTypes = ['bfloat16', 'float16', 'auto'];
        if (!supportedDTypes.includes(vllmConfig.dtype)) {
            validation.warnings.push(`지원되지 않는 데이터 타입: ${vllmConfig.dtype}. bfloat16을 권장합니다.`);
            validation.adjustedConfig.dtype = 'bfloat16';
            validation.recommendations.push('Gaudi HPU에서는 bfloat16이 최적화되어 있습니다.');
        }

        return validation;
    };

    const handleStartVLLM = async () => {
        try {
            setLoading(true);

            // 설정 검증
            const availableCount = availableHPUs?.available_count || 0;
            const validation = validateVLLMConfig(vllmConfig, availableCount);

            if (!validation.isValid) {
                validation.warnings.forEach(warning => toast.error(warning));
                return;
            }

            if (validation.warnings.length > 0) {
                // toast.warning 대신 커스텀 스타일 사용
                validation.warnings.forEach(warning => {
                    toast(`⚠️ ${warning}`, {
                        icon: '⚠️',
                        style: {
                            borderRadius: '10px',
                            background: '#FEF3C7',
                            color: '#92400E',
                            border: '1px solid #F59E0B'
                        },
                        duration: 4000,
                    });
                });
            }

            let result: VLLMStartResult;
            if (allocationMode === 'auto') {
                result = await startVLLMAutoAllocation(vllmConfig, {
                    required_hpus: vllmConfig.tensor_parallel_size,
                    prefer_consecutive: true
                }) as VLLMStartResult;
            } else {
                if (selectedHPUs.length === 0) {
                    toast.error('수동 할당 모드에서는 HPU를 선택해야 합니다');
                    return;
                }
                result = await startVLLMManualAllocation(vllmConfig, {
                    device_ids: selectedHPUs
                }) as VLLMStartResult;
            }

            toast.success(`VLLM 인스턴스가 시작되었습니다: ${result.instance_id}`);
            onInstanceCreated();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            toast.error(`VLLM 시작 실패: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.vllmModal}>
            <div className={styles.section}>
                <h3>빠른 템플릿</h3>
                <div className={styles.templateGrid}>
                    {Object.entries(VLLM_CONFIG_TEMPLATES).map(([key, template]) => (
                        <button
                            key={key}
                            className={styles.templateButton}
                            onClick={() => applyTemplate(key as keyof typeof VLLM_CONFIG_TEMPLATES)}
                        >
                            <div className={styles.templateName}>{key}</div>
                            <div className={styles.templateDesc}>
                                {template.tensor_parallel_size}개 HPU, {template.max_model_len} 토큰
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <h3>모델 설정</h3>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>모델명</label>
                        <input
                            type="text"
                            value={vllmConfig.model_name}
                            onChange={(e) => handleConfigChange('model_name', e.target.value)}
                            placeholder="x2bee/Polar-14B"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>최대 모델 길이</label>
                        <input
                            type="number"
                            value={vllmConfig.max_model_len}
                            onChange={(e) => handleConfigChange('max_model_len', parseInt(e.target.value))}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>데이터 타입</label>
                        <select
                            value={vllmConfig.dtype}
                            onChange={(e) => handleConfigChange('dtype', e.target.value)}
                        >
                            <option value="bfloat16">bfloat16 (권장)</option>
                            <option value="float16">float16</option>
                            <option value="auto">auto</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h3>HPU 할당</h3>
                <div className={styles.allocationModeToggle}>
                    <button
                        className={allocationMode === 'auto' ? styles.active : ''}
                        onClick={() => setAllocationMode('auto')}
                    >
                        <FiCpu /> 자동 할당
                    </button>
                    <button
                        className={allocationMode === 'manual' ? styles.active : ''}
                        onClick={() => setAllocationMode('manual')}
                    >
                        <FiSettings /> 수동 할당
                    </button>
                </div>

                {allocationMode === 'auto' ? (
                    <div className={styles.autoAllocation}>
                        <div className={styles.formGroup}>
                            <label>텐서 병렬 크기</label>
                            <input
                                type="number"
                                min="1"
                                max={availableHPUs?.available_count || 8}
                                value={vllmConfig.tensor_parallel_size}
                                onChange={(e) => handleConfigChange('tensor_parallel_size', parseInt(e.target.value))}
                            />
                            <small>사용할 HPU 개수와 동일해야 합니다</small>
                        </div>
                    </div>
                ) : (
                    <div className={styles.manualAllocation}>
                        <div className={styles.hpuGrid}>
                            {availableHPUs?.available_hpus?.map((hpu: any) => (
                                <label key={hpu.hpu_id} className={styles.hpuOption}>
                                    <input
                                        type="checkbox"
                                        checked={selectedHPUs.includes(hpu.hpu_id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedHPUs(prev => [...prev, hpu.hpu_id]);
                                                // 수동 선택 시 텐서 병렬 크기도 자동 조정
                                                setVLLMConfig(prev => ({
                                                    ...prev,
                                                    tensor_parallel_size: selectedHPUs.length + 1
                                                }));
                                            } else {
                                                setSelectedHPUs(prev => {
                                                    const newSelection = prev.filter(id => id !== hpu.hpu_id);
                                                    // 텐서 병렬 크기도 자동 조정
                                                    setVLLMConfig(prevConfig => ({
                                                        ...prevConfig,
                                                        tensor_parallel_size: newSelection.length
                                                    }));
                                                    return newSelection;
                                                });
                                            }
                                        }}
                                    />
                                    <span>HPU-{hpu.hpu_id}</span>
                                </label>
                            ))}
                        </div>
                        {selectedHPUs.length > 0 && (
                            <div className={styles.selectionInfo}>
                                선택된 HPU: {selectedHPUs.join(', ')} (총 {selectedHPUs.length}개)
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <h3>고급 설정</h3>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>포트</label>
                        <input
                            type="number"
                            value={vllmConfig.port}
                            onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>HPU 메모리 사용률</label>
                        <input
                            type="number"
                            min="0.1"
                            max="1.0"
                            step="0.1"
                            value={vllmConfig.hpu_memory_utilization}
                            onChange={(e) => handleConfigChange('hpu_memory_utilization', parseFloat(e.target.value))}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>도구 호출 파서</label>
                        <select
                            value={vllmConfig.tool_call_parser}
                            onChange={(e) => handleConfigChange('tool_call_parser', e.target.value)}
                        >
                            <option value="hermes">hermes</option>
                            <option value="mistral">mistral</option>
                            <option value="">없음</option>
                        </select>
                    </div>
                </div>

                <div className={styles.checkboxGroup}>
                    <label>
                        <input
                            type="checkbox"
                            checked={vllmConfig.trust_remote_code}
                            onChange={(e) => handleConfigChange('trust_remote_code', e.target.checked)}
                        />
                        원격 코드 신뢰
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={vllmConfig.enable_lora}
                            onChange={(e) => handleConfigChange('enable_lora', e.target.checked)}
                        />
                        LoRA 어댑터 활성화
                    </label>
                </div>
            </div>

            <div className={styles.actionButtons}>
                <button
                    className={styles.startButton}
                    onClick={handleStartVLLM}
                    disabled={loading || !availableHPUs?.available}
                >
                    <FiPlay />
                    {loading ? 'VLLM 시작 중...' : 'VLLM 시작'}
                </button>
            </div>
        </div>
    );
};
