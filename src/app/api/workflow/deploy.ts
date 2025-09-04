import { apiClient } from "@/app/api/helper/apiClient";
import { API_BASE_URL } from '@/app/config.js';
import { devLog } from "@/app/_common/utils/logger";

//배포 관련 타입 정의
export interface DeployStatus {
    workflow_name: string;
    workflow_id: string;
    is_deployed: boolean;
    deploy_key?: string;
    created_at?: string;
    updated_at?: string;
}

export interface DeployToggleResponse {
    workflow_name: string;
    workflow_id: string;
    is_deployed: boolean;
    deploy_key?: string;
    message: string;
    updated_at?: string;
}

export interface DeployKeyResponse {
    workflow_name: string;
    workflow_id: string;
    deploy_key: string;
    is_deployed: boolean;
    message: string;
}

/**
 * 특정 워크플로우의 배포 상태를 조회합니다.
 * @param {string} workflowName - 워크플로우 이름
 * @returns {Promise<DeployStatus>} 배포 상태 정보
 */
export const getDeployStatus = async (workflowName: string, user_id?: number | string): Promise<DeployStatus> => {
    try {
        devLog.log(`Getting deploy status for workflow: ${workflowName}`);
        devLog.log(`User ID: ${user_id}`);

        const response = user_id 
            ? await fetch(`${API_BASE_URL}/api/workflow/deploy/status/${encodeURIComponent(workflowName)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id })
            })
            : await apiClient(`${API_BASE_URL}/api/workflow/deploy/status/${encodeURIComponent(workflowName)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: "" })
            });

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Deploy status error:', errorData);
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        devLog.log('Deploy status retrieved successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get deploy status:', error);
        throw error;
    }
};

/**
 * 워크플로우의 배포 상태를 활성화/비활성화합니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {boolean} enable - 배포 활성화 여부 (true: 활성화, false: 비활성화)
 * @returns {Promise<DeployToggleResponse>} 업데이트된 배포 상태 정보
 */
export const toggleDeployStatus = async (workflowName: string, enable: boolean): Promise<DeployToggleResponse> => {
    try {
        devLog.log(`Toggling deploy status for workflow: ${workflowName}, enable: ${enable}`);

        const response = await apiClient(`${API_BASE_URL}/api/workflow/deploy/toggle/${encodeURIComponent(workflowName)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ enable }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Deploy toggle error:', errorData);
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        devLog.log('Deploy status toggled successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to toggle deploy status:', error);
        throw error;
    }
};

/**
 * 특정 워크플로우의 배포 키값을 조회합니다.
 * @param {string} workflowName - 워크플로우 이름
 * @returns {Promise<DeployKeyResponse>} 배포 키값 정보
 */
export const getDeployKey = async (workflowName: string): Promise<DeployKeyResponse> => {
    try {
        devLog.log(`Getting deploy key for workflow: ${workflowName}`);

        const response = await apiClient(`${API_BASE_URL}/api/workflow/deploy/key/${encodeURIComponent(workflowName)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Deploy key error:', errorData);
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        devLog.log('Deploy key retrieved successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get deploy key:', error);
        throw error;
    }
};