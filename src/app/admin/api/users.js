// User 관리 API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/_common/api/helper/apiClient';
import { generateSha256Hash } from '@/app/_common/utils/generateSha1Hash';
import { setCookieAuth } from '@/app/_common/utils/cookieUtils';

/**
 * 모든 사용자 목록을 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {number} page - 페이지 번호 (1부터 시작)
 * @param {number} pageSize - 페이지당 항목 수 (기본값: 100)
 * @returns {Promise<Object>} 사용자 목록과 페이지네이션 정보가 포함된 객체
 */
export const getAllUsers = async (page = 1, pageSize = 100) => {
    try {
        const url = `${API_BASE_URL}/api/admin/user/all-users?page=${page}&page_size=${pageSize}`;
        const response = await apiClient(url);
        const data = await response.json();
        devLog.log('Get all users result:', data);

        if (!response.ok) {
            devLog.error('Failed to get all users:', data);
            throw new Error(data.detail || 'Failed to get all users');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to get all users:', error);
        throw error;
    }
};

/**
 * 대기 중인 사용자 목록을 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<Array>} 대기 중인 사용자 목록 배열
 */
export const getStandbyUsers = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/user/standby-users`);
        const data = await response.json();
        devLog.log('Get standby users result:', data);

        if (!response.ok) {
            devLog.error('Failed to get standby users:', data);
            throw new Error(data.detail || 'Failed to get standby users');
        }

        return data.users;
    } catch (error) {
        devLog.error('Failed to get standby users:', error);
        throw error;
    }
};

/**
 * 대기 중인 사용자를 승인하는 함수 (슈퍼유저 권한 필요)
 * @param {Object} userData - 승인할 사용자 정보
 * @param {number} userData.id - 사용자 ID
 * @param {string} userData.username - 사용자명
 * @param {string} userData.email - 사용자 이메일
 * @returns {Promise<Object>} 승인 결과
 */
export const approveUser = async (userData) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/user/approve-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        devLog.log('Approve user result:', data);

        if (!response.ok) {
            devLog.error('Failed to approve user:', data);
            throw new Error(data.detail || 'Failed to approve user');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to approve user:', error);
        throw error;
    }
};

/**
 * 슈퍼유저 로그인 API
 * @param {Object} loginData - 로그인 데이터
 * @param {string} loginData.email - 이메일
 * @param {string} loginData.password - 비밀번호
 * @returns {Promise<Object>} 로그인 결과 (토큰 포함)
 */
export const superuserLogin = async (loginData) => {
    try {
        const hashedLoginData = {
            ...loginData,
            password: generateSha256Hash(loginData.password)
        };

        const response = await fetch(`${API_BASE_URL}/api/admin/user/superuser-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(hashedLoginData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        if (result.access_token) {
            setCookieAuth('access_token', result.access_token);
        }
        if (result.refresh_token) {
            setCookieAuth('refresh_token', result.refresh_token);
        }
        if (result.user_id) {
            setCookieAuth('user_id', result.user_id.toString());
        }
        if (result.username) {
            setCookieAuth('username', result.username);
        }

        devLog.log('Superuser login successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to superuser login:', error);
        throw error;
    }
};

/**
 * 사용자와 관련된 모든 데이터를 삭제하는 함수 (슈퍼유저 권한 필요)
 * @param {Object} userData - 삭제할 사용자 정보
 * @param {number} userData.id - 사용자 ID
 * @param {string} userData.username - 사용자명
 * @param {string} userData.email - 사용자 이메일
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteUser = async (userData) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/user/user-account`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        devLog.log('Delete user result:', data);

        if (!response.ok) {
            devLog.error('Failed to delete user:', data);
            throw new Error(data.detail || 'Failed to delete user');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to delete user:', error);
        throw error;
    }
};

/**
 * 사용자 정보를 수정하는 함수 (슈퍼유저 권한 필요)
 * @param {Object} userData - 수정할 사용자 정보
 * @param {number} userData.id - 사용자 ID
 * @param {string} [userData.email] - 이메일
 * @param {string} [userData.username] - 사용자명
 * @param {string|null} [userData.full_name] - 이름
 * @param {boolean} [userData.is_admin] - 관리자 권한
 * @param {string} [userData.user_type] - 사용자 유형 (standard/admin/superuser)
 * @param {Object|null} [userData.preferences] - 환경설정
 * @param {string} [userData.password_hash] - 새 비밀번호 (평문, 서버에서 해시 처리)
 * @returns {Promise<Object>} 수정 결과
 */
export const editUser = async (userData) => {
    try {
        if (userData.password_hash) {
            userData.password_hash = generateSha256Hash(userData.password_hash);
        }

        const response = await apiClient(`${API_BASE_URL}/api/admin/user/edit-user`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        devLog.log('Edit user result:', data);

        if (!response.ok) {
            devLog.error('Failed to edit user:', data);
            throw new Error(data.detail || 'Failed to edit user');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to edit user:', error);
        throw error;
    }
};

/**
 * 사용자에게 그룹을 추가하는 함수 (슈퍼유저 권한 필요)
 * @param {Object} userData - 그룹을 추가할 사용자 정보
 * @param {number} userData.id - 사용자 ID
 * @param {string} userData.group_name - 추가할 그룹명
 * @returns {Promise<Object>} 그룹 추가 결과
 */
export const addUserGroup = async (userData) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/user/edit-user/groups`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        devLog.log('Add user group result:', data);

        if (!response.ok) {
            devLog.error('Failed to add user group:', data);
            throw new Error(data.detail || 'Failed to add user group');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to add user group:', error);
        throw error;
    }
};

/**
 * 사용자에게서 그룹을 제거하는 함수 (슈퍼유저 권한 필요)
 * @param {Object} userData - 그룹을 제거할 사용자 정보
 * @param {number} userData.id - 사용자 ID
 * @param {string} userData.group_name - 제거할 그룹명
 * @returns {Promise<Object>} 그룹 제거 결과
 */
export const removeUserGroup = async (userData) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/user/edit-user/groups`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        devLog.log('Remove user group result:', data);

        if (!response.ok) {
            devLog.error('Failed to remove user group:', data);
            throw new Error(data.detail || 'Failed to remove user group');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to remove user group:', error);
        throw error;
    }
};

/**
 * 사용자의 사용 가능한 관리자 섹션을 수정하는 함수 (슈퍼유저 권한 필요)
 * @param {Object} userData - 수정할 사용자 정보
 * @param {number} userData.id - 사용자 ID
 * @param {Array<string>} userData.available_admin_sections - 사용 가능한 관리자 섹션 목록
 * @returns {Promise<Object>} 수정 결과
 */
export const updateUserAvailableAdminSections = async (userData) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/user/update-user/available-admin-sections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        devLog.log('Update user available admin sections result:', data);

        if (!response.ok) {
            devLog.error('Failed to update user available admin sections:', data);
            throw new Error(data.detail || 'Failed to update user available admin sections');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to update user available admin sections:', error);
        throw error;
    }
};
