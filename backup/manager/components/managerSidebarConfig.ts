import React from 'react';
import {
    FiShield,
    FiMessageSquare,
    FiSettings,
} from 'react-icons/fi';
import { ManagerSidebarItem } from '@/app/manager/components/types';

export const getGroupItems = ['group-permissions'];

export const getGroupSidebarItems = (): ManagerSidebarItem[] => [
    {
        id: 'group-permissions',
        title: '조직 관리',
        description: '조직의 사용자를 확인하고 관리합니다.',
        icon: React.createElement(FiShield),
    },
];

export const getWorkflowItems = ['workflow-management', 'workflow-chat-logs'];

export const getWorkflowSidebarItems = (): ManagerSidebarItem[] => [
    {
        id: 'workflow-management',
        title: '워크플로우 관리',
        description: '워크플로우 생성, 편집, 삭제 및 관리',
        icon: React.createElement(FiSettings),
    },
    {
        id: 'workflow-chat-logs',
        title: '워크플로우 채팅 로그',
        description: '워크플로우 입출력 및 채팅 상호작용 로그 조회',
        icon: React.createElement(FiMessageSquare),
    },
];

export const createManagerItemClickHandler = (router: any) => {
    return (itemId: string) => {
        localStorage.setItem('managerActiveSection', itemId);
        router.push('/manager');
    };
};
