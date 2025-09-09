// STT API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient, apiClientV2 } from '@/app/api/helper/apiClient';

/**
 * 오디오 파일을 텍스트로 변환하는 함수
 * @param {File} audioFile - 업로드할 오디오 파일
 * @param {string} audioFormat - 오디오 형식 (선택사항)
 * @returns {Promise<Object>} 변환된 텍스트 정보
 */
export const transcribeAudio = async (audioFile, audioFormat = null) => {
    try {
        const formData = new FormData();
        formData.append('audio_file', audioFile);

        if (audioFormat) {
            formData.append('audio_format', audioFormat);
        }

        const response = await apiClientV2(`${API_BASE_URL}/api/stt/transcribe`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Audio transcription completed:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to transcribe audio:', error);
        throw error;
    }
};

/**
 * STT 서비스 상태 정보를 가져오는 함수
 * @returns {Promise<Object>} STT 서비스 상태 정보
 */
export const getSTTStatus = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/stt/status`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('STT status fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch STT status:', error);
        throw error;
    }
};

/**
 * STT 새로고침하는 함수
 * @returns {Promise<Object>} 새로고침 결과
 */
export const refreshSTT = async () => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/stt/refresh`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('STT Factory refreshed:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to refresh STT Factory:', error);
        throw error;
    }
};

/**
 * STT 서비스의 간단한 상태 정보를 가져오는 함수
 * @returns {Promise<Object>} STT 서비스의 간단한 상태 정보
 */
export const getSTTSimpleStatus = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/stt/simple-status`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('STT simple status fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch STT simple status:', error);
        throw error;
    }
};
