import React from 'react';
import {
    FiGrid,
    FiFolder,
    FiCpu,
    FiSettings,
    FiEye,
    FiClock,
    FiMessageCircle
} from 'react-icons/fi';
import { RiChatSmileAiLine } from "react-icons/ri";
import { SidebarItem } from '@/app/main/components/types';

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

export const getSettingSidebarItems = (): SidebarItem[] => [
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
        id: 'exec-monitor',
        title: '실행 및 모니터링',
        description: '워크플로우 실행과 성능 모니터링',
        icon: React.createElement(FiCpu),
    },
    {
        id: 'settings',
        title: '고급 환경 설정',
        description: 'LLM 및 Tool 환경변수 직접 관리',
        icon: React.createElement(FiSettings),
    },
    {
        id: 'config-viewer',
        title: '설정값 확인',
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

// 채팅 아이템 클릭 핸들러 (localStorage 사용)
export const createChatItemClickHandler = (router: any) => {
    return (itemId: string) => {
        // 클릭한 채팅 섹션을 localStorage에 저장하고 /chat으로 이동
        localStorage.setItem('activeChatSection', itemId);
        router.push('/chat');
    };
};
