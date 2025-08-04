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
    items: SidebarItem[];
    workflowItems?: SidebarItem[];
    chatItems?: SidebarItem[];
    trainItem?: SidebarItem[];
    activeItem: string;
    onItemClick: (itemId: string) => void;
    className?: string;
    initialChatExpanded?: boolean;
    initialSettingExpanded?: boolean;
    initialWorkflowExpanded?: boolean;
    initialTrainExpanded?: boolean;
}

export interface ContentAreaProps {
    title: string;
    description: string;
    children: ReactNode;
    className?: string;
    headerButtons?: ReactNode; // 헤더 우측에 표시할 버튼 추가
}

export interface EvaluationJob {
    job_info: {
      job_name: string;
      task: string;
      model_name: string;
      dataset_name: string;
      column1?: string | null;
      column2?: string | null;
      column3?: string | null;
      label?: string | null;
      top_k?: number;
      gpu_num: number;
      model_minio_enabled: boolean;
      dataset_minio_enabled: boolean;
      use_cot?: boolean;
      base_model?: string; // 선택적 필드
    };
    logs: LogEntry[];
    status: 'running' | 'completed' | 'failed' | 'pending' | 'accepted';
    start_time?: string;
    end_time?: string;
    result?: Record<string, any>;
    base_model_result?: Record<string, any>; // 선택적 필드
    base_model_name?: string; // 선택적 필드
    job_id: string;
    error?: string;
  }
  
  export interface LogEntry {
	timestamp: string;
	level: string;
	message: string;
  }