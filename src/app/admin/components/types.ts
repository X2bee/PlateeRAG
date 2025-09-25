import { ReactNode } from 'react';

export interface AdminSidebarItem {
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
}

export interface AdminSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    userItems?: AdminSidebarItem[];
    workflowItems?: AdminSidebarItem[];
    settingItems?: AdminSidebarItem[];
    systemItems?: AdminSidebarItem[];
    dataItems?: AdminSidebarItem[];
    securityItems?: AdminSidebarItem[];
    mcpItems?: AdminSidebarItem[];
    activeItem: string;
    onItemClick: (itemId: string) => void;
    className?: string;
    initialUserExpanded?: boolean;
    initialWorkflowExpanded?: boolean;
    initialSettingExpanded?: boolean;
    initialSystemExpanded?: boolean;
    initialDataExpanded?: boolean;
    initialSecurityExpanded?: boolean;
    initialMCPExpanded?: boolean;
}

export interface AdminContentAreaProps {
    title: string;
    description: string;
    children: ReactNode;
    className?: string;
    headerButtons?: ReactNode;
}
