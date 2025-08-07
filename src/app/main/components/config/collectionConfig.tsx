import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import BaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/main/components/config/baseConfigPanel';
import {
    testOpenACollectionConnection,
    testVLLMCollectionConnection,
} from '@/app/api/llmAPI';

interface CollectionConfigProps {
    configData?: ConfigItem[];
    onConfigUpdate?: () => Promise<void>; // 설정 업데이트 후 호출될 콜백
}

const COLLECTION_CONFIG_FIELDS: Record<string, FieldConfig> = {
    IMAGE_TEXT_MODEL_PROVIDER: {
      label: '모델 제공자',
      type: 'select',
      options: [
        { value: 'openai', label: 'OpenAI (GPT-4V)' },
        { value: 'vllm', label: 'vLLM' },
        { value: 'no_model', label: '기본 텍스트 추출' },
      ],
      description: '사용할 이미지-텍스트 모델 제공자를 선택하세요.',
      required: true,
    },
    IMAGE_TEXT_BASE_URL: {
      label: 'Base URL',
      type: 'text',
      placeholder: 'https://api.openai.com/v1',
      description: '이미지-텍스트 모델 API의 base URL을 입력하세요.',
      required: true,
    },
    IMAGE_TEXT_API_KEY: {
      label: 'API Key',
      type: 'password',
      placeholder: 'sk-...',
      description: '이미지-텍스트 모델 API 키를 입력하세요. 안전하게 암호화되어 저장됩니다.',
      required: true,
    },
    IMAGE_TEXT_MODEL_NAME: {
      label: '모델 이름',
      type: 'text',
      placeholder: 'gpt-4-vision-preview',
      description: '사용할 이미지-텍스트 모델의 정확한 이름을 입력하세요.',
      required: true,
    },
    IMAGE_TEXT_TEMPERATURE: {
      label: '온도 (Temperature)',
      type: 'number',
      min: 0,
      max: 2,
      step: 0.1,
      placeholder: '0.7',
      description: '모델의 창의성을 조절합니다.',
      required: false,
    },
    IMAGE_QUALITY: {
      label: '이미지 품질',
      type: 'select',
      options: [
        { value: 'auto', label: '자동' },
        { value: 'low', label: '낮음 (빠름)' },
        { value: 'high', label: '높음 (정확함)' },
      ],
      description: '이미지 처리 품질을 설정합니다.',
      required: false,
    },
    IMAGE_TEXT_BATCH_SIZE: {
      label: '이미지 배치 사이즈',
      type: 'number',
      placeholder: '1',
      description: '이미지 처리 배치 크기를 정수 값으로 입력하세요.',
      required: false,
      min: 1,    // 최소 1
      step: 1,   // 1 단위로만 증가/감소
    },
  };


const CollectionConfig: React.FC<CollectionConfigProps> = ({
    configData = [],
    onConfigUpdate, // 부모로부터 받는 콜백
}) => {
    const [testing, setTesting] = useState(false);

    // BaseConfigPanel에서 설정이 업데이트될 때 호출될 함수
    const handleConfigChange = useCallback(async () => {
        if (onConfigUpdate) {
            await onConfigUpdate();
        }
    }, [onConfigUpdate]);

    const handleTestConnection = async (category: string) => {
        setTesting(true);
        try {
            let result;
            if (category === 'openai') {
                result = await testOpenACollectionConnection();
            } else if (category === 'vllm') {
                result = await testVLLMCollectionConnection();
            } else {
                toast.error('지원되지 않는 제공자입니다.');
                return;
            }

            const isSuccess = (result as { status: string })?.status === 'success';
            if (isSuccess) {
                toast.success(`${category} 연결 테스트 성공!`);
            } else {
                toast.error(`${category} 연결 테스트 실패`);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : `${category} 연결 테스트에 실패했습니다.`;
            toast.error(msg);
            console.error(err);
        } finally {
            setTesting(false);
        }
    };

    return (
        <BaseConfigPanel
            configData={configData}
            fieldConfigs={COLLECTION_CONFIG_FIELDS}
            filterPrefix="IMAGE_TEXT"
            onTestConnection={handleTestConnection}
            testConnectionLabel="모델 연결 테스트"
            testConnectionCategory={
                configData.find(item => item.env_name === "IMAGE_TEXT_MODEL_PROVIDER")?.current_value || ""
            }
            onConfigChange={handleConfigChange} // 새로 추가
        />
    );
};

export default CollectionConfig;
