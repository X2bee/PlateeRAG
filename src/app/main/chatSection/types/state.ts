import { WorkflowData } from '@/app/canvas/types';
import { SourceInfo } from './source';

// UI 상태 인터페이스
export interface UIState {
    showAttachmentMenu: boolean;
    showCollectionModal: boolean;
    showDeploymentModal: boolean;
    showPDFViewer: boolean;
    loading: boolean;
}

// 패널 상태 인터페이스
export interface PanelState {
    split: number;
    isResizing: boolean;
}

// PDF 뷰어 상태 인터페이스
export interface PDFViewerState {
    isVisible: boolean;
    currentSourceInfo: SourceInfo | null;
}

// 워크플로우 상태 인터페이스
export interface WorkflowState {
    contentDetail: WorkflowData | null;
    additionalParams: Record<string, Record<string, any>>;
}

// 통합 채팅 상태 인터페이스
export interface ChatState {
    ui: UIState;
    panel: PanelState;
    pdfViewer: PDFViewerState;
    workflow: WorkflowState;
}

// 액션 타입들
export enum ChatActionType {
    // UI Actions
    TOGGLE_ATTACHMENT_MENU = 'TOGGLE_ATTACHMENT_MENU',
    SET_ATTACHMENT_MENU = 'SET_ATTACHMENT_MENU',
    TOGGLE_COLLECTION_MODAL = 'TOGGLE_COLLECTION_MODAL',
    TOGGLE_DEPLOYMENT_MODAL = 'TOGGLE_DEPLOYMENT_MODAL',
    SET_LOADING = 'SET_LOADING',

    // PDF Viewer Actions
    SHOW_PDF_VIEWER = 'SHOW_PDF_VIEWER',
    HIDE_PDF_VIEWER = 'HIDE_PDF_VIEWER',
    SET_SOURCE_INFO = 'SET_SOURCE_INFO',

    // Panel Actions
    SET_PANEL_SPLIT = 'SET_PANEL_SPLIT',
    SET_PANEL_RESIZING = 'SET_PANEL_RESIZING',

    // Workflow Actions
    SET_WORKFLOW_DETAIL = 'SET_WORKFLOW_DETAIL',
    SET_ADDITIONAL_PARAMS = 'SET_ADDITIONAL_PARAMS',
    UPDATE_ADDITIONAL_PARAMS = 'UPDATE_ADDITIONAL_PARAMS',

    // Reset Actions
    RESET_UI_STATE = 'RESET_UI_STATE',
    RESET_ALL = 'RESET_ALL',
}

// 액션 인터페이스들
export interface ToggleAttachmentMenuAction {
    type: ChatActionType.TOGGLE_ATTACHMENT_MENU;
}

export interface SetAttachmentMenuAction {
    type: ChatActionType.SET_ATTACHMENT_MENU;
    payload: boolean;
}

export interface ToggleCollectionModalAction {
    type: ChatActionType.TOGGLE_COLLECTION_MODAL;
}

export interface ToggleDeploymentModalAction {
    type: ChatActionType.TOGGLE_DEPLOYMENT_MODAL;
}

export interface SetLoadingAction {
    type: ChatActionType.SET_LOADING;
    payload: boolean;
}

export interface ShowPDFViewerAction {
    type: ChatActionType.SHOW_PDF_VIEWER;
    payload: SourceInfo;
}

export interface HidePDFViewerAction {
    type: ChatActionType.HIDE_PDF_VIEWER;
}

export interface SetSourceInfoAction {
    type: ChatActionType.SET_SOURCE_INFO;
    payload: SourceInfo | null;
}

export interface SetPanelSplitAction {
    type: ChatActionType.SET_PANEL_SPLIT;
    payload: number;
}

export interface SetPanelResizingAction {
    type: ChatActionType.SET_PANEL_RESIZING;
    payload: boolean;
}

export interface SetWorkflowDetailAction {
    type: ChatActionType.SET_WORKFLOW_DETAIL;
    payload: WorkflowData | null;
}

export interface SetAdditionalParamsAction {
    type: ChatActionType.SET_ADDITIONAL_PARAMS;
    payload: Record<string, Record<string, any>>;
}

export interface UpdateAdditionalParamsAction {
    type: ChatActionType.UPDATE_ADDITIONAL_PARAMS;
    payload: {
        toolId: string;
        params: Record<string, any>;
    };
}

export interface ResetUIStateAction {
    type: ChatActionType.RESET_UI_STATE;
}

export interface ResetAllAction {
    type: ChatActionType.RESET_ALL;
}

// 모든 액션의 유니온 타입
export type ChatAction =
    | ToggleAttachmentMenuAction
    | SetAttachmentMenuAction
    | ToggleCollectionModalAction
    | ToggleDeploymentModalAction
    | SetLoadingAction
    | ShowPDFViewerAction
    | HidePDFViewerAction
    | SetSourceInfoAction
    | SetPanelSplitAction
    | SetPanelResizingAction
    | SetWorkflowDetailAction
    | SetAdditionalParamsAction
    | UpdateAdditionalParamsAction
    | ResetUIStateAction
    | ResetAllAction;

// 초기 상태 정의
export const initialChatState: ChatState = {
    ui: {
        showAttachmentMenu: false,
        showCollectionModal: false,
        showDeploymentModal: false,
        showPDFViewer: false,
        loading: false,
    },
    panel: {
        split: typeof window !== 'undefined'
            ? (localStorage.getItem('chatPanelSplit') ? parseFloat(localStorage.getItem('chatPanelSplit')!) : 65)
            : 65,
        isResizing: false,
    },
    pdfViewer: {
        isVisible: false,
        currentSourceInfo: null,
    },
    workflow: {
        contentDetail: null,
        additionalParams: {},
    },
};
