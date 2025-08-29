import React from 'react';
import {
    FiGrid,
    FiFolder,
    FiCpu,
    FiSettings,
    FiEye,
    FiClock,
    FiMessageCircle,
    FiFile,
    FiBarChart2,
} from 'react-icons/fi';
import { RiChatSmileAiLine } from "react-icons/ri";
import { LuBrainCircuit } from "react-icons/lu";
import { HiSaveAs } from "react-icons/hi";
import { TbBrandSpeedtest } from "react-icons/tb";
import { SidebarItem } from '@/app/main/components/types';
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

export const getWorkflowItems = ['canvas', 'workflows', 'documents'];

export const getWorkflowSidebarItems = (): SidebarItem[] => [
    {
        id: 'canvas',
        title: '워크플로우 캔버스',
        description: '새로운 워크플로우 만들기',
        icon: React.createElement(FiGrid),
    },
    {
        id: 'workflows',
        title: '완성된 워크플로우',
        description: '저장된 워크플로우 관리',
        icon: React.createElement(FiFolder),
    },
    {
        id: 'documents',
        title: '문서',
        description: '문서 저장소',
        icon: React.createElement(FiFile),
    },
];

export const getTrainItems = ['train', 'train-monitor', 'eval', 'storage'];

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
        id: 'storage',
        title: '모델 허브',
        description: '모델 허브',
        icon: React.createElement(HiSaveAs),
    },
];

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

// 공통 아이템 클릭 핸들러 (localStorage 사용)
export const createItemClickHandler = (router: any) => {
    return (itemId: string) => {
        // 클릭한 섹션을 localStorage에 저장하고 /main으로 이동
        localStorage.setItem('activeSection', itemId);
        router.push('/main');
    };
};

export const createTrainItemClickHandler = (router: any) => {
    return (itemId: string) => {
        // 클릭한 섹션을 localStorage에 저장하고 /train으로 이동
        localStorage.setItem('activeSection', itemId);
        router.push('/train');
    };
};

// 채팅 아이템 클릭 핸들러 (localStorage 사용)
export const createChatItemClickHandler = (router: any) => {
    return (itemId: string) => {
        // 클릭한 채팅 섹션을 localStorage에 저장하고 /chat으로 이동
        localStorage.setItem('activeChatSection', itemId);
        router.push('/chat');
    };
};
