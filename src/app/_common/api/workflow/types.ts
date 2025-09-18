export interface excuteWorkflowRequest {
    workflow_name: string
    workflow_id: string
    input_data?: string
    interaction_id?: string
    selected_collections?: Array<string>
    user_id?: number | string
    additional_params?: Record<string, Record<string, any>>
}

export interface excuteWorkflowResponse {
    workflowName: string;
    workflowId: string;
    inputData?: string;
    interaction_id?: string;
    selectedCollections?: Array<string>;
}
