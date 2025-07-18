// Configuration API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/utils/logger';
import { API_BASE_URL } from '@/app/config.js';

/**
 * Creates a new chat session
 * @param {Object} params - The chat creation parameters
 * @param {string} params.interaction_id - Unique interaction identifier
 * @param {string} [params.input_data] - Optional initial message
 * @returns {Promise<Object>} A promise that resolves with the chat creation response
 */
export const createNewChat = async ({ interaction_id, input_data = null }) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/chat/new`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                workflow_name: "default_mode",
                workflow_id: "default_mode",
                interaction_id,
                input_data
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP ${response.status}: ${errorData.detail || 'Unknown error'}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating new chat:', error);
        throw error;
    }
};

/**
 * Continues an existing chat session
 * @param {Object} params - The chat execution parameters
 * @param {string} params.user_input - The user's message
 * @param {string} params.interaction_id - The interaction identifier
 * @param {string} [params.workflow_id] - Optional workflow ID (defaults to "default_mode")
 * @param {string} [params.workflow_name] - Optional workflow name (defaults to "default_mode")
 * @param {string|null} [params.selectedCollection] - Optional selected collection for default_mode
 * @returns {Promise<Object>} A promise that resolves with the chat response
 */
export const executeChatMessage = async ({ 
    user_input, 
    interaction_id, 
    workflow_id = "default_mode", 
    workflow_name = "default_mode",
    selectedCollection = null,
}) => {
    try {
        const requestBody = {
            user_input,
            interaction_id,
            workflow_id,
            workflow_name,
        };

        // selectedCollection이 있으면 body에 추가
        if (selectedCollection) {
            requestBody.selected_collection = selectedCollection;
        }

        const response = await fetch(`${API_BASE_URL}/api/chat/execution`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP ${response.status}: ${errorData.detail || 'Unknown error'}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error executing chat message:', error);
        throw error;
    }
};

/**
 * High-level function to handle a complete chat flow
 * @param {Object} params - The chat parameters
 * @param {string} params.message - The user's message
 * @param {string} [params.interaction_id] - Existing interaction ID or will generate new one
 * @param {boolean} [params.isNewChat] - Whether this is a new chat session
 * @returns {Promise<Object>} A promise that resolves with the chat response
 */
export const sendMessage = async ({ 
    message, 
    interaction_id = null, 
    isNewChat = false 
}) => {
    try {
        // Generate interaction ID if not provided
        const chatInteractionId = interaction_id || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (isNewChat) {
            // Create new chat session with initial message
            const result = await createNewChat({
                interaction_id: chatInteractionId,
                input_data: message
            });

            return {
                text: result.chat_response || 'Chat session created successfully',
                interaction_id: result.interaction_id,
                session_info: result.execution_meta,
                timestamp: result.timestamp,
                status: result.status
            };
        } else {
            // Continue existing chat session
            const result = await executeChatMessage({
                user_input: message,
                interaction_id: chatInteractionId
            });

            return {
                text: result.ai_response,
                interaction_id: result.interaction_id,
                session_id: result.session_id,
                session_info: result.execution_meta,
                timestamp: result.timestamp,
                status: result.status
            };
        }
    } catch (error) {
        console.error('Error in sendMessage:', error);
        throw error;
    }
};

/**
 * Legacy function for backward compatibility - simulates sending a message
 * @deprecated Use sendMessage with proper parameters instead
 * @param {string} message - The message to send
 * @returns {Promise<{text: string}>} A promise that resolves with a response object
 */
export const sendMessageLegacy = (message) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                text: `This is a response to your message: "${message}"`,
            });
        }, 1000); // Simulate 1 second delay
    });
};
