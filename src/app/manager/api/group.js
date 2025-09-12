// Group 관리 API 호출 함수들을 관리하는 파일 (Manager용 - 제한된 기능)
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/helper/apiClient';

/**
 * 매니저가 접근 가능한 그룹 목록을 가져오는 함수 (자신이 속한 그룹만)
 * @returns {Promise<Array>} 그룹 목록 배열
 */
export const getAllGroups = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/manager/group/all-groups`);
        const data = await response.json();
        devLog.log('Get manager groups result:', data);

        if (!response.ok) {
            devLog.error('Failed to get manager groups:', data);
            throw new Error(data.detail || 'Failed to get manager groups');
        }

        return data.groups;
    } catch (error) {
        devLog.error('Failed to get manager groups:', error);
        throw error;
    }
};

/**
 * 특정 그룹에 속한 사용자 목록을 가져오는 함수
 * @param {string} groupName - 그룹명
 * @returns {Promise<Array>} 해당 그룹 사용자 목록 배열
 */
export const getGroupUsers = async (groupName) => {
    try {
        const url = `${API_BASE_URL}/api/manager/group/group-users?group_name=${encodeURIComponent(groupName)}`;
        const response = await apiClient(url);
        const data = await response.json();
        devLog.log('Get group users result:', data);

        if (!response.ok) {
            devLog.error('Failed to get group users:', data);
            throw new Error(data.detail || 'Failed to get group users');
        }

        return data.users;
    } catch (error) {
        devLog.error('Failed to get group users:', error);
        throw error;
    }
};

/**
 * 그룹을 삭제하는 함수 (매니저가 속한 그룹만)
 * @param {string} groupName - 삭제할 그룹명
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteGroup = async (groupName) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/manager/group/group?group_name=${encodeURIComponent(groupName)}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        devLog.log('Delete group result:', data);

        if (!response.ok) {
            devLog.error('Failed to delete group:', data);
            throw new Error(data.detail || 'Failed to delete group');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to delete group:', error);
        throw error;
    }
};
