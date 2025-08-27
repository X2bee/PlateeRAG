import { useReducer, useCallback } from 'react';
import { 
    ChatState, 
    ChatAction, 
    ChatActionType, 
    initialChatState 
} from '../types/state';
import { SourceInfo } from '../types/source';
import { WorkflowData } from '@/app/canvas/types';

// Reducer 함수
function chatReducer(state: ChatState, action: ChatAction): ChatState {
    switch (action.type) {
        case ChatActionType.TOGGLE_ATTACHMENT_MENU:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    showAttachmentMenu: !state.ui.showAttachmentMenu,
                },
            };

        case ChatActionType.SET_ATTACHMENT_MENU:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    showAttachmentMenu: action.payload,
                },
            };

        case ChatActionType.TOGGLE_COLLECTION_MODAL:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    showCollectionModal: !state.ui.showCollectionModal,
                },
            };

        case ChatActionType.TOGGLE_DEPLOYMENT_MODAL:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    showDeploymentModal: !state.ui.showDeploymentModal,
                },
            };

        case ChatActionType.SET_LOADING:
            return {
                ...state,
                ui: {
                    ...state.ui,
                    loading: action.payload,
                },
            };

        case ChatActionType.SHOW_PDF_VIEWER:
            // PDF 뷰어 표시 시 패널 크기도 함께 조정
            const newSplit = 65;
            localStorage.setItem('chatPanelSplit', newSplit.toString());
            
            return {
                ...state,
                ui: {
                    ...state.ui,
                    showPDFViewer: true,
                },
                pdfViewer: {
                    isVisible: true,
                    currentSourceInfo: action.payload,
                },
                panel: {
                    ...state.panel,
                    split: newSplit,
                },
            };

        case ChatActionType.HIDE_PDF_VIEWER:
            // PDF 뷰어 숨김 시 패널을 100%로 설정
            const fullSplit = 100;
            localStorage.setItem('chatPanelSplit', fullSplit.toString());
            
            return {
                ...state,
                ui: {
                    ...state.ui,
                    showPDFViewer: false,
                },
                pdfViewer: {
                    isVisible: false,
                    currentSourceInfo: null,
                },
                panel: {
                    ...state.panel,
                    split: fullSplit,
                },
            };

        case ChatActionType.SET_SOURCE_INFO:
            return {
                ...state,
                pdfViewer: {
                    ...state.pdfViewer,
                    currentSourceInfo: action.payload,
                },
            };

        case ChatActionType.SET_PANEL_SPLIT:
            localStorage.setItem('chatPanelSplit', action.payload.toString());
            return {
                ...state,
                panel: {
                    ...state.panel,
                    split: action.payload,
                },
            };

        case ChatActionType.SET_PANEL_RESIZING:
            return {
                ...state,
                panel: {
                    ...state.panel,
                    isResizing: action.payload,
                },
            };

        case ChatActionType.SET_WORKFLOW_DETAIL:
            // 워크플로우 디테일을 localStorage에도 저장
            if (action.payload) {
                localStorage.setItem('workflowContentDetail', JSON.stringify(action.payload));
            }
            
            return {
                ...state,
                workflow: {
                    ...state.workflow,
                    contentDetail: action.payload,
                },
            };

        case ChatActionType.SET_ADDITIONAL_PARAMS:
            return {
                ...state,
                workflow: {
                    ...state.workflow,
                    additionalParams: action.payload,
                },
            };

        case ChatActionType.UPDATE_ADDITIONAL_PARAMS:
            return {
                ...state,
                workflow: {
                    ...state.workflow,
                    additionalParams: {
                        ...state.workflow.additionalParams,
                        [action.payload.toolId]: action.payload.params,
                    },
                },
            };

        case ChatActionType.RESET_UI_STATE:
            return {
                ...state,
                ui: {
                    showAttachmentMenu: false,
                    showCollectionModal: false,
                    showDeploymentModal: false,
                    showPDFViewer: false,
                    loading: false,
                },
            };

        case ChatActionType.RESET_ALL:
            return initialChatState;

        default:
            return state;
    }
}

// Custom Hook
interface UseChatStateReturn {
    state: ChatState;
    actions: {
        // UI Actions
        toggleAttachmentMenu: () => void;
        setAttachmentMenu: (show: boolean) => void;
        toggleCollectionModal: () => void;
        toggleDeploymentModal: () => void;
        setLoading: (loading: boolean) => void;
        
        // PDF Viewer Actions
        showPDFViewer: (sourceInfo: SourceInfo) => void;
        hidePDFViewer: () => void;
        setSourceInfo: (sourceInfo: SourceInfo | null) => void;
        
        // Panel Actions
        setPanelSplit: (split: number) => void;
        setPanelResizing: (resizing: boolean) => void;
        
        // Workflow Actions
        setWorkflowDetail: (detail: WorkflowData | null) => void;
        setAdditionalParams: (params: Record<string, Record<string, any>>) => void;
        updateAdditionalParams: (toolId: string, params: Record<string, any>) => void;
        
        // Reset Actions
        resetUIState: () => void;
        resetAll: () => void;
    };
}

export const useChatState = (): UseChatStateReturn => {
    const [state, dispatch] = useReducer(chatReducer, initialChatState);

    // Memoized action creators
    const actions = {
        toggleAttachmentMenu: useCallback(() => {
            dispatch({ type: ChatActionType.TOGGLE_ATTACHMENT_MENU });
        }, []),

        setAttachmentMenu: useCallback((show: boolean) => {
            dispatch({ type: ChatActionType.SET_ATTACHMENT_MENU, payload: show });
        }, []),

        toggleCollectionModal: useCallback(() => {
            dispatch({ type: ChatActionType.TOGGLE_COLLECTION_MODAL });
        }, []),

        toggleDeploymentModal: useCallback(() => {
            dispatch({ type: ChatActionType.TOGGLE_DEPLOYMENT_MODAL });
        }, []),

        setLoading: useCallback((loading: boolean) => {
            dispatch({ type: ChatActionType.SET_LOADING, payload: loading });
        }, []),

        showPDFViewer: useCallback((sourceInfo: SourceInfo) => {
            dispatch({ type: ChatActionType.SHOW_PDF_VIEWER, payload: sourceInfo });
        }, []),

        hidePDFViewer: useCallback(() => {
            dispatch({ type: ChatActionType.HIDE_PDF_VIEWER });
        }, []),

        setSourceInfo: useCallback((sourceInfo: SourceInfo | null) => {
            dispatch({ type: ChatActionType.SET_SOURCE_INFO, payload: sourceInfo });
        }, []),

        setPanelSplit: useCallback((split: number) => {
            dispatch({ type: ChatActionType.SET_PANEL_SPLIT, payload: split });
        }, []),

        setPanelResizing: useCallback((resizing: boolean) => {
            dispatch({ type: ChatActionType.SET_PANEL_RESIZING, payload: resizing });
        }, []),

        setWorkflowDetail: useCallback((detail: WorkflowData | null) => {
            dispatch({ type: ChatActionType.SET_WORKFLOW_DETAIL, payload: detail });
        }, []),

        setAdditionalParams: useCallback((params: Record<string, Record<string, any>>) => {
            dispatch({ type: ChatActionType.SET_ADDITIONAL_PARAMS, payload: params });
        }, []),

        updateAdditionalParams: useCallback((toolId: string, params: Record<string, any>) => {
            dispatch({ 
                type: ChatActionType.UPDATE_ADDITIONAL_PARAMS, 
                payload: { toolId, params } 
            });
        }, []),

        resetUIState: useCallback(() => {
            dispatch({ type: ChatActionType.RESET_UI_STATE });
        }, []),

        resetAll: useCallback(() => {
            dispatch({ type: ChatActionType.RESET_ALL });
        }, []),
    };

    return { state, actions };
};