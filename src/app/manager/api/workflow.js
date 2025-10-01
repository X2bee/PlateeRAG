// Workflow 관리 API 호출 함수들을 관리하는 파일 (Manager용)
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * 워크플로우 IO 로그를 페이지네이션과 함께 가져오는 통합 함수
 * @param {number} page - 페이지 번호 (기본값: 1)
 * @param {number} pageSize - 페이지 크기 (기본값: 250)
 * @param {number|null} userId - 필터링할 사용자 ID (선택사항)
 * @param {string|null} workflowId - 필터링할 워크플로우 ID (선택사항)
 * @returns {Promise<Object>} IO 로그 목록 및 페이지네이션 정보
 */
export const getAllIOLogs = async (page = 1, pageSize = 250, userId = null, workflowId = null) => {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString()
        });

        if (userId) {
            params.append('user_id', userId.toString());
        }

        if (workflowId) {
            params.append('workflow_id', workflowId);
        }

        const response = await apiClient(
            `${API_BASE_URL}/api/manager/workflow/all-io-logs?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();
        devLog.log('Get all IO logs result:', data);

        if (!response.ok) {
            devLog.error('Failed to get all IO logs:', data);
            throw new Error(data.detail || 'Failed to get all IO logs');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to get all IO logs:', error);
        throw error;
    }
};

/**
 * 특정 조건으로 워크플로우 IO 로그를 가져오는 함수
 * @param {Object} params - 검색 조건
 * @param {number|null} params.user_id - 사용자 ID
 * @param {string|null} params.workflow_name - 워크플로우 이름
 * @param {string|null} params.workflow_id - 워크플로우 ID
 * @returns {Promise<Object>} IO 로그 목록
 */
export const getIOLogsByCondition = async ({ user_id = null, workflow_name = null, workflow_id = null }) => {
    try {
        const params = new URLSearchParams();

        if (user_id) {
            params.append('user_id', user_id.toString());
        }
        if (workflow_name) {
            params.append('workflow_name', workflow_name);
        }
        if (workflow_id) {
            params.append('workflow_id', workflow_id);
        }

        const response = await apiClient(
            `${API_BASE_URL}/api/manager/workflow/manager-io-logs?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();
        devLog.log('Get IO logs by condition result:', data);

        if (!response.ok) {
            devLog.error('Failed to get IO logs by condition:', data);
            throw new Error(data.detail || 'Failed to get IO logs by condition');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to get IO logs by condition:', error);
        throw error;
    }
};

/**
 * 매니저가 접근 가능한 모든 워크플로우 목록을 가져오는 함수
 * @param {number} page - 페이지 번호 (기본값: 1)
 * @param {number} pageSize - 페이지 크기 (기본값: 250)
 * @param {number|null} userId - 필터링할 사용자 ID (선택사항)
 * @returns {Promise<Object>} 워크플로우 목록 및 페이지네이션 정보
 */
export const getAllWorkflows = async (page = 1, pageSize = 250, userId = null) => {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString()
        });

        if (userId) {
            params.append('user_id', userId.toString());
        }

        const response = await apiClient(
            `${API_BASE_URL}/api/manager/workflow/all-list?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();
        devLog.log('Get all workflows result:', data);

        if (!response.ok) {
            devLog.error('Failed to get all workflows:', data);
            throw new Error(data.detail || 'Failed to get all workflows');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to get all workflows:', error);
        throw error;
    }
};

/**
 * 매니저용 워크플로우 업데이트 함수
 * @param {string} workflowName - 업데이트할 워크플로우 이름
 * @param {Object} updateDict - 업데이트할 설정 딕셔너리
 * @param {boolean|null} updateDict.is_shared - 공유 여부
 * @param {string|null} updateDict.share_group - 공유 그룹
 * @param {boolean} updateDict.enable_deploy - 배포 활성화 여부
 * @param {number} updateDict.user_id - 워크플로우 소유자 ID
 * @param {boolean|null} updateDict.inquire_deploy - 배포 요청 상태
 * @param {boolean|null} updateDict.is_accepted - 워크플로우 사용 승인 상태
 * @returns {Promise<Object>} 업데이트 결과 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const updateWorkflow = async (workflowName, updateDict) => {
    try {
        devLog.log('Updating workflow with name:', workflowName);
        devLog.log('Update data:', updateDict);

        const response = await apiClient(
            `${API_BASE_URL}/api/manager/workflow/update/${encodeURIComponent(workflowName)}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateDict),
            }
        );

        devLog.log('Workflow update response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Workflow update error data:', errorData);
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Successfully updated workflow:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to update workflow:', error);
        devLog.error('Workflow name that failed:', workflowName);
        throw error;
    }
};

/**
 * 매니저용 워크플로우 삭제 함수
 * @param {string|number} userId - 사용자 ID
 * @param {string} workflowName - 삭제할 워크플로우 이름
 * @returns {Promise<Object>} 삭제 결과 객체
 */
export const deleteWorkflow = async (userId, workflowName) => {
    try {
        const url = `${API_BASE_URL}/api/manager/workflow/delete/${encodeURIComponent(workflowName)}?user_id=${userId}`;

        const response = await apiClient(url, {
            method: 'DELETE',
        });
        const data = await response.json();

        if (!response.ok) {
            devLog.error('Failed to delete workflow:', data);
            throw new Error(data.detail || 'Failed to delete workflow');
        }

        devLog.log('Delete workflow result:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to delete workflow:', error);
        throw error;
    }
};

/**
 * 매니저용 워크플로우 배포 승인 함수
 * @param {string} workflowName - 승인할 워크플로우 이름
 * @param {Object} workflow - 워크플로우 객체
 * @returns {Promise<Object>} 승인 결과 객체
 */
export const approveWorkflowDeploy = async (workflowName, workflow) => {
    try {
        const updateDict = {
            enable_deploy: true,
            inquire_deploy: false,
            is_accepted: Boolean(workflow.is_accepted),
            is_shared: Boolean(workflow.is_shared),
            share_group: workflow.share_group || null,
            user_id: workflow.user_id
        };

        devLog.log('Approving workflow deployment:', workflowName);
        devLog.log('Update data:', updateDict);

        const response = await apiClient(
            `${API_BASE_URL}/api/manager/workflow/update/${encodeURIComponent(workflowName)}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateDict),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Workflow deployment approval error:', errorData);
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Successfully approved workflow deployment:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to approve workflow deployment:', error);
        throw error;
    }
};

/**
 * 매니저용 워크플로우 배포 거부 함수
 * @param {string} workflowName - 거부할 워크플로우 이름
 * @param {Object} workflow - 워크플로우 객체
 * @returns {Promise<Object>} 거부 결과 객체
 */
export const rejectWorkflowDeploy = async (workflowName, workflow) => {
    try {
        const updateDict = {
            enable_deploy: false,
            inquire_deploy: false,
            is_accepted: Boolean(workflow.is_accepted),
            is_shared: Boolean(workflow.is_shared),
            share_group: workflow.share_group || null,
            user_id: workflow.user_id
        };

        devLog.log('Rejecting workflow deployment:', workflowName);
        devLog.log('Update data:', updateDict);

        const response = await apiClient(
            `${API_BASE_URL}/api/manager/workflow/update/${encodeURIComponent(workflowName)}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateDict),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Workflow deployment rejection error:', errorData);
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Successfully rejected workflow deployment:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to reject workflow deployment:', error);
        throw error;
    }
};
