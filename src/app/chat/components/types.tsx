export interface Workflow {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    lastModified?: string;
    author: string;
    nodeCount: number;
    status: 'active' | 'draft' | 'archived';
    filename?: string;
    error?: string;
}

export interface IOLog {
    log_id: number | string;
    workflow_name: string;
    workflow_id: string;
    input_data: string;
    output_data: string;
    updated_at: string;
}

export interface ChatInterfaceProps {
    mode: 'existing' | 'new-workflow' | 'new-default' | 'deploy';
    workflow: Workflow;
    onChatStarted?: () => void;
    onBack: () => void;
    hideBackButton?: boolean;
    firstChat?: boolean;
    existingChatData?: {
        interactionId: string;
        workflowId: string;
        workflowName: string;
    } | null;
}

export interface ChatHeaderProps {
    mode: 'existing' | 'new-workflow' | 'new-default' | 'deploy';
    workflow: Workflow;
    ioLogs: IOLog[];
    onBack: () => void;
    hideBackButton?: boolean;
    onDeploy?: () => void;
}