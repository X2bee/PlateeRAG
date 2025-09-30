import React from 'react';
import {
    FiShield,
    FiMessageSquare,
} from 'react-icons/fi';
import { ManagerSidebarItem } from '@/app/manager/components/types';

export const getGroupItems = ['group-permissions'];

export const getGroupSidebarItems = (): ManagerSidebarItem[] => [
    {
        id: 'group-permissions',
        title: '조직 권한 관리',
        description: '조직을 생성하고 사용자를 조직에 할당하여 권한을 관리하세요',
        icon: React.createElement(FiShield),
    },
];

export const getWorkflowItems = ['workflow-chat-logs'];

export const getWorkflowSidebarItems = (): ManagerSidebarItem[] => [
    {
        id: 'workflow-chat-logs',
        title: '워크플로우 채팅 로그',
        description: '워크플로우 입출력 및 채팅 상호작용 로그 조회',
        icon: React.createElement(FiMessageSquare),
    },
];

// 공통 아이템 클릭 핸들러 (localStorage 사용)
export const createManagerItemClickHandler = (router: any) => {
    return (itemId: string) => {
        // 클릭한 섹션을 localStorage에 저장하고 /manager로 이동
        localStorage.setItem('managerActiveSection', itemId);
        router.push('/manager');
    };
};
