import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '../apiClient';
import type { excuteWorkflowRequest } from './types';

const _executeWorkflowById = async (params: excuteWorkflowRequest & { isDeploy?: boolean }): Promise<any> => {    
    const { isDeploy, ...requestBody } = params;

    const endpoint = isDeploy ? `${API_BASE_URL}/api/workflow/deploy/execute/based_id`:`${API_BASE_URL}/api/workflow/execute/based_id`;    
    const response = await apiClient(endpoint, {       
        method: 'POST',        
        body: JSON.stringify(requestBody),    
    });    
    if (!response.ok) {        
        const errorData = await response.json();        
        
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);    
    }    
    return response.json();
};

export const executeWorkflowById = withErrorHandler(_executeWorkflowById, 'Failed to execute workflow');

interface StreamParams extends excuteWorkflowRequest {    
    isDeploy?: boolean;    
    onData: (chunk: string) => void;    
    onEnd: () => void;    
    onError: (error: Error) => void;
}

const _executeWorkflowByIdStream = async (params: StreamParams): Promise<void> => {    
    const { isDeploy, onData, onEnd, onError, ...requestBody } = params;    
    const endpoint = isDeploy ? 
        `${API_BASE_URL}/api/workflow/deploy/execute/based_id/stream`: 
        `${API_BASE_URL}/api/workflow/execute/based_id/stream`;
    
    const response = await apiClient(endpoint, {        
        method: 'POST',        
        body: JSON.stringify(requestBody),    
    });    

    if (!response.ok) {        
        const errorData = await response.json();        
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);    
    }    
    if (!response.body) {        
        throw new Error('Response body is null.');    
    }    
    
    const reader = response.body.getReader();    
    const decoder = new TextDecoder('utf-8');    
    while (true) {        
        const { done, value } = await reader.read();        
        if (done) {            
            onEnd();            
            break;        
        }        
        const chunk = decoder.decode(value);        
        const lines = chunk.split('\n\n');        
        for (const line of lines) {            
            if (line.startsWith('data: ')) {                
                const jsonData = line.substring(6);                
                try {                    
                    const parsedData = JSON.parse(jsonData);                    
                    if (parsedData.type === 'data') onData(parsedData.content);                    
                    else if (parsedData.type === 'end') onEnd();                    
                    else if (parsedData.type === 'error') throw new Error(parsedData.detail);                
                } catch (e) {                   
                    // Ignore parsing errors for now                
                }            
            }       
        }    
    }
};

export const executeWorkflowByIdStream = withErrorHandler(_executeWorkflowByIdStream, 'Failed to execute streaming workflow');