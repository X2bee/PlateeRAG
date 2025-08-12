'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { EvaluationJob } from '@/app/model/components/types';
import { 
  getStatusBadgeClass, 
  getStatusText, 
  calculateJobScore, 
  hasBaseModelResult 
} from '@/app/model/components/Eval/utils/eval';
// import { deleteEvaluationJob, deleteMultipleEvaluationJobs } from '@/app/api/evalAPI'; // 가짜로 교체
import styles from '@/app/model/assets/EvalTable.module.scss';

export const TASK_OPTIONS = [
  { value: 'CausalLM', label: '언어 모델(LLM, 자체 데이터셋)' },
  { value: 'CausalLM_task', label: '언어 모델(LLM, 벤치마크)' },
  { value: 'RAG', label: 'RAG 평가' },
  { value: 'Classification', label: '분류' },
  { value: 'Semantic_Textual_Similarity', label: '의미적 유사도' },
  { value: 'Retrieval', label: '검색' },
  { value: 'Reranking', label: '재랭킹' }
] as const;

interface EvaluationTableProps {
  jobs: EvaluationJob[];
  isLoading?: boolean;
  statusFilter?: string;
  searchFilter?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onJobClick?: (job: EvaluationJob) => void;
  onRefresh?: () => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onStatusFilterChange?: (value: string) => void;
  onSearchFilterChange?: (value: string) => void;
  onJobDelete?: (jobId: string) => void; // 추가: 부모로부터 삭제 핸들러 받기
  onJobsDelete?: (jobIds: string[]) => void; // 추가: 부모로부터 일괄 삭제 핸들러 받기
}

// ==================== FAKE DELETE FUNCTIONS START ====================
// TODO: 나중에 실제 API 연동 시 이 부분 삭제하고 실제 import 사용
const fakeDeleteEvaluationJob = async (jobId: string): Promise<void> => {
  // 가짜 지연 시간
  await new Promise(resolve => setTimeout(resolve, 500));
};

const fakeDeleteMultipleEvaluationJobs = async (jobIds: string[]): Promise<void> => {
  // 가짜 지연 시간
  await new Promise(resolve => setTimeout(resolve, 1000));
};
// ==================== FAKE DELETE FUNCTIONS END ====================

const EvaluationTable: React.FC<EvaluationTableProps> = ({
  jobs = [],
  isLoading = false,
  statusFilter = 'all',
  searchFilter = '',
  sortField = 'start_time',
  sortDirection = 'desc',
  onJobClick,
  onRefresh,
  onSort,
  onStatusFilterChange,
  onSearchFilterChange,
  onJobDelete, // 추가
  onJobsDelete // 추가
}) => {
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  const taskMap: Map<string, string> = new Map(
       TASK_OPTIONS.map(option => [option.value, option.label])
     );

  const handleJobClick = useCallback((job: EvaluationJob) => {
    onJobClick?.(job);
  }, [onJobClick]);

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);
  
  const handleSort = useCallback((field: string) => {
    let newDirection: 'asc' | 'desc' = 'desc';
    if (sortField === field) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    onSort?.(field, newDirection);
  }, [sortField, sortDirection, onSort]);

  // 전체 선택 토글 함수
  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedJobs(new Set());
      setSelectAll(false);
    } else {
      setSelectedJobs(new Set(jobs.map(job => job.job_id)));
      setSelectAll(true);
    }
  }, [selectAll, jobs]);

  // 개별 선택 토글 함수
  const toggleJobSelection = useCallback((jobId: string) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  }, []);

  // 개별 삭제
  const handleDeleteJob = useCallback(async (jobId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (!confirm('이 평가 결과를 삭제하시겠습니까?')) {
      return;
    }

    // ==================== FAKE DELETE START ====================
    // TODO: 나중에 실제 API 연동 시 이 부분 수정
    try {
      setDeletingJobId(jobId);
      
      // 부모 컴포넌트의 삭제 핸들러가 있으면 사용, 없으면 가짜 함수 사용
      if (onJobDelete) {
        onJobDelete(jobId);
      } else {
        await fakeDeleteEvaluationJob(jobId);
        handleRefresh();
      }
    } catch (error: any) {
      console.error('Failed to delete job:', error);
      alert('삭제 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setDeletingJobId(null);
    }
    // ==================== FAKE DELETE END ====================

    /* 
    // ==================== REAL DELETE START ====================
    // TODO: 실제 API 연동 시 이 주석을 해제하고 위의 FAKE 부분 삭제
    try {
      setDeletingJobId(jobId);
      await deleteEvaluationJob(jobId);
      handleRefresh();
    } catch (error: any) {
      console.error('Failed to delete job:', error);
      alert('삭제 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setDeletingJobId(null);
    }
    // ==================== REAL DELETE END ====================
    */
  }, [onJobDelete, handleRefresh]);

  // 일괄 삭제
  const handleBulkDelete = useCallback(async () => {
    if (selectedJobs.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }

    if (!confirm(`선택된 ${selectedJobs.size}개의 평가 결과를 삭제하시겠습니까?`)) {
      return;
    }

    // ==================== FAKE BULK DELETE START ====================
    // TODO: 나중에 실제 API 연동 시 이 부분 수정
    try {
      setBulkDeleting(true);
      const jobIds = Array.from(selectedJobs);
      
      // 부모 컴포넌트의 일괄 삭제 핸들러가 있으면 사용, 없으면 가짜 함수 사용
      if (onJobsDelete) {
        onJobsDelete(jobIds);
      } else {
        await fakeDeleteMultipleEvaluationJobs(jobIds);
        handleRefresh();
      }
      
      setSelectedJobs(new Set());
      setSelectAll(false);
    } catch (error: any) {
      console.error('Failed to delete jobs:', error);
      alert('삭제 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setBulkDeleting(false);
    }
    // ==================== FAKE BULK DELETE END ====================

    /* 
    // ==================== REAL BULK DELETE START ====================
    // TODO: 실제 API 연동 시 이 주석을 해제하고 위의 FAKE 부분 삭제
    try {
      setBulkDeleting(true);
      const jobIds = Array.from(selectedJobs);
      await deleteMultipleEvaluationJobs(jobIds);
      setSelectedJobs(new Set());
      setSelectAll(false);
      handleRefresh();
    } catch (error: any) {
      console.error('Failed to delete jobs:', error);
      alert('삭제 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setBulkDeleting(false);
    }
    // ==================== REAL BULK DELETE END ====================
    */
  }, [selectedJobs, onJobsDelete, handleRefresh]);

  // jobs가 변경될 때 선택 상태 업데이트
  useEffect(() => {
    if (jobs.length > 0) {
      const currentJobIds = new Set(jobs.map(job => job.job_id));
      const filteredSelectedJobs = new Set(
        Array.from(selectedJobs).filter(id => currentJobIds.has(id))
      );
      
      if (filteredSelectedJobs.size !== selectedJobs.size) {
        setSelectedJobs(filteredSelectedJobs);
      }
      
      setSelectAll(filteredSelectedJobs.size > 0 && filteredSelectedJobs.size === jobs.length);
    }
  }, [jobs, selectedJobs]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>평가 결과</h2>
        <div className={styles.controls}>
          {selectedJobs.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className={`${styles.button} ${styles.deleteButton}`}
            >
              {bulkDeleting ? (
                <div className={styles.spinner} />
              ) : (
                <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              삭제 ({selectedJobs.size})
            </button>
          )}
          
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              value={searchFilter}
              onChange={(e) => onSearchFilterChange?.(e.target.value)}
              placeholder="검색..." 
              className={styles.searchInput}
            />
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => onStatusFilterChange?.(e.target.value)}
            className={styles.statusSelect}
          >
            <option value="all">모든 상태</option>
            <option value="completed">완료</option>
            <option value="running">실행 중</option>
            <option value="failed">실패</option>
            <option value="pending">대기 중</option>
            <option value="accepted">접수됨</option>
          </select>
          
          <button 
            onClick={handleRefresh}
            className={`${styles.button} ${styles.refreshButton}`}
          >
            <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            새로고침
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
        </div>
      ) : jobs.length === 0 ? (
        <div className={styles.emptyState}>
          <p>검색 조건에 맞는 평가 결과가 없습니다.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.checkboxColumn}>
                  <input 
                    type="checkbox" 
                    checked={selectAll} 
                    onChange={toggleSelectAll}
                    className={styles.checkbox}
                  />
                </th>
                <th className={styles.tableHeader}>작업 이름</th>
                <th className={styles.tableHeader}>모델</th>
                <th className={styles.tableHeader}>데이터셋/태스크</th>
                <th className={styles.tableHeader}>타입</th>
                <th className={styles.tableHeader}>
                  <button 
                    onClick={() => handleSort('score')}
                    className={styles.sortButton}
                  >
                    정답률
                    {sortField === 'score' && (
                      <svg className={styles.sortIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    )}
                  </button>
                </th>
                <th className={styles.tableHeader}>
                  <button 
                    onClick={() => handleSort('start_time')}
                    className={styles.sortButton}
                  >
                    시작 시간
                    {sortField === 'start_time' && (
                      <svg className={styles.sortIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sortDirection === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    )}
                  </button>
                </th>
                <th className={styles.tableHeader}>상태</th>
                <th className={styles.tableHeader}>작업</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {jobs.map((job) => (
                <tr 
                  key={job.job_id}
                  className={styles.tableRow} 
                  onClick={() => handleJobClick(job)}
                >
                  <td className={styles.tableCell} onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedJobs.has(job.job_id)}
                      onChange={() => toggleJobSelection(job.job_id)}
                      className={styles.checkbox}
                    />
                  </td>
                  
                  <td className={`${styles.tableCell} ${styles.jobName}`}>
                    {job.job_info.job_name}
                  </td>
                  
                  <td className={styles.tableCell}>
                    <div className={styles.modelInfo}>
                      <div className={styles.modelName} title={job.job_info.model_name}>
                        {job.job_info.model_name}
                      </div>
                      {hasBaseModelResult(job) && (
                        <div className={styles.baseModel}>
                          vs {job.base_model_name}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className={styles.tableCell}>
                    <div className={styles.datasetName} title={job.job_info.dataset_name || job.job_info.task || '-'}>
                      {job.job_info.dataset_name || job.job_info.task || '-'}
                    </div>
                  </td>
                  
                  <td className={styles.tableCell}>
                    {taskMap.get(job.job_info.task) || job.job_info.task}
                  </td>
                  
                  <td className={styles.tableCell}>
                    {job.status === 'completed' && job.result ? (
                      <div className={styles.score}>
                        {calculateJobScore(job)}
                      </div>
                    ) : job.status === 'failed' ? (
                      <span className={styles.failed}>Failed</span>
                    ) : job.status === 'running' ? (
                      <span className={styles.running}>실행 중...</span>
                    ) : (
                      <span className={styles.noData}>-</span>
                    )}
                  </td>
                  
                  <td className={styles.tableCell}>
                    {job.start_time ? new Date(job.start_time).toLocaleString('ko-KR', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </td>
                  
                  <td className={styles.tableCell}>
                    <span className={`${styles.badge} ${getStatusBadgeClass(job.status)}`}>
                      {getStatusText(job.status)}
                    </span>
                  </td>
                  
                  <td className={styles.tableCell} onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => handleDeleteJob(job.job_id, e)}
                      disabled={deletingJobId === job.job_id}
                      className={styles.deleteJobButton}
                      title="삭제"
                    >
                      {deletingJobId === job.job_id ? (
                        <div className={styles.deleteSpinner} />
                      ) : (
                        <svg className={styles.deleteIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EvaluationTable;