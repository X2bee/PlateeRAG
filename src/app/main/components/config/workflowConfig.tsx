import React from 'react';
import BaseConfigPanel, { ConfigItem, FieldConfig } from '@/app/main/components/config/baseConfigPanel';

interface WorkflowConfigProps {
    configData?: ConfigItem[];
    onTestConnection?: (category: string) => void;
}

const WORKFLOW_CONFIG_FIELDS: Record<string, FieldConfig> = {
    WORKFLOW_ALLOW_PARALLEL: {
        label: '병렬 실행 허용',
        type: 'boolean',
        description:
            '여러 워크플로우를 동시에 병렬로 실행할 수 있는지 설정합니다.',
        required: false,
    },
    WORKFLOW_ENABLE_CACHING: {
        label: '캐싱 활성화',
        type: 'boolean',
        description: '워크플로우 실행 결과를 캐싱하여 성능을 향상시킵니다.',
        required: false,
    },
    MAX_CONCURRENT_WORKFLOWS: {
        label: '최대 동시 실행 워크플로우',
        type: 'number',
        min: 1,
        max: 20,
        description: '동시에 실행할 수 있는 최대 워크플로우 개수를 설정합니다.',
        required: false,
    },
    WORKFLOW_SAVE_LOGS: {
        label: '로그 저장',
        type: 'boolean',
        description: '워크플로우 실행 로그를 파일로 저장할지 설정합니다.',
        required: false,
    },
};

const WorkflowConfig: React.FC<WorkflowConfigProps> = ({
    configData = [],
    onTestConnection,
}) => {
    return (
        <BaseConfigPanel
            configData={configData}
            fieldConfigs={WORKFLOW_CONFIG_FIELDS}
            filterPrefix="workflow"
            onTestConnection={onTestConnection}
            testConnectionLabel="워크플로우 테스트"
            testConnectionCategory="workflow"
        />
    );
};

export default WorkflowConfig;
