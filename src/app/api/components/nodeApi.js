const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * @returns {Promise<Array<Object>>} 노드 객체의 배열을 반환하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const getNodes = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/node/get`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to get nodes:", error);
        throw error; // 에러를 호출한 쪽으로 다시 던져서 UI에서 처리할 수 있도록 합니다.
    }
};

/**
 * 백엔드에 노드 목록을 새로고침하고(export) 가져오도록 요청합니다.
 * @returns {Promise<Array<Object>>} 새로 생성된 노드 객체의 배열을 반환하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const exportNodes = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/node/export`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        
        // export 후, 최신 노드 리스트를 다시 불러옵니다.
        return await getNodes();
    } catch (error) {
        console.error("Failed to export nodes:", error);
        throw error;
    }
};

/**
 * 주어진 워크플로우 데이터를 백엔드로 전송하여 실행합니다.
 * @param {Object} workflowData - 노드와 엣지 정보를 포함하는 워크플로우 객체.
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스.
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const executeWorkflow = async (workflowData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/node/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(workflowData),
        });

        const result = await response.json();

        if (!response.ok) {
            // FastAPI에서 HTTPException으로 반환된 detail 메시지를 사용
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        return result;
    } catch (error) {
        console.error("Failed to execute workflow:", error);
        // UI에서 에러 메시지를 표시할 수 있도록 에러를 다시 던집니다.
        throw error;
    }
};