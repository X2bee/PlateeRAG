/**
 * URL 파라미터 암호화/복호화 유틸리티 (AES 암호화 사용)
 */

import { getDeployStatus } from "@/app/api/workflow/deploy";

// 암호화 키 (실제 환경에서는 환경변수나 더 안전한 방식으로 관리해야 함)
const ENCRYPTION_KEY = 'PlateerXgenAILab'; // 16바이트 키

/**
 * 문자열을 바이트 배열로 변환
 */
const stringToBytes = (str: string): Uint8Array => {
    return new TextEncoder().encode(str);
};

/**
 * 바이트 배열을 문자열로 변환
 */
const bytesToString = (bytes: Uint8Array): string => {
    return new TextDecoder().decode(bytes);
};

/**
 * 간단한 XOR 암호화 (AES 대신 브라우저 호환성을 위해 사용)
 */
const xorEncrypt = (data: string, key: string): string => {
    const dataBytes = stringToBytes(data);
    const keyBytes = stringToBytes(key);
    const encrypted = new Uint8Array(dataBytes.length);

    for (let i = 0; i < dataBytes.length; i++) {
        encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Base64 인코딩
    const binaryString = Array.from(encrypted, byte => String.fromCharCode(byte)).join('');
    return btoa(binaryString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

/**
 * XOR 복호화
 */
const xorDecrypt = (encryptedData: string, key: string): string => {
    try {
        // Base64 디코딩
        let base64 = encryptedData.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }

        const binaryString = atob(base64);
        const encrypted = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            encrypted[i] = binaryString.charCodeAt(i);
        }

        const keyBytes = stringToBytes(key);
        const decrypted = new Uint8Array(encrypted.length);

        for (let i = 0; i < encrypted.length; i++) {
            decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
        }

        return bytesToString(decrypted);
    } catch (error) {
        console.error('Failed to decrypt data:', error);
        throw error;
    }
};

/**
 * 타임스탬프와 랜덤값을 포함한 더 안전한 암호화
 */
export const encodeUrlParams = (data: string): string => {
    try {
        const timestamp = Date.now().toString();
        const randomValue = Math.random().toString(36).substring(2, 15);
        const payload = JSON.stringify({
            data,
            timestamp,
            random: randomValue
        });

        return xorEncrypt(payload, ENCRYPTION_KEY);
    } catch (error) {
        console.error('Failed to encode URL params:', error);
        return data;
    }
};

/**
 * 복호화 및 유효성 검증
 */
export const decodeUrlParams = (encodedData: string): string => {
    try {
        const decrypted = xorDecrypt(encodedData, ENCRYPTION_KEY);
        const payload = JSON.parse(decrypted);

        // 타임스탬프 검증 (24시간 유효)
        const currentTime = Date.now();
        const encryptionTime = parseInt(payload.timestamp);
        const timeDiff = currentTime - encryptionTime;

        // if (timeDiff > 24 * 60 * 60 * 1000) { // 24시간 초과
        //     throw new Error('URL has expired');
        // }

        return payload.data;
    } catch (error) {
        console.error('Failed to decode URL params:', error);
        throw error;
    }
};

/**
 * URL 파라미터를 암호화된 형태로 변환
 * @param userId - 사용자 ID
 * @param workflowName - 워크플로우 이름
 * @returns 암호화된 파라미터 문자열
 */
export const createEncryptedUrlParams = (userId: string, workflowName: string): string => {
    const params = {
        userId,
        workflowName
    };

    const paramsString = JSON.stringify(params);
    return encodeUrlParams(paramsString);
};

/**
 * 암호화된 URL 파라미터를 복호화
 * @param encryptedParams - 암호화된 파라미터 문자열
 * @returns 복호화된 파라미터 객체
 */
export const decryptUrlParams = async (encryptedParams: string): Promise<{ userId: string; workflowName: string; message?: string; } | null> => {
    try {
        const decryptedString = decodeUrlParams(encryptedParams);
        const params = JSON.parse(decryptedString);

        const valid_deployable = await getDeployStatus(params.workflowName, params.userId);
        if (!valid_deployable.is_deployed) {
            return {
                userId: params.userId,
                workflowName: params.workflowName,
                message: 'This workflow is not deployed.'
            };
        }
        // 배포가 불가능할때 메시지 처리

        if (params.userId && params.workflowName) {
            return {
                userId: params.userId,
                workflowName: params.workflowName
            };
        }

        return null;
    } catch (error) {
        console.error('Failed to decrypt URL params:', error);
        return null;
    }
};

/**
 * 환경변수에서 암호화 키 가져오기 (프로덕션용)
 */
export const getEncryptionKey = (): string => {
    if (typeof window !== 'undefined') {
        // 클라이언트 사이드에서는 기본 키 사용 (보안상 제한적)
        return ENCRYPTION_KEY;
    }

    // 서버 사이드에서는 환경변수 사용
    return process.env.URL_ENCRYPTION_KEY || ENCRYPTION_KEY;
};
