import React from 'react';
import {
    FiGrid,
    FiFolder,
    FiClock,
    FiMessageCircle,
    FiFile,
    FiBarChart2,
    FiDatabase,
    FiUpload,
    FiLayers,
    FiZap,
} from 'react-icons/fi';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { RiChatSmileAiLine } from "react-icons/ri";
import { LuBrainCircuit } from "react-icons/lu";
import { HiSaveAs } from "react-icons/hi";
import { TbBrandSpeedtest } from "react-icons/tb";
import { SidebarItem } from '@/app/main/sidebar/index';
import { devLog } from '@/app/_common/utils/logger';

export const getChatItems = ['new-chat', 'current-chat', 'chat-history'];

export const getChatSidebarItems = (): SidebarItem[] => [
    {
        id: 'new-chat',
        title: '새 채팅',
        description: '새로운 AI 채팅을 시작합니다',
        icon: React.createElement(RiChatSmileAiLine),
    },
    {
        id: 'current-chat',
        title: '현재 채팅',
        description: '진행 중인 대화를 계속합니다',
        icon: React.createElement(FiMessageCircle),
    },
    {
        id: 'chat-history',
        title: '기존 채팅 불러오기',
        description: '이전 대화를 불러와서 계속합니다',
        icon: React.createElement(FiClock),
    },
];

export const getWorkflowItems = ['canvas', 'workflows', 'documents', 'tool-storage', 'prompt-store'];

export const getWorkflowSidebarItems = (): SidebarItem[] => [
    {
        id: 'canvas',
        title: '워크플로우 캔버스',
        description: '새로운 워크플로우 만들기',
        icon: React.createElement(FiGrid),
    },
    {
        id: 'workflows',
        title: '워크플로우 관리',
        description: '워크플로우 관리 및 스토어',
        icon: React.createElement(FiFolder),
    },
    {
        id: 'documents',
        title: '문서 관리',
        description: '문서 저장소',
        icon: React.createElement(FiFile),
    },
    {
        id: 'tool-storage',
        title: '도구 관리',
        description: '도구 관리 및 스토어',
        icon: React.createElement(FiZap),
    },
    {
        id: 'prompt-store',
        title: '프롬프트 스토어',
        description: '프롬프트 탐색하고 관리',
        icon: React.createElement(IoDocumentTextOutline),
    },
];


export const getDataItems = ['data-station', 'data-storage'];
export const getDataSidebarItems = (): SidebarItem[] => [
    {
        id: 'data-station',
        title: '데이터 스테이션',
        description: '데이터를 처리합니다.',
        icon: React.createElement(FiDatabase),
    },
    {
        id: 'data-storage',
        title: '데이터셋 허브',
        description: 'HF 데이터셋을 확인하고 관리합니다',
        icon: React.createElement(HiSaveAs),
    },
];

export const getTrainItems = ['train', 'train-monitor', 'eval', 'model-storage'];
export const getTrainSidebarItems = (): SidebarItem[] => [
    {
        id: 'train',
        title: '모델 훈련',
        description: '모델 훈련',
        icon: React.createElement(LuBrainCircuit),
    },
    {
        id: 'train-monitor',
        title: '모델 훈련 모니터',
        description: '모델 훈련 파라미터 모니터링',
        icon: React.createElement(FiBarChart2),
    },
    {
        id: 'eval',
        title: '모델 평가',
        description: '모델 평가',
        icon: React.createElement(TbBrandSpeedtest),
    },
    {
        id: 'model-storage',
        title: '모델 허브',
        description: '모델 허브',
        icon: React.createElement(HiSaveAs),
    },
];

export const getMlModelItems = ['model-upload', 'model-hub', 'model-inference' , 'ml-train', 'ml-train-monitor'];

export const getMlModelSidebarItems = (): SidebarItem[] => [
    {
        id: 'model-upload',
        title: '모델 업로드',
        description: '학습된 모델을 등록합니다',
        icon: React.createElement(FiUpload),
    },
    {
        id: 'ml-train',
        title: 'ML 모델 훈련',
        description: 'ML 모델 훈련',
        icon: React.createElement(LuBrainCircuit),
    },
    {
        id: 'ml-train-monitor',
        title: 'ML 모델 훈련 모니터 및 저장소',
        description: 'ML 모델 훈련 파라미터 모니터링',
        icon: React.createElement(FiBarChart2),
    },
    {
        id: 'model-hub',
        title: '모델 허브',
        description: '저장된 모델을 확인하고 관리합니다',
        icon: React.createElement(FiLayers),
    },
    {
        id: 'model-inference',
        title: '모델 헬스체크',
        description: '모델 메타데이터와 헬스체크 콘솔',
        icon: React.createElement(FiZap),
    },
    
];

/**
 * 사용자 권한에 따라 데이터 아이템 필터링
 * @param hasAccessToSection - 섹션 접근 권한 확인 함수
 * @returns 접근 가능한 데이터 아이템들
 */
export const getFilteredDataSidebarItems = (hasAccessToSection: (sectionId: string) => boolean): SidebarItem[] => {
    const allItems = getDataSidebarItems();
    const filteredItems = allItems.filter(item => {
        const hasAccess = hasAccessToSection(item.id);
        devLog.log(`SidebarConfig: Checking data item '${item.id}': ${hasAccess}`);
        return hasAccess;
    });
    devLog.log('SidebarConfig: Filtered data items:', filteredItems.map(item => item.id));
    return filteredItems;
};

/**
 * 사용자 권한에 따라 워크플로우 아이템 필터링
 * @param hasAccessToSection - 섹션 접근 권한 확인 함수
 * @returns 접근 가능한 워크플로우 아이템들
 */
export const getFilteredWorkflowSidebarItems = (hasAccessToSection: (sectionId: string) => boolean): SidebarItem[] => {
    const allItems = getWorkflowSidebarItems();
    const filteredItems = allItems.filter(item => {
        const hasAccess = hasAccessToSection(item.id);
        devLog.log(`SidebarConfig: Checking workflow item '${item.id}': ${hasAccess}`);
        return hasAccess;
    });
    devLog.log('SidebarConfig: Filtered workflow items:', filteredItems.map(item => item.id));
    return filteredItems;
};

/**
 * 사용자 권한에 따라 훈련 아이템 필터링
 * @param hasAccessToSection - 섹션 접근 권한 확인 함수
 * @returns 접근 가능한 훈련 아이템들
 */
export const getFilteredTrainSidebarItems = (hasAccessToSection: (sectionId: string) => boolean): SidebarItem[] => {
    const allItems = getTrainSidebarItems();
    const filteredItems = allItems.filter(item => {
        const hasAccess = hasAccessToSection(item.id);
        devLog.log(`SidebarConfig: Checking train item '${item.id}': ${hasAccess}`);
        return hasAccess;
    });
    devLog.log('SidebarConfig: Filtered train items:', filteredItems.map(item => item.id));
    return filteredItems;
};

export const getFilteredMlModelSidebarItems = (hasAccessToSection: (sectionId: string) => boolean): SidebarItem[] => {
    const allItems = getMlModelSidebarItems();
    const filteredItems = allItems.filter(item => {
        const hasAccess = hasAccessToSection(item.id);
        devLog.log(`SidebarConfig: Checking ML model item '${item.id}': ${hasAccess}`);
        return hasAccess;
    });
    devLog.log('SidebarConfig: Filtered ML model items:', filteredItems.map(item => item.id));
    return filteredItems;
};
