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

export const getSettingItems = ['settings', 'exec-monitor', 'config-viewer'];

export const getSettingSidebarItems = (): SidebarItem[] => [
    {
        id: 'settings',
        title: '환경 설정',
        description: 'LLM 및 Tool 환경변수 직접 관리',
        icon: React.createElement(FiSettings),
    },
    {
        id: 'exec-monitor',
        title: '실행 및 모니터링',
        description: '워크플로우 실행과 성능 모니터링',
        icon: React.createElement(FiCpu),
    },
    {
        id: 'config-viewer',
        title: '[고급] 전체 설정 확인',
        description: '백엔드 환경변수 및 설정 확인',
        icon: React.createElement(FiEye),
    },
];

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
