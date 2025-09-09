import React, { useState, useCallback } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import AdminBaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/admin/components/config/AdminBaseConfigPanel';
import { testCollectionConnection } from '@/app/api/llmAPI';
import { refreshTTS } from '@/app/api/ttsAPI';
import styles from '@/app/admin/assets/settings/AdminSettings.module.scss';

interface AdminTTSConfigProps {
    configData?: ConfigItem[];
    onConfigUpdate?: () => Promise<void>; // 설정 업데이트 후 호출될 콜백
}

const TTS_CONFIG_FIELDS: Record<string, FieldConfig> = {
    IS_AVAILABLE_TTS: {
        label: 'TTS 사용 가능 여부',
        type: 'select',
        options: [
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' },
        ],
        description: 'Text-to-Speech 기능 사용 여부를 설정합니다.',
        required: true,
    },
    TTS_PROVIDER: {
        label: 'TTS 제공자',
        type: 'select',
        options: [
            { value: 'zonos', label: 'Zonos' },
        ],
        description: '사용할 Text-to-Speech 제공자를 선택하세요.',
        required: true,
    },
    OPENAI_TTS_MODEL_NAME: {
        label: 'OpenAI TTS 모델 이름',
        type: 'text',
        placeholder: 'tts-1',
        description: '사용할 OpenAI TTS 모델의 정확한 이름을 입력하세요.',
        required: false,
    },
    ZONOS_TTS_MODEL_NAME: {
        label: 'Zonos TTS 모델 이름',
        type: 'text',
        placeholder: 'Zyphra/Zonos-v0.1-transformer',
        description: '사용할 Zonos TTS 모델의 정확한 이름을 입력하세요.',
        required: false,
    },
    ZONOS_TTS_MODEL_DEVICE: {
        label: 'Zonos TTS 모델 디바이스',
        type: 'select',
        options: [
            { value: 'gpu', label: 'GPU' },
            { value: 'cpu', label: 'CPU' },
            { value: 'auto', label: '자동 선택' },
        ],
        description: 'Zonos TTS 모델을 실행할 디바이스를 선택하세요.',
        required: false,
    },
    ZONOS_TTS_DEFAULT_SPEAKER: {
        label: 'Zonos 기본 스피커',
        type: 'select',
        options: [
            { value: 'female_sample1', label: '여성 음성 1' },
            { value: 'female_sample2', label: '여성 음성 2' },
            { value: 'female_sample3', label: '여성 음성 3' },
            { value: 'male_sample1', label: '남성 음성 1' },
            { value: 'male_sample2', label: '남성 음성 2' },
            { value: 'male_sample3', label: '남성 음성 3' },
        ],
        description: 'Zonos TTS에서 사용할 기본 스피커를 선택하세요.',
        required: false,
    },
};

const AdminTTSConfig: React.FC<AdminTTSConfigProps> = ({
    configData = [],
    onConfigUpdate, // 부모로부터 받는 콜백
}) => {
    const [testing, setTesting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // AdminBaseConfigPanel에서 설정이 업데이트될 때 호출될 함수
    const handleConfigChange = useCallback(async () => {
        if (onConfigUpdate) {
            await onConfigUpdate();
        }
    }, [onConfigUpdate]);

    const handleRefreshTTS = async () => {
        setRefreshing(true);
        try {
            await refreshTTS();
            showSuccessToastKo('TTS 설정이 성공적으로 새로고침되었습니다.');
            if (onConfigUpdate) {
                await onConfigUpdate();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'TTS 설정 새로고침에 실패했습니다.';
            showErrorToastKo(errorMessage);
            console.error('Failed to refresh TTS:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleTestConnection = async (category: string) => {
        setTesting(true);
        try {
            let result;
            if (category === 'openai') {
                result = await testCollectionConnection('openai');
            } else if (category === 'zonos') {
                result = await testCollectionConnection('zonos');
            } else {
                showErrorToastKo('지원되지 않는 제공자입니다.');
                return;
            }

            const isSuccess = (result as { status: string })?.status === 'success';
            if (isSuccess) {
                showSuccessToastKo(`${category} 연결 테스트 성공!`);
            } else {
                showErrorToastKo(`${category} 연결 테스트 실패`);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : `${category} 연결 테스트에 실패했습니다.`;
            showErrorToastKo(msg);
            console.error(err);
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className={styles.openaiConfig}>
            <div className={styles.sectionHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h3>Text-to-Speech 설정</h3>
                        <p>텍스트를 음성으로 변환하는 TTS 서비스를 설정합니다.</p>
                    </div>
                    <button
                        onClick={handleRefreshTTS}
                        className={`${styles.button} ${styles.secondary} ${styles.refreshButton}`}
                        disabled={refreshing}
                        title="TTS 설정 새로고침"
                    >
                        <FiRefreshCw className={refreshing ? styles.spinning : ''} />
                        설정 초기화
                    </button>
                </div>
            </div>

            <AdminBaseConfigPanel
                configData={configData}
                fieldConfigs={TTS_CONFIG_FIELDS}
                filterPrefix=""
                onTestConnection={handleTestConnection}
                testConnectionLabel="TTS 연결 테스트"
                testConnectionCategory={
                    configData.find((item: ConfigItem) => item.env_name === "TTS_PROVIDER")?.current_value || ""
                }
                onConfigChange={handleConfigChange} // 새로 추가
            />
        </div>
    );
};

export default AdminTTSConfig;
