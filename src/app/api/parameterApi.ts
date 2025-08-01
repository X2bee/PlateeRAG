import { apiClient } from '@/app/api/apiClient';
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import type { ParameterOption } from '@/app/canvas/types';

/**
 * API를 호출하여 동적 옵션을 가져옵니다.
 * @param nodeId - 노드 ID (예: "llm/openai")
 * @param apiName - API 이름 (예: "api_models")
 * @returns Promise<ParameterOption[]> - 옵션 배열
 */
export const fetchParameterOptions = async (
    nodeId: string,
    apiName: string
): Promise<ParameterOption[]> => {
    try {
        devLog.log('=== Fetching Parameter Options ===');

        // node_id에서 "/"를 "_"로 변경하고 대문자를 소문자로 변경
        const formattedNodeId = nodeId.replace(/\//g, '_').toLowerCase();

        // api_name에서 "api_" 접두사 제거
        const formattedApiName = apiName.startsWith('api_')
            ? apiName.substring(4)
            : apiName;

        const endpoint = `${API_BASE_URL}/api/editor/${formattedNodeId}/${formattedApiName}`;

        devLog.log('Calling API:', {
            originalNodeId: nodeId,
            formattedNodeId,
            originalApiName: apiName,
            formattedApiName,
            endpoint
        });

        const response = await apiClient(endpoint, {
            method: 'POST',
            body: JSON.stringify({ parameters: {} })
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.log('API response:', data);

        // API 응답에서 result 배열 추출
        const resultArray = data.result || data;

        // 응답 데이터가 배열이 아닌 경우 처리
        if (!Array.isArray(resultArray)) {
            devLog.warn('API response result is not an array:', resultArray);
            return [];
        }

        // 응답 데이터를 ParameterOption 형태로 변환
        const options: ParameterOption[] = resultArray.map((item: any) => {
            if (typeof item === 'string' || typeof item === 'number') {
                return { value: item, label: String(item) };
            }

            if (typeof item === 'object' && item !== null) {
                const value = item.value ?? item.id ?? item.name ?? item;
                const label = item.label ?? item.name ?? item.displayName ?? String(value);
                return { value, label };
            }

            return { value: String(item), label: String(item) };
        });

        devLog.log('Converted options:', options);
        devLog.log('=== Parameter Options Fetch Complete ===');

        return options;

    } catch (error) {
        devLog.error('Error fetching parameter options:', error);

        // 에러 발생 시 빈 배열 반환
        return [];
    }
};

/**
 * POST 요청으로 API를 호출하여 동적 옵션을 가져옵니다.
 * @param nodeId - 노드 ID
 * @param apiName - API 이름
 * @param requestData - POST 요청에 보낼 데이터
 * @returns Promise<ParameterOption[]> - 옵션 배열
 */
export const fetchParameterOptionsWithData = async (
    nodeId: string,
    apiName: string,
    requestData: any = {}
): Promise<ParameterOption[]> => {
    try {
        devLog.log('=== Fetching Parameter Options (POST) ===');

        const formattedNodeId = nodeId.replace(/\//g, '_').toLowerCase();
        const formattedApiName = apiName.startsWith('api_')
            ? apiName.substring(4)
            : apiName;

        const endpoint = `${API_BASE_URL}/api/editor/${formattedNodeId}/${formattedApiName}`;

        devLog.log('Calling API (POST):', {
            originalNodeId: nodeId,
            formattedNodeId,
            originalApiName: apiName,
            formattedApiName,
            endpoint,
            requestData
        });

        const response = await apiClient(endpoint, {
            method: 'POST',
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.log('API response (POST):', data);

        // API 응답에서 result 배열 추출
        const resultArray = data.result || data;

        if (!Array.isArray(resultArray)) {
            devLog.warn('API response result is not an array:', resultArray);
            return [];
        }

        const options: ParameterOption[] = resultArray.map((item: any) => {
            if (typeof item === 'string' || typeof item === 'number') {
                return { value: item, label: String(item) };
            }

            if (typeof item === 'object' && item !== null) {
                const value = item.value ?? item.id ?? item.name ?? item;
                const label = item.label ?? item.name ?? item.displayName ?? String(value);
                return { value, label };
            }

            return { value: String(item), label: String(item) };
        });

        devLog.log('Converted options (POST):', options);
        devLog.log('=== Parameter Options Fetch Complete (POST) ===');

        return options;

    } catch (error) {
        devLog.error('Error fetching parameter options (POST):', error);
        return [];
    }
};
