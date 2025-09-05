// TTS API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/api/helper/apiClient';

/**
 * 텍스트를 음성으로 변환하는 함수
 * @param {Object} ttsRequest - TTS 요청 데이터
 * @param {string} ttsRequest.text - 변환할 텍스트
 * @param {string} ttsRequest.speaker - 화자 (선택사항)
 * @param {string} ttsRequest.output_format - 출력 형식 (기본값: "wav")
 * @param {number} ttsRequest.happiness - 기쁨 감정 값 (기본값: 0.3077)
 * @param {number} ttsRequest.sadness - 슬픔 감정 값 (기본값: 0.0256)
 * @param {number} ttsRequest.disgust - 혐오 감정 값 (기본값: 0.0256)
 * @param {number} ttsRequest.fear - 두려움 감정 값 (기본값: 0.0256)
 * @param {number} ttsRequest.surprise - 놀람 감정 값 (기본값: 0.0256)
 * @param {number} ttsRequest.anger - 분노 감정 값 (기본값: 0.0256)
 * @param {number} ttsRequest.other - 기타 감정 값 (기본값: 0.2564)
 * @param {number} ttsRequest.neutral - 중립 감정 값 (기본값: 0.3077)
 * @returns {Promise<Blob>} 생성된 오디오 데이터
 */
export const generateSpeech = async (ttsRequest) => {
    try {
        // 기본값 설정
        const requestData = {
            text: ttsRequest.text,
            speaker: ttsRequest.speaker || null,
            output_format: ttsRequest.output_format || "wav",
            happiness: ttsRequest.happiness ?? 0.3077,
            sadness: ttsRequest.sadness ?? 0.0256,
            disgust: ttsRequest.disgust ?? 0.0256,
            fear: ttsRequest.fear ?? 0.0256,
            surprise: ttsRequest.surprise ?? 0.0256,
            anger: ttsRequest.anger ?? 0.0256,
            other: ttsRequest.other ?? 0.2564,
            neutral: ttsRequest.neutral ?? 0.3077
        };

        devLog.log('TTS request data:', requestData);

        const response = await apiClient(`${API_BASE_URL}/api/tts/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            devLog.error('TTS generation error:', errorData);
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const audioBlob = await response.blob();
        devLog.info('TTS generation completed, audio size:', audioBlob.size);
        return audioBlob;
    } catch (error) {
        devLog.error('Failed to generate speech:', error);
        throw error;
    }
};

/**
 * TTS 서비스 정보를 가져오는 함수
 * @returns {Promise<Object>} TTS 서비스 정보
 */
export const getTTSInfo = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/tts/info`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            devLog.error('TTS info error:', errorData);
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('TTS info fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch TTS info:', error);
        throw error;
    }
};

/**
 * 사용 가능한 TTS 제공자 목록을 가져오는 함수
 * @returns {Promise<Object>} TTS 제공자 목록
 */
export const getAvailableTTSProviders = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/tts/providers`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            devLog.error('TTS providers error:', errorData);
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('TTS providers fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch TTS providers:', error);
        throw error;
    }
};

/**
 * 오디오 파일을 다운로드하는 유틸리티 함수
 * @param {Blob} audioBlob - 오디오 데이터
 * @param {string} filename - 파일명 (기본값: "generated_speech.wav")
 */
export const downloadAudioFile = (audioBlob, filename = "generated_speech.wav") => {
    try {
        const url = URL.createObjectURL(audioBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        devLog.info('Audio file downloaded:', filename);
    } catch (error) {
        devLog.error('Failed to download audio file:', error);
        throw error;
    }
};

/**
 * 오디오를 재생하는 유틸리티 함수
 * @param {Blob} audioBlob - 오디오 데이터
 * @returns {Promise<void>} 재생 완료 Promise
 */
export const playAudioBlob = (audioBlob) => {
    return new Promise((resolve, reject) => {
        try {
            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);

            audio.onended = () => {
                URL.revokeObjectURL(url);
                devLog.info('Audio playback completed');
                resolve();
            };

            audio.onerror = (error) => {
                URL.revokeObjectURL(url);
                devLog.error('Audio playback failed:', error);
                reject(error);
            };

            audio.play().catch(reject);
        } catch (error) {
            devLog.error('Failed to create audio player:', error);
            reject(error);
        }
    });
};
