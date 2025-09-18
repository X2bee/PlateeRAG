import { ReactNode } from 'react';

export interface SidebarItem {
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
}
export interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    workflowItems?: SidebarItem[];
    chatItems?: SidebarItem[];
    trainItem?: SidebarItem[];
    activeItem: string;
    onItemClick: (itemId: string) => void;
    className?: string;
    initialChatExpanded?: boolean;
    initialWorkflowExpanded?: boolean;
    initialTrainExpanded?: boolean;
}
