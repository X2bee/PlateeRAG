// System 관리 API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/helper/apiClient';

/**
 * 시스템 모니터링 정보를 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<Object>} 시스템 모니터링 정보 (CPU, 메모리, GPU, 네트워크, 디스크, 업타임)
 */
export const getSystemStatus = async () => {
    try {
        const url = `${API_BASE_URL}/api/admin/system/status`;
        const response = await apiClient(url);
        const data = await response.json();
        devLog.log('Get system status result:', data);

        if (!response.ok) {
            devLog.error('Failed to get system status:', data);
            throw new Error(data.detail || 'Failed to get system status');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to get system status:', error);
        throw error;
    }
};

/**
 * CPU 정보만 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<Object>} CPU 정보 (사용률, 코어 수, 주파수 등)
 */
export const getCPUInfo = async () => {
    try {
        const systemData = await getSystemStatus();
        return systemData.cpu;
    } catch (error) {
        devLog.error('Failed to get CPU info:', error);
        throw error;
    }
};

/**
 * 메모리 정보만 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<Object>} 메모리 정보 (총량, 사용량, 사용률 등)
 */
export const getMemoryInfo = async () => {
    try {
        const systemData = await getSystemStatus();
        return systemData.memory;
    } catch (error) {
        devLog.error('Failed to get memory info:', error);
        throw error;
    }
};

/**
 * GPU 정보만 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<Array>} GPU 정보 배열 (이름, 메모리, 사용률, 온도 등)
 */
export const getGPUInfo = async () => {
    try {
        const systemData = await getSystemStatus();
        return systemData.gpu;
    } catch (error) {
        devLog.error('Failed to get GPU info:', error);
        throw error;
    }
};

/**
 * 네트워크 정보만 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<Array>} 네트워크 인터페이스 정보 배열
 */
export const getNetworkInfo = async () => {
    try {
        const systemData = await getSystemStatus();
        return systemData.network;
    } catch (error) {
        devLog.error('Failed to get network info:', error);
        throw error;
    }
};

/**
 * 디스크 정보만 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<Array>} 디스크 정보 배열 (장치, 마운트포인트, 용량 등)
 */
export const getDiskInfo = async () => {
    try {
        const systemData = await getSystemStatus();
        return systemData.disk;
    } catch (error) {
        devLog.error('Failed to get disk info:', error);
        throw error;
    }
};

/**
 * 시스템 업타임 정보만 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<number>} 시스템 부팅 시간 (초 단위)
 */
export const getSystemUptime = async () => {
    try {
        const systemData = await getSystemStatus();
        return systemData.uptime;
    } catch (error) {
        devLog.error('Failed to get system uptime:', error);
        throw error;
    }
};

/**
 * 바이트를 인간이 읽기 쉬운 형태로 변환하는 유틸리티 함수
 * @param {number} bytes - 바이트 수
 * @param {number} decimals - 소수점 자리수 (기본값: 2)
 * @returns {string} 변환된 문자열 (예: "1.23 GB")
 */
export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * 업타임을 인간이 읽기 쉬운 형태로 변환하는 유틸리티 함수
 * @param {number} bootTime - 부팅 시간 (타임스탬프)
 * @returns {string} 업타임 문자열 (예: "2일 3시간 45분")
 */
export const formatUptime = (bootTime) => {
    const now = Date.now() / 1000;
    const uptime = now - bootTime;

    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    let result = '';
    if (days > 0) result += `${days}일 `;
    if (hours > 0) result += `${hours}시간 `;
    result += `${minutes}분`;

    return result;
};

/**
 * CPU 사용률에 따른 상태 분류 함수
 * @param {number} usage - CPU 사용률 (0-100)
 * @returns {string} 상태 ("low", "medium", "high", "critical")
 */
export const getCPUStatus = (usage) => {
    if (usage < 30) return 'low';
    if (usage < 60) return 'medium';
    if (usage < 80) return 'high';
    return 'critical';
};

/**
 * 메모리 사용률에 따른 상태 분류 함수
 * @param {number} usage - 메모리 사용률 (0-100)
 * @returns {string} 상태 ("low", "medium", "high", "critical")
 */
export const getMemoryStatus = (usage) => {
    if (usage < 50) return 'low';
    if (usage < 70) return 'medium';
    if (usage < 85) return 'high';
    return 'critical';
};

/**
 * 디스크 사용률에 따른 상태 분류 함수
 * @param {number} usage - 디스크 사용률 (0-100)
 * @returns {string} 상태 ("low", "medium", "high", "critical")
 */
export const getDiskStatus = (usage) => {
    if (usage < 60) return 'low';
    if (usage < 80) return 'medium';
    if (usage < 90) return 'high';
    return 'critical';
};

/**
 * fetch + ReadableStream을 통해 실시간 시스템 모니터링 정보를 스트리밍하는 함수 (슈퍼유저 권한 필요)
 * @param {Function} onData - 데이터 수신 시 호출될 콜백 함수
 * @param {Function} onError - 에러 발생 시 호출될 콜백 함수
 * @returns {Function} 연결을 종료하는 cleanup 함수
 */
export const streamSystemStatus = async (onData, onError) => {
    let controller = new AbortController();

    try {
        const url = `${API_BASE_URL}/api/admin/system/status/stream`;
        devLog.log('Starting stream connection to:', url);

        const response = await apiClient(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache',
            },
            credentials: 'include',
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error('ReadableStream not supported');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // 스트림 읽기 함수
        const readStream = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        devLog.log('Stream finished');
                        break;
                    }

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const jsonData = line.slice(6); // "data: " 제거
                                if (jsonData.trim() === '') continue;

                                const data = JSON.parse(jsonData);
                                devLog.log('Parsed stream data:', data);

                                if (data.error) {
                                    devLog.error('Stream error data received:', data.error);
                                    if (onError) onError(data.error);
                                } else {
                                    if (onData) onData(data);
                                }
                            } catch (parseError) {
                                devLog.error('Failed to parse stream data:', parseError);
                            }
                        }
                    }
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    devLog.error('Stream reading error:', error);
                    if (onError) onError(`Stream error: ${error.message}`);
                }
            } finally {
                reader.releaseLock();
            }
        };

        // 스트림 읽기 시작
        readStream();

        // cleanup 함수 반환
        return () => {
            devLog.log('Closing stream connection');
            controller.abort();
        };

    } catch (error) {
        devLog.error('Failed to create stream connection:', error);
        if (onError) onError(`Connection failed: ${error.message}`);

        // cleanup 함수 반환 (에러 시에도)
        return () => {
            controller.abort();
        };
    }
};
