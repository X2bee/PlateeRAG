import { devLog } from '@/app/_common/utils/logger';
import { Workflow } from '@/app/canvas/types'; // Assuming Workflow type is defined here

const WORKFLOW_NAME_KEY = 'plateerag_workflow_name';
const WORKFLOW_STATE_KEY = 'plateerag_workflow_state';
const DEFAULT_WORKFLOW_NAME = 'Workflow';

/**
 * 브라우저 로컬 스토리지에서 워크플로우 이름을 가져옵니다
 * @returns 저장된 워크플로우 이름 또는 기본값
 */
export const getWorkflowName = (): string => {
    if (typeof window === 'undefined') return DEFAULT_WORKFLOW_NAME;

    try {
        const savedName = localStorage.getItem(WORKFLOW_NAME_KEY);
        return savedName || DEFAULT_WORKFLOW_NAME;
    } catch (error) {
        devLog.warn('Failed to get workflow name from localStorage:', error);
        return DEFAULT_WORKFLOW_NAME;
    }
};

/**
 * 브라우저 로컬 스토리지에 워크플로우 이름을 저장합니다
 * @param name - 저장할 워크플로우 이름
 */
export const saveWorkflowName = (name: string): void => {
    if (typeof window === 'undefined') return;

    try {
        const trimmedName = name.trim();
        const nameToSave = trimmedName || DEFAULT_WORKFLOW_NAME;
        localStorage.setItem(WORKFLOW_NAME_KEY, nameToSave);
    } catch (error) {
        devLog.warn('Failed to save workflow name to localStorage:', error);
    }
};

/**
 * 워크플로우 이름을 초기화합니다 (기본값으로 되돌림)
 */
export const resetWorkflowName = (): void => {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(WORKFLOW_NAME_KEY);
    } catch (error) {
        devLog.warn('Failed to reset workflow name:', error);
    }
};

/**
 * 브라우저 로컬 스토리지에서 워크플로우 상태를 가져옵니다
 * @returns 저장된 워크플로우 상태 또는 null
 */
export const getWorkflowState = (): Workflow | null => {
    if (typeof window === 'undefined') return null;

    try {
        const savedState = localStorage.getItem(WORKFLOW_STATE_KEY);
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            return parsedState as Workflow;
        }
        return null;
    } catch (error) {
        devLog.warn('Failed to get workflow state from localStorage:', error);
        return null;
    }
};

/**
 * 브라우저 로컬 스토리지에 워크플로우 상태를 저장합니다
 * @param state - 저장할 워크플로우 상태
 */
export const saveWorkflowState = (state: Workflow | null): void => {
    if (typeof window === 'undefined') return;

    try {
        if (!state) {
            devLog.log('saveWorkflowState: No state provided, skipping save');
            return;
        }
        const stateJson = JSON.stringify(state);
        localStorage.setItem(WORKFLOW_STATE_KEY, stateJson);
    } catch (error) {
        devLog.warn('Failed to save workflow state to localStorage:', error);
    }
};

/**
 * 워크플로우 상태를 초기화합니다 (로컬 스토리지에서 제거)
 */
export const clearWorkflowState = (): void => {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(WORKFLOW_STATE_KEY);
    } catch (error) {
        devLog.warn('Failed to clear workflow state:', error);
    }
};

/**
 * 새로운 워크플로우를 시작합니다 (상태와 이름을 모두 초기화)
 */
export const startNewWorkflow = (): void => {
    clearWorkflowState();
    resetWorkflowName();
};

/**
 * 워크플로우 상태가 유효한지 확인합니다
 * @param state - 확인할 워크플로우 상태
 * @returns 상태가 유효한지 여부
 */
export const isValidWorkflowState = (state: any): state is Workflow => {
    if (!state || typeof state !== 'object') return false;
    return (
        Array.isArray(state.nodes) &&
        Array.isArray(state.edges) &&
        state.view &&
        typeof state.view === 'object'
    );
};

/**
 * 워크플로우 상태에 기본 view 정보를 추가합니다
 * @param state - 워크플로우 상태
 * @returns view 정보가 포함된 완전한 상태
 */
export const ensureValidWorkflowState = (state: Partial<Workflow>): Workflow | null => {
    if (!state) return null;

    const defaultView = { x: 0, y: 0, scale: 1 };

    return {
        nodes: Array.isArray(state.nodes) ? state.nodes : [],
        edges: Array.isArray(state.edges) ? state.edges : [],
        view: (state.view && typeof state.view === 'object') ? {
            x: typeof state.view.x === 'number' ? state.view.x : defaultView.x,
            y: typeof state.view.y === 'number' ? state.view.y : defaultView.y,
            scale: typeof state.view.scale === 'number' ? state.view.scale : defaultView.scale,
        } : defaultView,
        // Ensure other required Workflow properties are present, even if empty
        id: state.id || '',
        name: state.name || DEFAULT_WORKFLOW_NAME,
        description: state.description || '',
    };
};
