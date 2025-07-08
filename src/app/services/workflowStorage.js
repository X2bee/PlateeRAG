// 워크플로우 이름 관련 유틸리티 함수들

const WORKFLOW_NAME_KEY = 'plateerag_workflow_name';
const DEFAULT_WORKFLOW_NAME = 'Workflow';

/**
 * 브라우저 로컬 스토리지에서 워크플로우 이름을 가져옵니다
 * @returns {string} 저장된 워크플로우 이름 또는 기본값
 */
export const getWorkflowName = () => {
    if (typeof window === 'undefined') return DEFAULT_WORKFLOW_NAME;
    
    try {
        const savedName = localStorage.getItem(WORKFLOW_NAME_KEY);
        return savedName || DEFAULT_WORKFLOW_NAME;
    } catch (error) {
        console.warn('Failed to get workflow name from localStorage:', error);
        return DEFAULT_WORKFLOW_NAME;
    }
};

/**
 * 브라우저 로컬 스토리지에 워크플로우 이름을 저장합니다
 * @param {string} name - 저장할 워크플로우 이름
 */
export const saveWorkflowName = (name) => {
    if (typeof window === 'undefined') return;
    
    try {
        const trimmedName = name.trim();
        const nameToSave = trimmedName || DEFAULT_WORKFLOW_NAME;
        localStorage.setItem(WORKFLOW_NAME_KEY, nameToSave);
    } catch (error) {
        console.warn('Failed to save workflow name to localStorage:', error);
    }
};

/**
 * 워크플로우 이름을 초기화합니다 (기본값으로 되돌림)
 */
export const resetWorkflowName = () => {
    if (typeof window === 'undefined') return;
    
    try {
        localStorage.removeItem(WORKFLOW_NAME_KEY);
    } catch (error) {
        console.warn('Failed to reset workflow name:', error);
    }
};
