import { ReactNode } from 'react';

// 사이드바 관련 타입들
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

export interface ContentAreaProps {
    title: string;
    description: string;
    children: ReactNode;
    className?: string;
    headerButtons?: ReactNode;
}

export interface Collection {
    id: number;
    collection_name: string;
    collection_make_name: string;
    vector_size?: number;
    points_count?: number;
    description?: string;
    registered_at: string;
    updated_at: string;
    created_at: string;
    user_id: number;
    is_shared?: boolean | null;
    share_group?: string | null;
    share_permissions?: string | null;
    init_embedding_model?: string | null;
}

export interface ChunkInfo {
    chunk_id: string;
    chunk_index: number;
    chunk_size: number;
    chunk_text?: string;
    chunk_text_preview?: string;
}

export interface DocumentInCollection {
    document_id: string;
    file_name: string;
    file_type: string;
    processed_at: string;
    total_chunks: number;
    actual_chunks?: number;
    metadata?: {
        folder_path?: string;
        directory_full_path?: string;
        relative_path?: string;
        original_file_name?: string;
        upload_type?: string;
        process_type?: string;
        upload_timestamp?: string;
        file_size?: number;
        user_id?: number;
        collection_name?: string;
        [key: string]: any;
    };
    chunks: ChunkInfo[];
}

export interface SearchResult {
    id: string;
    score: number;
    document_id: string;
    chunk_index: number;
    chunk_text: string;
    file_name: string;
    file_type: string;
    metadata: any;
}

// API 응답 타입들
export type CollectionsResponse = Collection[];

export interface DocumentsInCollectionResponse {
    collection_name: string;
    total_documents: number;
    total_chunks: number;
    documents: DocumentInCollection[];
    directory_info?: Folder[];
}

export interface Folder {
    id: number;
    created_at: string;
    updated_at: string;
    user_id: number;
    collection_make_name: string;
    collection_name: string;
    folder_name: string;
    parent_folder_name: string | null;
    parent_folder_id: number | null;
    is_root: boolean;
    full_path: string;
    order_index: number;
    collection_id: number;
}

export interface SearchResponse {
    query: string;
    results: SearchResult[];
    total: number;
    search_params: any;
}

// 뷰 모드 관련 타입들
export type ViewMode = 'collections' | 'documents' | 'documents-graph' | 'document-detail' | 'all-documents-graph';
export type CollectionFilter = 'all' | 'personal' | 'shared';

// 그래프 관련 타입들
export interface Node {
    id: string;
    label: string;
    type: 'chunk' | 'concept';
    data?: any;
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

export interface Link {
    source: string | Node;
    target: string | Node;
    relation_type: string;
    edge_weight: number;
}

export interface GraphData {
    nodes: Node[];
    links: Link[];
}

export type GraphViewMode = 'graph' | 'data';

export interface DocumentsGraphProps {
    loading: boolean;
    documentDetailMeta: any;
    documentDetailEdges: any;
}

// 모달 Props 타입들
export interface CollectionEditModalProps {
    collection: Collection;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedCollection: Collection) => void;
}

export interface DocumentCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCollectionCreated?: () => void;
}

// 평가 작업 관련 타입들
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
        base_model?: string;
    };
    logs: LogEntry[];
    status: 'running' | 'completed' | 'failed' | 'pending' | 'accepted';
    start_time?: string;
    end_time?: string;
    result?: Record<string, any>;
    base_model_result?: Record<string, any>;
    base_model_name?: string;
    job_id: string;
    error?: string;
}

export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
}

// 워크플로우 관련 타입들
export interface Workflow {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    lastModified?: string;
    author: string;
    nodeCount: number;
    status: 'active' | 'draft' | 'archived' | 'unactive';
    filename?: string;
    error?: string;
    key_value?: number;
    user_id?: number;
    is_shared?: boolean;
    share_group?: string | null;
    share_permissions?: string;
}

export interface WorkflowDetailResponse {
    id: number;
    workflow_name: string;
    workflow_id: string;
    username: string;
    user_id: number;
    node_count: number;
    edge_count: number;
    updated_at: string;
    created_at: string;
    has_startnode: boolean;
    has_endnode: boolean;
    is_completed: boolean;
    is_shared: boolean;
    share_group: string | null;
    share_permissions: string;
    metadata: any;
    error?: string;
}
