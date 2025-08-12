'use client';

import React, { useCallback, useEffect } from 'react';
import type { EvaluationJob } from '@/app/model/components/types';
import { 
  formatDate, 
  getStatusBadgeClass, 
  getStatusText, 
  calculateDetailScore, 
  hasBaseModelResult 
} from '@/app/model/components/Eval/utils/eval';
// import { deleteEvaluationJob } from '@/app/api/evalAPI'; // 가짜로 교체
import styles from '@/app/model/assets/JobDetailModal.module.scss';

interface JobDetailModalProps {
  show: boolean;
  job: EvaluationJob | null;
  loading?: boolean;
  deleting?: boolean;
  onClose: () => void;
  onDeleted: (jobId: string) => void;
}

// ==================== FAKE DELETE FUNCTION START ====================
// TODO: 나중에 실제 API 연동 시 이 부분 삭제하고 실제 import 사용
const fakeDeleteEvaluationJob = async (jobId: string): Promise<void> => {
  // 가짜 지연 시간
  await new Promise(resolve => setTimeout(resolve, 500));
};
// ==================== FAKE DELETE FUNCTION END ====================

function safeEntries<T extends object>(obj: T | undefined) {
  return Object.entries(obj ?? {} as Record<string, unknown>) as [string, unknown][];
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({
  show,
  job,
  loading = false,
  deleting = false,
  onClose,
  onDeleted
}) => {
  // 성능 향상 계산 함수
  const calculateImprovement = useCallback((mainValue: any, baseValue: any): string => {
    if (typeof mainValue === 'number' && typeof baseValue === 'number') {
      const diff = mainValue - baseValue;
      const percent = ((diff / baseValue) * 100);
      return `${diff >= 0 ? '+' : ''}${diff.toFixed(4)} (${percent.toFixed(2)}%)`;
    }
    return '-';
  }, []);

  const handleDelete = useCallback(async () => {
    if (!job || !confirm('이 평가 결과를 삭제하시겠습니까?')) {
      return;
    }

    // ==================== FAKE DELETE START ====================
    // TODO: 나중에 실제 API 연동 시 이 부분 수정
    try {
      console.log('상세 모달에서 삭제 시작:', job.job_id);
      await fakeDeleteEvaluationJob(job.job_id);
      onDeleted(job.job_id);
      onClose();
      console.log('상세 모달에서 삭제 완료:', job.job_id);
    } catch (error: any) {
      console.error('Failed to delete job:', error);
      alert('삭제 중 오류가 발생했습니다: ' + error.message);
    }
    // ==================== FAKE DELETE END ====================

    /* 
    // ==================== REAL DELETE START ====================
    // TODO: 실제 API 연동 시 이 주석을 해제하고 위의 FAKE 부분 삭제
    try {
      await deleteEvaluationJob(job.job_id);
      onDeleted(job.job_id);
      onClose();
    } catch (error: any) {
      console.error('Failed to delete job:', error);
      alert('삭제 중 오류가 발생했습니다: ' + error.message);
    }
    // ==================== REAL DELETE END ====================
    */
  }, [job, onDeleted, onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [show, onClose]);

  if (!show || !job) return null;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              평가 결과 상세
              <span className={`${styles.statusBadge} ${getStatusBadgeClass(job.status)}`}>
                {getStatusText(job.status)}
              </span>
            </h2>
            <p className={styles.subtitle}>
              {job.job_info.job_name} ({job.job_id})
            </p>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <svg className={styles.closeIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner} />
          </div>
        ) : (
          <div className={styles.content}>
            {/* 기본 정보 섹션 */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>기본 정보</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>모델:</span>
                  <span className={styles.infoValue}>{job.job_info.model_name}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>평가 타입:</span>
                  <span className={styles.infoValue}>{job.job_info.task}</span>
                </div>
                
                {/* Base Model 정보 (있는 경우에만 표시) */}
                {job.job_info.base_model && (
                  <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                    <span className={styles.infoLabel}>Base Model:</span>
                    <span className={styles.infoValue}>{job.job_info.base_model}</span>
                  </div>
                )}
                
                {job.job_info.dataset_name && (
                  <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                    <span className={styles.infoLabel}>
                      {job.job_info.task === 'CausalLM_task' ? '벤치마크 태스크:' : '데이터셋:'}
                    </span>
                    <span className={styles.infoValue}>{job.job_info.dataset_name}</span>
                  </div>
                )}
                
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>GPU 수:</span>
                  <span className={styles.infoValue}>{job.job_info.gpu_num || 1}</span>
                </div>
                
                {job.job_info.top_k !== undefined && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Top K:</span>
                    <span className={styles.infoValue}>{job.job_info.top_k}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 컬럼 정보 - 데이터셋이 있고 CausalLM_task가 아닌 경우만 */}
            {job.job_info.dataset_name && job.job_info.task !== 'CausalLM_task' && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>데이터셋 컬럼 설정</h3>
                <div className={styles.infoGrid}>
                  {job.job_info.column1 && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>주요 데이터 열:</span>
                      <span className={styles.infoValue}>{job.job_info.column1}</span>
                    </div>
                  )}
                  {job.job_info.column2 && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>보조 데이터 열:</span>
                      <span className={styles.infoValue}>{job.job_info.column2}</span>
                    </div>
                  )}
                  {job.job_info.column3 && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>보조 데이터 열 2:</span>
                      <span className={styles.infoValue}>{job.job_info.column3}</span>
                    </div>
                  )}
                  {job.job_info.label && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>라벨:</span>
                      <span className={styles.infoValue}>{job.job_info.label}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 실행 정보 */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>실행 정보</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>시작 시간:</span>
                  <span className={styles.infoValue}>{formatDate(job.start_time)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>완료 시간:</span>
                  <span className={styles.infoValue}>{formatDate(job.end_time)}</span>
                </div>
              </div>
            </div>
            
            {/* 평가 결과 */}
            {job.status === 'completed' && job.result && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>평가 결과</h3>
                
                {/* Main Model 결과 */}
                <div className={styles.resultSection}>
                  <h4 className={styles.resultTitle}>Main Model 결과</h4>
                  <div className={styles.resultContainer}>
                    {Object.entries(job.result ?? {} as Record<string, any>).map(([taskName, metrics]) => (
                      <div key={taskName} className={styles.resultItem}>
                        <span className={styles.taskName}>{taskName}:</span>
                        {typeof metrics === 'object' ? (
                          Object.entries(metrics).map(([metricName, value]) => (
                            <div key={metricName} className={styles.metricItem}>
                              <span>{metricName}:</span>
                              <span className={styles.metricValue}>
                                 {typeof value === 'number'
                                   ? value.toFixed(4)
                                   : String(value)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className={styles.metricValue}>{metrics}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Base Model 결과 (있는 경우에만 표시) */}
                {hasBaseModelResult(job) && (
                  <>
                    {/* Base Model 결과 */}
                    <div className={styles.resultSection}>
                      <h4 className={styles.resultTitle}>
                        Base Model 결과 ({job.base_model_name})
                      </h4>
                      <div className={`${styles.resultContainer} ${styles.baseModelResult}`}>
                        {Object.entries((job.base_model_result ?? {}) as Record<string, unknown>).map(
                          ([taskName, metrics]) => {
                            const m = metrics as Record<string, number | string>;
                            return (
                              <div key={taskName} className={styles.resultItem}>
                                <span className={styles.taskName}>{taskName}:</span>
                                {Object.entries(m).map(([metricName, value]) => (
                                  <div key={metricName} className={styles.metricItem}>
                                    <span>{metricName}:</span>
                                    <span className={`${styles.metricValue} ${styles.baseValue}`}>
                                      {typeof value === 'number' ? value.toFixed(4) : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                        {/* 모델 성능 비교 */}
                        <div className={styles.resultSection}>
                              <h4 className={styles.resultTitle}>모델 성능 비교</h4>
                              <div className={`${styles.resultContainer} ${styles.comparisonResult}`}>
                                {Object.entries((job.result ?? {}) as Record<string, unknown>).map(
                                  ([taskName, mainMetrics]) => {
                                    const mainM = mainMetrics as Record<string, number>;
                                    const baseRaw = (job.base_model_result ?? {})[taskName];
                                    const baseM = (baseRaw as Record<string, number>) || {};
                                    return (
                                      <div key={taskName} className={styles.resultItem}>
                                        <span className={styles.taskName}>{taskName} 성능 향상:</span>
                                        {Object.entries(mainM).map(([metricName, mainValue]) => {
                                          const baseValue = baseM[metricName];
                                          if (typeof mainValue === 'number' && typeof baseValue === 'number') {
                                            const improvement = calculateImprovement(mainValue, baseValue);
                                            const isImproved = mainValue >= baseValue;
                                            return (
                                              <div key={metricName} className={styles.metricItem}>
                                                <span>{metricName}:</span>
                                                <span
                                                  className={`${styles.metricValue} ${
                                                    isImproved ? styles.improved : styles.degraded
                                                  }`}
                                                >
                                                  {improvement}
                                                </span>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          </>
                        )}
              </div>
            )}
            
            {/* 오류 정보 */}
            {job.error && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>오류 정보</h3>
                <div className={styles.errorContainer}>
                  <p className={styles.errorText}>{job.error}</p>
                </div>
              </div>
            )}

            {/* 로그 정보 (간단하게 최근 몇 개만) */}
            {job.logs && job.logs.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>최근 로그 (최대 10개)</h3>
                <div className={styles.logContainer}>
                  {job.logs.slice(-10).reverse().map((log, index) => (
                    <div key={index} className={styles.logItem}>
                      <div className={styles.logHeader}>
                        <span className={styles.logLevel}>[{log.level}]</span>
                        <span className={styles.logTimestamp}>{formatDate(log.timestamp)}</span>
                      </div>
                      <p className={styles.logMessage}>{log.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className={styles.footer}>
          <button 
            onClick={handleDelete}
            disabled={deleting}
            className={`${styles.button} ${styles.deleteButton}`}
          >
            {deleting ? (
              <div className={styles.buttonSpinner} />
            ) : (
              <svg className={styles.buttonIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            삭제
          </button>
          
          <button 
            onClick={onClose} 
            className={`${styles.button} ${styles.closeModalButton}`}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;