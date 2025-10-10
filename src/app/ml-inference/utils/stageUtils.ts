import type { MlflowStage } from '../types';

const STAGE_VALUE_MAP: Record<string, MlflowStage> = {
    none: 'None',
    'no stage': 'None',
    no_stage: 'None',
    staging: 'Staging',
    production: 'Production',
    prod: 'Production',
    archived: 'Archived',
};

export const normalizeMlflowStage = (value?: string | null): MlflowStage => {
    if (!value) {
        return 'None';
    }
    const normalized = value.trim().toLowerCase();
    return STAGE_VALUE_MAP[normalized] ?? 'None';
};

export const formatStageDisplay = (stage: MlflowStage): string => {
    if (stage === 'None') {
        return 'NONE';
    }
    if (stage === 'Staging') {
        return 'STAGING';
    }
    if (stage === 'Production') {
        return 'PRODUCTION';
    }
    return 'ARCHIVED';
};

export interface StageOption {
    value: MlflowStage;
    label: string;
    description: string;
}

export const STAGE_OPTIONS: StageOption[] = [
    {
        value: 'None',
        label: 'None',
        description: 'MLflow 레지스트리에서 스테이지를 해제합니다. 테스트용 모델이나 임시 버전에 사용하세요.',
    },
    {
        value: 'Staging',
        label: 'Staging',
        description: '배포 전 검증 단계입니다. QA 및 내부 검증 환경에서 사용하세요.',
    },
    {
        value: 'Production',
        label: 'Production',
        description: '실서비스에 제공되는 운영 단계입니다. 필요하다면 기존 Production 버전을 보관할 수 있습니다.',
    },
    {
        value: 'Archived',
        label: 'Archived',
        description: '더 이상 사용하지 않는 모델을 보관하는 단계입니다. 기록용으로 유지합니다.',
    },
];

export const getStageDescription = (stage: MlflowStage): string => {
    const option = STAGE_OPTIONS.find(item => item.value === stage);
    return option ? option.description : '';
};
