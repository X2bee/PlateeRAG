import { ReactNode } from 'react';

export interface ManagerSidebarItem {
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
}

export interface ManagerSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    groupItems?: ManagerSidebarItem[];
    activeItem: string;
    onItemClick: (itemId: string) => void;
    className?: string;
    initialGroupExpanded?: boolean;
}

export interface ManagerContentAreaProps {
    title: string;
    description: string;
    children: ReactNode;
    className?: string;
    headerButtons?: ReactNode;
}
