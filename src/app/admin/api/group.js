// Group 관리 API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/helper/apiClient';

/**
 * 모든 그룹 목록을 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<Array>} 그룹 목록 배열
 */
export const getAllGroups = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/group/all-groups`);
        const data = await response.json();
        devLog.log('Get all groups result:', data);

        if (!response.ok) {
            devLog.error('Failed to get all groups:', data);
            throw new Error(data.detail || 'Failed to get all groups');
        }

        return data.groups;
    } catch (error) {
        devLog.error('Failed to get all groups:', error);
        throw error;
    }
};

/**
 * 모든 그룹명 목록을 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<Array>} 그룹명 목록 배열
 */
export const getAllGroupsList = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/group/all-groups/list`);
        const data = await response.json();
        devLog.log('Get all groups list result:', data);

        if (!response.ok) {
            devLog.error('Failed to get all groups list:', data);
            throw new Error(data.detail || 'Failed to get all groups list');
        }

        return data.groups;
    } catch (error) {
        devLog.error('Failed to get all groups list:', error);
        throw error;
    }
};

/**
 * 새로운 그룹을 생성하는 함수 (슈퍼유저 권한 필요)
 * @param {Object} groupData - 생성할 그룹 정보
 * @param {string} groupData.group_name - 그룹명
 * @param {boolean} [groupData.available] - 사용 가능 여부 (기본값: true)
 * @param {Array} [groupData.available_sections] - 사용 가능한 섹션 목록 (기본값: [])
 * @returns {Promise<Object>} 생성 결과
 */
export const createGroup = async (groupData) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/group/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(groupData)
        });

        const data = await response.json();
        devLog.log('Create group result:', data);

        if (!response.ok) {
            devLog.error('Failed to create group:', data);
            throw new Error(data.detail || 'Failed to create group');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to create group:', error);
        throw error;
    }
};

/**
 * 특정 그룹에 속한 사용자 목록을 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {string} groupName - 그룹명
 * @returns {Promise<Array>} 해당 그룹 사용자 목록 배열
 */
export const getGroupUsers = async (groupName) => {
    try {
        const url = `${API_BASE_URL}/api/admin/group/group-users?group_name=${encodeURIComponent(groupName)}`;
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
 * 그룹 권한을 업데이트하는 함수 (슈퍼유저 권한 필요)
 * @param {Object} updateData - 업데이트할 그룹 정보
 * @param {string} updateData.group_name - 그룹명
 * @param {boolean} updateData.available - 사용 가능 여부
 * @param {Array} updateData.available_sections - 사용 가능한 섹션 목록
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateGroupPermissions = async (updateData) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/group/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        const data = await response.json();
        devLog.log('Update group permissions result:', data);

        if (!response.ok) {
            devLog.error('Failed to update group permissions:', data);
            throw new Error(data.detail || 'Failed to update group permissions');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to update group permissions:', error);
        throw error;
    }
};



/**
 * 그룹을 삭제하는 함수 (슈퍼유저 권한 필요)
 * @param {string} groupName - 삭제할 그룹명
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteGroup = async (groupName) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/group/group?group_name=${encodeURIComponent(groupName)}`, {
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
