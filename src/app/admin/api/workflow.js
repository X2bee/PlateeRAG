// Workflow 관리 API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * 모든 IO 로그를 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {number} page - 페이지 번호 (1부터 시작)
 * @param {number} pageSize - 페이지당 항목 수 (기본값: 250)
 * @param {number|null} userId - 특정 사용자 ID (선택사항, null이면 전체 조회)
 * @param {string|null} workflowId - 필터링할 워크플로우 ID (선택사항)
 * @param {string|null} workflowName - 필터링할 워크플로우 이름 (선택사항)
 * @returns {Promise<Object>} IO 로그 목록과 페이지네이션 정보가 포함된 객체
 */
export const getAllIOLogs = async (page = 1, pageSize = 250, userId = null, workflowId = null, workflowName = null) => {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString()
        });

        if (userId !== null && userId !== undefined) {
            params.append('user_id', userId.toString());
        }

        if (workflowId) {
            params.append('workflow_id', workflowId);
        }

        if (workflowName) {
            params.append('workflow_name', workflowName);
        }

        const response = await apiClient(`${API_BASE_URL}/api/admin/workflow/all-io-logs?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
            devLog.error('Failed to get all IO logs:', data);
            throw new Error(data.detail || 'Failed to get all IO logs');
        }

        devLog.log('Get all IO logs result:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to get all IO logs:', error);
        throw error;
    }
};

/**
 * 모든 워크플로우 정보를 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {number} page - 페이지 번호 (1부터 시작)
 * @param {number} pageSize - 페이지당 항목 수 (기본값: 250)
 * @param {number|null} userId - 특정 사용자 ID (선택사항, null이면 전체 조회)
 * @returns {Promise<Object>} 워크플로우 목록과 페이지네이션 정보가 포함된 객체
 */
export const getAllWorkflowMeta = async (page = 1, pageSize = 250, userId = null) => {
    try {
        let url = `${API_BASE_URL}/api/admin/workflow/all-list?page=${page}&page_size=${pageSize}`;

        if (userId !== null && userId !== undefined) {
            url += `&user_id=${userId}`;
        }

        const response = await apiClient(url);
        const data = await response.json();

        if (!response.ok) {
            devLog.error('Failed to get all workflow meta:', data);
            throw new Error(data.detail || 'Failed to get all workflow meta');
        }

        devLog.log('Get all workflow meta result:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to get all workflow meta:', error);
        throw error;
    }
};

/**
 * 관리자용 ExecutionIO 로그를 조건별로 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {number|null} userId - 사용자 ID (선택사항)
 * @param {string|null} workflowName - 워크플로우 이름 (선택사항)
 * @param {string|null} workflowId - 워크플로우 ID (선택사항)
 * @returns {Promise<Object>} IO 로그 목록이 포함된 객체
 */
export const getIOLogsAdmin = async (userId = null, workflowName = null, workflowId = null) => {
    try {
        let url = `${API_BASE_URL}/api/admin/workflow/admin-io-logs`;
        const queryParams = [];

        if (userId !== null && userId !== undefined) {
            queryParams.push(`user_id=${userId}`);
        }
        if (workflowName !== null && workflowName !== undefined) {
            queryParams.push(`workflow_name=${encodeURIComponent(workflowName)}`);
        }
        if (workflowId !== null && workflowId !== undefined) {
            queryParams.push(`workflow_id=${encodeURIComponent(workflowId)}`);
        }

        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        }

        const response = await apiClient(url);
        const data = await response.json();

        if (!response.ok) {
            devLog.error('Failed to get IO logs by condition:', data);
            throw new Error(data.detail || 'Failed to get IO logs by condition');
        }

        devLog.log('Get IO logs by condition result:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to get IO logs by condition:', error);
        throw error;
    }
};

/**
 * 관리자용 워크플로우 삭제 함수 (슈퍼유저 권한 필요)
 * @param {string|number} userId - 사용자 ID
 * @param {string} workflowName - 삭제할 워크플로우 이름
 * @returns {Promise<Object>} 삭제 결과 객체
 */
export const deleteWorkflowAdmin = async (userId, workflowName) => {
    try {
        const url = `${API_BASE_URL}/api/admin/workflow/delete/${encodeURIComponent(workflowName)}?user_id=${userId}`;

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
 * 사용자별 토큰 사용량 통계를 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {number} page - 페이지 번호 (1부터 시작)
 * @param {number} pageSize - 페이지당 항목 수 (기본값: 50)
 * @param {string|null} startDate - 시작 날짜 (YYYY-MM-DD 형식, 선택사항)
 * @param {string|null} endDate - 종료 날짜 (YYYY-MM-DD 형식, 선택사항)
 * @returns {Promise<Object>} 사용자별 토큰 사용량 통계와 페이지네이션 정보가 포함된 객체
 */
export const getUserTokenUsage = async (page = 1, pageSize = 50, startDate = null, endDate = null) => {
    try {
        let url = `${API_BASE_URL}/api/admin/user-token/usage?page=${page}&page_size=${pageSize}`;

        if (startDate) {
            url += `&start_date=${startDate}`;
        }
        if (endDate) {
            url += `&end_date=${endDate}`;
        }

        const response = await apiClient(url);
        const data = await response.json();

        if (!response.ok) {
            devLog.error('Failed to get user token usage:', data);
            throw new Error(data.detail || 'Failed to get user token usage');
        }

        devLog.log('Get user token usage result:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to get user token usage:', error);
        throw error;
    }
};


/**
 * 토큰 사용량 요약 통계를 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {string|null} startDate - 시작 날짜 (YYYY-MM-DD 형식, 선택사항)
 * @param {string|null} endDate - 종료 날짜 (YYYY-MM-DD 형식, 선택사항)
 * @returns {Promise<Object>} 전체 토큰 사용량 요약 통계
 */
export const getTokenUsageSummary = async (startDate = null, endDate = null) => {
    try {
        let url = `${API_BASE_URL}/api/admin/user-token/summary`;
        const params = [];

        if (startDate) {
            params.push(`start_date=${startDate}`);
        }
        if (endDate) {
            params.push(`end_date=${endDate}`);
        }

        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }

        const response = await apiClient(url);
        const data = await response.json();

        if (!response.ok) {
            devLog.error('Failed to get token usage summary:', data);
            throw new Error(data.detail || 'Failed to get token usage summary');
        }

        devLog.log('Get token usage summary result:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to get token usage summary:', error);
        throw error;
    }
};

/**
 * 백엔드에서 특정 워크플로우의 공유 설정을 업데이트합니다.
 * @param {string} workflowName - 업데이트할 워크플로우 이름
 * @param {Object} updateDict - 업데이트할 설정 딕셔너리
 * @param {boolean|null} updateDict.is_shared - 공유 여부
 * @param {string|null} updateDict.share_group - 공유 그룹
 * @param {boolean} updateDict.enable_deploy - 배포 활성화 여부
 * @param {int} updateDict.user_id - 워크플로우 소유자 ID
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
            `${API_BASE_URL}/api/admin/workflow/update/${encodeURIComponent(workflowName)}`,
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
 * 워크플로우 테스터 IO 로그를 interaction_batch_id별로 그룹화하여 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {number|null} userId - 사용자 ID (선택사항)
 * @param {string|null} workflowName - 워크플로우 이름 (선택사항)
 * @returns {Promise<Object>} 테스터 IO 로그 목록이 포함된 객체
 */
export const getWorkflowIOLogsForTester = async (userId = null, workflowName = null) => {
    try {
        let url = `${API_BASE_URL}/api/admin/workflow/all-io-logs/tester`;
        const queryParams = [];

        if (userId !== null && userId !== undefined) {
            queryParams.push(`user_id=${userId}`);
        }
        if (workflowName !== null && workflowName !== undefined) {
            queryParams.push(`workflow_name=${encodeURIComponent(workflowName)}`);
        }

        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        }

        const response = await apiClient(url);
        const data = await response.json();

        if (!response.ok) {
            devLog.error('Failed to get workflow tester IO logs:', data);
            throw new Error(data.detail || 'Failed to get workflow tester IO logs');
        }

        devLog.log('Get workflow tester IO logs result:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to get workflow tester IO logs:', error);
        throw error;
    }
};

/**
 * 특정 워크플로우의 성능 통계를 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {number} userId - 워크플로우 소유자의 사용자 ID
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} workflowId - 워크플로우 ID
 * @returns {Promise<Object>} 성능 통계 데이터가 포함된 객체
 */
export const getWorkflowPerformanceAdmin = async (userId, workflowName, workflowId) => {
    try {
        const params = new URLSearchParams({
            user_id: userId.toString(),
            workflow_name: workflowName,
            workflow_id: workflowId
        });

        const response = await apiClient(`${API_BASE_URL}/api/admin/workflow/performance?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
            devLog.error('Failed to get workflow performance:', data);
            throw new Error(data.detail || 'Failed to get workflow performance');
        }

        devLog.log('Get workflow performance result:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to get workflow performance:', error);
        throw error;
    }
};

/**
 * 특정 워크플로우의 성능 데이터를 삭제하는 함수 (슈퍼유저 권한 필요)
 * @param {number} userId - 워크플로우 소유자의 사용자 ID
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} workflowId - 워크플로우 ID
 * @returns {Promise<Object>} 삭제 결과가 포함된 객체
 */
export const deleteWorkflowPerformanceAdmin = async (userId, workflowName, workflowId) => {
    try {
        const params = new URLSearchParams({
            user_id: userId.toString(),
            workflow_name: workflowName,
            workflow_id: workflowId
        });

        const response = await apiClient(`${API_BASE_URL}/api/admin/workflow/performance?${params.toString()}`, {
            method: 'DELETE',
        });
        const data = await response.json();

        if (!response.ok) {
            devLog.error('Failed to delete workflow performance:', data);
            throw new Error(data.detail || 'Failed to delete workflow performance');
        }

        devLog.log('Delete workflow performance result:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to delete workflow performance:', error);
        throw error;
    }
};
