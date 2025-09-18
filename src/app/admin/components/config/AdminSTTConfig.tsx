import React, { useState, useCallback } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import AdminBaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/admin/components/config/AdminBaseConfigPanel';
import { testCollectionConnection } from '@/app/_common/api/llmAPI';
import { refreshSTT } from '@/app/_common/api/sttAPI';
import styles from '@/app/admin/assets/settings/AdminSettings.module.scss';

interface AdminSTTConfigProps {
    configData?: ConfigItem[];
    onConfigUpdate?: () => Promise<void>; // 설정 업데이트 후 호출될 콜백
}

const STT_CONFIG_FIELDS: Record<string, FieldConfig> = {
    IS_AVAILABLE_STT: {
        label: 'STT 사용 가능 여부',
        type: 'select',
        options: [
            { value: 'true', label: 'True' },
            { value: 'false', label: 'False' },
        ],
        description: 'Speech-to-Text 기능 사용 여부를 설정합니다.',
        required: true,
    },
    STT_PROVIDER: {
        label: 'STT 제공자',
        type: 'select',
        options: [
            { value: 'huggingface', label: 'HuggingFace' },
        ],
        description: '사용할 Speech-to-Text 제공자를 선택하세요.',
        required: true,
    },
    OPENAI_STT_MODEL_NAME: {
        label: 'OpenAI STT 모델 이름',
        type: 'text',
        placeholder: 'whisper-1',
        description: '사용할 OpenAI STT 모델의 정확한 이름을 입력하세요.',
        required: false,
    },
    HUGGINGFACE_STT_MODEL_NAME: {
        label: 'Hugging Face STT 모델 이름',
        type: 'text',
        placeholder: 'openai/whisper-small',
        description: '사용할 Hugging Face STT 모델의 정확한 이름을 입력하세요.',
        required: false,
    },
    HUGGINGFACE_STT_MODEL_DEVICE: {
        label: 'Hugging Face STT 모델 디바이스',
        type: 'select',
        options: [
            { value: 'cpu', label: 'CPU' },
            { value: 'cuda', label: 'CUDA (GPU)' },
            { value: 'auto', label: '자동 선택' },
        ],
        description: 'Hugging Face STT 모델을 실행할 디바이스를 선택하세요.',
        required: false,
    },
};

const AdminSTTConfig: React.FC<AdminSTTConfigProps> = ({
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

    const handleRefreshSTT = async () => {
        setRefreshing(true);
        try {
            await refreshSTT();
            showSuccessToastKo('STT 설정이 성공적으로 새로고침되었습니다.');
            if (onConfigUpdate) {
                await onConfigUpdate();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'STT 설정 새로고침에 실패했습니다.';
            showErrorToastKo(errorMessage);
            console.error('Failed to refresh STT:', err);
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
            } else if (category === 'huggingface') {
                result = await testCollectionConnection('huggingface');
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
                        <h3>Speech-to-Text 설정</h3>
                        <p>음성을 텍스트로 변환하는 STT 서비스를 설정합니다.</p>
                    </div>
                    <button
                        onClick={handleRefreshSTT}
                        className={`${styles.button} ${styles.secondary} ${styles.refreshButton}`}
                        disabled={refreshing}
                        title="STT 설정 새로고침"
                    >
                        <FiRefreshCw className={refreshing ? styles.spinning : ''} />
                        설정 초기화
                    </button>
                </div>
            </div>

            <AdminBaseConfigPanel
                configData={configData}
                fieldConfigs={STT_CONFIG_FIELDS}
                filterPrefix=""
                onTestConnection={handleTestConnection}
                testConnectionLabel="STT 연결 테스트"
                testConnectionCategory={
                    configData.find((item: ConfigItem) => item.env_name === "STT_PROVIDER")?.current_value || ""
                }
                onConfigChange={handleConfigChange} // 새로 추가
            />
        </div>
    );
};

export default AdminSTTConfig;
