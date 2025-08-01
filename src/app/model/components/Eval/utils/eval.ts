import type { EvaluationJob } from '@/app/model/components/types';

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'status-completed';
    case 'running':
      return 'status-running';
    case 'failed':
      return 'status-failed';
    case 'pending':
    case 'accepted':
      return 'status-pending';
    default:
      return 'status-default';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'completed':
      return '완료';
    case 'running':
      return '실행 중';
    case 'failed':
      return '실패';
    case 'pending':
      return '대기 중';
    case 'accepted':
      return '접수됨';
    default:
      return status;
  }
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateString;
  }
}

// EvaluationTable에서 사용하는 정답률 계산 (기존 방식 유지)
export function calculateJobScore(job: EvaluationJob): string {
  if (job.status !== 'completed' || !job.result) {
    return '-';
  }

  // acc_norm,none 값들을 찾아서 평균 계산
  const accNormValues: number[] = [];
  
  Object.values(job.result).forEach(taskResult => {
    if (typeof taskResult === 'object' && taskResult !== null) {
      if ('acc_norm,none' in taskResult && typeof taskResult['acc_norm,none'] === 'number') {
        accNormValues.push(taskResult['acc_norm,none']);
      }
    }
  });

  if (accNormValues.length === 0) {
    // acc_norm,none이 없으면 첫 번째 값을 표시 (기존 로직)
    const mainResult = Object.values(job.result)[0];
    if (typeof mainResult === 'object' && mainResult !== null) {
      const firstValue = Object.values(mainResult)[0];
      return typeof firstValue === 'number' ? firstValue.toFixed(4) : String(firstValue);
    } else {
      return typeof mainResult === 'number' ? mainResult.toFixed(4) : String(mainResult);
    }
  }

  // acc_norm,none 값들의 평균 계산
  const average = accNormValues.reduce((sum, val) => sum + val, 0) / accNormValues.length;
  return average.toFixed(4);
}

// JobDetailModal에서 사용하는 상세 점수 계산
export function calculateDetailScore(value: any): string {
  if (typeof value === 'object' && value !== null) {
    const firstValue = Object.values(value)[0];
    return typeof firstValue === 'number' ? firstValue.toFixed(4) : String(firstValue);
  }
  return typeof value === 'number' ? value.toFixed(4) : String(value);
}

export function hasBaseModelResult(job: EvaluationJob): boolean {
  return !!(job.base_model_result && job.base_model_name);
}

/**
 * 성능 향상 계산 함수 - JobDetailModal에서 사용
 */
export function calculateImprovement(mainValue: any, baseValue: any): string {
  if (typeof mainValue === 'number' && typeof baseValue === 'number') {
    const diff = mainValue - baseValue;
    const percent = ((diff / baseValue) * 100);
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(4)} (${percent.toFixed(2)}%)`;
  }
  return '-';
}

/**
 * 상태별 색상을 반환하는 헬퍼 함수
 */
export function getStatusColor(status: string): {
  background: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'completed':
      return {
        background: '#dcfce7',
        text: '#166534',
        border: '#16a34a'
      };
    case 'running':
      return {
        background: '#dbeafe',
        text: '#1e40af',
        border: '#2563eb'
      };
    case 'failed':
      return {
        background: '#fee2e2',
        text: '#991b1b',
        border: '#dc2626'
      };
    case 'pending':
    case 'accepted':
      return {
        background: '#fef3c7',
        text: '#92400e',
        border: '#d97706'
      };
    default:
      return {
        background: '#f3f4f6',
        text: '#6b7280',
        border: '#9ca3af'
      };
  }
}

/**
 * 메트릭 이름을 사용자 친화적으로 변환
 */
export function formatMetricName(metricName: string): string {
  const metricMap: Record<string, string> = {
    'acc_norm,none': '정규화 정확도',
    'acc,none': '정확도',
    'exact_match': '완전 일치',
    'f1': 'F1 점수',
    'bleu': 'BLEU 점수',
    'rouge': 'ROUGE 점수',
    'perplexity': '복잡도',
    'loss': '손실'
  };

  return metricMap[metricName] || metricName;
}

/**
 * 작업 시간 계산 (시작시간과 종료시간 사이의 소요 시간)
 */
export function calculateDuration(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime) return '-';
  
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    
    if (diffMs < 1000) {
      return '< 1초';
    }
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${seconds}초`;
    } else if (minutes > 0) {
      return `${minutes}분 ${seconds}초`;
    } else {
      return `${seconds}초`;
    }
  } catch {
    return '-';
  }
}

/**
 * 작업 상태가 진행 중인지 확인
 */
export function isJobInProgress(status: string): boolean {
  return ['running', 'pending', 'accepted'].includes(status);
}

/**
 * 작업 상태가 완료된 상태인지 확인
 */
export function isJobCompleted(status: string): boolean {
  return status === 'completed';
}

/**
 * 작업 상태가 실패한 상태인지 확인
 */
export function isJobFailed(status: string): boolean {
  return status === 'failed';
}

/**
 * 결과 데이터가 유효한지 확인
 */
export function hasValidResult(job: EvaluationJob): boolean {
  return !!(job.result && Object.keys(job.result).length > 0);
}

/**
 * 태스크 타입에 따른 아이콘 반환
 */
export function getTaskTypeIcon(taskType: string): string {
  const iconMap: Record<string, string> = {
    'CausalLM_task': '🤖',
    'classification': '📊',
    'question_answering': '❓',
    'text_generation': '✍️',
    'summarization': '📝',
    'translation': '🌐'
  };

  return iconMap[taskType] || '📋';
}

/**
 * 작업 우선순위 계산 (선택된 순서 기반)
 */
export function getJobPriority(job: EvaluationJob, allJobs: EvaluationJob[]): number {
  // 시작 시간 기준으로 우선순위 계산
  if (!job.start_time) return 0;
  
  const jobStartTime = new Date(job.start_time).getTime();
  const olderJobs = allJobs.filter(j => 
    j.start_time && new Date(j.start_time).getTime() < jobStartTime
  );
  
  return olderJobs.length + 1;
}