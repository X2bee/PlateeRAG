export interface EvaluationJob {
    job_info: {
      job_name: string;
      task: string;
      model_name: string;
      dataset_name: string;
      column1?: string | null;
      column2?: string | null;
      column3?: string | null;
      label?: string | null;
      top_k?: number;
      gpu_num: number;
      model_minio_enabled: boolean;
      dataset_minio_enabled: boolean;
      use_cot?: boolean;
      base_model?: string; // 선택적 필드
    };
    logs: LogEntry[];
    status: 'running' | 'completed' | 'failed' | 'pending' | 'accepted';
    start_time?: string;
    end_time?: string;
    result?: Record<string, any>;
    base_model_result?: Record<string, any>; // 선택적 필드
    base_model_name?: string; // 선택적 필드
    job_id: string;
    error?: string;
  }
  
export interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
}

export interface TaskGroup {
	description: string;
	tasks: string[];
  }

export interface TaskGroups {
	[key: string]: TaskGroup;
  }

export type ModelInfo = {
  name?: string;
  base_model?: string;
  user_name?: string;
};
  
export type PopupState = {
    [key: string]: {
      show: boolean;
      options: any[];
      selected: string;
      loading: boolean;
      mode?: string;
      error?: string |null ;
    };
  };
