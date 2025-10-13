// MCP API 호출 함수들을 관리하는 파일
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * MCP Station 상태 확인
 * @returns {Promise<Object>} 서비스 상태 정보
 */
export const checkMCPHealth = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/mcp/health`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('MCP Station health check:', data);
        return data;
    } catch (error) {
        console.error('Failed to check MCP health:', error);
        throw error;
    }
};

/**
 * 상세 헬스체크
 * @returns {Promise<Object>} 상세 상태 정보
 */
export const checkMCPDetailedHealth = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/mcp/health/detailed`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('MCP Station detailed health:', data);
        return data;
    } catch (error) {
        console.error('Failed to check MCP detailed health:', error);
        throw error;
    }
};

/**
 * 새로운 MCP 서버 세션 생성
 * @param {Object} sessionData - 세션 생성 데이터
 * @param {string} sessionData.server_type - 서버 타입 (python 또는 node)
 * @param {string} sessionData.server_command - 실행할 스크립트 경로
 * @param {Array<string>} [sessionData.server_args] - 추가 명령줄 인자
 * @param {Object} [sessionData.env_vars] - 환경 변수
 * @param {string} [sessionData.working_dir] - 작업 디렉토리
 * @param {string} [sessionData.session_name] - 세션 이름 (식별용)
 * @returns {Promise<Object>} 생성된 세션 정보
 */
export const createMCPSession = async (sessionData) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/mcp/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('MCP session created:', data);
        return data;
    } catch (error) {
        console.error('Failed to create MCP session:', error);
        throw error;
    }
};

/**
 * 모든 활성 세션 목록 조회
 * @returns {Promise<Array>} 세션 목록
 */
export const listMCPSessions = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/mcp/sessions`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('MCP sessions listed:', data);
        return data;
    } catch (error) {
        console.error('Failed to list MCP sessions:', error);
        throw error;
    }
};

/**
 * 특정 세션 정보 조회
 * @param {string} sessionId - 세션 ID
 * @returns {Promise<Object>} 세션 정보
 */
export const getMCPSession = async (sessionId) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/mcp/sessions/${sessionId}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('MCP session info:', data);
        return data;
    } catch (error) {
        console.error('Failed to get MCP session:', error);
        throw error;
    }
};

/**
 * 세션 삭제 및 프로세스 종료
 * @param {string} sessionId - 세션 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteMCPSession = async (sessionId) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/mcp/sessions/${sessionId}`,
            {
                method: 'DELETE',
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 204 No Content 또는 JSON 응답 처리
        if (response.status === 204) {
            console.log('MCP session deleted:', sessionId);
            return { success: true, message: '세션이 삭제되었습니다' };
        }

        const data = await response.json();
        console.log('MCP session deleted:', data);
        return data;
    } catch (error) {
        console.error('Failed to delete MCP session:', error);
        throw error;
    }
};

/**
 * 특정 세션의 MCP 도구 목록 조회
 * @param {string} sessionId - 세션 ID
 * @returns {Promise<Object>} 도구 목록
 */
export const getMCPSessionTools = async (sessionId) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/mcp/sessions/${sessionId}/tools`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('MCP session tools:', data);
        return data;
    } catch (error) {
        console.error('Failed to get MCP session tools:', error);
        throw error;
    }
};

/**
 * MCP 서버로 요청 라우팅
 * @param {Object} mcpRequest - MCP 요청 데이터
 * @param {string} mcpRequest.session_id - 대상 세션 ID
 * @param {string} mcpRequest.method - MCP 메서드 (예: tools/list, tools/call)
 * @param {Object} [mcpRequest.params] - 메서드 파라미터
 * @returns {Promise<Object>} MCP 응답
 */
export const sendMCPRequest = async (mcpRequest) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/mcp/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mcpRequest),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('MCP request response:', data);
        return data;
    } catch (error) {
        console.error('Failed to send MCP request:', error);
        throw error;
    }
};

/**
 * MCP 도구 호출 (편의 함수)
 * @param {string} sessionId - 세션 ID
 * @param {string} toolName - 도구 이름
 * @param {Object} [arguments_] - 도구 인자
 * @returns {Promise<Object>} 도구 실행 결과
 */
export const callMCPTool = async (sessionId, toolName, arguments_ = {}) => {
    try {
        const response = await sendMCPRequest({
            session_id: sessionId,
            method: 'tools/call',
            params: {
                name: toolName,
                arguments: arguments_,
            },
        });
        return response;
    } catch (error) {
        console.error('Failed to call MCP tool:', error);
        throw error;
    }
};

/**
 * MCP 도구 목록 조회 (편의 함수)
 * @param {string} sessionId - 세션 ID
 * @returns {Promise<Object>} 도구 목록
 */
export const listMCPTools = async (sessionId) => {
    try {
        const response = await sendMCPRequest({
            session_id: sessionId,
            method: 'tools/list',
            params: {},
        });
        return response;
    } catch (error) {
        console.error('Failed to list MCP tools:', error);
        throw error;
    }
};

/**
 * MCP 프롬프트 목록 조회 (편의 함수)
 * @param {string} sessionId - 세션 ID
 * @returns {Promise<Object>} 프롬프트 목록
 */
export const listMCPPrompts = async (sessionId) => {
    try {
        const response = await sendMCPRequest({
            session_id: sessionId,
            method: 'prompts/list',
            params: {},
        });
        return response;
    } catch (error) {
        console.error('Failed to list MCP prompts:', error);
        throw error;
    }
};

/**
 * MCP 프롬프트 가져오기 (편의 함수)
 * @param {string} sessionId - 세션 ID
 * @param {string} promptName - 프롬프트 이름
 * @param {Object} [arguments_] - 프롬프트 인자
 * @returns {Promise<Object>} 프롬프트 내용
 */
export const getMCPPrompt = async (sessionId, promptName, arguments_ = {}) => {
    try {
        const response = await sendMCPRequest({
            session_id: sessionId,
            method: 'prompts/get',
            params: {
                name: promptName,
                arguments: arguments_,
            },
        });
        return response;
    } catch (error) {
        console.error('Failed to get MCP prompt:', error);
        throw error;
    }
};

/**
 * MCP 리소스 목록 조회 (편의 함수)
 * @param {string} sessionId - 세션 ID
 * @returns {Promise<Object>} 리소스 목록
 */
export const listMCPResources = async (sessionId) => {
    try {
        const response = await sendMCPRequest({
            session_id: sessionId,
            method: 'resources/list',
            params: {},
        });
        return response;
    } catch (error) {
        console.error('Failed to list MCP resources:', error);
        throw error;
    }
};

/**
 * MCP 리소스 읽기 (편의 함수)
 * @param {string} sessionId - 세션 ID
 * @param {string} uri - 리소스 URI
 * @returns {Promise<Object>} 리소스 내용
 */
export const readMCPResource = async (sessionId, uri) => {
    try {
        const response = await sendMCPRequest({
            session_id: sessionId,
            method: 'resources/read',
            params: {
                uri: uri,
            },
        });
        return response;
    } catch (error) {
        console.error('Failed to read MCP resource:', error);
        throw error;
    }
};

/**
 * Python MCP 서버 세션 생성 (편의 함수)
 * @param {string} scriptPath - Python 스크립트 경로
 * @param {Array<string>} [args] - 추가 인자
 * @param {Object} [envVars] - 환경 변수
 * @param {string} [workingDir] - 작업 디렉토리
 * @param {string} [sessionName] - 세션 이름 (식별용)
 * @returns {Promise<Object>} 생성된 세션 정보
 */
export const createPythonMCPSession = async (
    scriptPath,
    args = [],
    envVars = {},
    workingDir = null,
    sessionName = null
) => {
    return await createMCPSession({
        server_type: 'python',
        server_command: scriptPath,
        server_args: args,
        env_vars: envVars,
        working_dir: workingDir,
        session_name: sessionName,
    });
};

/**
 * Node.js MCP 서버 세션 생성 (편의 함수)
 * @param {string} scriptPath - Node.js 스크립트 경로
 * @param {Array<string>} [args] - 추가 인자
 * @param {Object} [envVars] - 환경 변수
 * @param {string} [workingDir] - 작업 디렉토리
 * @param {string} [sessionName] - 세션 이름 (식별용)
 * @returns {Promise<Object>} 생성된 세션 정보
 */
export const createNodeMCPSession = async (
    scriptPath,
    args = [],
    envVars = {},
    workingDir = null,
    sessionName = null
) => {
    return await createMCPSession({
        server_type: 'node',
        server_command: scriptPath,
        server_args: args,
        env_vars: envVars,
        working_dir: workingDir,
        session_name: sessionName,
    });
};
