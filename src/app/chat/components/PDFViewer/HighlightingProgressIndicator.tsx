'use client';

import React from 'react';
import { FiLoader, FiCheck, FiAlertTriangle, FiBarChart } from 'react-icons/fi';
import styles from './HighlightingProgressIndicator.module.scss';

export interface HighlightingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress?: number; // 0-100
  duration?: number; // milliseconds
  resultCount?: number;
}

export interface HighlightingProgressProps {
  steps: HighlightingStep[];
  isVisible: boolean;
  onCancel?: () => void;
  onStepClick?: (stepId: string) => void;
}

const HighlightingProgressIndicator: React.FC<HighlightingProgressProps> = ({
  steps,
  isVisible,
  onCancel,
  onStepClick
}) => {
  if (!isVisible) return null;

  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const currentStep = steps.find(step => step.status === 'in_progress');
  const hasError = steps.some(step => step.status === 'error');

  const overallProgress = (completedSteps / totalSteps) * 100;

  const getStepIcon = (step: HighlightingStep) => {
    switch (step.status) {
      case 'completed':
        return <FiCheck className={styles.checkIcon} />;
      case 'in_progress':
        return <FiLoader className={styles.loadingIcon} />;
      case 'error':
        return <FiAlertTriangle className={styles.errorIcon} />;
      default:
        return <div className={styles.pendingIcon} />;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <div className={styles.progressContainer}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <FiBarChart className={styles.titleIcon} />
          <h4 className={styles.title}>하이라이팅 분석</h4>
          <span className={styles.progressBadge}>
            {completedSteps}/{totalSteps}
          </span>
        </div>
        {onCancel && !hasError && currentStep && (
          <button 
            className={styles.cancelButton} 
            onClick={onCancel}
            title="취소"
          >
            ✕
          </button>
        )}
      </div>

      {/* Overall Progress Bar */}
      <div className={styles.overallProgress}>
        <div className={styles.progressLabel}>
          전체 진행도: {Math.round(overallProgress)}%
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Current Step Details */}
      {currentStep && (
        <div className={styles.currentStep}>
          <div className={styles.currentStepLabel}>
            {getStepIcon(currentStep)}
            <span>{currentStep.name}</span>
          </div>
          {currentStep.progress !== undefined && (
            <div className={styles.stepProgressBar}>
              <div 
                className={styles.stepProgressFill}
                style={{ width: `${currentStep.progress}%` }}
              />
            </div>
          )}
          <div className={styles.stepDescription}>
            {currentStep.description}
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className={styles.stepsList}>
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`${styles.stepItem} ${styles[step.status]}`}
            onClick={() => onStepClick?.(step.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStepClick?.(step.id);
              }
            }}
            role="button"
            tabIndex={onStepClick ? 0 : -1}
            aria-label={`단계 ${index + 1}: ${step.name}`}
          >
            <div className={styles.stepIndex}>
              {index + 1}
            </div>
            <div className={styles.stepIcon}>
              {getStepIcon(step)}
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepName}>
                {step.name}
                {step.resultCount !== undefined && step.status === 'completed' && (
                  <span className={styles.resultCount}>
                    ({step.resultCount}개 발견)
                  </span>
                )}
              </div>
              {step.duration && step.status === 'completed' && (
                <div className={styles.stepDuration}>
                  {formatDuration(step.duration)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {completedSteps === totalSteps && !hasError && (
        <div className={styles.summary}>
          <FiCheck className={styles.summaryIcon} />
          <div className={styles.summaryText}>
            하이라이팅 분석 완료
          </div>
        </div>
      )}

      {hasError && (
        <div className={styles.errorSummary}>
          <FiAlertTriangle className={styles.errorSummaryIcon} />
          <div className={styles.errorSummaryText}>
            분석 중 오류가 발생했습니다
          </div>
        </div>
      )}
    </div>
  );
};

export default HighlightingProgressIndicator;
export { HighlightingProgressIndicator };