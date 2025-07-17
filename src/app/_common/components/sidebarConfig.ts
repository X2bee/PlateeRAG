import React from 'react';
import {
    FiGrid,
    FiFolder,
    FiCpu,
    FiSettings,
    FiEye,
    FiFile,
} from 'react-icons/fi';
import { SidebarItem } from '@/app/main/components/types';

// 워크플로우 관리 센터의 공통 사이드바 아이템들을 반환하는 함수
export const getSidebarItems = (): SidebarItem[] => [
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
    {
        id: 'documents',
        title: '문서',
        description: '문서 저장소',
        icon: React.createElement(FiFile),
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
